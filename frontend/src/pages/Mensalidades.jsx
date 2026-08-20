import { useEffect, useState } from "react";
import api from "../services/api"

function Mensalidades() {
    const [mensalidades, setMensalidades] = useState([]);
    const [formaPagamento, setFormaPagamento] = useState("");
    const [numeroNota, setNumeroNota] = useState("");
    const [mensalidadeSelecionada, setMensalidadeSelecionada] = useState("");

    useEffect(() => {
        api.get("/api/mensalidades/")
            .then((response) => setMensalidades(response.data))
    }, [])
    console.log(mensalidades)

    function registrarPagamento() {
        api.post(
            `/api/mensalidades/${mensalidadeSelecionada.id}/pagar/`,
            {
                forma_pagamento: formaPagamento,
                numero_nota: numeroNota
            }
        )
            .then((response) => {
                console.log("Pagamento registrado:", response.data);

                api.get("/api/mensalidades/")
                    .then((response) => setMensalidades(response.data));

                setMensalidadeSelecionada(null);
                setFormaPagamento("");
                setNumeroNota("");
            })

            .catch((error) => {
                console.log("Erro ao registrar pagamento:", error);
            });
    }

    return (
        <>
            <h1>Mensalidades</h1>

            {mensalidades.map((mensalidade) =>
            <div key={mensalidade.id}>
                <p>{mensalidade.aluno_nome}</p>
                <p>R$ {Number(mensalidade.valor).toFixed(2)}</p>
                <p>
                    {mensalidade.status === "pendente"
                        ? "Pendente"
                        : mensalidade.status === "pago"
                            ? "Pago"
                            : "Atrasado"
                    }
                </p>
                <p>{mensalidade.data_vencimento}</p>
                <p>{mensalidade.mes_referencia}</p>

                {mensalidade.status !== "pago" && (
                    <button onClick={() => setMensalidadeSelecionada(mensalidade)}>
                        Pagar
                    </button>
                )}

                {mensalidadeSelecionada && (
                    <div>
                        <h2>Registrar Pagamento</h2>
                        <p>Aluno: {mensalidadeSelecionada.aluno_nome}</p>
                        <p>Valor: R$ {Number(mensalidadeSelecionada.valor).toFixed(2)}</p>
                        <select value={formaPagamento} onChange={(event) => setFormaPagamento(event.target.value)}>
                            <option value="">Selecione a forma de pagamento</option>
                            <option value="pix">Pix</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao">Cartão</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Número da nota (opcional)"
                            value={numeroNota}
                            onChange={(event) => setNumeroNota(event.target.value)}
                        />

                        <button onClick={registrarPagamento}>
                            Confirmar Pagamento
                        </button>
                    </div>
                )}
            </div>
            )}
        </>
    )
}

export default Mensalidades