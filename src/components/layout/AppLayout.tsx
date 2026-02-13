import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

function roleLabel(role: string | null) {
  if (!role) return "—";
  if (role === "admin") return "Admin";
  if (role === "gerente") return "Gerente";
  return "Usuário";
}

export default function AppLayout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-svh w-full">
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">Dashboard de Vendas</div>
              <div className="text-xs text-muted-foreground">
                {user?.email ?? "—"} • {roleLabel(role)} • {location.pathname}
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={() => void signOut()} className="h-11 px-5 text-base">
            Sair
          </Button>
        </header>

        <div className="flex min-h-[calc(100svh-theme(spacing.16))] w-full">
          <AppSidebar />

          <SidebarInset>
            <div className="mx-auto w-full px-6 py-6">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
