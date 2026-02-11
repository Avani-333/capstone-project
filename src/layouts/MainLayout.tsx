import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  onNavigate: (page: "home" | "puzzle" | "login") => void
}

function MainLayout({ children, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="p-4 flex justify-between items-center bg-white shadow">
        <span className="font-bold text-xl">
          Daily Puzzle Game
        </span>

        <div className="space-x-4">
          <button
            className="text-sm text-blue-600 underline"
            onClick={() => onNavigate("home")}
          >
            Home
          </button>

          <button
            className="text-sm text-blue-600 underline"
            onClick={() => onNavigate("puzzle")}
          >
            Puzzle
          </button>

          <button
            className="text-sm text-blue-600 underline"
            onClick={() => onNavigate("login")}
          >
            Login
          </button>
        </div>
      </header>

      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

export default MainLayout