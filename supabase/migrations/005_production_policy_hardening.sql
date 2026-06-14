-- Production policy hardening
-- Safe to re-run. Apply after 004_rls_hardening.sql.

-- Users must not be able to update billing/trial fields on their own profile.
drop policy if exists "Users can update own profile" on public.profiles;

-- Keep profile reads user-scoped.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

-- Explicit WITH CHECK prevents direct API writes from assigning rows to other users.
drop policy if exists "Users can CRUD own businesses" on public.businesses;
create policy "Users can CRUD own businesses"
  on public.businesses for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can CRUD own competitors" on public.competitors;
create policy "Users can CRUD own competitors"
  on public.competitors for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.businesses b
      where b.id = competitors.business_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can CRUD own reports" on public.reports;
create policy "Users can CRUD own reports"
  on public.reports for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own scrape jobs" on public.scrape_jobs;
create policy "Users can view own scrape jobs"
  on public.scrape_jobs for select
  using (
    exists (
      select 1
      from public.competitors c
      where c.id = scrape_jobs.competitor_id
        and c.user_id = (select auth.uid())
    )
  );

-- Trigger/helper functions should not be externally executable through REST RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_arguments(p.oid) = ''
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- App RPC grants.
revoke execute on function public.try_consume_trial_credit(uuid) from public, anon, authenticated;
grant execute on function public.try_consume_trial_credit(uuid) to service_role;

revoke execute on function public.restore_trial_credit(uuid) from public, anon, authenticated;
grant execute on function public.restore_trial_credit(uuid) to service_role;

revoke execute on function public.replace_competitors(uuid, text[]) from public, anon;
grant execute on function public.replace_competitors(uuid, text[]) to authenticated;

create index if not exists idx_scrape_jobs_competitor_id
  on public.scrape_jobs(competitor_id);
