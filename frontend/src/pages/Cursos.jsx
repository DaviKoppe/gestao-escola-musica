import { useEffect, useState} from "react";
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel"
import api from "../services/api"
import CursoCard from "../components/CursoCard"
import Modal from "../components/Modal"

function Cursos(){
    const [cursos, setCursos] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [nomeCurso, setNomeCurso] = useState("");
    const [termoPesquisa, setTermoPesquisa] = useState("");

    useEffect(() => {
        api.get("/api/cursos")
            .then((response) => setCursos(response.data))
    }, []);

    function criarCurso() {
        api.post(
            "/api/cursos/",
            {
                nome: nomeCurso
            }
        )
            .then((response) => {
                setCursos((cursosAtuais) => [
                    ...cursosAtuais,
                    response.data
                ]);

                setNomeCurso("");
                setModalAberto(false);
            })
            .catch((error) => {
                console.log("Erro ao criar curso:", error);
            });
    }

    const cursosFiltrados = cursos.filter((curso) =>
        curso.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
    )

    return (
        <div className="w-full px-6 py-10 text-left">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-white">Cursos</h1>
                <p className="text-gray-400 mt-1">Cursos oferecidos pela escola</p>
            </div>

            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Pesquisar curso..."
                        value={termoPesquisa}
                        onChange={(e) => setTermoPesquisa(e.target.value)}
                        className="pl-9 bg-white text-gray-800 border-gray-200"
                    />
                </div>

                <Button onClick={() => setModalAberto(true)}>
                    + Novo curso
                </Button>
            </div>

            <h2 className="text-xl font-medium text-white mb-4">Cursos disponíveis</h2>

            <Carousel className="w-full px-14">
                <CarouselContent>
                    {cursosFiltrados.map((curso) => (
                        <CarouselItem key={curso.id} className="basis-auto">
                            <CursoCard curso={curso} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
            </Carousel>

            {cursosFiltrados.length === 0 && (
                <p className="text-gray-400 mt-4">Nenhum curso encontrado.</p>
            )}

            <Modal
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                titulo="Novo curso"
            >
                <label className="text-sm text-gray-600 flex flex-col gap-1 mb-4">
                    Nome do curso
                    <Input
                        type="text"
                        value={nomeCurso}
                        onChange={(e) => setNomeCurso(e.target.value)}
                    />
                </label>

                <Button onClick={criarCurso} className="w-full">
                    Criar curso
                </Button>
            </Modal>
        </div>
    );
}

export default Cursos