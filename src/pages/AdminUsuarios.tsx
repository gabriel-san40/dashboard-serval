import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "gerente" | "usuario";

type FixedUser = {
  username: string;
  role: Role;
  password: string;
};

const DOMAIN = "@dashboard.local";

const AdminUsuarios = () => {
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<FixedUser[]>([
    { username: "admin", role: "admin", password: "" },
    { username: "gerente", role: "gerente", password: "" },
    { username: "usuario", role: "usuario", password: "" },
  ]);

  const canSubmit = useMemo(() => users.every((u) => u.username.trim() && u.password.trim()), [users]);

  const setPassword = (role: Role, password: string) => {
    setUsers((prev) => prev.map((u) => (u.role === role ? { ...u, password } : u)));
  };

  const handleProvision = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          domain: DOMAIN,
          users: users.map(({ username, role, password }) => ({ username, role, password })),
        },
      });

      if (error) throw error;

      toast({
        title: "Usuários provisionados",
        description: `${data?.results?.length ?? 0} usuário(s) processado(s).`,
      });
    } catch (e: any) {
      toast({
        title: "Erro ao provisionar",
        description: e?.message ?? "Não foi possível criar/atualizar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Usuários (Admin)</h1>
        <p className="text-base text-muted-foreground">
          Cria/atualiza os 3 usuários fixos (admin/gerente/usuario) no Supabase Auth e atribui roles em <code>user_roles</code>.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border bg-card p-5">
        {users.map((u) => (
          <div key={u.role} className="grid gap-3 lg:grid-cols-3 lg:items-end">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input value={u.username} readOnly className="h-12 text-base" />
              <p className="text-sm text-muted-foreground">Email interno: {u.username}{DOMAIN}</p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={u.role} readOnly className="h-12 text-base" />
              <p className="text-sm invisible">‎</p>
            </div>

            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={u.password}
                onChange={(e) => setPassword(u.role, e.target.value)}
                placeholder="Defina uma senha"
                className="h-12 text-base"
              />
              <p className="text-sm invisible">‎</p>
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button onClick={() => void handleProvision()} disabled={!canSubmit || loading} className="h-12 px-6 text-base">
            {loading ? "Processando…" : "Provisionar / Atualizar"}
          </Button>
        </div>
      </section>
    </section>
  );
};

export default AdminUsuarios;
