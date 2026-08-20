import { useEffect, useState } from "react"
import api from "../services/api"
import Aluno from "../models/Aluno"
import FormularioAluno from "../components/FormularioAluno"

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

  useEffect(() => {
    api.get("/api/alunos/")
      .then((response) => setAlunos(response.data))

    api.get("/api/cursos/")
        .then((response) => setCursos(response.data))
        .catch((error) => console.log(error))

    api.get("/api/mensalidades/")
        .then((response) => setMensalidades(response.data))
  }, [])

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
    <>
      <h1>Alunos</h1>

      <FormularioAluno
          aluno={aluno}
          setAluno={setAluno}
          cursos={cursos}
          setCursos={setCursos}
      />
      <button onClick={addAluno}>Salvar aluno</button>
      {idAlunoEditando !== null && <button onClick={atualizarAluno}>Atualizar aluno</button>}

      {alunos.map((aluno) => {
        const mensalidade = mensalidades.find(
            (mensalidade) => mensalidade.aluno === aluno.id
        )
        return (
            <div key={aluno.id}>
              <p>{aluno.nome}</p>
              <p>{aluno.curso_nome}</p>
              <p>R$ {aluno.valor_mensalidade}</p>

              <button
                  onClick={() =>
                      setIdAlunoExpandido(
                          idAlunoExpandido === aluno.id ? null : aluno.id
                      )
                  }
              >
                {idAlunoExpandido === aluno.id ? "Ocultar" : "Ver mais"}
              </button>

              {idAlunoExpandido === aluno.id && (
                  <div>
                    <p>Data de Nascimento: {aluno.data_nascimento}</p>
                    <p>Telefone: {aluno.telefone}</p>
                    <p>Endereço: {aluno.endereco}</p>
                    <p>Dia do vencimento: {aluno.dia_vencimento}</p>

                    {mensalidade && (
                        <div>
                          <h3>Mensalidade</h3>
                          <p>Valor: R$ {Number(mensalidade.valor).toFixed(2)}</p>
                          <p>Status: {mensalidade.status}</p>
                          <p>Vencimento: {mensalidade.data_vencimento}</p>

                          {mensalidade.status !== "pago" && (
                              <button onClick={() => setIdAlunoPagando(aluno.id)}>
                                Pagar
                              </button>
                          )}

                          {idAlunoPagando === aluno.id && (
                              <div>
                                <h3>Registrar Pagamento</h3>

                                <label>
                                  Forma de Pagamento:
                                  <select
                                      value={formaPagamento}
                                      onChange={(e) => setFormaPagamento(e.target.value)}
                                  >
                                    <option value="pix">Pix</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="cartao">Cartão</option>
                                  </select>
                                </label>

                                <br />

                                <label>
                                  Número da nota:
                                  <input
                                      type="text"
                                      value={numeroNota}
                                      onChange={(e) => setNumeroNota(e.target.value)}
                                  />
                                </label>

                                <br />

                                <button onClick={() => pagarMensalidade(mensalidade)}>
                                  Confirmar Pagamento
                                </button>
                              </div>
                          )}

                        </div>
                    )}
                  </div>
              )}

              <button onClick={() => excluirAluno(aluno.id)}>
                Excluir
              </button>

              <button onClick={() => editarAluno(aluno.id)}>
                Editar
              </button>
            </div>
        )
      })}
    </>
  )
}

export default Alunos


