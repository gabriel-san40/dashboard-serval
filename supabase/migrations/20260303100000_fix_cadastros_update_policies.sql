-- Fix: cria função RPC SECURITY DEFINER para soft-delete de cadastros.
-- Contorna problemas de RLS WITH CHECK nas tabelas de cadastro.

create or replace function public.admin_soft_delete(
  _table text,
  _id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Permissão negada: apenas admin pode desativar registros.';
  end if;

  if _table not in (
    'vendedores', 'produtos_sky', 'pacotes_sky',
    'produtos_internet', 'pacotes_internet',
    'formas_pagamento', 'origens_lead'
  ) then
    raise exception 'Tabela não permitida: %', _table;
  end if;

  execute format(
    'UPDATE %I SET ativo = false, deleted_at = now() WHERE id = $1 AND ativo = true AND deleted_at IS NULL',
    _table
  ) using _id;
end;
$$;
