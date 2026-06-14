-- Security & reliability hardening
-- Safe to re-run: uses DROP IF EXISTS before each CREATE.
-- Apply AFTER 003_competitor_rls.sql.

-- ─── 1. Explicit WITH CHECK on reports ALL policy ─────────────────────────────
-- Migration 001 created a FOR ALL policy with only USING on reports.
-- PostgreSQL applies the USING expression as both filter and check for ALL
-- policies without WITH CHECK, but we make it explicit here to match the
-- pattern established for businesses/competitors in migration 002.

drop policy if exists "Users can CRUD own reports" on public.reports;
create policy "Users can CRUD own reports"
  on public.reports for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── 2. restore_trial_credit ─────────────────────────────────────────────────
-- Called by the service role if report generation fails AFTER a trial credit
-- was consumed. Decrements trial_reports_used atomically (floor 0).
-- Only affects trial users — active/trialing subscribers are no-ops.

create or replace function public.restore_trial_credit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set trial_reports_used = greatest(0, trial_reports_used - 1)
  where id = p_user_id
    and subscription_status = 'trial';
end;
$$;

revoke execute on function public.restore_trial_credit(uuid) from public, anon, authenticated;
grant  execute on function public.restore_trial_credit(uuid) to service_role;

-- ─── 3. replace_competitors ───────────────────────────────────────────────────
-- Atomically replaces all competitor rows for a given business.
-- Running delete then insert in two separate client calls risks a partial
-- state if the insert fails after the delete succeeds. This function ensures
-- both operations happen in a single transaction.
--
-- Security: SECURITY DEFINER so it can bypass RLS, but validates ownership via
-- auth.uid() before touching any rows. Callable by authenticated users only.

create or replace function public.replace_competitors(
  p_business_id uuid,
  p_urls        text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Validate that the calling user owns the business
  if not exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.user_id = auth.uid()
  ) then
    raise exception 'Business not found or access denied';
  end if;

  -- Delete all existing competitors for this business
  delete from public.competitors
  where business_id = p_business_id;

  -- Insert new competitors (no-op if array is null or empty)
  if p_urls is not null and array_length(p_urls, 1) > 0 then
    insert into public.competitors (business_id, user_id, url)
    select p_business_id, auth.uid(), unnest(p_urls);
  end if;
end;
$$;

revoke execute on function public.replace_competitors(uuid, text[]) from public, anon;
grant  execute on function public.replace_competitors(uuid, text[]) to authenticated;
