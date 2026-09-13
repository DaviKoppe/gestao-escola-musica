import { NavLink, useLocation } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDollarSign, faUsers, faChartLine, faGuitar} from '@fortawesome/free-solid-svg-icons';

const itens = [
    { titulo: "Dashboard", url: "/", icone: faChartLine },
    { titulo: "Alunos ", url: "/alunos", icone: faUsers },
    { titulo: "Cursos", url: "/cursos", icone: faGuitar },
    { titulo: "Mensalidades", url: "/mensalidades", icone: faDollarSign },
]

function AppSidebar() {
    const location = useLocation()

    return (
        <Sidebar variant>
            <SidebarHeader className="px-4 py-3">
                <span className="text-lg font-semibold">Gestão Escola de Música</span>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navegação</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {itens.map((item) =>{
                                const ativo =
                                    item.url === "/"
                                        ? location.pathname === "/"
                                        : location.pathname.startsWith(item.url)
                                return (
                                    <SidebarMenuItem key={item.url}>
                                        <SidebarMenuButton asChild isActive={ativo}>
                                            <NavLink to={item.url} className="flex items-center gap-2">
                                                {item.icone && (
                                                    <FontAwesomeIcon icon={item.icone} className="w-4 h-4" />
                                                )}
                                                <span>{item.titulo}</span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

export default AppSidebar;