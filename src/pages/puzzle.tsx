import { useEffect, useMemo, useRef, useState } from "react"
import type { Puzzle as PuzzleModel } from "../game/types"
import { generateDailyPuzzle, precomputeNextDays } from "../game/daily"
import { computeScore } from "../game/scoring"
import { getHint, validateAnswer } from "../game/validate"
import { dbOps, toLocalDateKey } from "../utils/db"
import { httpJson } from "../utils/http"
import { track } from "../utils/analytics"
import { getSessionUser } from "../utils/session"

type Cached = {
  puzzle: PuzzleModel
  solution: unknown
}

function Puzzle() {
  const user = useMemo(() => getSessionUser(), [])
  const [dateKey, setDateKey] = useState(() => toLocalDateKey())

  const [cached, setCached] = useState<Cached | null>(null)
  const [answer, setAnswer] = useState<string>("")
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintText, setHintText] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [startedAtIso, setStartedAtIso] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const syncOnceRef = useRef(false)

  // Daily reset mechanism: if the tab stays open across midnight, roll to the new date.
  useEffect(() => {
    const t = setInterval(() => {
      const next = toLocalDateKey()
      setDateKey((prev) => (prev === next ? prev : next))
    }, 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!user) return

    let isMounted = true
    syncOnceRef.current = false

    const load = async () => {
      if (isMounted) setCached(null)
      // Try cached puzzle first
      const existing = await dbOps.getCachedPuzzle(dateKey)
      if (existing && isMounted) {
        const puzzle = existing.payload as PuzzleModel
        // We intentionally do not store the solution in IndexedDB.
        // Re-generate solution deterministically.
        const regen = generateDailyPuzzle(dateKey)
        setCached({ puzzle, solution: regen.solution })
      } else {
        const generated = generateDailyPuzzle(dateKey)
        await dbOps.cachePuzzle({
          dateKey,
          puzzleId: generated.puzzle.id,
          puzzleType: generated.puzzle.type,
          payload: generated.puzzle,
          createdAt: new Date().toISOString(),
        })
        if (isMounted) setCached({ puzzle: generated.puzzle, solution: generated.solution })
      }

      // Lazy cache current + next 7 days in background
      const days = precomputeNextDays(dateKey, 7)
      void (async () => {
        for (const key of days) {
          const row = await dbOps.getCachedPuzzle(key)
          if (row) continue
          const gen = generateDailyPuzzle(key)
          await dbOps.cachePuzzle({
            dateKey: key,
            puzzleId: gen.puzzle.id,
            puzzleType: gen.puzzle.type,
            payload: gen.puzzle,
            createdAt: new Date().toISOString(),
          })
        }
      })()

      // Load today's progress (answer snapshot)
      const progress = await dbOps.getDailyProgress(user.id, dateKey)
      if (progress && isMounted) {
        const state = progress.state as { answer?: string; hintsUsed?: number; status?: { ok: boolean; message: string } }
        if (typeof state?.answer === "string") setAnswer(state.answer)
        if (typeof state?.hintsUsed === "number") setHintsUsed(state.hintsUsed)
        if (state?.status) setStatus(state.status)
        if (typeof progress.attempts === "number") setAttempts(progress.attempts)
        if (typeof progress.score === "number") setScore(progress.score)
        if (typeof progress.startedAt === "string") setStartedAtIso(progress.startedAt)
      } else if (isMounted) {
        // Fresh day: reset local UI state
        setAnswer("")
        setHintsUsed(0)
        setHintText(null)
        setStatus(null)
        setAttempts(0)
        setScore(null)
        setStartedAtIso(new Date().toISOString())
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [dateKey, user])

  useEffect(() => {
    if (!user || !cached) return
    const save = async () => {
      const startedAt = startedAtIso ?? new Date().toISOString()
      if (startedAtIso == null) setStartedAtIso(startedAt)
      await dbOps.upsertDailyProgress({
        userId: user.id,
        dateKey,
        puzzleId: cached.puzzle.id,
        puzzleType: cached.puzzle.type,
        state: { answer, hintsUsed, status },
        hintsUsed,
        attempts,
        score: score ?? undefined,
        timeTakenMs:
          status?.ok && startedAtIso ? Math.max(0, Date.now() - new Date(startedAtIso).getTime()) : undefined,
        startedAt,
        solvedAt: status?.ok ? new Date().toISOString() : null,
      })
    }
    void save()
  }, [answer, attempts, cached, dateKey, hintsUsed, score, startedAtIso, status, user])

  // Best-effort score sync (only when backend exists)
  useEffect(() => {
    if (!user || !cached || !status?.ok || score == null) return
    if (syncOnceRef.current) return
    syncOnceRef.current = true

    const startedAt = startedAtIso ?? new Date().toISOString()
    const timeTakenMs = Math.max(0, Date.now() - new Date(startedAt).getTime())

    void (async () => {
      track("puzzle_solved", {
        dateKey,
        puzzleType: cached.puzzle.type,
        puzzleId: cached.puzzle.id,
        score,
        hintsUsed,
        attempts,
      })

      try {
        await httpJson("/api/scores/submit", {
          method: "POST",
          body: {
            userId: user.id,
            date: new Date().toISOString(),
            puzzleId: cached.puzzle.id,
            score,
            timeTaken: Math.round(timeTakenMs / 1000),
          },
        })
      } catch {
        // Frontend-only mode (Vite) will 404; ignore.
      }
    })()
  }, [attempts, cached, dateKey, hintsUsed, score, startedAtIso, status?.ok, user])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold text-brand-navy">Puzzle</h2>
        <p className="mt-3 text-brand-ink">
          Please open the Login page and continue as Guest (or configure Google/Truecaller).
        </p>
      </div>
    )
  }

  if (!cached) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold text-brand-navy">Loading puzzle…</h2>
      </div>
    )
  }

  const { puzzle, solution } = cached
  const maxHints = 3

  const submit = () => {
    setAttempts((a) => a + 1)
    const res = validateAnswer({ puzzle, solution, answer })
    setStatus(res)
    setHintText(null)

    if (res.ok) {
      const startedAt = startedAtIso ?? new Date().toISOString()
      if (startedAtIso == null) setStartedAtIso(startedAt)
      const timeTakenMs = Math.max(0, Date.now() - new Date(startedAt).getTime())
      const nextScore = computeScore({ solved: true, hintsUsed, attempts: attempts + 1, timeTakenMs })
      setScore(nextScore)
    }
  }

  const useHint = () => {
    if (hintsUsed >= maxHints) return
    const hint = getHint({ puzzle, solution, hintsUsed })
    setHintsUsed((h) => h + 1)
    setHintText(hint)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-r from-brand-primaryTint via-brand-skyTint to-brand-lavender p-[1px] shadow">
        <div className="rounded-3xl border border-brand-white/60 bg-brand-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-brand-navy to-brand-violet bg-clip-text text-transparent">
                  {puzzle.title}
                </span>
              </h2>
              <p className="mt-2 text-brand-ink/80">{puzzle.prompt}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-brand-ink/10 bg-brand-white/70 px-3 py-1 text-xs font-semibold text-brand-ink/80 shadow-sm backdrop-blur">
                <i className="bi bi-calendar2" aria-hidden />
                <span className="ml-2">{dateKey}</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-brand-primaryTint px-3 py-1 text-xs font-semibold text-brand-primary shadow-sm">
                <i className="bi bi-lightbulb" aria-hidden />
                <span className="ml-2">{maxHints - hintsUsed} hints</span>
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-brand-white/60 bg-brand-white/65 p-4 shadow-sm backdrop-blur">
            {puzzle.type === "pattern" || puzzle.type === "deduction" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {puzzle.data.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-left transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                      answer === opt
                        ? "border-brand-primary bg-brand-primaryTint"
                        : "border-brand-ink/10 bg-brand-white/80 hover:bg-brand-white"
                    }`}
                    onClick={() => setAnswer(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-brand-ink">Answer</label>
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={puzzle.type === "matrix" ? "Enter 16 digits (1–4)" : "Type your answer"}
                  className="mt-1 w-full rounded-xl border border-brand-ink/10 bg-brand-white/80 px-3 py-2 outline-none shadow-sm transition-shadow focus:shadow"
                />
                {puzzle.type === "matrix" && (
                  <p className="mt-2 text-xs text-brand-ink/70">Tip: you can type digits only, e.g. 1234341221434321</p>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primaryAlt to-brand-violet px-5 py-3 font-semibold text-brand-white shadow transition-all hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
              >
                <i className="bi bi-check2-circle" aria-hidden />
                Check
              </button>
              <button
                type="button"
                onClick={useHint}
                disabled={hintsUsed >= maxHints}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-navy px-5 py-3 font-semibold text-brand-white shadow transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
              >
                <i className="bi bi-lightbulb-fill" aria-hidden />
                Hint ({maxHints - hintsUsed} left)
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-ink/80">
              <div>
                <span className="font-semibold text-brand-navy">Attempts</span>: {attempts}
              </div>
              <div>
                <span className="font-semibold text-brand-navy">Hints</span>: {hintsUsed}
              </div>
              {status?.ok && score != null && (
                <div className="font-semibold text-brand-navy">
                  <i className="bi bi-trophy" aria-hidden /> <span className="ml-1">Score: {score}</span>
                </div>
              )}
            </div>

            {hintText && (
              <div className="mt-4 rounded-2xl border border-brand-ink/10 bg-brand-white/70 p-3 text-sm text-brand-ink shadow-sm backdrop-blur">
                {hintText}
              </div>
            )}

            {status && (
              <div
                className={`mt-4 rounded-xl border p-3 text-sm ${status.ok ? "border-green-200 bg-green-50 text-green-800" : "border-brand-accent/30 bg-brand-accent/10 text-brand-ink"}`}
              >
                {status.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Puzzle