# Lead Operations Agent Workflow Spec

This is the first operational workflow spec for the Lead Operations Agent. It turns the role definition into an implementation-ready process for intake, triage, routing, approval enforcement, logging, escalation, and weekly briefing handoff.

This is documentation only. Do not wire live AgentMail API calls, create credentials, change production configuration, deploy, or alter Stripe, Supabase, Vercel, Anthropic, ScraperAPI, report-generation, scraping, billing, auth, database, or production prompt logic from this spec.

## Workflow Objective

The Lead Operations Agent is the router and control point for CompeteIQ operations. Its job is to keep low-risk work moving quickly while blocking high-risk production, billing, legal, security, data, and configuration actions until the human operator approves them.

The workflow optimizes for:

- Fast classification of operational events.
- Clear ownership by one of the six locked agents.
- AgentMail-only communication.
- Strict approval gate enforcement.
- Low manual overhead for routine support, billing, upgrade, and bug-report communication.
- Clean weekly briefing handoff.

## Scope

In scope:

- Intake triggers.
- Routing rules.
- AgentMail thread patterns.
- Escalation formats.
- Log schema.
- Weekly briefing handoff.
- Approval gate enforcement.

Out of scope:

- Live AgentMail API calls.
- New credentials or secrets.
- Production deployments.
- Stripe, Supabase, Vercel, Anthropic, ScraperAPI, auth, billing, database, scraping, report storage, or prompt changes.
- New agents beyond the locked six-agent team.

## Operating Inboxes

Target branded AgentMail inboxes:

| Function | AgentMail inbox |
| --- | --- |
| Lead operations intake and routing | lead-ops@mail.competeiq.com |
| System health and security | security@mail.competeiq.com |
| Revenue and billing | billing@mail.competeiq.com |
| Customer engagement | support@mail.competeiq.com |
| Report quality | reports@mail.competeiq.com |
| Weekly briefing | briefings@mail.competeiq.com |

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready. The target operating model remains the branded CompeteIQ inbox structure.

## Intake Triggers

Lead Operations Agent should run when any of these events arrive:

| Trigger | Source | Initial status | Default risk |
| --- | --- | --- | --- |
| Unknown operational email | AgentMail lead-ops inbox | `new` | P2 |
| Customer support thread with unclear owner | AgentMail support inbox | `new` | P2 |
| Billing thread with dispute, refund, discount, or Stripe config request | AgentMail billing inbox | `new` | P1 |
| Failed payment pattern | Stripe summary or billing inbox | `new` | P1 |
| Checkout failure or webhook issue | Stripe summary, logs, or billing inbox | `new` | P0 |
| Signup, login, or dashboard access issue | Support thread, Vercel, or Supabase context | `new` | P1 |
| Supabase auth, database, RLS, or service-role concern | System alert or security inbox | `new` | P0 |
| Report generation failure pattern | Report event, support thread, or system logs | `new` | P1 |
| Poor report quality complaint | Reports or support inbox | `new` | P2 |
| Secret exposure or suspicious credential handling | Security inbox or repo/log alert | `new` | P0 |
| Deployment or build issue | Vercel, Codex, or GitHub context | `new` | P1 |
| Legal complaint, data deletion request, policy request, or public statement issue | Any inbox | `new` | P0 |
| Weekly briefing risk needing follow-up | Briefings inbox | `new` | P1 |

## Intake Classification

For every incoming event, Lead Operations Agent must classify:

- `event_type`: one of `customer_support`, `billing`, `report_quality`, `system_health`, `security`, `legal_data_policy`, `weekly_briefing`, or `unclear`.
- `customer_impact`: one of `none`, `single_customer`, `multiple_customers`, or `unknown`.
- `revenue_impact`: one of `none`, `possible`, `confirmed`, or `unknown`.
- `production_sensitivity`: one of `none`, `low`, `medium`, or `high`.
- `risk_level`: one of `P0`, `P1`, `P2`, or `P3`.
- `approval_level`: one of `Level 0`, `Level 1`, `Level 2`, or `Level 3`.
- `primary_agent`: one of the six locked agents.
- `secondary_agent`: optional second agent.
- `next_status`: one of the standard task statuses.

Use the highest relevant risk. For example, a routine support question is P3/P2, but a support question involving data deletion is P0 because the data action controls the risk.

## Routing Rules

