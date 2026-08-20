class Aluno {
  constructor(
    nome = "",
    curso = "",
    mensalidade = "",
    dataNascimento = "",
    telefone = "",
    endereco = "",
    diaVencimento = ""
  ) {
    this.nome = nome;
    this.curso = curso;
    this.mensalidade = mensalidade;
    this.dataNascimento = dataNascimento;
    this.telefone = telefone;
    this.endereco = endereco;
    this.diaVencimento = diaVencimento;
  }

  atualizarCampos(campos){
    return new Aluno(
      campos.nome ?? this.nome,
      campos.curso ?? this.curso,
      campos.mensalidade ?? this.mensalidade,
      campos.dataNascimento ?? this.dataNascimento,
      campos.telefone ?? this.telefone,
      campos.endereco ?? this.endereco,
      campos.diaVencimento ?? this.diaVencimento
    );
  }
}

export default Aluno
