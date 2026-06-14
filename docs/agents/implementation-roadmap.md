# Agent Operations Implementation Roadmap

This roadmap turns the CompeteIQ Agent Operations System from documentation into real automation in small, safe stages. It is intentionally conservative because CompeteIQ is launch-sensitive and depends on Stripe, Supabase, Vercel, ScraperAPI, Anthropic Claude, and AgentMail.

Do not implement live automation from this roadmap without explicit human approval. Do not add secrets, create live credentials, deploy, or change production-sensitive configuration as part of documentation work.

## Success Definition

The agent system is complete for version 1 when:

- The six locked agents have documented roles and workflow specs.
- AgentMail is the only communication layer.
- Templates exist for intake, handoff, approval, incident escalation, routine outbound messages, and weekly briefing.
- Approval gates block high-risk production, billing, legal, security, data, prompt, scraping, and report-storage actions.
- A future implementation can start with draft-only logs and tests before sending real messages.

## Stage 0 - Documentation Foundation

Status: complete.

Deliverables:

- Agent system entry point.
- AgentMail communication layer.
- Approval gates.
- Six locked agent role files.
- Lead Operations workflow.
- Specialist workflow specs.
- Shared templates.
- Implementation roadmap.

No production behavior changes are allowed in this stage.

## Stage 1 - Draft-Only Workflow Harness

Status: complete.

Goal: convert docs into a local or server-side workflow harness that does not send emails or change production systems.

Deliverables:

- Event classification function. ✓ (`lib/agentOpsClassifier.ts`)
- Risk and approval-level classifier. ✓
- Agent routing function. ✓
- Safe log object builder. ✓ (`lib/agentOpsLogBuilder.ts`)
- Draft-only local log writer. ✓ (`lib/agentOpsLogWriter.ts`)
- Unit tests for routing, approval gates, redaction, and writer safety. ✓ (68 tests passing)

Rules:

- No live AgentMail sends.
- No Stripe writes.
- No Supabase writes unless a human approves a dedicated logging table.
- No production deploy until reviewed.
- No secrets in logs or test fixtures.

## Stage 2 - Safe Logging

Status: complete (local dev only).

Goal: preserve useful operational history without exposing sensitive data.

Deliverables:

- Final log schema. ✓ (matches `lead-operations-agent-workflow.md`)
- Redaction rules. ✓ (16 patterns in `lib/agentOpsLogBuilder.ts`, final pass in `lib/agentOpsLogWriter.ts`)
- Storage: local `.agent-ops/logs/YYYY-MM-DD.jsonl` (gitignored, dev only). ✓
- Log pruner with retention policy and dry-run mode. ✓ (`lib/agentOpsLogPruner.ts`)
- Dev sample runner showing the full classify→build→redact→write pipeline. ✓ (`scripts/agent-ops-dev-sample.mjs`)
- Tests proving secrets, tokens, private credentials, full payment data, and unnecessary personal data are not stored. ✓ (94 tests passing)

### Log Pruner — `lib/agentOpsLogPruner.ts`

Tests: `scripts/agent-ops-log-pruner.test.mjs` (26 tests, all passing).

Covers:

- `pruneAgentOpsLogs(daysToKeep, options)` — deletes `.jsonl` files whose date name is `>= daysToKeep` days old.
- `daysToKeep` must be a safe positive integer; throws `InvalidDaysToKeepError` for zero, negatives, floats, strings, NaN, Infinity, and values above `Number.MAX_SAFE_INTEGER`.
- Age computed from UTC midnight of the file date vs. UTC midnight of `now`, so behaviour is deterministic regardless of time of day.
- Future-dated files are never deleted (negative age → kept).
- Non-JSONL files and files without a `YYYY-MM-DD` name are silently skipped.
- `dryRun: true` reports what would be deleted without touching the filesystem.
- `now` and `logDir` are injectable for testing.
- Missing directory returns an empty result without error.
- Throws `ProductionPruneBlockedError` when `NODE_ENV === "production"` — no files touched.
- No Supabase, Stripe, AgentMail, fetch, or file writes.

