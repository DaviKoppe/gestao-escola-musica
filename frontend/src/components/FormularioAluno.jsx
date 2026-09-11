import {useState} from "react";
import api from "../services/api";

const inputClasses =
    "border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 " +
    "focus:outline-none focus:ring-2 focus:ring-purple-400 w-full";

const buttonClasses =
    "px-3 py-2 rounded-md bg-purple-500 text-white text-sm font-medium " +
    "hover:bg-purple-600 transition-colors";

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
    }

    return (
        <div className="flex flex-col gap-3 w-full">
            <input
                type="text"
                placeholder="Nome do aluno"
                value={aluno.nome}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ nome: e.target.value }))
                }
                className={inputClasses}
            />

            <div className="flex gap-2 items-center">
                <select
                    value={aluno.curso}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ curso: e.target.value }))
                    }
                    className={inputClasses}
                >
                    <option value="">Selecione um curso</option>

                    {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                            {curso.nome}
                        </option>
                    ))}
                </select>

                <button onClick={() => setCriandoCurso(!criandoCurso)} className={buttonClasses}>
                    {criandoCurso ? "Cancelar" : "+ Criar curso"}
                </button>
            </div>

            {criandoCurso && (
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="Nome do novo curso"
                        value={nomeCurso}
                        onChange={(e) => setNomeCurso(e.target.value)}
                        className={inputClasses}
                    />

                    <button onClick={criarCurso} className={buttonClasses}>
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
                className={inputClasses}
            />

            <input
                type="date"
                placeholder="Data de nascimento"
                value={aluno.dataNascimento}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ dataNascimento: e.target.value }))
                }
                className={inputClasses}
            />

            <input
                type="text"
                placeholder="Telefone"
                value={aluno.telefone}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ telefone: e.target.value }))
                }
                className={inputClasses}
            />

            <input
                type="text"
                placeholder="Endereço"
                value={aluno.endereco}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ endereco: e.target.value }))
                }
                className={inputClasses}
            />

            <input
                type="text"
                placeholder="Dia de vencimento"
                value={aluno.diaVencimento}
                onChange={(e) =>
                    setAluno(aluno.atualizarCampos({ diaVencimento: e.target.value }))
                }
                className={inputClasses}
            />
        </div>
    )
}

export default FormularioAluno