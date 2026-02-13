import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gerente" | "usuario";

type AuthState = {
  loading: boolean;
  user: { id: string; email: string | null } | null;
  role: AppRole | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error("Timeout ao carregar permissões"));
      }, ms);
    }),
  ]);
}

async function fetchRole(userId: string): Promise<AppRole> {
  // Prioridade: admin > gerente > usuario
  const { data: isAdmin, error: errAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (errAdmin) throw errAdmin;
  if (isAdmin) return "admin";

  const { data: isGerente, error: errGerente } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "gerente",
  });
  if (errGerente) throw errGerente;
  if (isGerente) return "gerente";

  return "usuario";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Fallback para nunca travar em loading (rede/RPC/etc.)
    const hardStop = window.setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
      if (user && !role) setRole("usuario");
    }, 8000);

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const nextUser = session?.user ? { id: session.user.id, email: session.user.email ?? null } : null;

      const prevUserId = lastUserIdRef.current;

      setUser(nextUser);
      lastUserIdRef.current = nextUser?.id ?? null;

      // Importante: não “zera” a role em todo refresh de token.
      // Isso evita a UI cair para "Usuário" por falhas/timeout transitórios no RPC.
      setRole((prev) => {
        if (!nextUser) return null;
        // Se trocou de usuário, invalida o cache de role.
        if (prevUserId && prevUserId !== nextUser.id) return null;
        return prev;
      });

      if (nextUser) {
        try {
          const r = await withTimeout(fetchRole(nextUser.id), 4000);
          if (mounted) setRole(r);
        } catch {
          // Se falhar/timeout: mantém role anterior; se não houver, cai para "usuario" (mais restritivo).
          if (mounted) setRole((prev) => prev ?? "usuario");
        }
      }

      if (mounted) setLoading(false);
    });

    // getSession depois do listener (boas práticas)
    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        const session = data.session;
        const nextUser = session?.user ? { id: session.user.id, email: session.user.email ?? null } : null;
        setUser(nextUser);
        lastUserIdRef.current = nextUser?.id ?? null;

        if (nextUser) {
          try {
            const r = await withTimeout(fetchRole(nextUser.id), 4000);
            if (mounted) setRole(r);
          } catch {
            if (mounted) setRole((prev) => prev ?? "usuario");
          } finally {
            if (mounted) setLoading(false);
          }
        } else {
          setRole(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      window.clearTimeout(hardStop);
      sub.subscription.unsubscribe();
    };
    // Intencional: dependências vazias para inicializar 1x
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const value = useMemo<AuthState>(() => ({ loading, user, role, signOut }), [loading, user, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

