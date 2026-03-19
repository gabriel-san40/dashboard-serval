-- Adicionar campos negadas, ag_pagamento e ag_habilitacao à tabela status
ALTER TABLE public.status
  ADD COLUMN IF NOT EXISTS negadas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ag_pagamento INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ag_habilitacao INTEGER NOT NULL DEFAULT 0;
