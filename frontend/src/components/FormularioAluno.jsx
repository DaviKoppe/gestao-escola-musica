import {useState} from "react";
import api from "../services/api";

function FormularioAluno({ aluno, setAluno, cursos, setCursos }) {
    const [criandoCurso, setCriandoCurso] = useState(false);
    const [nomeCurso, setNomeCurso] = useState("");

    const criarCurso = () => {
        if (!nomeCurso.trim()) {
            return
        }

        api.post(
            "/api/cursos/",
            {nome: nomeCurso}
        )
            .then((response) => {
                setCursos([...cursos, response.data])

                setAluno(
                    aluno.atualizarCampos({
                        curso: response.data.id
                    })
                )
                setNomeCurso("")
                setCriandoCurso(false)
            })
            .catch((error) => {
                console.log("STATUS:", error.response?.status)
                console.log("ERRO:", error.response?.data)
            })
    }
    return (
        <>
            <input
                type="text"
                placeholder="Nome do aluno"
                value={aluno.nome}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ nome: e.target.value }))
                }
            />

            <div>
                <select
                    value={aluno.curso}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ curso: e.target.value }))
                    }
                >
                    <option value="">Selecione um curso</option>

                    {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                            {curso.nome}
                        </option>
                    ))}
                </select>

                <button onClick={() => setCriandoCurso(!criandoCurso)}>
                    {criandoCurso ? "Cancelar" : "+ Criar curso"}
                </button>
            </div>

            {criandoCurso && (
                <div>
                    <input
                        type="text"
                        placeholder="Nome do novo curso"
                        value={nomeCurso}
                        onChange={(e) => setNomeCurso(e.target.value)}
                    />

                    <button onClick={criarCurso}>
                        Salvar curso
                    </button>
                </div>
            )}

            <input
                type="text"
                placeholder="Mensalidade"
                value={aluno.mensalidade}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ mensalidade: e.target.value }))
                }
            />

            <input
                type="date"
                placeholder="Data de nascimento"
                value={aluno.dataNascimento}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ dataNascimento: e.target.value }))
                }
            />

            <input
                type="text"
                placeholder="Telefone"
                value={aluno.telefone}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ telefone: e.target.value }))
                }
            />

            <input
                type="text"
                placeholder="Endereço"
                value={aluno.endereco}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ endereco: e.target.value }))
                }
            />

            <input
                type="text"
                placeholder="Dia de vencimento"
                value={aluno.diaVencimento}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ diaVencimento: e.target.value }))
                }
            />
        </>
    )
}

export default FormularioAluno