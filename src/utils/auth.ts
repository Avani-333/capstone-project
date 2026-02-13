import { httpJson } from "./http";
import { clearSessionUser, setSessionUser, type AuthMethod, type SessionUser } from "./session";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (params: {
            client_id: string;
            callback: (resp: { credential?: string }) => void;
          }) => void;
          prompt: (cb: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void;
        };
      };
    };
    Truecaller?: {
      initialize?: (params: { partnerKey: string }) => void;
      requestVerification?: (params: {
        onSuccess: (data: { phone?: string; name?: string }) => void;
        onFailure: (err: { message?: string }) => void;
      }) => void;
    };
  }
}

type RegisterResponse = SessionUser & {
  stats?: {
    id: string;
    userId: string;
    puzzlesSolved: number;
    avgSolveTime: number;
  };
};

async function registerUser(body: { email?: string; phone?: string; name?: string; authMethod: AuthMethod }) {
  const user = await httpJson<RegisterResponse>("/api/users/register", {
    method: "POST",
    body,
  });
  setSessionUser(user);
  return user;
}

function createLocalGuest(name = "Guest"): SessionUser {
  return {
    id: `guest_local_${Date.now()}`,
    email: null,
    phone: null,
    name,
    authMethod: "guest",
    streakCount: 0,
    totalPoints: 0,
    lastPlayed: null,
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("Invalid credential");
  const payload = parts[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
  return JSON.parse(json) as Record<string, unknown>;
}

async function loadGoogleIdentityServices(): Promise<void> {
  if (document.getElementById("google-gis")) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-gis";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export const auth = {
  guest: async () => {
    try {
      return await registerUser({ authMethod: "guest", name: "Guest" });
    } catch {
      // Frontend-only mode (e.g., running `npm run dev` on port 5173) won't have `/api/*`.
      // In that case, allow guest sessions to work locally and sync later.
      const local = createLocalGuest("Guest");
      setSessionUser(local);
      return local;
    }
  },

  google: async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      throw new Error("Google login not configured (VITE_GOOGLE_CLIENT_ID missing)");
    }

    await loadGoogleIdentityServices();

    const google = window.google;
    if (!google?.accounts?.id) {
      throw new Error("Google Identity Services not available");
    }

    const googleId = google.accounts.id;

    const credential = await new Promise<string>((resolve, reject) => {
      googleId.initialize({
        client_id: clientId,
        callback: (resp: { credential?: string }) => {
          if (!resp.credential) reject(new Error("Google credential missing"));
          else resolve(resp.credential);
        },
      });
      googleId.prompt((notification) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          reject(new Error("Google sign-in was cancelled"));
        }
      });
    });

    const payload = decodeJwtPayload(credential);
    const email = typeof payload.email === "string" ? payload.email : undefined;
    const name = typeof payload.name === "string" ? payload.name : undefined;

    if (!email) {
      throw new Error("Google did not return an email");
    }

    return registerUser({ authMethod: "google", email, name });
  },

  truecaller: async () => {
    const sdkUrl = import.meta.env.VITE_TRUECALLER_SDK_URL as string | undefined;
    const partnerKey = import.meta.env.VITE_TRUECALLER_PARTNER_KEY as string | undefined;
    if (!sdkUrl || !partnerKey) {
      throw new Error("Truecaller login not configured (VITE_TRUECALLER_SDK_URL / VITE_TRUECALLER_PARTNER_KEY missing)");
    }

    if (!document.getElementById("truecaller-sdk")) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.id = "truecaller-sdk";
        script.src = sdkUrl;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Truecaller SDK"));
        document.head.appendChild(script);
      });
    }

    const Truecaller = window.Truecaller;
    if (!Truecaller) {
      throw new Error("Truecaller SDK did not initialize");
    }

    const result = await new Promise<{ phone?: string; name?: string }>((resolve, reject) => {
      try {
        Truecaller.initialize?.({ partnerKey });
        Truecaller.requestVerification?.({
          onSuccess: (data) => resolve({ phone: data?.phone, name: data?.name }),
          onFailure: (err) => reject(new Error(err?.message ?? "Truecaller verification failed")),
        });
      } catch (err) {
        reject(new Error(err instanceof Error ? err.message : "Truecaller request failed"));
      }
    });

    if (!result.phone) {
      throw new Error("Truecaller did not return a phone number");
    }

    return registerUser({ authMethod: "truecaller", phone: result.phone, name: result.name });
  },

  logout: async () => {
    clearSessionUser();
  },
};
