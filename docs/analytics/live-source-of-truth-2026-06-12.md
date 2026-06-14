# Live Analytics Source Of Truth

Snapshot date: 2026-06-12
Primary timezone for captured timestamps: UTC
Scope: CompeteIQ product usage, entitlement, report-generation, and revenue-source setup.

## Source Precedence

1. Stripe live mode is the source of truth for billing, revenue, invoices, subscription lifecycle, and payment events.
2. Supabase live project `yzwkvwcflnnwrcyadqzv` is the source of truth for app users, entitlement cache, businesses, competitors, report attempts, report statuses, and scrape jobs.
3. Vercel logs are needed only when reconciling webhook delivery, API failures, or production runtime behavior.
4. Local repo migrations and routes explain intended behavior, but live Supabase and Stripe reads control current-state analytics.

Do not store raw customer emails, payment links, phone numbers, payment methods, or full customer records in analytics handoff files. Use aggregate summaries or redacted provider IDs unless a task explicitly requires row-level reconciliation.

## Connected Sources

### Supabase

- Project: `Competitor Research Agent`
- Project ref: `yzwkvwcflnnwrcyadqzv`
- Region: `ap-southeast-2`
- Status at read time: `ACTIVE_HEALTHY`
- Database engine: Postgres 17
- Verified through: Supabase connector project list, project details, and read-only SQL.

### Stripe

- Account profile: `Atlas by Emma`
- Account ID: `acct_1TWAFnCHQLJhk243`
- Live mode key available through Stripe CLI at read time.
- Verified through: `stripe whoami` and read-only live list commands.
- Stripe app connector authenticated, but its listed read tools returned `Unknown tool` after auth, so the CLI was used for revenue truth.

## Supabase Snapshot

Captured at `2026-06-12 08:15:02+00` to `2026-06-12 08:15:43+00`.

| Table | Rows |
| --- | ---: |
| `public.profiles` | 14 |
| `public.businesses` | 6 |
| `public.competitors` | 10 |
| `public.reports` | 9 |
| `public.scrape_jobs` | 7 |

### Profiles By Entitlement

| Subscription Status | Plan | Profiles | With Stripe Customer | With Stripe Subscription |
| --- | --- | ---: | ---: | ---: |
| `active` | `pro` | 1 | 1 | 1 |
| `trial` | `free` | 13 | 7 | 0 |

### Reports By Status

| Status | Reports | Reports Last 30 Days | Reports Last Hour |
| --- | ---: | ---: | ---: |
| `completed` | 5 | 5 | 0 |
| `failed` | 4 | 4 | 0 |

### Reports Last 30 Days By Entitlement

| Subscription Status | Plan | Reports Last 30 Days |
| --- | --- | ---: |
| `active` | `pro` | 4 |
| `trial` | `free` | 5 |

### Scrape Jobs By Status

| Status | Scrape Jobs |
| --- | ---: |
| `completed` | 7 |

### Live Schema And Policy Notes

- Live `public.profiles` includes `plan`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, and `trial_reports_used`.
- Live `public.reports` includes status and generated report content fields.
- Live RLS policies exist on `profiles`, `businesses`, `competitors`, `reports`, and `scrape_jobs`.
- Live helper functions exist as `SECURITY DEFINER`: `handle_new_user`, `replace_competitors`, `restore_trial_credit`, and `try_consume_trial_credit`.

## Stripe Live Snapshot

Captured from live Stripe CLI reads on 2026-06-12.

### Prices

| Price ID | Active | Currency | Amount | Recurrence | Nickname | Product |
| --- | --- | --- | ---: | --- | --- | --- |
| `price_1TeYygCHQLJhk243ld7bWXaQ` | true | AUD | 159.00 | monthly | `100 reports per 30 days` | `prod_UdHxu1eKmVDGR4` |
| `price_1TeDxMCHQLJhk243bt8T7lUG` | false | USD | 79.00 | monthly | `test` | `prod_UdHxu1eKmVDGR4` |
| `price_1Te1NDCHQLJhk243PoMxR5HG` | false | USD | 79.00 | monthly | `Pro monthly` | `prod_UdHxu1eKmVDGR4` |

