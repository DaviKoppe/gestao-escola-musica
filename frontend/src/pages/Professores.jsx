import { useEffect, useState } from "react"
import api from "../services/api"
import Professor from "../models/ProfessorModel"
import FormularioProfessor from "../components/FormularioProfessor"
import Modal from "../components/Modal"

const botaoPrimario =
    "px-4 py-2 rounded-md bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors";
const botaoSecundario =
    "px-4 py-2 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors";
const botaoNeutro =
    "px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors";
const botaoPerigo =
    "px-3 py-1.5 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors";

function Professores() {
    const [professores, setProfessores] = useState([])
    const [cursos, setCursos] = useState([])
    const [professor, setProfessor] = useState(new Professor())
    const [idProfessorEditando, setIdProfessorEditando] = useState(null)
    const [modalAberto, setModalAberto] = useState(false)

    useEffect(() => {
        api.get("/api/professores/")
            .then((response) => setProfessores(response.data))
            .catch((error) => console.log("Erro ao buscar professores:", error))

        api.get("/api/cursos/")
            .then((response) => setCursos(response.data))
            .catch((error) => console.log("Erro ao buscar cursos:", error))
    }, [])

    function abrirModalNovoProfessor() {
        setProfessor(new Professor())
        setIdProfessorEditando(null)
        setModalAberto(true)
    }

    function criarProfessor() {
        api.post("/api/professores/", {
            nome: professor.nome,
            data_nascimento: professor.dataNascimento,
            cursos: professor.cursos,
        })
            .then((response) => {
                setProfessores((atuais) => [...atuais, response.data])
                setProfessor(new Professor())
                setModalAberto(false)
            })
            .catch((error) => console.log("Erro ao criar professor:", error))
    }

    function iniciarEdicaoProfessor(id) {
        const professorEncontrado = professores.find((p) => p.id === id)
        if (professorEncontrado) {
            setProfessor(new Professor(
                professorEncontrado.nome,
                professorEncontrado.data_nascimento,
                professorEncontrado.cursos
            ))
            setIdProfessorEditando(id)
            setModalAberto(true)
        }
    }

    function atualizarProfessor() {
        api.patch(`/api/professores/${idProfessorEditando}/`, {
            nome: professor.nome,
            data_nascimento: professor.dataNascimento,
            cursos: professor.cursos,
        })
            .then((response) => {
                setProfessores((atuais) =>
                    atuais.map((p) => (p.id === idProfessorEditando ? response.data : p))
                )
                setIdProfessorEditando(null)
                setProfessor(new Professor())
                setModalAberto(false)
            })
            .catch((error) => console.log("Erro ao editar professor:", error))
    }

    function excluirProfessor(id) {
        api.delete(`/api/professores/${id}/`)
            .then(() => {
                setProfessores((atuais) => atuais.filter((p) => p.id !== id))
            })
            .catch((error) => console.log("Erro ao excluir professor:", error))
    }

    function obterNomesCursos(cursosDoProfessor) {
        return cursosDoProfessor.map((cursoId) => {
            const curso = cursos.find((curso) => curso.id === cursoId)
            return curso ? curso.nome : "Curso não encontrado"
        })
    }

    return (
        <div className="w-full px-6 py-10 text-left">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Professores</h1>
                    <p className="text-gray-400 mt-1">Corpo docente da escola.</p>
                </div>

                <button onClick={abrirModalNovoProfessor} className={botaoPrimario}>
                    + Registrar Professor
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {professores.map((professorAtual) => (
                    <div key={professorAtual.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-medium text-gray-800">{professorAtual.nome}</p>
                                <p className="text-sm text-gray-500">
                                    Nascimento: {professorAtual.data_nascimento}
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => iniciarEdicaoProfessor(professorAtual.id)} className={botaoNeutro}>
                                    Editar
                                </button>

                                <button onClick={() => excluirProfessor(professorAtual.id)} className={botaoPerigo}>
                                    Excluir
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {obterNomesCursos(professorAtual.cursos).map((nomeCurso, indice) => (
                                <span
                                    key={indice}
                                    className="text-xs font-medium text-purple-700 bg-purple-100 rounded-full px-2.5 py-1"
                                >
                                    {nomeCurso}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                titulo={idProfessorEditando !== null ? "Editar professor" : "Novo professor"}
            >
                <FormularioProfessor
                    professor={professor}
                    setProfessor={setProfessor}
                    cursos={cursos}
                />

                <div className="flex gap-3 mt-4">
                    <button onClick={criarProfessor} className={botaoPrimario}>
                        Salvar professor
                    </button>
                    {idProfessorEditando !== null && (
                        <button onClick={atualizarProfessor} className={botaoSecundario}>
                            Atualizar professor
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default Professores