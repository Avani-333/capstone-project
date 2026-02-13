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
    <div className="text-center">
      <h2 className="text-3xl font-semibold">
        Login
      </h2>

      {user ? (
        <div className="mt-4 text-gray-700 space-y-2">
          <div>
            Signed in as <span className="font-semibold">{user.name ?? user.email ?? user.phone ?? "User"}</span>
          </div>
          <div className="text-sm text-gray-500">
            Method: {user.authMethod}
          </div>

          <button
            className="mt-2 text-sm text-blue-600 underline disabled:opacity-50"
            disabled={isBusy}
            onClick={() => run(() => auth.logout())}
          >
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
            className="mx-auto block w-full max-w-md rounded bg-brand-navy px-4 py-3 text-brand-white disabled:opacity-50"
            disabled={isBusy}
            onClick={() => run(() => auth.guest())}
          >
            Continue as Guest
          </button>

          <button
            className="mx-auto block w-full max-w-md rounded bg-brand-primary px-4 py-3 text-brand-white disabled:opacity-50"
            disabled={isBusy || !hasGoogle}
            onClick={() => {
              if (!hasGoogle) return
              void run(() => auth.google())
            }}
          >
            {hasGoogle ? "Sign in with Google" : "Google login (configure VITE_GOOGLE_CLIENT_ID)"}
          </button>

          <button
            className="mx-auto block w-full max-w-md rounded bg-brand-violet px-4 py-3 text-brand-white disabled:opacity-50"
            disabled={isBusy || !hasTruecaller}
            onClick={() => {
              if (!hasTruecaller) return
              void run(() => auth.truecaller())
            }}
          >
            {hasTruecaller ? "Sign in with Truecaller" : "Truecaller login (configure VITE_TRUECALLER_*)"}
          </button>

          <p className="mx-auto max-w-md text-left text-sm text-gray-500">
            Tip: Google requires setting <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span>. Truecaller requires <span className="font-mono">VITE_TRUECALLER_SDK_URL</span> and <span className="font-mono">VITE_TRUECALLER_PARTNER_KEY</span>.
          </p>
        </div>
      )}
    </div>
  )
}

export default Login