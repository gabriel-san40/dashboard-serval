import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminCadastros from "./pages/AdminCadastros";
import AdminUsuarios from "./pages/AdminUsuarios";
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BootstrapAdmin from "./pages/BootstrapAdmin";
import AppLayout from "@/components/layout/AppLayout";
import NovaVendaSky from "./pages/NovaVendaSky";
import NovaVendaInternet from "./pages/NovaVendaInternet";
import DashboardSky from "./pages/DashboardSky";
import DashboardInternet from "./pages/DashboardInternet";
import DashboardAdmin from "./pages/DashboardAdmin";
import NovoDadoAdmin from "./pages/NovoDadoAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/403" element={<Forbidden />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/bootstrap-admin" element={<BootstrapAdmin />} />

                <Route path="/dashboards/sky" element={<DashboardSky />} />
                <Route path="/dashboards/internet" element={<DashboardInternet />} />

                <Route element={<ProtectedRoute allow={["admin", "gerente"]} />}>
                  <Route path="/vendas/sky/nova" element={<NovaVendaSky />} />
                  <Route path="/vendas/internet/nova" element={<NovaVendaInternet />} />
                </Route>

                <Route element={<ProtectedRoute allow={["admin"]} />}>
                  <Route path="/admin/cadastros" element={<AdminCadastros />} />
                  <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                  <Route path="/dashboards/admin" element={<DashboardAdmin />} />
                  <Route path="/admin/dados-administrativos/novo" element={<NovoDadoAdmin />} />
                </Route>
              </Route>
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

