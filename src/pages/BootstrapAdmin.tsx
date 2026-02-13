import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

type ClientChecks = {
  loading: boolean;
  isAdmin: boolean | null;
  isGerente: boolean | null;
  error: string | null;
};

export default function BootstrapAdmin() {
  const { user, role } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<ClientChecks>({ loading: true, isAdmin: null, isGerente: null, error: null });

  const canSubmit = useMemo(() => !!user && token.trim().length > 0 && !loading, [user, token, loading]);

  const runChecks = async () => {
    if (!user) {
      setChecks({ loading: false, isAdmin: null, isGerente: null, error: null });
      return;
    }

    setChecks((p) => ({ ...p, loading: true, error: null }));
    try {
      const [{ data: isAdmin, error: errA }, { data: isGerente, error: errG }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "gerente" }),
      ]);
      if (errA) throw errA;
      if (errG) throw errG;
      setChecks({ loading: false, isAdmin: !!isAdmin, isGerente: !!isGerente, error: null });
    } catch (e: any) {
      setChecks({ loading: false, isAdmin: null, isGerente: null, error: e?.message ?? "Erro ao checar roles" });
    }
  };

  useEffect(() => {
    void runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleBootstrap = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("bootstrap-admin", {
        body: { token: token.trim() },
      });
      if (error) throw error;

      toast({
        title: "Admin habilitado",
        description: "Seu usuário foi promovido a admin. Recarregando para atualizar permissões…",
      });

      // Reload to refresh session/role checks
      window.location.href = "/admin/usuarios";
    } catch (e: any) {
      toast({
        title: "Falha no bootstrap",
        description: e?.message ?? "Não foi possível promover o usuário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Bootstrap Admin</h1>
          <p className="text-sm text-muted-foreground">
            Use isto apenas para o primeiro acesso. Funciona somente se ainda não existir nenhum admin no sistema.
          </p>
        </header>

        <div className="space-y-3">
          <div className="text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">User ID:</span> {user?.id ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Role (cache local):</span> {role ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">RPC has_role(admin):</span>{" "}
              {checks.loading ? "checando…" : checks.isAdmin === null ? "—" : checks.isAdmin ? "true" : "false"}
            </div>
            <div>
              <span className="text-muted-foreground">RPC has_role(gerente):</span>{" "}
              {checks.loading ? "checando…" : checks.isGerente === null ? "—" : checks.isGerente ? "true" : "false"}
            </div>
            {checks.error ? <div className="text-sm text-destructive">{checks.error}</div> : null}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => void runChecks()} disabled={!user || checks.loading}>
              Rechecar roles
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token de bootstrap</Label>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole o token" />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void handleBootstrap()} disabled={!canSubmit}>
              {loading ? "Processando…" : "Tornar-me admin"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Se aparecer "Bootstrap disabled", é porque já existe admin e este fluxo fica bloqueado.
          </p>
        </div>
      </section>
    </main>
  );
}
