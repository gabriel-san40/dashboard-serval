-- Tabela "status" para armazenar valores de Habilitadas, Pagas e Instaladas.
-- A ideia é manter uma única linha que é atualizada (upsert).
CREATE TABLE IF NOT EXISTS public.status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habilitadas INTEGER NOT NULL DEFAULT 0,
  pagas INTEGER NOT NULL DEFAULT 0,
  instaladas INTEGER NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_status
  BEFORE UPDATE ON public.status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.status ENABLE ROW LEVEL SECURITY;

-- SELECT: todos autenticados
CREATE POLICY "status_select" ON public.status
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: admin e gerente
CREATE POLICY "status_insert" ON public.status
  FOR INSERT TO authenticated
  WITH CHECK (public.is_gerente_or_admin());

-- UPDATE: admin e gerente
CREATE POLICY "status_update" ON public.status
  FOR UPDATE TO authenticated
  USING (public.is_gerente_or_admin())
  WITH CHECK (public.is_gerente_or_admin());

-- Inserir linha inicial com zeros
INSERT INTO public.status (habilitadas, pagas, instaladas) VALUES (0, 0, 0);
