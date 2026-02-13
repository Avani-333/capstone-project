import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  onNavigate: (page: "home" | "puzzle" | "login") => void
}

function MainLayout({ children, onNavigate }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-skyTint via-brand-surface to-brand-lavender text-brand-ink">
      <div className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-40 h-[32rem] w-[32rem] rounded-full bg-brand-violet/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-brand-accent/10 blur-3xl" />

      <header className="p-4">
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-r from-brand-primaryTint via-brand-skyTint to-brand-lavender p-[1px] shadow">
          <div className="flex flex-col gap-3 rounded-2xl border border-brand-white/60 bg-brand-white/70 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-2 text-left"
              aria-label="Go to Home"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primaryTint text-brand-primary">
                <i className="bi bi-infinity" aria-hidden />
              </span>
              <span>
                <span className="block bg-gradient-to-r from-brand-navy to-brand-violet bg-clip-text text-xl font-extrabold leading-tight text-transparent">
                  Logic Looper
                </span>
                <span className="block text-xs text-brand-ink/70">Daily logic puzzles</span>
              </span>
            </button>

            <nav className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-brand-ink/10 bg-brand-white/70 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm backdrop-blur transition-all hover:bg-brand-white hover:shadow active:scale-[0.99]"
                onClick={() => onNavigate("home")}
              >
                <i className="bi bi-house" aria-hidden />
                Home
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-violet px-4 py-2 text-sm font-semibold text-brand-white shadow transition-all hover:shadow-md active:scale-[0.99]"
                onClick={() => onNavigate("puzzle")}
              >
                <i className="bi bi-joystick" aria-hidden />
                Puzzle
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-brand-ink/10 bg-brand-white/70 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm backdrop-blur transition-all hover:bg-brand-white hover:shadow active:scale-[0.99]"
                onClick={() => onNavigate("login")}
              >
                <i className="bi bi-person" aria-hidden />
                Login
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}

export default MainLayout