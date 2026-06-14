-- Security hardening migration
-- Safe to re-run: uses DROP IF EXISTS before each CREATE.
-- Apply AFTER 001_initial_schema.sql.

-- ─── 1. Remove user-facing profile update policy ──────────────────────────────
-- Users must not be able to set subscription_status, trial_reports_used,
-- or any Stripe fields on their own row. All profile writes now go through
-- the service role (webhook, checkout, report generation).

drop policy if exists "Users can update own profile" on public.profiles;

-- ─── 2. Add with check to businesses + competitors INSERT/UPDATE ──────────────
-- Ensures user_id on new/updated rows must equal the authenticated user.

drop policy if exists "Users can CRUD own businesses" on public.businesses;
create policy "Users can CRUD own businesses"
  on public.businesses for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can CRUD own competitors" on public.competitors;
create policy "Users can CRUD own competitors"
  on public.competitors for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── 3. Atomic trial credit consumption function ──────────────────────────────
-- Called server-side (service role) before expensive scraping/AI work.
-- Returns: 'subscriber' | 'consumed' | 'exhausted'
--   subscriber → active/trialing subscription, allow generation, no credit used
--   consumed   → trial credit deducted atomically, allow generation
--   exhausted  → trial already used, block generation

create or replace function public.try_consume_trial_credit(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_rows   integer;
begin
  select subscription_status into v_status
  from public.profiles
  where id = p_user_id;

  if v_status in ('active', 'trialing') then
    return 'subscriber';
  end if;

  -- Atomically increment only if < 1 trial used
  update public.profiles
  set trial_reports_used = trial_reports_used + 1
  where id = p_user_id
    and trial_reports_used < 1;

  get diagnostics v_rows = row_count;

  return case when v_rows > 0 then 'consumed' else 'exhausted' end;
end;
$$;

-- Only service role may call this function — not client JWTs
revoke execute on function public.try_consume_trial_credit(uuid) from public, anon, authenticated;
grant  execute on function public.try_consume_trial_credit(uuid) to service_role;
