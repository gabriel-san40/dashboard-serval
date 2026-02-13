-- 0) Utilitários (timestamps)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Cadastros base
create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vendedores_set_updated_at
before update on public.vendedores
for each row execute function public.update_updated_at_column();

create table if not exists public.produtos_sky (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger produtos_sky_set_updated_at
before update on public.produtos_sky
for each row execute function public.update_updated_at_column();

create table if not exists public.pacotes_sky (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos_sky(id) on delete restrict,
  nome text not null,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pacotes_sky_produto_id on public.pacotes_sky(produto_id);

create trigger pacotes_sky_set_updated_at
before update on public.pacotes_sky
for each row execute function public.update_updated_at_column();

create table if not exists public.produtos_internet (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger produtos_internet_set_updated_at
before update on public.produtos_internet
for each row execute function public.update_updated_at_column();

create table if not exists public.pacotes_internet (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos_internet(id) on delete restrict,
  nome text not null,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pacotes_internet_produto_id on public.pacotes_internet(produto_id);

create trigger pacotes_internet_set_updated_at
before update on public.pacotes_internet
for each row execute function public.update_updated_at_column();

create table if not exists public.formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger formas_pagamento_set_updated_at
before update on public.formas_pagamento
for each row execute function public.update_updated_at_column();

create table if not exists public.origens_lead (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger origens_lead_set_updated_at
before update on public.origens_lead
for each row execute function public.update_updated_at_column();

-- 2) Tabelas operacionais
create table if not exists public.vendas_sky (
  id uuid primary key default gen_random_uuid(),
  data_venda date not null default current_date,
  vendedor_id uuid not null references public.vendedores(id) on delete restrict,
  produto_id uuid not null references public.produtos_sky(id) on delete restrict,
  pacote_id uuid references public.pacotes_sky(id) on delete restrict,
  forma_pagamento_id uuid not null references public.formas_pagamento(id) on delete restrict,
  origem_lead_id uuid references public.origens_lead(id) on delete restrict,
  seguro boolean not null default false,
  cidade text,
  created_by uuid not null default auth.uid(),
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendas_sky_data_venda on public.vendas_sky(data_venda);
create index if not exists idx_vendas_sky_vendedor_id on public.vendas_sky(vendedor_id);
create index if not exists idx_vendas_sky_produto_id on public.vendas_sky(produto_id);

create trigger vendas_sky_set_updated_at
before update on public.vendas_sky
for each row execute function public.update_updated_at_column();

create table if not exists public.vendas_internet (
  id uuid primary key default gen_random_uuid(),
  data_venda date not null default current_date,
  vendedor_id uuid not null references public.vendedores(id) on delete restrict,
  produto_id uuid not null references public.produtos_internet(id) on delete restrict,
  pacote_id uuid references public.pacotes_internet(id) on delete restrict,
  forma_pagamento_id uuid not null references public.formas_pagamento(id) on delete restrict,
  origem_lead_id uuid references public.origens_lead(id) on delete restrict,
  cidade text,
  created_by uuid not null default auth.uid(),
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendas_internet_data_venda on public.vendas_internet(data_venda);
create index if not exists idx_vendas_internet_vendedor_id on public.vendas_internet(vendedor_id);
create index if not exists idx_vendas_internet_produto_id on public.vendas_internet(produto_id);

create trigger vendas_internet_set_updated_at
before update on public.vendas_internet
for each row execute function public.update_updated_at_column();

create table if not exists public.dados_administrativos (
  id uuid primary key default gen_random_uuid(),
  data_ref date not null default current_date,
  canal text not null,
  leads integer not null default 0,
  sem_contato integer not null default 0,
  negociacao integer not null default 0,
  cadastradas integer not null default 0,
  habilitadas integer not null default 0,
  created_by uuid not null default auth.uid(),
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dados_adm_data_ref on public.dados_administrativos(data_ref);

create trigger dados_administrativos_set_updated_at
before update on public.dados_administrativos
for each row execute function public.update_updated_at_column();

create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  valor_numeric numeric,
  valor_texto text,
  ativo boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger configuracoes_set_updated_at
before update on public.configuracoes
for each row execute function public.update_updated_at_column();

-- 3) RLS (tudo com RLS)
alter table public.vendedores enable row level security;
alter table public.produtos_sky enable row level security;
alter table public.pacotes_sky enable row level security;
alter table public.produtos_internet enable row level security;
alter table public.pacotes_internet enable row level security;
alter table public.formas_pagamento enable row level security;
alter table public.origens_lead enable row level security;
alter table public.vendas_sky enable row level security;
alter table public.vendas_internet enable row level security;
alter table public.dados_administrativos enable row level security;
alter table public.configuracoes enable row level security;

-- 3.1) Policies: selects só ativos
-- Cadastros base: SELECT para qualquer autenticado; escrita só admin
create policy "vendedores_select_active" on public.vendedores
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "vendedores_admin_insert" on public.vendedores
for insert to authenticated
with check (public.is_admin());

create policy "vendedores_admin_update" on public.vendedores
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

create policy "produtos_sky_select_active" on public.produtos_sky
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "produtos_sky_admin_insert" on public.produtos_sky
for insert to authenticated
with check (public.is_admin());

create policy "produtos_sky_admin_update" on public.produtos_sky
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

create policy "pacotes_sky_select_active" on public.pacotes_sky
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "pacotes_sky_admin_insert" on public.pacotes_sky
for insert to authenticated
with check (public.is_admin());

create policy "pacotes_sky_admin_update" on public.pacotes_sky
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

create policy "produtos_internet_select_active" on public.produtos_internet
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "produtos_internet_admin_insert" on public.produtos_internet
for insert to authenticated
with check (public.is_admin());

create policy "produtos_internet_admin_update" on public.produtos_internet
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

create policy "pacotes_internet_select_active" on public.pacotes_internet
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "pacotes_internet_admin_insert" on public.pacotes_internet
for insert to authenticated
with check (public.is_admin());

create policy "pacotes_internet_admin_update" on public.pacotes_internet
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

create policy "formas_pagamento_select_active" on public.formas_pagamento
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "formas_pagamento_admin_insert" on public.formas_pagamento
for insert to authenticated
with check (public.is_admin());

create policy "formas_pagamento_admin_update" on public.formas_pagamento
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

create policy "origens_lead_select_active" on public.origens_lead
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "origens_lead_admin_insert" on public.origens_lead
for insert to authenticated
with check (public.is_admin());

create policy "origens_lead_admin_update" on public.origens_lead
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

-- Vendas: SELECT para qualquer autenticado (dashboard); INSERT/UPDATE para gerente/admin
create policy "vendas_sky_select_active" on public.vendas_sky
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "vendas_sky_mgr_insert" on public.vendas_sky
for insert to authenticated
with check (public.is_gerente_or_admin());

create policy "vendas_sky_mgr_update" on public.vendas_sky
for update to authenticated
using (public.is_gerente_or_admin() and ativo = true and deleted_at is null)
with check (
  public.is_gerente_or_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

create policy "vendas_internet_select_active" on public.vendas_internet
for select to authenticated
using (ativo = true and deleted_at is null);

create policy "vendas_internet_mgr_insert" on public.vendas_internet
for insert to authenticated
with check (public.is_gerente_or_admin());

create policy "vendas_internet_mgr_update" on public.vendas_internet
for update to authenticated
using (public.is_gerente_or_admin() and ativo = true and deleted_at is null)
with check (
  public.is_gerente_or_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

-- Administrativo e configurações: apenas admin
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

create policy "configuracoes_admin_select" on public.configuracoes
for select to authenticated
using (public.is_admin() and ativo = true and deleted_at is null);

create policy "configuracoes_admin_insert" on public.configuracoes
for insert to authenticated
with check (public.is_admin());

create policy "configuracoes_admin_update" on public.configuracoes
for update to authenticated
using (public.is_admin() and ativo = true and deleted_at is null)
with check (
  public.is_admin()
  and ((ativo = true and deleted_at is null) or (ativo = false and deleted_at is not null))
);

-- 3.2) Soft delete: sem DELETE policy (DELETE fica bloqueado por RLS)