### Dev Sample Runner — `scripts/agent-ops-dev-sample.mjs`

Run: `node scripts/agent-ops-dev-sample.mjs`

Creates 5 sample log entries covering billing P2, P0 webhook failure, customer onboarding, weekly briefing, and a redaction demo (email + card number). Output goes to `.agent-ops/logs/YYYY-MM-DD.jsonl` (gitignored).

Approval needed before:

- Creating or changing a Supabase table.
- Adding new environment variables.
- Deploying logging to production.
- Writing customer-identifiable data to a new store.

## Stage 3 - Level 0 Automation

Goal: automate safe classification, routing drafts, summaries, and weekly briefing drafts.

Allowed:

- Classify events.
- Assign risk.
- Assign owner.
- Draft handoff messages.
- Draft incident summaries.
- Draft weekly brief.
- Track statuses.

Blocked:

- Outbound email sending.
- Production code/config changes.
- Billing actions.
- Customer data edits.
- Prompt/model/scraping/report-storage changes.

## Stage 4 - Reviewed Level 1 AgentMail Sends

Goal: enable routine operational sends only after templates are reviewed.

Allowed after approval:

- Standard customer replies.
- Basic onboarding replies.
- Routine troubleshooting guidance.
- Billing emails.
- Failed-payment emails.
- Checkout recovery emails.
- Upgrade nudges.
- Cancellation follow-up emails.
- Internal bug reports.
- Report-quality bug reports.

Required first:

- Approved message templates.
- AgentMail send testing in a safe environment.
- Audit log for every sent message.
- Opt-out or stop conditions where relevant.
- Tests that Level 2 and Level 3 actions cannot be sent automatically.

## Stage 5 - Agent-by-Agent Live Workflow Build

Build live workflows in this order:

1. Lead Operations Agent
2. Weekly Briefing Agent
3. Revenue & Billing Agent
4. Customer Engagement Agent
5. Report Quality Agent
6. System Health & Security Agent

Reasoning:

- Lead Operations should enforce routing and approval gates first.
- Weekly Briefing is low-risk and summarizes activity.
- Revenue and Customer Engagement provide the fastest operational leverage.
- Report Quality needs careful boundaries around saved reports, prompts, and scraping.
- System Health & Security has the highest blast radius and should remain draft-heavy until gates are proven.

## Stage 6 - Approval Workflow

Goal: make approval requests explicit, auditable, and hard to bypass.

Deliverables:

- Approval request records.
- Human decision status.
- Approval timestamp.
- Approved action scope.
- Rejection/revision reason.
- Tests for every Level 3 blocked action.

Level 3 actions must stay blocked unless explicitly approved:

- Production deploys.
- Production code changes.
- Supabase RLS/security changes.
- Stripe product, price, checkout, or webhook changes.
- Refunds and discounts.
- API key rotation.
- Environment variable changes.
- Production AI prompt changes.
- Anthropic model setting changes.
- Scraping logic changes.
- Report storage changes.
- Saved report edits.
- Automatic report regeneration.
- Legal complaints.
- Data deletion requests.
- Security promises.
- Public apology statements.
- Public content.
- Legal/privacy/refund/security policy changes.
- Customer data deletion.
- Destructive scripts.

## Stage 7 - Monitoring and Review

Goal: keep the system useful without letting it become a bloated agent org.

Weekly review:

- Which messages were sent automatically?
- Which approvals were requested?
- Which Level 3 actions were blocked?
- Which customer issues repeated?
- Which report-quality issues repeated?
- Which revenue events need action?
- Which workflows should be simplified?

Expansion rule:

Do not add new agents until a repeated workflow is too large for the six-agent system and has clear revenue, support, quality, security, or operating value.

