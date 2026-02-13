-- Permite que todos os usuários autenticados leiam configurações (metas, etc.)
-- Anteriormente, apenas admin podia ler. INSERT/UPDATE continuam restritos a admin.

drop policy if exists "configuracoes_admin_select" on public.configuracoes;

create policy "configuracoes_authenticated_select" on public.configuracoes
for select to authenticated
using (ativo = true and deleted_at is null);