| Event pattern | Primary route | Secondary route | Approval default |
| --- | --- | --- | --- |
| General support, onboarding, product usage, routine troubleshooting | Customer Engagement Agent | Lead Operations Agent if unclear | Level 1 if routine |
| Billing question, failed payment, checkout recovery, upgrade nudge, cancellation follow-up | Revenue & Billing Agent | Customer Engagement Agent | Level 1 if routine |
| Refund, discount, dispute, Stripe product, price, checkout, or webhook change | Revenue & Billing Agent | Lead Operations Agent | Level 3 |
| Signup, login, dashboard, Vercel, Supabase, Stripe webhook, ScraperAPI, or Anthropic issue | System Health & Security Agent | Lead Operations Agent | Level 2 or Level 3 |
| Supabase RLS, auth security, service role, env var, secret, or key rotation issue | System Health & Security Agent | Lead Operations Agent | Level 3 |
| Report generated, thin report, poor output, formatting issue, hallucination risk, scrape quality issue | Report Quality Agent | System Health & Security Agent if repeated | Level 0 or Level 2 |
| Prompt, model, scraping, report storage, saved report edit, or auto-regeneration request | Report Quality Agent | Lead Operations Agent | Level 3 |
| Weekly operating summary, KPI rollup, open risk review | Weekly Briefing Agent | Lead Operations Agent | Level 0 unless KPI definitions change |
| Legal complaint, data deletion request, policy update, public apology, public content | Lead Operations Agent | Relevant specialist | Level 3 |

## AgentMail Thread Patterns

All operational messages must stay inside AgentMail.

### Intake Thread

Use this pattern for initial classification:

```text
Subject: [CompeteIQ Ops][INTAKE][P1] Short event title

Event:
[One-sentence event summary]

Source:
[AgentMail thread / system alert / billing summary / report event]

Current owner:
Lead Operations Agent

Proposed route:
[Agent name and inbox]

Approval level:
[Level 0 / Level 1 / Level 2 / Level 3]

Next status:
[triaged / routed / approval_needed / blocked]
```

### Specialist Handoff Thread

Use this pattern when routing to another agent:

```text
Subject: [CompeteIQ Ops][ROUTE][P1][Billing] Short event title

Assigned agent:
[Specialist agent]

AgentMail inbox:
[Mapped inbox]

Issue:
[What happened]

Known context:
[Safe context only, no secrets or sensitive payment data]

Required action:
[Investigate / reply / draft / send routine message / prepare approval request]

Approval gate:
[Allowed automatic action or approval required]

Return to Lead Ops when:
[Condition]
```

### Routine Send Thread

Use this pattern when Level 1 routine communication is allowed:

```text
Subject: [CompeteIQ Ops][SENT][P2] Short event title

Sent by:
[Agent name]

Sent from:
[AgentMail inbox]

Message type:
[standard support / billing / failed payment / checkout recovery / upgrade nudge / cancellation follow-up / bug report]

Approval basis:
Level 1 routine communication

Log status:
sent
```

## Approval Gate Enforcement

Lead Operations Agent must apply this decision path before every action:

1. Does the action only log, classify, summarize, score, route, or draft internally?
   - If yes, use Level 0 and proceed.
2. Is the action a routine approved support, billing, failed-payment, checkout recovery, upgrade, cancellation, or bug-report message through AgentMail?
   - If yes, use Level 1 and allow send.
3. Does the action affect public docs, non-routine customer communication, product direction, support docs, KPI definitions, or sensitive complaints?
   - If yes, use Level 2 and request human approval.
4. Does the action touch production code, deployment, Stripe configuration, Supabase RLS/security, env vars, keys, prompts, model settings, scraping logic, report storage, saved reports, legal/data requests, public statements, policies, customer data deletion, refunds, discounts, or destructive scripts?
   - If yes, use Level 3 and block until explicit human approval.

When uncertain, escalate one level higher.

## Escalation Formats

### Human Approval Request

```text
Approval Request

Agent:
Lead Operations Agent

Issue:
[What happened]

Recommended action:
[What the agent wants to do]

Risk level:
[P0 / P1 / P2 / P3]

Why approval is needed:
[Specific approval gate]

Approve / reject / revise:
[Decision needed]
```

### P0 Incident Escalation

```text
P0 Incident Escalation

Issue:
[What is broken or at risk]

Customer/revenue/security impact:
[Known impact or unknown]

Affected systems:
[Stripe / Supabase / Vercel / ScraperAPI / Anthropic / AgentMail / app route]

Current evidence:
[Safe log summary, no secrets]

Blocked action:
[What cannot proceed without approval]

Recommended immediate next step:
[Smallest safe diagnostic or action]
```

### Specialist Return Handoff

```text
Specialist Return Handoff

Agent:
[Specialist agent]

Task status:
[done / blocked / approval_needed / investigating]

Findings:
[Short summary]

Customer impact:
[none / single_customer / multiple_customers / unknown]

Recommended next action:
[Action]

Weekly briefing note:
[Yes/no and summary]
```

## Log Schema

Use this JSON shape for future implementation. Store only safe operational data.

