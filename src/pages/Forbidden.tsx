import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

const Forbidden = () => {
  const { role } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-6 text-center">
        <h1 className="text-2xl font-bold">Acesso negado</h1>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar esta página.
          {role ? ` (perfil: ${role})` : ""}
        </p>
        <Button asChild>
          <a href="/">Voltar</a>
        </Button>
      </section>
    </main>
  );
};

export default Forbidden;
