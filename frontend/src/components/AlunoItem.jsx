function AlunoItem({ nome, curso, mensalidade, remover, editar }) {
    return (
        <div>
            <h3>{nome}</h3>
            <p>{curso}</p>
            <p>R$ {mensalidade}</p>

            <button onClick = {remover}>
                Excluir
            </button>

            <button onClick={editar}>
                Editar
            </button>
        </div>
        
    )
}

export default AlunoItem