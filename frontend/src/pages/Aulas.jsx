import { useCallback, useEffect, useState } from "react"
import api from "../services/api"

const hojeLocal = () => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const dia = String(hoje.getDate()).padStart(2, "0")
    return `${ano}-${mes}-${dia}`
}

const formatarData = (data) => {
    if (!data) return "—"
    return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
}

const formatarHora = (hora) => hora?.slice(0, 5) || "—"

const formatarErro = (erro) => {
    const dados = erro.response?.data

    if (!dados) {
        return "Não foi possível conectar ao servidor. Confira se o backend está rodando."
    }

    if (typeof dados === "string") return dados

    return Object.entries(dados)
        .map(([campo, mensagens]) => {
            const texto = Array.isArray(mensagens)
                ? mensagens.join(" ")
                : typeof mensagens === "object"
                    ? JSON.stringify(mensagens)
                    : String(mensagens)

            return `${campo === "non_field_errors" ? "" : `${campo}: `}${texto}`
        })
        .join(" | ")
}

const nomeStatus = {
    agendada: "Agendada",
    realizada: "Realizada",
    cancelada: "Cancelada",
    falta: "Falta",
}

function Aulas() {
    const [alunos, setAlunos] = useState([])
    const [professores, setProfessores] = useState([])
    const [cursos, setCursos] = useState([])
    const [aulas, setAulas] = useState([])
    const [horarios, setHorarios] = useState([])

    const [alunoId, setAlunoId] = useState("")
    const [professorId, setProfessorId] = useState("")
    const [data, setData] = useState(hojeLocal())
    const [tipo, setTipo] = useState("regular")
    const [horarioSelecionado, setHorarioSelecionado] = useState("")
    const [observacoes, setObservacoes] = useState("")

    const [carregando, setCarregando] = useState(true)
    const [buscandoHorarios, setBuscandoHorarios] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState("")
    const [sucesso, setSucesso] = useState("")

    const alunoSelecionado = alunos.find(
        (aluno) => String(aluno.id) === alunoId
    )

    const cursoId = alunoSelecionado?.curso

    const professoresDisponiveis = professores.filter((professor) => {
        if (!cursoId) return false

        const cursosDoProfessor = professor.cursos || []
        const possuiCurso = cursosDoProfessor.some(
            (id) => String(typeof id === "object" ? id.id : id) === String(cursoId)
        )

        return possuiCurso && professor.ativo !== false
    })

    const carregarDados = useCallback(async () => {
        setCarregando(true)
        setErro("")

        try {
            const [resAlunos, resProfessores, resCursos, resAulas] =
                await Promise.all([
                    api.get("/api/alunos/"),
                    api.get("/api/professores/"),
                    api.get("/api/cursos/"),
                    api.get("/aulas/"),
                ])

            const listaAlunos = Array.isArray(resAlunos.data)
                ? resAlunos.data
                : resAlunos.data.results || []

            const listaProfessores = Array.isArray(resProfessores.data)
                ? resProfessores.data
                : resProfessores.data.results || []

            const listaCursos = Array.isArray(resCursos.data)
                ? resCursos.data
                : resCursos.data.results || []

            const listaAulas = Array.isArray(resAulas.data)
                ? resAulas.data
                : resAulas.data.results || []

            setAlunos(listaAlunos)
            setProfessores(listaProfessores)
            setCursos(listaCursos)
            setAulas(listaAulas)
        } catch (e) {
            setErro(formatarErro(e))
        } finally {
            setCarregando(false)
        }
    }, [])

    useEffect(() => {
        carregarDados()
    }, [carregarDados])

    useEffect(() => {
        setProfessorId("")
        setHorarios([])
        setHorarioSelecionado("")
    }, [alunoId])

    useEffect(() => {
        setHorarios([])
        setHorarioSelecionado("")
    }, [professorId, data, tipo])

    useEffect(() => {
        if (!alunoId || !professorId || !data || !tipo) {
            setHorarios([])
            return
        }

        let ativo = true

        const buscarHorarios = async () => {
            setBuscandoHorarios(true)
            setErro("")

            try {
                const resposta = await api.get(
                    "/api/disponibilidade-professor/",
                    {
                        params: {
                            professor: professorId,
                            data,
                            tipo,
                            aluno: alunoId,
                        },
                    }
                )

                const lista = Array.isArray(resposta.data)
                    ? resposta.data
                    : resposta.data.results || []

                if (ativo) setHorarios(lista)
            } catch (e) {
                if (ativo) {
                    setHorarios([])
                    setErro(formatarErro(e))
                }
            } finally {
                if (ativo) setBuscandoHorarios(false)
            }
        }

        buscarHorarios()

        return () => {
            ativo = false
        }
    }, [alunoId, professorId, data, tipo])

    const agendarAula = async (e) => {
        e.preventDefault()
        setErro("")
        setSucesso("")

        const horario = horarios.find(
            (item, indice) =>
                String(indice) === horarioSelecionado
        )

        if (!horario) {
            setErro("Selecione um horário disponível.")
            return
        }

        setSalvando(true)

        try {
            await api.post("/aulas/", {
                aluno: Number(alunoId),
                professor: Number(professorId),
                curso: Number(cursoId),
                horario: horario.horario ?? null,
                data,
                hora_inicio: horario.hora_inicio,
                tipo,
                status: "agendada",
                observacoes,
            })

            setSucesso("Aula agendada com sucesso!")
            setHorarioSelecionado("")
            setObservacoes("")
            await carregarDados()
        } catch (e) {
            setErro(formatarErro(e))
        } finally {
            setSalvando(false)
        }
    }

    const cancelarAula = async (aula) => {
        const confirmar = window.confirm(
            `Deseja cancelar a aula de ${aula.aluno_nome} em ${formatarData(aula.data)} às ${formatarHora(aula.hora_inicio)}?`
        )

        if (!confirmar) return

        setErro("")
        setSucesso("")

        try {
            await api.delete(`/aulas/${aula.id}/`)
            setSucesso("Aula cancelada com sucesso.")
            await carregarDados()
        } catch (e) {
            setErro(formatarErro(e))
        }
    }

    return (
        <main className="min-h-full bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="mb-2 text-sm font-medium text-purple-400">
                            GESTÃO ACADÊMICA
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Aulas
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Organize os agendamentos e acompanhe as aulas da escola.
                        </p>
                    </div>

                    <button
                        onClick={carregarDados}
                        disabled={carregando}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-800 disabled:opacity-50"
                    >
                        ↻ Atualizar
                    </button>
                </header>

                {erro && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                    >
                        {erro}
                    </div>
                )}

                {sucesso && (
                    <div
                        role="status"
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
                    >
                        {sucesso}
                    </div>
                )}

                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg sm:p-7">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">
                            Agendar nova aula
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Os horários são consultados conforme o professor, a data e o tipo de aula.
                        </p>
                    </div>

                    <form onSubmit={agendarAula} className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Aluno
                                </label>
                                <select
                                    required
                                    value={alunoId}
                                    onChange={(e) => setAlunoId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-purple-500"
                                >
                                    <option value="">Selecione um aluno</option>
                                    {alunos
                                        .filter((aluno) => aluno.ativo !== false)
                                        .map((aluno) => (
                                            <option key={aluno.id} value={aluno.id}>
                                                {aluno.nome}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Curso
                                </label>
                                <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-300">
                                    {cursos.find(
                                        (curso) => String(curso.id) === String(cursoId)
                                    )?.nome || "Selecione um aluno primeiro"}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Professor
                                </label>
                                <select
                                    required
                                    value={professorId}
                                    onChange={(e) => setProfessorId(e.target.value)}
                                    disabled={!alunoId}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-purple-500 disabled:opacity-50"
                                >
                                    <option value="">Selecione um professor</option>
                                    {professoresDisponiveis.map((professor) => (
                                        <option key={professor.id} value={professor.id}>
                                            {professor.nome}
                                        </option>
                                    ))}
                                </select>
                                {alunoId && professoresDisponiveis.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-400">
                                        Nenhum professor ativo encontrado para este curso.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Data da aula
                                </label>
                                <input
                                    required
                                    type="date"
                                    min={hojeLocal()}
                                    value={data}
                                    onChange={(e) => setData(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Tipo de aula
                                </label>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-purple-500"
                                >
                                    <option value="regular">Regular · 60 minutos</option>
                                    <option value="experimental">Experimental · 30 minutos</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Horário disponível
                                </label>
                                <select
                                    required
                                    value={horarioSelecionado}
                                    onChange={(e) => setHorarioSelecionado(e.target.value)}
                                    disabled={!professorId || buscandoHorarios || horarios.length === 0}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-purple-500 disabled:opacity-50"
                                >
                                    <option value="">
                                        {buscandoHorarios
                                            ? "Buscando horários..."
                                            : horarios.length
                                                ? "Selecione um horário"
                                                : "Nenhum horário disponível"}
                                    </option>
                                    {horarios.map((horario, indice) => (
                                        <option key={`${horario.hora_inicio}-${indice}`} value={indice}>
                                            {formatarHora(horario.hora_inicio)} – {formatarHora(horario.hora_fim)}
                                            {horario.extraordinario ? " · Extra" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Observações (opcional)
                            </label>
                            <textarea
                                rows={3}
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Informações adicionais sobre a aula..."
                                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-purple-500"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={salvando || buscandoHorarios || !horarioSelecionado}
                                className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {salvando ? "Agendando..." : "Confirmar agendamento"}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg">
                    <div className="border-b border-slate-800 px-5 py-5 sm:px-7">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Aulas cadastradas
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Consulte os agendamentos e cancele quando necessário.
                                </p>
                            </div>
                            <span className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300">
                                {aulas.length} {aulas.length === 1 ? "aula" : "aulas"}
                            </span>
                        </div>
                    </div>

                    {carregando ? (
                        <p className="px-6 py-10 text-center text-sm text-slate-400">
                            Carregando aulas...
                        </p>
                    ) : aulas.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-slate-400">
                            Nenhuma aula cadastrada ainda.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Aluno / Curso</th>
                                    <th className="px-5 py-4 font-medium">Professor</th>
                                    <th className="px-5 py-4 font-medium">Data</th>
                                    <th className="px-5 py-4 font-medium">Horário</th>
                                    <th className="px-5 py-4 font-medium">Tipo</th>
                                    <th className="px-5 py-4 font-medium">Status</th>
                                    <th className="px-5 py-4 font-medium">Ação</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {[...aulas]
                                    .sort((a, b) =>
                                        `${a.data}T${a.hora_inicio}`.localeCompare(
                                            `${b.data}T${b.hora_inicio}`
                                        )
                                    )
                                    .map((aula) => (
                                        <tr key={aula.id} className="transition hover:bg-slate-800/40">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-white">
                                                    {aula.aluno_nome}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {aula.curso_nome}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-300">
                                                {aula.professor_nome}
                                            </td>
                                            <td className="px-5 py-4 text-slate-300">
                                                {formatarData(aula.data)}
                                            </td>
                                            <td className="px-5 py-4 text-slate-300">
                                                {formatarHora(aula.hora_inicio)} – {formatarHora(aula.hora_fim)}
                                            </td>
                                            <td className="px-5 py-4 text-slate-300">
                                                {aula.tipo === "experimental" ? "Experimental" : "Regular"}
                                            </td>
                                            <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            aula.status === "agendada"
                                                                ? "bg-blue-500/10 text-blue-300"
                                                                : aula.status === "realizada"
                                                                    ? "bg-emerald-500/10 text-emerald-300"
                                                                    : aula.status === "cancelada"
                                                                        ? "bg-red-500/10 text-red-300"
                                                                        : "bg-amber-500/10 text-amber-300"
                                                        }`}
                                                    >
                                                        {nomeStatus[aula.status] || aula.status}
                                                    </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {aula.status === "agendada" && (
                                                    <button
                                                        onClick={() => cancelarAula(aula)}
                                                        className="font-medium text-red-300 transition hover:text-red-200"
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Aulas
