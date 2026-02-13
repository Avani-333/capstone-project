import { useMemo } from "react";
import { addDaysToDateKey, listPastDateKeys } from "../utils/db";

export type HeatmapEntry = {
  dateKey: string;
  solved: boolean;
  score: number;
};

function levelFor(entry: HeatmapEntry | undefined): 0 | 1 | 2 | 3 {
  if (!entry || !entry.solved) return 0;
  if (entry.score >= 800) return 3;
  if (entry.score >= 500) return 2;
  return 1;
}

function classesForLevel(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 0:
      return "bg-brand-white/70 border-brand-ink/10";
    case 1:
      return "bg-brand-primaryTint border-brand-primaryTint";
    case 2:
      return "bg-brand-primary border-brand-primary";
    case 3:
      return "bg-brand-violet border-brand-violet";
  }
}

function computeStreak(todayKey: string, entriesByDate: Map<string, HeatmapEntry>): number {
  let streak = 0;
  let cursor = todayKey;
  while (true) {
    const e = entriesByDate.get(cursor);
    if (!e?.solved) break;
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }
  return streak;
}

type Props = {
  todayKey: string;
  entries: HeatmapEntry[];
  daysBack?: number;
};

export default function StreakHeatmap({ todayKey, entries, daysBack = 34 }: Props) {
  const entriesByDate = useMemo(() => new Map(entries.map((e) => [e.dateKey, e])), [entries]);
  const keys = useMemo(() => listPastDateKeys(todayKey, daysBack), [daysBack, todayKey]);

  // Simple row layout: 7 columns (days of week) by ~5 weeks
  const cells = keys.map((k) => {
    const e = entriesByDate.get(k);
    const level = levelFor(e);
    return { dateKey: k, level, solved: !!e?.solved, score: e?.score ?? 0 };
  });

  return (
    <div className="rounded-3xl bg-gradient-to-r from-brand-primaryTint via-brand-skyTint to-brand-lavender p-[1px] shadow">
      <div className="rounded-3xl border border-brand-white/60 bg-brand-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-semibold text-brand-navy">Streak</h3>
          <div className="text-sm text-brand-ink/70">Last {daysBack + 1} days</div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {cells.map((c) => (
            <div
              key={c.dateKey}
              title={`${c.dateKey}${c.solved ? ` • score ${c.score}` : ""}`}
              className={`h-4 w-4 rounded-md border shadow-sm ${classesForLevel(c.level)}`}
            />
          ))}
        </div>

        <div className="mt-3 text-sm text-brand-ink">
          Current streak: <span className="font-semibold">{computeStreak(todayKey, entriesByDate)}</span>
        </div>
      </div>
    </div>
  );
}
