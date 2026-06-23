-- Guest report flow: unauthenticated visitors generate one free report.
-- Access is controlled by the token column (128-bit UUID) — no Supabase user
-- required. All DB operations go through the service-role admin client.

CREATE TABLE guest_reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token        uuid        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  email        text        NOT NULL,
  ip           text,
  website_url  text,
  competitor_url text      NOT NULL,
  status       text        NOT NULL DEFAULT 'generating'
                           CHECK (status IN ('generating', 'completed', 'failed')),
  title                    text,
  executive_summary        text,
  competitor_summaries     jsonb,
  positioning_analysis     text,
  pricing_analysis         text,
  strengths_weaknesses     jsonb,
  market_gaps              jsonb,
  recommended_actions      jsonb,
  sources                  jsonb,
  error_message            text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Index for the duplicate-email rate limit check.
CREATE INDEX guest_reports_email_created_idx ON guest_reports (email, created_at);

-- Index for the per-IP rate limit check.
CREATE INDEX guest_reports_ip_created_idx ON guest_reports (ip, created_at);

-- All access is via the service-role admin client (bypasses RLS).
-- Enable RLS to prevent any accidental anon/authenticated reads/writes.
ALTER TABLE guest_reports ENABLE ROW LEVEL SECURITY;
