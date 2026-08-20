import { useEffect, useState} from "react";
import axios from "axios";

function Cursos(){
    const [cursos, setCursos] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [nomeCurso, setNomeCurso] = useState("");

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/cursos")
            .then((response) => setCursos(response.data))
    }, []);

    console.log(cursos);

    function criarCurso() {
        axios.post(
            "http://127.0.0.1:8000/api/cursos/",
            {
                nome: nomeCurso
            }
        )
            .then((response) => {
                console.log("Curso criado:", response.data);

                setCursos((cursosAtuais) => [
                    ...cursosAtuais,
                    response.data
                ]);

                setNomeCurso("");
                setMostrarFormulario(false);
            })
            .catch((error) => {
                console.log("Erro ao criar curso:", error);
            });
    }

    return (
        <>
            <h1>Cursos</h1>

            <button onClick={() => setMostrarFormulario(true)}>
                + Novo curso
            </button>

            {mostrarFormulario && (
                <div>
                    <h2>Novo Curso</h2>

                    <input
                        type="text"
                        placeholder="Nome do curso"
                        value={nomeCurso}
                        onChange={(e) => setNomeCurso(e.target.value)}
                    />

                    <button onClick={criarCurso}>
                        Criar curso
                    </button>
                </div>
            )}

            {cursos.map((curso) =>
                <div key={curso.id}>
                    <p>{curso.nome}</p>
                </div>
            )}
        </>
    );
}

export default Cursos;