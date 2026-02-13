import { useEffect, useMemo, useState } from "react"
import StreakHeatmap, { type HeatmapEntry } from "../components/StreakHeatmap"
import { addDaysToDateKey, dbOps, toLocalDateKey } from "../utils/db"
import { getSessionUser } from "../utils/session"

type Props = {
  onNavigate: (page: "home" | "puzzle" | "login") => void
}

function Home({ onNavigate }: Props) {
  const user = useMemo(() => getSessionUser(), [])
  const todayKey = useMemo(() => toLocalDateKey(), [])
  const [entries, setEntries] = useState<HeatmapEntry[]>([])

  const currentStreak = useMemo(() => {
    const map = new Map(entries.map((e) => [e.dateKey, e]))
    let streak = 0
    let cursor = todayKey
    while (true) {
      const e = map.get(cursor)
      if (!e?.solved) break
      streak += 1
      cursor = addDaysToDateKey(cursor, -1)
    }
    return streak
  }, [entries, todayKey])

  const totalScore = useMemo(() => entries.reduce((sum, e) => sum + (e.score ?? 0), 0), [entries])

  useEffect(() => {
    if (!user) return
    let isMounted = true
    const load = async () => {
      const since = addDaysToDateKey(todayKey, -34)
      const rows = await dbOps.listDailyProgressSince(user.id, since)
      const next: HeatmapEntry[] = rows.map((r) => ({
        dateKey: r.dateKey,
        solved: r.solvedAt != null,
        score: r.score ?? 0,
      }))
      if (isMounted) setEntries(next)
    }
    void load()
    return () => {
      isMounted = false
    }
  }, [todayKey, user])

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-brand-primaryTint via-brand-skyTint to-brand-lavender p-[1px] shadow">
          <div className="rounded-3xl border border-brand-white/60 bg-brand-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-4xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-brand-navy to-brand-violet bg-clip-text text-transparent">
                    Logic Looper
                  </span>
                </h2>
              <p className="mt-2 text-brand-ink/80">
                A quick daily logic challenge. One puzzle a day, streaks that actually feel good.
              </p>
              </div>
              <div className="hidden sm:block text-3xl text-brand-primary" aria-hidden>
                <i className="bi bi-stars" />
              </div>
            </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primaryAlt to-brand-violet px-5 py-3 font-semibold text-brand-white shadow transition-all hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
            >
              <i className="bi bi-person-circle" aria-hidden />
              Start (Guest or Login)
            </button>

            <button
              type="button"
              onClick={() => onNavigate("puzzle")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-ink/10 bg-brand-white/70 px-5 py-3 font-semibold text-brand-navy shadow-sm backdrop-blur transition-all hover:bg-brand-white hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky/50"
            >
              <i className="bi bi-play-circle" aria-hidden />
              Preview Today’s Puzzle
            </button>
          </div>

          <p className="mt-4 text-sm text-brand-ink/70">
            Tip: if you want database-backed scores, run with <span className="font-secondary font-semibold">Vercel dev</span>.
          </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-r from-brand-primaryTint via-brand-skyTint to-brand-lavender p-[1px] shadow">
        <div className="rounded-3xl border border-brand-white/60 bg-brand-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-brand-navy">
              Welcome{user.name ? `, ${user.name}` : ""}
            </h2>
            <p className="mt-2 text-brand-ink/80">Today’s challenge is ready. Keep your streak alive.</p>
          </div>
          <div className="text-sm text-brand-ink/70">{todayKey}</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-white/60 bg-brand-white/65 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-brand-ink/70">Current streak</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-sky text-brand-navy" aria-hidden>
                <i className="bi bi-fire" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-brand-navy">{currentStreak}</div>
              <div className="text-sm text-brand-ink/70">days</div>
            </div>
          </div>
          <div className="rounded-2xl border border-brand-white/60 bg-brand-white/65 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-brand-ink/70">Score (last 35 days)</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-white text-brand-primary" aria-hidden>
                <i className="bi bi-trophy" />
              </span>
            </div>
            <div className="mt-1 text-3xl font-bold text-brand-navy">{totalScore}</div>
          </div>
          <div className="rounded-2xl border border-brand-white/60 bg-brand-white/65 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-brand-ink/70">Account</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-white text-brand-navy" aria-hidden>
                <i className="bi bi-person-circle" />
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold text-brand-navy">
              {user.name ?? user.email ?? user.phone ?? "User"}
            </div>
            <div className="mt-1 text-xs text-brand-ink/70">{user.authMethod}</div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => onNavigate("puzzle")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primaryAlt to-brand-violet px-5 py-3 font-semibold text-brand-white shadow transition-all hover:shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            <i className="bi bi-controller" aria-hidden />
            Play Today’s Puzzle
          </button>
        </div>
        </div>
      </div>

      <div className="mt-6">
        <StreakHeatmap todayKey={todayKey} entries={entries} />
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-primaryTint via-brand-skyTint to-brand-lavender p-[1px] shadow">
        <div className="rounded-2xl bg-brand-white p-6 transition-shadow hover:shadow-lg">
        <h3 className="text-lg font-semibold text-brand-navy">How it works</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-ink/10 bg-brand-skyTint p-4">
            <div className="text-sm font-semibold text-brand-navy">
              <i className="bi bi-calendar2-check" aria-hidden /> Daily
            </div>
            <p className="mt-2 text-sm text-brand-ink/80">One deterministic puzzle per day (same for everyone).</p>
          </div>
          <div className="rounded-xl border border-brand-ink/10 bg-brand-primaryTint p-4">
            <div className="text-sm font-semibold text-brand-navy">
              <i className="bi bi-lightbulb" aria-hidden /> Hints
            </div>
            <p className="mt-2 text-sm text-brand-ink/80">Up to 3 hints. More hints means lower score.</p>
          </div>
          <div className="rounded-xl border border-brand-ink/10 bg-brand-lavender p-4">
            <div className="text-sm font-semibold text-brand-navy">
              <i className="bi bi-wifi-off" aria-hidden /> Offline
            </div>
            <p className="mt-2 text-sm text-brand-ink/80">Progress saves locally and works offline in production.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Home