## Immediate Next Build Tasks

1. Turn the templates into reviewed message copy for Revenue & Billing and Customer Engagement.
2. Define a safe event classification schema in TypeScript without wiring live sends.
3. Add unit tests for event routing and approval gate enforcement.
4. Decide where draft-only logs should live before creating any database table.
5. Review AgentMail env var naming before adding placeholders to `.env.example`.

## Current Draft Implementation

### Classifier — `lib/agentOpsClassifier.ts`

Tests: `scripts/agent-ops-classifier.test.mjs` (8 tests, all passing).

Covers:

- Event type classification.
- P0/P1/P2/P3 risk assignment.
- Level 0/1/2/3 approval assignment.
- Routing to the six locked agents.
- Explicit blocked actions for Level 3 requests.
- Routine Level 1 AgentMail message allowance.

### Log Writer — `lib/agentOpsLogWriter.ts`

Status: complete (Stage 1 draft-only).

Tests: `scripts/agent-ops-log-writer.test.mjs` (20 tests, all passing).

Covers:

- Writes each `AgentOpsLog` as a single JSONL line to `.agent-ops/logs/YYYY-MM-DD.jsonl`.
- Creates the log directory automatically if it does not exist.
- Appends multiple writes to the same daily file; different days go to separate files.
- Applies a final `redactUnsafeValues` pass over the fully serialised JSON string before writing — catches any unsafe values set on the log object after the builder ran (defence in depth).
- Throws `ProductionWriteBlockedError` when `NODE_ENV === "production"` and writes no file.
- Exports `getLogFilePath(logDir, date)` for testable path resolution.
- `.agent-ops/logs/` is listed in `.gitignore` and is never committed.
- No Supabase, Stripe, AgentMail, fetch, or remote calls of any kind.

### Log Builder — `lib/agentOpsLogBuilder.ts`

Status: complete (Stage 1 draft-only).

Tests: `scripts/agent-ops-log-builder.test.mjs` (25 tests, all passing).

Covers:

- Builds a safe `AgentOpsLog` object from classifier output and optional references.
- Generates `task_id` in `ops_YYYYMMDD_shortid` format.
- Derives `customer_impact`, `revenue_impact`, `production_sensitivity` from event type, risk, and approval level when not provided by the caller.
- Builds `approval_request` with `required: true` and a blocking reason for Level 2 and Level 3.
- Builds `weekly_briefing` with `include`, `summary`, and `priority` from risk level.
- Initialises `messages_sent: []` — no messages sent at build time.
- Applies `redactUnsafeValues` to all free-text fields derived from event input and caller-supplied references.
- Exports `redactUnsafeValues` for independent use.

Redaction covers:

- `sk_live_*` / `sk_test_*` / `rk_live_*` / `rk_test_*` Stripe keys.
- `whsec_*` Stripe webhook signing secrets.
- `sk-ant-*` Anthropic API keys.
- Three-part base64url JWT tokens (Supabase service role, anon key, etc.).
- Bearer tokens.
- Named credential patterns: `api_key`, `token`, `password`, `secret`.
- ScraperAPI key patterns.
- AgentMail API key patterns.
- Credit card-like 16-digit numbers (with or without separators).
- Email addresses.
- Long base64-like strings (≥ 50 chars) as a catch-all for arbitrary secrets.

Does not send AgentMail, write logs, call external APIs, change environment variables, deploy, or modify Stripe, Supabase, Vercel, Anthropic, ScraperAPI, auth, billing, database, scraping, report storage, or production prompt behavior.

## Manual Approval Checklist Before Live Automation

Before any live automation ships, the human operator must approve:

- AgentMail domain/inbox setup.
- AgentMail environment variable names.
- Message templates.
- Logging location.
- Data retention rules.
- Which Level 1 messages may send automatically.
- Initial rollout scope.
- Rollback plan.
