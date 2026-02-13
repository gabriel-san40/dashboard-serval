import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  allow?: AppRole[]; // se omitido: qualquer autenticado
};

type RoleCheck = {
  loading: boolean;
  allowed: boolean | null; // null enquanto checa
};

export default function ProtectedRoute({ allow }: Props) {
  const { loading, user, role } = useAuth();
  const location = useLocation();

  const [roleCheck, setRoleCheck] = useState<RoleCheck>({ loading: false, allowed: null });

  const needsAllowCheck = useMemo(() => !!user && !!allow?.length, [user, allow]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!user || !allow?.length) {
        setRoleCheck({ loading: false, allowed: null });
        return;
      }

      // Se a role do cache já permite, não precisa RPC.
      if (role && allow.includes(role)) {
        setRoleCheck({ loading: false, allowed: true });
        return;
      }

      // Se role ainda não carregou, aguarda.
      if (!role) {
        setRoleCheck({ loading: true, allowed: null });
        return;
      }

      // Fallback: role cache pode estar desatualizada (ex.: bootstrap/alteração recente).
      setRoleCheck({ loading: true, allowed: null });
      try {
        const checks = await Promise.all(
          allow.map((r) => supabase.rpc("has_role", { _user_id: user.id, _role: r })),
        );
        const ok = checks.some((c) => !!c.data);
        if (mounted) setRoleCheck({ loading: false, allowed: ok });
      } catch {
        if (mounted) setRoleCheck({ loading: false, allowed: false });
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [user?.id, role, allow]);

  // Evita “tela em branco” durante bootstrap de sessão/role
  if (loading || (needsAllowCheck && roleCheck.loading) || (user && allow && !role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Carregando…</h1>
          <p className="mt-2 text-sm text-muted-foreground">Validando sua sessão e permissões.</p>
        </section>
      </main>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (allow?.length) {
    // Primeira tentativa: cache local
    if (role && allow.includes(role)) return <Outlet />;

    // Fallback RPC (quando cache está desatualizado)
    if (roleCheck.allowed === true) return <Outlet />;

    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

