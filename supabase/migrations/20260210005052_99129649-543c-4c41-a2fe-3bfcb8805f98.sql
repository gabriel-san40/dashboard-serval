-- Table required by public.handle_new_auth_user()
create table if not exists public.usuarios (
  id uuid primary key,
  email text not null,
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- Policies: user can read/update own record; admin can read all
drop policy if exists "usuarios_read_own" on public.usuarios;
create policy "usuarios_read_own"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "usuarios_update_own" on public.usuarios;
create policy "usuarios_update_own"
on public.usuarios
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "usuarios_admin_read_all" on public.usuarios;
create policy "usuarios_admin_read_all"
on public.usuarios
for select
to authenticated
using (public.is_admin());

-- Keep updated_at in sync
create trigger usuarios_set_updated_at
before update on public.usuarios
for each row
execute function public.update_updated_at_column();
