import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  onNavigate: (page: "home" | "puzzle" | "login") => void
}

function MainLayout({ children, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-brand-surface text-brand-ink">
      <header className="p-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-brand-white shadow">
        <span className="font-bold text-xl text-brand-navy">
          Logic Looper
        </span>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <button
            className="text-sm text-brand-primary underline transition-opacity hover:opacity-80"
            onClick={() => onNavigate("home")}
          >
            Home
          </button>

          <button
            className="text-sm text-brand-primary underline transition-opacity hover:opacity-80"
            onClick={() => onNavigate("puzzle")}
          >
            Puzzle
          </button>

          <button
            className="text-sm text-brand-primary underline transition-opacity hover:opacity-80"
            onClick={() => onNavigate("login")}
          >
            Login
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        {children}
      </main>
    </div>
  )
}

export default MainLayout