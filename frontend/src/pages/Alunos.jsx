import { useEffect, useState } from "react"
import api from "../services/api"
import Aluno from "../models/Aluno"
import FormularioAluno from "../components/FormularioAluno"
import Modal from "../components/Modal"

const botaoPrimario =
    "px-4 py-2 rounded-md bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors";
const botaoSecundario =
    "px-4 py-2 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors";
const botaoNeutro =
    "px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors";
const botaoPerigo =
    "px-3 py-1.5 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors";
const botaoSucesso =
    "px-3 py-1.5 rounded-md bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors";
const inputClasses =
    "border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400";

function Alunos() {
    const [alunos, setAlunos] = useState([])
    const [cursos, setCursos] = useState([])
    const [mensalidades, setMensalidades] = useState([])
    const [aluno, setAluno] = useState(new Aluno())
    const [idAlunoEditando, setIdAlunoEditando] = useState(null)
    const [idAlunoExpandido, setIdAlunoExpandido] = useState(null)
    const [idAlunoPagando, setIdAlunoPagando] = useState(null)
    const [formaPagamento, setFormaPagamento] = useState("pix")
    const [numeroNota, setNumeroNota] = useState("")
    const [modalAberto, setModalAberto] = useState(false)

    useEffect(() => {
        api.get("/api/alunos/")
            .then((response) => setAlunos(response.data))

        api.get("/api/cursos/")
            .then((response) => setCursos(response.data))
            .catch((error) => console.log(error))

        api.get("/api/mensalidades/")
            .then((response) => setMensalidades(response.data))
    }, [])

    const totalRecebido = mensalidades
        .filter((m) => m.status === "pago")
        .reduce((soma, m) => soma + Number(m.valor), 0)

    const totalPendente = mensalidades
        .filter((m) => m.status === "pendente")
        .reduce((soma, m) => soma + Number(m.valor), 0)

    const totalAtrasado = mensalidades
        .filter((m) => m.status === "atrasado")
        .reduce((soma, m) => soma + Number(m.valor), 0)

    function abrirModalNovoAluno() {
        setAluno(new Aluno())
        setIdAlunoEditando(null)
        setModalAberto(true)
    }

    function addAluno() {
        const novoAluno = {
            nome: aluno.nome,
            curso: aluno.curso,
            valor_mensalidade: aluno.mensalidade,
            data_nascimento: aluno.dataNascimento,
            telefone: aluno.telefone,
            endereco: aluno.endereco,
            dia_vencimento: aluno.diaVencimento
        }

        api.post(
            "/api/alunos/",
            novoAluno
        )
            .then((response) => {
                setAlunos([...alunos, response.data])
                setAluno(new Aluno())
                setModalAberto(false)

                api.get("/api/mensalidades/")
                    .then((response) => setMensalidades(response.data))
            })
            .catch((error) => {
                console.log("Erro:", error)
            })
    }

    const excluirAluno = (id) => {
        api.delete(`/api/alunos/${id}/`)
            .then(() => {
                setAlunos(alunos.filter((aluno) => aluno.id !== id))
            })
            .catch((error) => {
                console.log("Erro ao excluir aluno:", error)
            })
    }

    const editarAluno = (id) => {
        const alunoEncontrado = alunos.find((aluno) => aluno.id === id)
        if (alunoEncontrado) {
            setAluno(new Aluno(
                alunoEncontrado.nome,
                alunoEncontrado.curso,
                alunoEncontrado.valor_mensalidade,
                alunoEncontrado.data_nascimento,
                alunoEncontrado.telefone,
                alunoEncontrado.endereco,
                alunoEncontrado.dia_vencimento
            ))

            setIdAlunoEditando(id)
            setModalAberto(true)
        }
    }

    const atualizarAluno = () => {
        const alunoAtualizado = {
            nome: aluno.nome,
            curso: aluno.curso,
            valor_mensalidade: aluno.mensalidade,
            data_nascimento: aluno.dataNascimento,
            telefone: aluno.telefone,
            endereco: aluno.endereco,
            dia_vencimento: aluno.diaVencimento
        }

        api.patch(`/api/alunos/${idAlunoEditando}/`, alunoAtualizado)
            .then((response) => {
                setAlunos(alunos.map((aluno) => (aluno.id === idAlunoEditando ? response.data : aluno)))
                setIdAlunoEditando(null)
                setAluno(new Aluno())
                setModalAberto(false)
            })
    }

    const pagarMensalidade = (mensalidade) => {
        const dadosPagamento = {
            forma_pagamento: formaPagamento,
            numero_nota: numeroNota
        }

        api.post(
            `/api/mensalidades/${mensalidade.id}/pagar/`,
            dadosPagamento
        )
            .then(() => {
                setMensalidades(
                    mensalidades.map((item) =>
                        item.id === mensalidade.id
                            ? {
                                ...item,
                                status: "pago"
                            }
                            : item
                    )
                )

                setIdAlunoPagando(null)
                setFormaPagamento("pix")
                setNumeroNota("")
            })
    }

    return (
        <div className="w-full px-6 py-10 text-left">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-white">Bem-vindo(a) 👋</h1>
                <p className="text-gray-500 mt-1">Aqui está um resumo da sua escola de música.</p>
            </div>

            <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-500">💰 Recebido</p>
                    <p className="text-2xl font-semibold text-gray-800">R$ {totalRecebido.toFixed(2)}</p>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-500">⏳ Pendente</p>
                    <p className="text-2xl font-semibold text-gray-800">R$ {totalPendente.toFixed(2)}</p>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <p className="text-sm text-gray-500">🚨 Atrasado</p>
                    <p className="text-2xl font-semibold text-gray-800">R$ {totalAtrasado.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-gray-700">Alunos</h2>
                <button onClick={abrirModalNovoAluno} className={botaoPrimario}>
                    + Registrar Aluno
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {alunos.map((aluno) => {
                    const mensalidade = mensalidades.find(
                        (mensalidade) => mensalidade.aluno === aluno.id
                    )
                    return (
                        <div key={aluno.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-gray-800">{aluno.nome}</p>
                                    <p className="text-sm text-gray-500">{aluno.curso_nome} · R$ {aluno.valor_mensalidade}</p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() =>
                                            setIdAlunoExpandido(
                                                idAlunoExpandido === aluno.id ? null : aluno.id
                                            )
                                        }
                                        className={botaoNeutro}
                                    >
                                        {idAlunoExpandido === aluno.id ? "Ocultar" : "Ver mais"}
                                    </button>

                                    <button onClick={() => editarAluno(aluno.id)} className={botaoNeutro}>
                                        Editar
                                    </button>

                                    <button onClick={() => excluirAluno(aluno.id)} className={botaoPerigo}>
                                        Excluir
                                    </button>
                                </div>
                            </div>

                            {idAlunoExpandido === aluno.id && (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 flex flex-col gap-1">
                                    <p>Data de Nascimento: {aluno.data_nascimento}</p>
                                    <p>Telefone: {aluno.telefone}</p>
                                    <p>Endereço: {aluno.endereco}</p>
                                    <p>Dia do vencimento: {aluno.dia_vencimento}</p>

                                    {mensalidade && (
                                        <div className="mt-3 bg-gray-50 rounded-md p-3">
                                            <h3 className="font-medium text-gray-700 mb-1">Mensalidade</h3>
                                            <p>Valor: R$ {Number(aluno.valor_mensalidade).toFixed(2)}</p>
                                            <p>Status: {mensalidade.status}</p>
                                            <p>Vencimento: {mensalidade.data_vencimento}</p>

                                            {mensalidade.status !== "pago" && (
                                                <button
                                                    onClick={() => setIdAlunoPagando(aluno.id)}
                                                    className={`${botaoSucesso} mt-2`}
                                                >
                                                    Pagar
                                                </button>
                                            )}

                                            {idAlunoPagando === aluno.id && (
                                                <div className="mt-3 flex flex-col gap-2">
                                                    <h3 className="font-medium text-gray-700">Registrar Pagamento</h3>

                                                    <label className="text-sm text-gray-600 flex flex-col gap-1">
                                                        Forma de Pagamento:
                                                        <select
                                                            value={formaPagamento}
                                                            onChange={(e) => setFormaPagamento(e.target.value)}
                                                            className={inputClasses}
                                                        >
                                                            <option value="pix">Pix</option>
                                                            <option value="dinheiro">Dinheiro</option>
                                                            <option value="cartao">Cartão</option>
                                                        </select>
                                                    </label>

                                                    <label className="text-sm text-gray-600 flex flex-col gap-1">
                                                        Número da nota:
                                                        <input
                                                            type="text"
                                                            value={numeroNota}
                                                            onChange={(e) => setNumeroNota(e.target.value)}
                                                            className={inputClasses}
                                                        />
                                                    </label>

                                                    <button
                                                        onClick={() => pagarMensalidade(mensalidade)}
                                                        className={`${botaoSucesso} self-start`}
                                                    >
                                                        Confirmar Pagamento
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <Modal
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                titulo={idAlunoEditando !== null ? "Editar aluno" : "Novo aluno"}
            >
                <FormularioAluno
                    aluno={aluno}
                    setAluno={setAluno}
                    cursos={cursos}
                    setCursos={setCursos}
                />

                <div className="flex gap-3 mt-4">
                    <button onClick={addAluno} className={botaoPrimario}>
                        Salvar aluno
                    </button>
                    {idAlunoEditando !== null && (
                        <button onClick={atualizarAluno} className={botaoSecundario}>
                            Atualizar aluno
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default Alunos