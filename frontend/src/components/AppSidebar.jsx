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

const itens = [
    { titulo: "Dashboard", url: "/", icone: "🏠" },
    { titulo: "Alunos", url: "/alunos", icone: "🎓" },
    { titulo: "Cursos", url: "/cursos", icone: "📚" },
    { titulo: "Mensalidades", url: "/mensalidades", icone: "💰" },
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
                                            <NavLink to={item.url}>
                                                <span>{item.icone}</span>
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