-- Reestrutura dados_administrativos: formato normalizado (1 linha/canal/data)
-- para formato flat/denormalizado (1 linha/data, todos os canais como colunas).
-- ATENÇÃO: esta migração DROPA a tabela existente. Dados anteriores serão perdidos.

-- 1) Remover objetos dependentes
drop trigger if exists dados_administrativos_set_updated_at on public.dados_administrativos;
drop index if exists idx_dados_adm_data_ref;

drop policy if exists "dados_administrativos_admin_select" on public.dados_administrativos;
drop policy if exists "dados_administrativos_admin_insert" on public.dados_administrativos;
drop policy if exists "dados_administrativos_admin_update" on public.dados_administrativos;

drop table if exists public.dados_administrativos cascade;

-- 2) Criar nova tabela flat
create table public.dados_administrativos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,

  -- Leads (entrada manual)
  total_leads        integer not null default 0,
  ia_leads           integer not null default 0,
  robo_leads         integer not null default 0,
  facebook_leads     integer not null default 0,

  -- Sem contato
  sem_contato_ia       integer not null default 0,
  sem_contato_robo     integer not null default 0,
  sem_contato_facebook integer not null default 0,

  -- Em negociação
  em_negociacao_ia       integer not null default 0,
  em_negociacao_robo     integer not null default 0,
  em_negociacao_facebook integer not null default 0,

  -- Cadastradas (6 fontes)
  cadastradas_ia        integer not null default 0,
  cadastradas_robo      integer not null default 0,
  cadastradas_facebook  integer not null default 0,
  cadastradas_loja      integer not null default 0,
  cadastradas_indicacao integer not null default 0,
  cadastradas_pap       integer not null default 0,

  -- Habilitadas
  habilitada_ia       integer not null default 0,
  habilitada_robo     integer not null default 0,
  habilitada_facebook integer not null default 0,

  -- Campos de sistema
  created_by uuid not null default auth.uid(),
  ativo      boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Uma linha por data
  constraint dados_adm_data_unique unique (data)
);

-- 3) Index e trigger
create index idx_dados_adm_data on public.dados_administrativos(data);

create trigger dados_administrativos_set_updated_at
before update on public.dados_administrativos
for each row execute function public.update_updated_at_column();

-- 4) RLS
alter table public.dados_administrativos enable row level security;

create policy "dados_administrativos_admin_select" on public.dados_administrativos
for select to authenticated
using (public.is_admin() and ativo = true and deleted_at is null);

create policy "dados_administrativos_admin_insert" on public.dados_administrativos
for insert to authenticated
with check (public.is_admin());

create policy "dados_administrativos_admin_update" on public.dados_administrativos
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);
