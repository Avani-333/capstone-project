import { Suspense, lazy, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import MainLayout from "../layouts/MainLayout"
import { track } from "../utils/analytics"

const Home = lazy(() => import("./Home"))
const Puzzle = lazy(() => import("./puzzle"))
const Login = lazy(() => import("./Login"))

function App() {
  const [page, setPage] = useState<"home" | "puzzle" | "login">("home")
  const title = useMemo(() => {
    switch (page) {
      case "home":
        return "Home"
      case "puzzle":
        return "Puzzle"
      case "login":
        return "Login"
    }
  }, [page])

  const onNavigate = (next: "home" | "puzzle" | "login") => {
    setPage(next)
    track("page_view", { page: next })
  }

  return (
    <MainLayout onNavigate={onNavigate}>
      <Suspense fallback={<div className="max-w-2xl mx-auto text-brand-ink">Loading…</div>}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            aria-label={title}
          >
            {page === "home" && <Home />}
            {page === "puzzle" && <Puzzle />}
            {page === "login" && <Login />}
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </MainLayout>
  )
}

export default App