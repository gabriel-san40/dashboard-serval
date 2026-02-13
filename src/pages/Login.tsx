import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const USERNAME_DOMAIN = "@dashboard.local";

function toAuthEmail(usernameOrEmail: string) {
  const v = usernameOrEmail.trim();
  if (!v) return "";
  return v.includes("@") ? v : `${v}${USERNAME_DOMAIN}`;
}

const Login = () => {
  const [params] = useSearchParams();
  const redirectTo = useMemo(() => params.get("redirect") || "/", [params]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const email = toAuthEmail(username);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      window.location.href = redirectTo;
    } catch (e: any) {
      toast({
        title: "Falha no login",
        description: e?.message ?? "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-6">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="text-sm text-muted-foreground">Use usuário+senha (o usuário vira um email interno no Supabase).</p>
        </header>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
            <p className="text-xs text-muted-foreground">Autenticando como: {toAuthEmail(username) || "—"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button className="w-full" onClick={() => void handleLogin()} disabled={loading || !username || !password}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Login;
