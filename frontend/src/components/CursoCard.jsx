import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGuitar, faDrum, faMusic } from '@fortawesome/free-solid-svg-icons'

const iconesPorCurso = {
    "violao": faGuitar,
    "guitarra": faGuitar,
    "bateria": faDrum,
    "pandeiro": faDrum,
    "piano": faMusic,
    "teclado": faMusic,
    "ukulele": faMusic,
    "musicalizacao": faMusic,
}

function obterIcone(nomeCurso) {
    const chave = nomeCurso
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

    return iconesPorCurso[chave] ?? faMusic
}

function CursoCard({ curso }) {
    const icone = obterIcone(curso.nome)
    const professores = curso.professores ?? []
    const totalAlunos = curso.quantidade_alunos

    return (
        <div className="w-70 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="h-50 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <FontAwesomeIcon icon={icone} className="text-4xl text-white" />
            </div>

            <div className="p-4">
                <p className="font-medium text-gray-800 flex items-center gap-2">
                    <FontAwesomeIcon icon={icone} className="text-purple-500" />
                    {curso.nome}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                    Professor(es):{" "}
                    {professores.length > 0
                        ? professores.map((professor) => professor.nome).join(", ")
                        : "A definir"}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                    {totalAlunos} alunos
                </p>
            </div>
        </div>
    )
}

export default CursoCard