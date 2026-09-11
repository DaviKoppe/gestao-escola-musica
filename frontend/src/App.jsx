import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./components/Layout"
import Alunos from "./pages/Alunos"
import Cursos from "./pages/Cursos"
import Mensalidades from "./pages/Mensalidades"

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Alunos />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/mensalidades" element={<Mensalidades />} />
          </Route>
        </Routes>
      </BrowserRouter>
  )
}

export default App