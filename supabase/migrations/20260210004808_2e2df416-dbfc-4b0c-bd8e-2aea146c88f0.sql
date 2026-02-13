-- Roles table (required for RLS + admin tooling)
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- SECURITY DEFINER helpers (avoid RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin');
$$;

create or replace function public.is_gerente_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'gerente');
$$;

-- user_roles RLS (recreate)
drop policy if exists "user_roles_read_own" on public.user_roles;
create policy "user_roles_read_own"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_roles_admin_all" on public.user_roles;
create policy "user_roles_admin_all"
on public.user_roles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
