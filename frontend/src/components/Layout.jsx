import { Outlet } from "react-router-dom"
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger
} from "@/components/ui/sidebar"
import AppSidebar from "./AppSidebar"

function Layout() {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset className="min-w-0">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-[#0F172A] px-4">
                    <SidebarTrigger className="text-white hover:bg-slate-800 hover:text-white" />
                </header>

                <div className="flex flex-1 flex-col">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default Layout