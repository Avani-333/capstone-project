export type AuthMethod = "google" | "truecaller" | "guest";

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  authMethod: AuthMethod;
  streakCount: number;
  totalPoints: number;
  lastPlayed: string | null;
};

const KEY = "logicLooper.sessionUser";

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function setSessionUser(user: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSessionUser() {
  localStorage.removeItem(KEY);
}
