-- Strengthen competitor RLS: with check now also verifies the referenced
-- business belongs to the same authenticated user. This prevents a user
-- from attaching competitor rows to another user's business via direct API calls.
-- Safe to re-run: uses DROP IF EXISTS before CREATE.
-- Apply AFTER 002_security_hardening.sql.

drop policy if exists "Users can CRUD own competitors" on public.competitors;
create policy "Users can CRUD own competitors"
  on public.competitors for all
  using  (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.businesses b
      where b.id = competitors.business_id
        and b.user_id = auth.uid()
    )
  );
