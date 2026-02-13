import { useEffect, useMemo, useState } from "react"
import StreakHeatmap, { type HeatmapEntry } from "../components/StreakHeatmap"
import { addDaysToDateKey, dbOps, toLocalDateKey } from "../utils/db"
import { getSessionUser } from "../utils/session"

function Home() {
  const user = useMemo(() => getSessionUser(), [])
  const todayKey = useMemo(() => toLocalDateKey(), [])
  const [entries, setEntries] = useState<HeatmapEntry[]>([])

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
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold text-brand-navy">Welcome</h2>
        <p className="mt-3 text-brand-ink">
          Open the Login page to continue as Guest (or configure Google/Truecaller).
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-3xl font-semibold text-brand-navy">Welcome{user.name ? `, ${user.name}` : ""}</h2>
        <div className="text-sm text-brand-ink/70">Today: {todayKey}</div>
      </div>

      <div className="mt-6">
        <StreakHeatmap todayKey={todayKey} entries={entries} />
      </div>

      <div className="mt-6 rounded bg-brand-white p-4 shadow">
        <h3 className="text-lg font-semibold text-brand-navy">Progress</h3>
        <p className="mt-2 text-sm text-brand-ink/80">
          Your daily puzzle progress is saved locally on this device.
        </p>
      </div>
    </div>
  )
}

export default Home