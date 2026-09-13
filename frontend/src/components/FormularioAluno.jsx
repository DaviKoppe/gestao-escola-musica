import {useState} from "react";
import api from "../services/api";

const inputClasses =
    "border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 " +
    "focus:outline-none focus:ring-2 focus:ring-purple-400 w-full";

const buttonClasses =
    "px-3 py-2 rounded-md bg-purple-500 text-white text-sm font-medium " +
    "hover:bg-purple-600 transition-colors";

const labelClasses = "text-sm text-gray-600 flex flex-col gap-1";

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
            <label className={labelClasses}>
                Nome do aluno
                <input
                    type="text"
                    value={aluno.nome}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ nome: e.target.value }))
                    }
                    className={inputClasses}
                />
            </label>

            <div className="flex gap-2 items-end">
                <label className={`${labelClasses} flex-1`}>
                    Curso
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
                </label>

                <button onClick={() => setCriandoCurso(!criandoCurso)} className={buttonClasses}>
                    {criandoCurso ? "Cancelar" : "+ Criar curso"}
                </button>
            </div>

            {criandoCurso && (
                <div className="flex gap-2 items-end">
                    <label className={`${labelClasses} flex-1`}>
                        Nome do novo curso
                        <input
                            type="text"
                            value={nomeCurso}
                            onChange={(e) => setNomeCurso(e.target.value)}
                            className={inputClasses}
                        />
                    </label>

                    <button onClick={criarCurso} className={buttonClasses}>
                        Salvar curso
                    </button>
                </div>
            )}

            <label className={labelClasses}>
                Mensalidade
                <input
                    type="text"
                    value={aluno.mensalidade}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ mensalidade: e.target.value }))
                    }
                    className={inputClasses}
                />
            </label>

            <label className={labelClasses}>
                Data de nascimento
                <input
                    type="date"
                    value={aluno.dataNascimento}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ dataNascimento: e.target.value }))
                    }
                    className={inputClasses}
                />
            </label>

            <label className={labelClasses}>
                Telefone
                <input
                    type="text"
                    value={aluno.telefone}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ telefone: e.target.value }))
                    }
                    className={inputClasses}
                />
            </label>

            <label className={labelClasses}>
                Endereço
                <input
                    type="text"
                    value={aluno.endereco}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ endereco: e.target.value }))
                    }
                    className={inputClasses}
                />
            </label>

            <label className={labelClasses}>
                Dia de vencimento
                <input
                    type="text"
                    value={aluno.diaVencimento}
                    onChange={(e) =>
                        setAluno(aluno.atualizarCampos({ diaVencimento: e.target.value }))
                    }
                    className={inputClasses}
                />
            </label>
        </div>
    )
}

export default FormularioAluno