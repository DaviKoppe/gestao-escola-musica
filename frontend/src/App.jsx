import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"

import Layout from "./components/Layout"
import Alunos from "./pages/Alunos"
import Cursos from "./pages/Cursos"
import Mensalidades from "./pages/Mensalidades"
import Professores from "./pages/Professores"
import Dashboard from "./pages/Dashboard";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/alunos" element={<Alunos />} />
                    <Route path="/cursos" element={<Cursos />} />
                    <Route path="/professores" element={<Professores />} />
                    <Route path="/mensalidades" element={<Mensalidades />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App