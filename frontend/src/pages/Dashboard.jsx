import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
    const mesAtual = new Date().toISOString().slice(0, 7);

    const [dashboard, setDashboard] = useState(null);
    const [mes, setMes] = useState(mesAtual);


    useEffect(() => {
        api.get(`/api/dashboard/?mes=${mes}`)
            .then((response) => {
                setDashboard(response.data);
            })
            .catch((error) => {
                console.log("Erro ao carregar dashboard:", error);
            });
    }, [mes]);

    if (!dashboard) {
        return <p>Carregando dashboard...</p>;
    }

    return (
        <div>

            <input
                type="month"
                value={mes}
                onChange={(event) => setMes(event.target.value)}
            />

            <h1>Dashboard Financeiro</h1>

            <h2>Receitas</h2>

            <p>Recebido: R$ {dashboard.receitas.recebido.toFixed(2)}</p>
            <p>Pendente: R$ {dashboard.receitas.pendente.toFixed(2)}</p>
            <p>Atrasado: R$ {dashboard.receitas.atrasado.toFixed(2)}</p>

            <h2>Mensalidades</h2>

            <p>Total: {dashboard.mensalidades.total}</p>
            <p>Pagas: {dashboard.mensalidades.pagas}</p>
            <p>Pendentes: {dashboard.mensalidades.pendentes}</p>
            <p>Atrasadas: {dashboard.mensalidades.atrasadas}</p>

            <h2>Alunos</h2>

            <p>Alunos ativos: {dashboard.alunos.ativos}</p>
            <p>Alunos inadimplentes: {dashboard.alunos.inadimplentes}</p>

            <h2>Despesas</h2>

            <p>Nenhuma despesa cadastrada.</p>

            <h2>Indicadores</h2>

            <p>Em desenvolvimento.</p>
        </div>
    );
}

export default Dashboard;