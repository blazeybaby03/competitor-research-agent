-- Plan-based access support.
-- Safe to re-run. Apply after 005_production_policy_hardening.sql.

alter table public.profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'starter', 'pro'));

-- Preserve existing active subscribers as Pro until a Stripe webhook maps them
-- to a more specific tier by subscription price.
update public.profiles
set plan = 'pro'
where subscription_status = 'active'
  and plan = 'free';

-- Keep profile reads user-scoped and keep profile writes server-only.
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);
