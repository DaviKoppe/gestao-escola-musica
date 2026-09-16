class Professor {
    constructor(
        nome = "",
        dataNascimento = "",
        cursos = [],
        id = null
    ) {
        this.id = id;
        this.nome = nome;
        this.dataNascimento = dataNascimento;
        this.cursos = cursos;
    }

    atualizarCampos(campos) {
        return new Professor(
            campos.nome ?? this.nome,
            campos.dataNascimento ?? this.dataNascimento,
            campos.cursos ?? this.cursos,
            this.id
        );
    }
}

export default Professor