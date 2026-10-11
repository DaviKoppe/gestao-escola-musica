import { useEffect, useState } from "react";
import api from "../services/api"
import Modal from "../components/Modal"

const botaoPrimario =
    "px-4 py-2 rounded-md bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors";
const botaoNeutro =
    "px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors bg-white";
const botaoSucesso =
    "px-3 py-1.5 rounded-md bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors";
const inputClasses =
    "border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full";
const labelClasses = "text-sm text-gray-600 flex flex-col gap-1";

const estilosPorStatus = {
    pago: "bg-green-100 text-green-700",
    pendente: "bg-amber-100 text-amber-700",
    atrasado: "bg-red-100 text-red-700",
};

const textoPorStatus = {
    pago: "Pago",
    pendente: "Pendente",
    atrasado: "Atrasado",
};

function Mensalidades() {
    const [mensalidades, setMensalidades] = useState([]);
    const [formaPagamento, setFormaPagamento] = useState("pix");
    const [numeroNota, setNumeroNota] = useState("");
    const [mensalidadeSelecionada, setMensalidadeSelecionada] = useState(null);
    const [filtro, setFiltro] = useState("todas");

    const mensalidadesFiltradas = mensalidades.filter((mensalidade) => {
        if (filtro === "todas") {
            return true;
        }

        return mensalidade.status === filtro;
    });

    useEffect(() => {
        carregarMensalidades();
    }, []);

    function carregarMensalidades() {
        api.get("/api/mensalidades/")
            .then((response) => {
                setMensalidades(response.data);
            })
            .catch((error) => {
                console.log("Erro ao carregar mensalidades:", error);
            });
    }

    function registrarPagamento() {
        api.post(
            `/api/mensalidades/${mensalidadeSelecionada.id}/pagar/`,
            {
                forma_pagamento: formaPagamento,
                numero_nota: numeroNota
            }
        )
            .then(() => {
                carregarMensalidades();

                setMensalidadeSelecionada(null);
                setFormaPagamento("pix");
                setNumeroNota("");
            })
            .catch((error) => {
                console.log("Erro ao registrar pagamento:", error);
            });
    }

    function classeFiltro(valor) {
        const ativo = filtro === valor;
        return ativo
            ? "px-3 py-1.5 rounded-md bg-purple-500 text-white text-sm font-medium transition-colors"
            : "px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors";
    }

    return (
        <div className="w-full px-6 py-10 text-left">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-white">Mensalidades</h1>
                <p className="text-gray-400 mt-1">Acompanhe e registre os pagamentos dos alunos.</p>
            </div>

            <div className="flex gap-2 mb-6">
                <button onClick={() => setFiltro("todas")} className={classeFiltro("todas")}>
                    Todas
                </button>

                <button onClick={() => setFiltro("pendente")} className={classeFiltro("pendente")}>
                    Pendentes
                </button>

                <button onClick={() => setFiltro("pago")} className={classeFiltro("pago")}>
                    Pagas
                </button>

                <button onClick={() => setFiltro("atrasado")} className={classeFiltro("atrasado")}>
                    Atrasadas
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {mensalidadesFiltradas.map((mensalidade) => (
                    <div key={mensalidade.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-800">{mensalidade.aluno_nome}</p>
                                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${estilosPorStatus[mensalidade.status]}`}>
                                        {textoPorStatus[mensalidade.status]}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500 mt-1">
                                    R$ {Number(mensalidade.valor).toFixed(2)} · Vencimento: {mensalidade.data_vencimento} · Ref: {mensalidade.mes_referencia}
                                </p>
                            </div>

                            {mensalidade.status !== "pago" && (
                                <button
                                    onClick={() => setMensalidadeSelecionada(mensalidade)}
                                    className={`${botaoSucesso} shrink-0`}
                                >
                                    Pagar
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {mensalidadesFiltradas.length === 0 && (
                    <p className="text-gray-400">Nenhuma mensalidade encontrada para esse filtro.</p>
                )}
            </div>

            <Modal
                aberto={mensalidadeSelecionada !== null}
                aoFechar={() => setMensalidadeSelecionada(null)}
                titulo="Registrar Pagamento"
            >
                {mensalidadeSelecionada && (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-gray-600">
                            Aluno: <span className="font-medium text-gray-800">{mensalidadeSelecionada.aluno_nome}</span>
                        </p>

                        <p className="text-sm text-gray-600">
                            Valor: <span className="font-medium text-gray-800">R$ {Number(mensalidadeSelecionada.valor).toFixed(2)}</span>
                        </p>

                        <label className={labelClasses}>
                            Forma de pagamento
                            <select
                                value={formaPagamento}
                                onChange={(event) => setFormaPagamento(event.target.value)}
                                className={inputClasses}
                            >
                                <option value="pix">Pix</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                            </select>
                        </label>

                        <label className={labelClasses}>
                            Número da nota (opcional)
                            <input
                                type="text"
                                value={numeroNota}
                                onChange={(event) => setNumeroNota(event.target.value)}
                                className={inputClasses}
                            />
                        </label>

                        <div className="flex gap-3 mt-2">
                            <button onClick={registrarPagamento} className={botaoPrimario}>
                                Confirmar Pagamento
                            </button>

                            <button onClick={() => setMensalidadeSelecionada(null)} className={botaoNeutro}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default Mensalidades