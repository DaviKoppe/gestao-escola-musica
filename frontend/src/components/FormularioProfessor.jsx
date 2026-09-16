const inputClasses =
    "border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 " +
    "focus:outline-none focus:ring-2 focus:ring-purple-400 w-full";

const labelClasses = "text-sm text-gray-600 flex flex-col gap-1";

function FormularioProfessor({
                                 professor,
                                 setProfessor,
                                 cursos
                             }) {
    function alternarCurso(cursoId) {
        const cursosAtuais = professor.cursos;

        if (cursosAtuais.includes(cursoId)) {
            setProfessor(
                professor.atualizarCampos({
                    cursos: cursosAtuais.filter((id) => id !== cursoId)
                })
            );

            return;
        }

        setProfessor(
            professor.atualizarCampos({
                cursos: [...cursosAtuais, cursoId]
            })
        );
    }

    return (
        <div className="flex flex-col gap-3 w-full">

            <label className={labelClasses}>
                Nome do professor
                <input
                    type="text"
                    value={professor.nome}
                    onChange={(e) =>
                        setProfessor(
                            professor.atualizarCampos({
                                nome: e.target.value
                            })
                        )
                    }
                    className={inputClasses}
                />
            </label>

            <label className={labelClasses}>
                Data de nascimento
                <input
                    type="date"
                    value={professor.dataNascimento}
                    onChange={(e) =>
                        setProfessor(
                            professor.atualizarCampos({
                                dataNascimento: e.target.value
                            })
                        )
                    }
                    className={inputClasses}
                />
            </label>

            <div className={labelClasses}>
                Cursos

                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                    {cursos.map((curso) => (
                        <label key={curso.id} className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={professor.cursos.includes(curso.id)}
                                onChange={() => alternarCurso(curso.id)}
                                className="accent-purple-500 h-4 w-4"
                            />
                            {curso.nome}
                        </label>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default FormularioProfessor