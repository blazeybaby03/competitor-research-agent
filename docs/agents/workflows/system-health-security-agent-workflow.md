# System Health & Security Agent Workflow Spec

This workflow defines how the System Health & Security Agent investigates CompeteIQ technical and security events without making production-sensitive changes automatically.

This is documentation only. Do not wire live API calls, create credentials, deploy, change environment variables, rotate keys, or alter Stripe, Supabase, Vercel, Anthropic, ScraperAPI, auth, database, RLS, scraping, report storage, or prompt logic from this spec.

## Workflow Objective

Protect CompeteIQ launch stability across auth, database safety, Stripe webhooks, report generation, scraping, AI output, deployment health, and secret hygiene.

## Primary Inbox

- `security@mail.competeiq.com`

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready.

## Intake Triggers

| Trigger | Default risk | Approval default |
| --- | --- | --- |
| Production app down or repeated runtime failures | P0 | Level 3 for fixes |
| Stripe webhook failure or subscription sync risk | P0 | Level 3 |
| Supabase auth, database, RLS, or service-role concern | P0 | Level 3 |
| Possible secret exposure or unsafe credential handling | P0 | Level 3 |
| Signup, login, dashboard, or auth redirect issue | P1 | Level 2 or Level 3 |
| Report-generation failure pattern | P1 | Level 2 or Level 3 |
| ScraperAPI or Anthropic error pattern | P1 | Level 2 or Level 3 |
| Vercel build or deployment warning | P1 | Level 2 or Level 3 |
| One-off technical warning with no customer impact | P3 | Level 0 |

## Inputs

- AgentMail incident thread.
- Safe log summary from Vercel, Supabase, Stripe, ScraperAPI, or Anthropic.
- Route or feature affected.
- Customer or account reference when safe.
- Environment variable checklist names only, never values.
- Current deployment/build status.
- Related report or billing event summary.

## Triage Workflow

1. Classify the issue as `uptime`, `auth`, `database`, `rls`, `stripe_webhook`, `scraping`, `ai_generation`, `deployment`, `secret_hygiene`, or `unknown`.
2. Assign P0/P1/P2/P3 based on customer, revenue, data, and production impact.
3. Collect safe evidence without exposing secrets, tokens, full payment data, or unnecessary personal data.
4. Identify the smallest safe diagnostic action.
5. Determine whether the next action is Level 0, Level 1, Level 2, or Level 3.
6. Draft an incident summary, bug report, or approval request.
7. Return findings to Lead Operations Agent and hand material issues to Weekly Briefing Agent.

## Allowed Actions

Level 0:

- Log incident summaries.
- Summarize safe logs.
- Classify risk.
- Draft internal bug reports.
- Draft diagnostic plans.
- Route report-quality symptoms to Report Quality Agent.
- Route billing impact to Revenue & Billing Agent.

Level 1:

- Send internal bug reports through AgentMail.
- Send routine technical status updates internally through AgentMail when they do not promise security outcomes or production fixes.

## Blocked Actions

Human approval is required before:

- Deploying to production.
- Changing production code.
- Changing Supabase RLS, auth, service-role behavior, migrations, or database policy.
- Changing Stripe webhook behavior or billing configuration.
- Changing environment variables or rotating keys.
- Changing Anthropic model settings, prompts, scraping logic, or report storage.
- Sending security promises, public incident statements, or policy updates.
- Deleting or editing customer data.
- Running destructive scripts.

## AgentMail Outputs

Use:

- [Specialist Handoff](../templates/specialist-handoff-template.md)
- [P0 Incident Escalation](../templates/p0-incident-escalation-template.md)
- [Human Approval Request](../templates/human-approval-request-template.md)
- [Weekly Briefing Handoff](../templates/weekly-briefing-handoff-template.md)

## Log Fields

Minimum safe log fields:

- `task_id`
- `agentmail_thread_id`
- `issue_type`
- `affected_system`
- `affected_route`
- `risk_level`
- `approval_level`
- `customer_impact`
- `revenue_impact`
- `security_or_data_impact`
- `safe_evidence_summary`
- `suspected_root_cause`
- `blocked_actions`
- `recommended_next_step`
- `weekly_briefing.include`

## Weekly Briefing Handoff

Include all P0/P1 incidents and repeated P2 technical patterns.

Briefing summary should include:

- Affected system.
- Customer or revenue impact.
- Current status.
- Approval needed.
- Next diagnostic or fix recommendation.

## First Automation Checklist

1. Build a local-only classifier for incident event types.
2. Add redaction rules before any log summary is stored.
3. Add tests that secrets, tokens, and full payment data are not logged.
4. Add approval-gate tests for RLS, env vars, keys, deployments, webhooks, prompts, scraping, and report storage.
5. Start with draft-only incident summaries before any automatic sends.
