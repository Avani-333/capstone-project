import Dexie, { type Table } from "dexie";

export type DailyProgressRow = {
  id?: number;
  userId: string;
  dateKey: string; // YYYY-MM-DD (local)
  puzzleId: string;
  puzzleType: string;
  state: unknown; // client-side puzzle state snapshot
  hintsUsed: number;
  attempts?: number;
  score?: number;
  timeTakenMs?: number;
  startedAt: string; // ISO
  solvedAt: string | null; // ISO
  updatedAt: string; // ISO
};

export type CachedPuzzleRow = {
  dateKey: string; // YYYY-MM-DD (local)
  puzzleId: string;
  puzzleType: string;
  payload: unknown; // deterministic generated puzzle payload
  createdAt: string; // ISO
};

class LogicLooperDB extends Dexie {
  dailyProgress!: Table<DailyProgressRow, number>;
  cachedPuzzles!: Table<CachedPuzzleRow, string>;

  constructor() {
    super("LogicLooperDB");

    this.version(1).stores({
      // Primary key autoincrement; queryable by userId+dateKey
      dailyProgress: "++id,[userId+dateKey],userId,dateKey,puzzleId",

      // Primary key dateKey
      cachedPuzzles: "dateKey,puzzleId,puzzleType",
    });

    // v2: add optional scoring fields (no new indexes required)
    this.version(2).stores({
      dailyProgress: "++id,[userId+dateKey],userId,dateKey,puzzleId",
      cachedPuzzles: "dateKey,puzzleId,puzzleType",
    });
  }
}

export const db = new LogicLooperDB();

export function toLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const dt = parseDateKey(dateKey);
  dt.setDate(dt.getDate() + days);
  return toLocalDateKey(dt);
}

export function listPastDateKeys(fromDateKey: string, daysBack: number): string[] {
  const keys: string[] = [];
  for (let i = daysBack; i >= 0; i--) keys.push(addDaysToDateKey(fromDateKey, -i));
  return keys;
}

export const dbOps = {
  getDailyProgress: async (userId: string, dateKey = toLocalDateKey()) => {
    return db.dailyProgress.where({ userId, dateKey }).first();
  },

  listDailyProgressSince: async (userId: string, sinceDateKey: string) => {
    // dateKey uses YYYY-MM-DD so lexicographic compare matches chronological order.
    return db.dailyProgress
      .where("userId")
      .equals(userId)
      .and((row) => row.dateKey >= sinceDateKey)
      .toArray();
  },

  upsertDailyProgress: async (row: Omit<DailyProgressRow, "id" | "updatedAt">) => {
    const existing = await db.dailyProgress.where({ userId: row.userId, dateKey: row.dateKey }).first();
    const nowIso = new Date().toISOString();
    if (existing?.id != null) {
      await db.dailyProgress.update(existing.id, { ...row, updatedAt: nowIso });
      return existing.id;
    }
    return db.dailyProgress.add({ ...row, updatedAt: nowIso });
  },

  cachePuzzle: async (row: CachedPuzzleRow) => {
    return db.cachedPuzzles.put(row);
  },

  getCachedPuzzle: async (dateKey = toLocalDateKey()) => {
    return db.cachedPuzzles.get(dateKey);
  },
};