### Subscriptions

| Metric | Value |
| --- | ---: |
| Live subscriptions returned | 1 |
| Active live subscriptions returned | 1 |
| Active subscription price observed | `price_1TeE1bCHQLJhk2437VlYz8MW` |
| Active subscription price amount | USD 0.05 |
| Active subscription has Supabase user metadata | yes |
| Active subscription customer matches one Supabase active Pro profile | yes, by aggregate reconciliation |

Important caveat: the active live subscription is on an older inactive USD price, not the current active AUD Pro price. Treat it as a launch/test entitlement artifact unless reconfirmed as real customer revenue.

### Invoices

| Metric | Value |
| --- | ---: |
| Live invoices returned | 1 |
| Paid invoices returned | 1 |
| Total amount paid in returned invoices | USD 0.00 |
| Invoice total in returned invoices | USD 0.05 |

No usable live revenue should be inferred from the current invoice sample because the only returned invoice is a zero-paid launch/test artifact.

### Events

Recent live events include account updates, billing portal sessions, product/price updates, price creation for the active AUD Pro price, and expired checkout sessions. Recent test-mode events include Starter and Pro test product/price setup.

Event exports can contain customer emails, phone numbers, hosted invoice URLs, billing portal URLs, and other customer-sensitive fields. Do not paste raw event JSON into reports or analytics artifacts.

## Analytics-Ready Interpretation

- Supabase is connected and can provide current product usage and entitlement snapshots.
- Stripe live mode is connected and can provide billing truth through CLI reads.
- Current product usage is small enough that aggregate snapshots are more useful than dashboards for now.
- The only live active subscription and invoice evidence appears to be a launch/test artifact, not meaningful production revenue.
- Future revenue reporting should separate:
  - active app entitlement in Supabase,
  - live Stripe subscription status,
  - actual paid invoice amount,
  - checkout attempts and expired sessions.

## Refresh Commands And Queries

### Supabase Table Counts

```sql
with table_counts as (
  select 'profiles' as table_name, count(*)::bigint as row_count from public.profiles
  union all select 'businesses', count(*)::bigint from public.businesses
  union all select 'competitors', count(*)::bigint from public.competitors
  union all select 'reports', count(*)::bigint from public.reports
  union all select 'scrape_jobs', count(*)::bigint from public.scrape_jobs
), as_of as (select now() as snapshot_at)
select a.snapshot_at, t.table_name, t.row_count
from table_counts t cross join as_of a
order by t.table_name;
```

### Supabase Entitlement Mix

```sql
select
  now() as snapshot_at,
  subscription_status,
  plan,
  count(*)::bigint as profiles,
  count(*) filter (where stripe_customer_id is not null)::bigint as with_stripe_customer,
  count(*) filter (where stripe_subscription_id is not null)::bigint as with_stripe_subscription,
  min(created_at) as first_profile_created_at,
  max(created_at) as last_profile_created_at
from public.profiles
group by subscription_status, plan
order by subscription_status, plan;
```

### Supabase Report Status

```sql
select
  now() as snapshot_at,
  status,
  count(*)::bigint as reports,
  min(created_at) as first_report_created_at,
  max(created_at) as last_report_created_at,
  count(*) filter (where created_at >= now() - interval '30 days')::bigint as reports_last_30_days,
  count(*) filter (where created_at >= now() - interval '1 hour')::bigint as reports_last_hour
from public.reports
group by status
order by status;
```

### Stripe Live Reads

```powershell
stripe whoami
stripe prices list --live --limit 100
stripe subscriptions list --live --limit 100
stripe invoices list --live --limit 100
stripe events list --live --limit 20
```

For analytics artifacts, summarize these outputs. Do not store raw customer contact fields, hosted invoice URLs, billing portal URLs, payment method IDs, or full event payloads.

## Open Follow-Ups

- Decide whether to create a read-only analytics view layer in Supabase for safe aggregate querying.
- Decide whether Stripe test-mode data should be included in operational analytics or only launch QA notes.
- If real customers arrive, add a revenue reconciliation query that joins redacted Supabase entitlement rows to Stripe subscription and paid invoice aggregates.
