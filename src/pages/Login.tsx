import { useMemo, useState } from "react"
import { auth } from "../utils/auth"
import { getSessionUser } from "../utils/session"

function Login() {
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const user = useMemo(() => getSessionUser(), [])
  const hasGoogle = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
  const hasTruecaller = Boolean(import.meta.env.VITE_TRUECALLER_SDK_URL && import.meta.env.VITE_TRUECALLER_PARTNER_KEY)

  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    setIsBusy(true)
    try {
      await fn()
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-r from-brand-primaryTint via-brand-skyTint to-brand-lavender p-[1px] shadow">
        <div className="rounded-3xl border border-brand-white/60 bg-brand-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-brand-navy to-brand-violet bg-clip-text text-transparent">Login</span>
              </h2>
              <p className="mt-2 text-brand-ink/80">Pick a sign-in method to save streaks and scores.</p>
            </div>
            <div className="text-3xl text-brand-violet" aria-hidden>
              <i className="bi bi-shield-lock" />
            </div>
          </div>

        {user ? (
          <div className="mt-6 rounded-2xl border border-brand-white/60 bg-brand-white/65 p-4 text-brand-ink shadow-sm backdrop-blur transition-shadow hover:shadow">
            <div>
              Signed in as <span className="font-semibold text-brand-navy">{user.name ?? user.email ?? user.phone ?? "User"}</span>
            </div>
            <div className="mt-1 text-sm text-brand-ink/70">Method: {user.authMethod}</div>

            <button
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent underline disabled:opacity-50"
              disabled={isBusy}
              onClick={() => run(() => auth.logout())}
            >
              <i className="bi bi-box-arrow-right" aria-hidden />
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
          {error && (
            <div className="mx-auto max-w-md rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            className="mx-auto block w-full max-w-md rounded-2xl bg-gradient-to-r from-brand-navy to-brand-violet px-4 py-3 font-semibold text-brand-white shadow transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/40"
            disabled={isBusy}
            onClick={() => run(() => auth.guest())}
          >
            {isBusy ? "Working…" : "Continue as Guest"}
          </button>

          <button
            className="mx-auto block w-full max-w-md rounded-2xl bg-gradient-to-r from-brand-primary via-brand-primaryAlt to-brand-violet px-4 py-3 font-semibold text-brand-white shadow transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
            disabled={isBusy || !hasGoogle}
            onClick={() => {
              if (!hasGoogle) return
              void run(() => auth.google())
            }}
          >
            {hasGoogle ? "Sign in with Google" : "Google login (configure VITE_GOOGLE_CLIENT_ID)"}
          </button>

          <button
            className="mx-auto block w-full max-w-md rounded-2xl bg-gradient-to-r from-brand-violet to-brand-navy px-4 py-3 font-semibold text-brand-white shadow transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
            disabled={isBusy || !hasTruecaller}
            onClick={() => {
              if (!hasTruecaller) return
              void run(() => auth.truecaller())
            }}
          >
            {hasTruecaller ? "Sign in with Truecaller" : "Truecaller login (configure VITE_TRUECALLER_*)"}
          </button>

            <p className="mx-auto max-w-md text-left text-sm text-brand-ink/70">
              Tip: Google requires setting <span className="font-secondary font-semibold">VITE_GOOGLE_CLIENT_ID</span>. Truecaller
              requires <span className="font-secondary font-semibold">VITE_TRUECALLER_SDK_URL</span> and{" "}
              <span className="font-secondary font-semibold">VITE_TRUECALLER_PARTNER_KEY</span>.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default Login