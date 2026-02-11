import { useState } from "react"
import MainLayout from "../layouts/MainLayout"
import Home from "./Home"
import Puzzle from "./puzzle"
import Login from "./Login"

function App() {
  const [page, setPage] = useState<"home" | "puzzle" | "login">("home")

  return (
    <MainLayout onNavigate={setPage}>
      {page === "home" && <Home />}
      {page === "puzzle" && <Puzzle />}
      {page === "login" && <Login />}
    </MainLayout>
  )
}

export default App