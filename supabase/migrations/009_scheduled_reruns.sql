-- CompeteIQ — Stage 4: Scheduled Re-Runs and "What Changed"
-- Adds lightweight monthly re-run scheduling (paid plans) and a per-report
-- "what changed" summary. Run after migrations 001–008. Safe to re-run.
--
-- Scope: this is a lightweight monthly refresh, NOT a real-time monitoring
-- suite. Scheduling is gated to paid plans in application logic + the cron job.

-- ── Scheduling state on businesses ───────────────────────────────────────────
alter table public.businesses
  add column if not exists rerun_enabled boolean not null default false;

alter table public.businesses
  add column if not exists rerun_last_run_at timestamptz;

alter table public.businesses
  add column if not exists rerun_last_status text
    check (rerun_last_status in ('success', 'failed'));

comment on column public.businesses.rerun_enabled is
  'Stage 4: when true and the owner is on a paid plan, the monthly cron re-runs this business''s report.';
comment on column public.businesses.rerun_last_run_at is
  'Stage 4: timestamp of the last scheduled re-run attempt (success or failure).';
comment on column public.businesses.rerun_last_status is
  'Stage 4: outcome of the last scheduled re-run: success | failed | null (never run).';

-- ── "What changed" + run type on reports ─────────────────────────────────────
alter table public.reports
  add column if not exists change_summary jsonb;

alter table public.reports
  add column if not exists run_type text not null default 'manual'
    check (run_type in ('manual', 'scheduled'));

comment on column public.reports.change_summary is
  'Stage 4: short "what changed" summary vs the previous report for this business. '
  'Shape: { "summary": text, "changes": text[] }. Null for first/manual reports.';
comment on column public.reports.run_type is
  'Stage 4: how the report was generated: manual (user-triggered) | scheduled (cron).';

-- Help the cron find due businesses quickly.
create index if not exists idx_businesses_rerun_enabled
  on public.businesses(rerun_enabled)
  where rerun_enabled = true;
