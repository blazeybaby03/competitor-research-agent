-- CompeteIQ — Stage 2: Evidence-Backed Reports
-- Adds per-report source evidence (URLs, scrape status, scrape timestamps).
-- Run this in the Supabase SQL editor after migrations 001–007.
-- Safe to re-run: the column add is guarded with "if not exists".
--
-- Design note:
--   Scrape detail lives in public.scrape_jobs keyed by competitor_id, but those
--   rows are not linked to a specific report_id. Rather than retrofit a join,
--   Stage 2 stores a small, report-scoped evidence summary directly on the
--   report row as JSONB. This keeps source evidence private to the report's
--   owner (reports already enforce per-user RLS) and tied to the exact run that
--   produced the report. Shape (array of objects):
--     [{ "url": text, "status": "completed" | "failed",
--        "scraped_at": timestamptz-string | null, "error": text | null }]

alter table public.reports
  add column if not exists sources jsonb;

comment on column public.reports.sources is
  'Stage 2 evidence: per-competitor scrape sources for this report. '
  'Array of { url, status (completed|failed), scraped_at, error }. '
  'Null for reports generated before Stage 2.';