```json
{
  "task_id": "ops_YYYYMMDD_shortid",
  "created_at": "2026-06-04T00:00:00Z",
  "updated_at": "2026-06-04T00:00:00Z",
  "agentmail_thread_id": "thread_placeholder",
  "source": "agentmail",
  "source_reference": "safe_reference_only",
  "event_type": "billing",
  "event_summary": "Checkout recovery needed for abandoned checkout.",
  "customer_reference": "safe_customer_or_account_reference",
  "customer_impact": "single_customer",
  "revenue_impact": "possible",
  "production_sensitivity": "low",
  "risk_level": "P2",
  "approval_level": "Level 1",
  "primary_agent": "Revenue & Billing Agent",
  "secondary_agent": "Customer Engagement Agent",
  "status": "routed",
  "allowed_actions": [
    "send_checkout_recovery_email"
  ],
  "blocked_actions": [
    "offer_discount_without_approval"
  ],
  "approval_request": {
    "required": false,
    "reason": null,
    "requested_at": null,
    "decision": null,
    "decided_at": null
  },
  "messages_sent": [
    {
      "sent_at": "2026-06-04T00:00:00Z",
      "from_inbox": "billing@mail.competeiq.com",
      "message_type": "checkout_recovery",
      "agent": "Revenue & Billing Agent"
    }
  ],
  "weekly_briefing": {
    "include": true,
    "summary": "One checkout recovery email sent.",
    "priority": "normal"
  },
  "final_outcome": null
}
```

Do not store API keys, tokens, passwords, private credentials, full payment data, unnecessary personal data, or raw logs containing sensitive values.

## Status Transitions

```text
new
  -> triaged
  -> routed
  -> investigating
  -> drafted
  -> sent
  -> done
  -> briefed
```

Alternative branches:

```text
triaged -> approval_needed -> approved -> routed
triaged -> approval_needed -> blocked
investigating -> approval_needed
investigating -> blocked
done -> briefed
```

Do not mark a task `done` until the event is answered, routed, blocked with a clear reason, or escalated with the required approval request.

## Weekly Briefing Handoff

Every routed or escalated task should include a weekly briefing decision:

| Include in weekly brief? | Use when |
| --- | --- |
| Yes, priority `critical` | P0 incident, security risk, live payment issue, production outage, data issue. |
| Yes, priority `high` | P1 pattern, unresolved customer complaint, repeated report failure, checkout issue. |
| Yes, priority `normal` | Routine billing movement, support pattern, report-quality note, completed operational task. |
| No | One-off P3 event with no pattern and no action needed. |

Weekly handoff format:

```text
Weekly Briefing Handoff

Task:
[Task ID or thread reference]

Risk:
[P0 / P1 / P2 / P3]

Area:
[Security / Revenue / Auth / Reports / Support / Quality / Admin]

Summary:
[One or two sentences]

Decision needed:
[None or exact human decision]

Recommended next priority:
[Keep / escalate / close / monitor]
```

## Example Workflows

### Checkout Recovery

1. Event arrives from billing summary: checkout started but no subscription created.
2. Lead Operations classifies as `billing`, P2, Level 1.
3. Route to Revenue & Billing Agent at `billing@mail.competeiq.com`.
4. Revenue & Billing Agent sends approved checkout recovery email through AgentMail.
5. Log status as `sent`.
6. Include in weekly brief as normal revenue movement.

### Stripe Webhook Failure

1. Event arrives from system alert or billing issue.
2. Lead Operations classifies as `billing` plus `system_health`, P0, Level 3.
3. Route to System Health & Security Agent and Revenue & Billing Agent.
4. Block any webhook configuration change until human approval.
5. Send P0 incident escalation to human operator.
6. Include in weekly brief as critical.

### Report Quality Complaint

1. Customer says the report is thin or not useful.
2. Lead Operations classifies as `report_quality`, P2, Level 1 for acknowledgement.
3. Route to Customer Engagement Agent for routine support reply and Report Quality Agent for review.
4. Block saved report edits, automatic regeneration, prompt changes, model changes, scraping changes, or storage changes without approval.
5. Log quality finding and include in weekly brief if repeated or customer-impacting.

### Data Deletion Request

1. Customer requests deletion of data.
2. Lead Operations classifies as `legal_data_policy`, P0, Level 3.
3. Do not delete data automatically.
4. Do not send policy commitments without approval.
5. Send human approval request with the exact request, affected account reference, and recommended next step.
6. Include in weekly brief as critical until resolved.

## First Implementation Checklist

When the human operator approves live implementation later, build the smallest safe version first:

1. Define allowed AgentMail env var names in `.env.example` with placeholders only.
2. Create a local-only parser for AgentMail event payloads.
3. Implement the log schema in a non-production storage location or approved database table.
4. Add routing outputs as draft messages first.
5. Enable Level 0 logging and classification before any outbound sends.
6. Enable Level 1 routine sends only after templates are reviewed.
7. Keep all Level 2 and Level 3 actions blocked behind explicit human approval.
8. Add tests for classification, routing, approval gates, and no-secret logging.

## Next Recommended Task

Create the first Lead Operations templates:

- Intake classification template.
- Specialist handoff template.
- Human approval request template.
- Weekly briefing handoff template.
- P0 incident escalation template.
