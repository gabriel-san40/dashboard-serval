-- Tabela para registrar gastos diários com Facebook Ads
create table if not exists public.gastos_facebook_ads (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  valor numeric not null default 0,
  ativo boolean not null default true,
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gastos_facebook_ads_data_unique unique (data)
);

-- RLS
alter table public.gastos_facebook_ads enable row level security;

create policy "Authenticated users can read gastos_facebook_ads"
  on public.gastos_facebook_ads for select
  to authenticated
  using (true);

create policy "Admin can insert gastos_facebook_ads"
  on public.gastos_facebook_ads for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin can update gastos_facebook_ads"
  on public.gastos_facebook_ads for update
  to authenticated
  using (public.is_admin());

create policy "Admin can delete gastos_facebook_ads"
  on public.gastos_facebook_ads for delete
  to authenticated
  using (public.is_admin());
