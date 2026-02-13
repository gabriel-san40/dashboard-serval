import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Shield, Users, PlusSquare, BarChart3, ClipboardList } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, type AppRole } from "@/components/auth/AuthProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Item = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  allow?: AppRole[]; // se omitido, todos autenticados
};

const items: Item[] = [
  { title: "Início", to: "/", icon: LayoutDashboard },
  { title: "Dashboard Sky", to: "/dashboards/sky", icon: BarChart3 },
  { title: "Dashboard Internet", to: "/dashboards/internet", icon: BarChart3 },
  { title: "Nova venda (Sky)", to: "/vendas/sky/nova", icon: PlusSquare, allow: ["admin", "gerente"] },
  { title: "Nova venda (Internet)", to: "/vendas/internet/nova", icon: PlusSquare, allow: ["admin", "gerente"] },
  { title: "Dashboard Admin", to: "/dashboards/admin", icon: BarChart3, allow: ["admin"] },
  { title: "Novo Dado Admin", to: "/admin/dados-administrativos/novo", icon: ClipboardList, allow: ["admin"] },
  { title: "Cadastros", to: "/admin/cadastros", icon: Shield, allow: ["admin"] },
  { title: "Usuários", to: "/admin/usuarios", icon: Users, allow: ["admin"] },
];

export function AppSidebar() {
  const { role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const location = useLocation();
  const currentPath = location.pathname;

  const visibleItems = useMemo(() => {
    return items.filter((i) => {
      if (!i.allow) return true;
      if (!role) return false;
      return i.allow.includes(role);
    });
  }, [role]);

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      // Header é sticky no topo (h-16). Offset no sidebar para não ficar por baixo.
      className="top-16 h-[calc(100svh-theme(spacing.16))]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const active = currentPath === item.to;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} size="lg" tooltip={item.title}>
                      <NavLink
                        to={item.to}
                        end
                        className="w-full"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        <Icon className="h-5 w-5" />
                        {!collapsed ? <span className="text-base">{item.title}</span> : null}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
