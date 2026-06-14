-- Internal aggregate analytics views.
-- Safe to re-run. Apply after 006_plan_based_access.sql.

create schema if not exists analytics;

revoke all on schema analytics from public;
revoke all on schema analytics from anon;
revoke all on schema analytics from authenticated;
grant usage on schema analytics to service_role;

create or replace view analytics.signup_funnel
with (security_invoker = true)
as
with profile_base as (
  select
    p.id as user_id,
    p.created_at::date as signup_date
  from public.profiles p
),
user_milestones as (
  select
    pb.user_id,
    pb.signup_date,
    exists (
      select 1
      from public.businesses b
      where b.user_id = pb.user_id
    ) as has_business,
    exists (
      select 1
      from public.competitors c
      where c.user_id = pb.user_id
    ) as has_competitor,
    exists (
      select 1
      from public.reports r
      where r.user_id = pb.user_id
    ) as has_report_attempt,
    exists (
      select 1
      from public.reports r
      where r.user_id = pb.user_id
        and r.status = 'completed'
    ) as has_completed_report
  from profile_base pb
)
select
  signup_date,
  count(*)::integer as signed_up_users,
  count(*) filter (where has_business)::integer as business_setup_users,
  count(*) filter (where has_competitor)::integer as competitor_configured_users,
  count(*) filter (where has_report_attempt)::integer as report_attempt_users,
  count(*) filter (where has_completed_report)::integer as completed_report_users,
  round(
    count(*) filter (where has_business)::numeric / nullif(count(*), 0),
    4
  ) as business_setup_rate,
  round(
    count(*) filter (where has_competitor)::numeric / nullif(count(*), 0),
    4
  ) as competitor_configured_rate,
  round(
    count(*) filter (where has_completed_report)::numeric / nullif(count(*), 0),
    4
  ) as completed_report_user_rate
from user_milestones
group by signup_date;

comment on view analytics.signup_funnel is
  'Daily aggregate signup funnel by profile creation date. Contains no user-level identifiers.';

create or replace view analytics.report_success_rate
with (security_invoker = true)
as
select
  r.created_at::date as report_date,
  count(*)::integer as report_attempts,
  count(*) filter (where r.status = 'completed')::integer as completed_reports,
  count(*) filter (where r.status = 'failed')::integer as failed_reports,
  count(*) filter (where r.status in ('pending', 'generating'))::integer as in_progress_reports,
  round(
    count(*) filter (where r.status = 'completed')::numeric / nullif(count(*), 0),
    4
  ) as completion_rate,
  round(
    count(*) filter (where r.status = 'failed')::numeric / nullif(count(*), 0),
    4
  ) as failure_rate
from public.reports r
group by r.created_at::date;

comment on view analytics.report_success_rate is
  'Daily aggregate report attempts and status rates by report creation date.';

create or replace view analytics.entitlement_mix
with (security_invoker = true)
as
select
  now() as snapshot_at,
  p.plan,
  p.subscription_status,
  count(*)::integer as profiles,
  count(*) filter (where p.stripe_customer_id is not null)::integer as profiles_with_stripe_customer,
  count(*) filter (where p.stripe_subscription_id is not null)::integer as profiles_with_stripe_subscription,
  count(*) filter (where p.trial_reports_used > 0)::integer as profiles_with_trial_report_used,
  coalesce(sum(p.trial_reports_used), 0)::integer as trial_reports_used_total,
  min(p.created_at) as first_profile_created_at,
  max(p.created_at) as latest_profile_created_at
from public.profiles p
group by p.plan, p.subscription_status;

comment on view analytics.entitlement_mix is
  'Current aggregate entitlement cache mix by plan and subscription status.';

create or replace view analytics.stripe_supabase_reconciliation
with (security_invoker = true)
as
select
  now() as snapshot_at,
  count(*) filter (where p.subscription_status = 'active')::integer as active_entitlement_profiles,
  count(*) filter (
    where p.subscription_status = 'active'
      and p.plan in ('starter', 'pro')
  )::integer as active_paid_plan_profiles,
  count(*) filter (
    where p.subscription_status = 'active'
      and p.stripe_customer_id is not null
  )::integer as active_profiles_with_stripe_customer,
  count(*) filter (
    where p.subscription_status = 'active'
      and p.stripe_subscription_id is not null
  )::integer as active_profiles_with_stripe_subscription,
  count(*) filter (
    where p.subscription_status = 'active'
      and p.stripe_customer_id is null
  )::integer as active_profiles_missing_stripe_customer,
  count(*) filter (
    where p.subscription_status = 'active'
      and p.stripe_subscription_id is null
  )::integer as active_profiles_missing_stripe_subscription,
  count(*) filter (
    where p.subscription_status <> 'active'
      and p.stripe_subscription_id is not null
  )::integer as inactive_profiles_with_stripe_subscription,
  count(*) filter (
    where p.subscription_status <> 'active'
      and p.stripe_customer_id is not null
  )::integer as inactive_profiles_with_stripe_customer,
  count(*) filter (
    where p.subscription_status = 'active'
      and p.plan = 'free'
  )::integer as active_profiles_on_free_plan,
  count(*) filter (
    where p.subscription_status <> 'active'
      and p.plan in ('starter', 'pro')
  )::integer as inactive_profiles_on_paid_plan,
  'Compare these Supabase entitlement-cache counts against live Stripe subscriptions/invoices; Stripe remains the billing source of truth.'::text
    as reconciliation_note
from public.profiles p;

comment on view analytics.stripe_supabase_reconciliation is
  'Aggregate Supabase entitlement-cache checks to compare with Stripe billing exports.';

revoke all on all tables in schema analytics from public;
revoke all on all tables in schema analytics from anon;
revoke all on all tables in schema analytics from authenticated;
grant select on all tables in schema analytics to service_role;

alter default privileges in schema analytics revoke all on tables from public;
alter default privileges in schema analytics revoke all on tables from anon;
alter default privileges in schema analytics revoke all on tables from authenticated;
alter default privileges in schema analytics grant select on tables to service_role;
