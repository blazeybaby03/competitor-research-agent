# Weekly Briefing Agent Workflow Spec

This workflow defines how the Weekly Briefing Agent produces CompeteIQ operating summaries across revenue, users, support, report quality, system health, risks, approvals, and next actions.

This is documentation only. Do not wire live AgentMail API calls, publish public content, change KPI definitions, change policies, deploy, or alter production systems from this spec.

## Workflow Objective

Give the human operator a concise weekly operating picture with the fewest useful numbers, unresolved risks, approval requests, and next actions.

## Primary Inbox

- `briefings@mail.competeiq.com`

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready.

## Intake Triggers

| Trigger | Default risk | Approval default |
| --- | --- | --- |
| Weekly scheduled summary | P2 | Level 0 |
| Lead Operations requests current operating picture | P2 | Level 0 |
| P0/P1 incident rollup needed | P1 | Level 0 summary, Level 3 for action |
| Open approval requests need review | P1/P2 | Level 0 summary |
| KPI definition change requested | P2 | Level 2 |
| Public content or policy update requested | P1/P2 | Level 3 |

## Inputs

- Lead Operations task log.
- Specialist weekly handoffs.
- Revenue and billing summaries.
- Signup and trial summaries.
- Support and objection summaries.
- Report quality summaries.
- System health and incident summaries.
- Open approval requests.
- Blocked tasks.

## Weekly Brief Format

```text
Subject: [CompeteIQ Weekly Brief][YYYY-MM-DD] Operating Summary

1. Top Summary
[Three bullets max.]

2. Revenue
[Subscriptions, failed payments, checkout recovery, cancellations, upgrade nudges.]

3. Users and Activation
[Signups, trial usage, first-report movement, onboarding friction.]

4. Support
[Common questions, complaints, objections, unresolved threads.]

5. Report Quality
[Reports generated, quality issues, failed outputs, prompt recommendations needing approval.]

6. System Health and Security
[Incidents, auth, Stripe webhook, Supabase, Vercel, ScraperAPI, Anthropic, secret hygiene.]

7. Open Approvals
[Approval requests with risk level and exact decision needed.]

8. Next Three Priorities
[No more than three practical actions.]
```

## Triage Workflow

1. Collect handoffs from all agents.
2. Group items into revenue, users, support, report quality, system health, approvals, and next actions.
3. Promote P0/P1 items to the top summary.
4. Keep one-off P3 noise out unless repeated.
5. Draft weekly brief.
6. Send the internal weekly brief through AgentMail.
7. Return unresolved P0/P1 risks and approvals to Lead Operations Agent.

## Allowed Actions

Level 0:

- Summarize agent logs.
- Summarize weekly metrics.
- List open approvals.
- Recommend next priorities.
- Send internal weekly brief through AgentMail.

## Blocked Actions

Human approval is required before:

- Publishing public content.
- Updating public policies, legal pages, refund language, privacy language, or security language.
- Changing KPI definitions.
- Triggering production changes from briefing recommendations.
- Sending public statements.
- Making legal, security, refund, discount, or product commitments.

## Log Fields

Minimum safe log fields:

- `briefing_id`
- `week_start`
- `week_end`
- `agentmail_thread_id`
- `revenue_summary`
- `activation_summary`
- `support_summary`
- `report_quality_summary`
- `system_health_summary`
- `open_approval_count`
- `p0_count`
- `p1_count`
- `next_priorities`
- `sent_at`

## Quality Standard

A useful weekly brief should:

- Fit on one screen where possible.
- Lead with P0/P1 risks and revenue blockers.
- List exact approval decisions needed.
- Avoid vague strategy language.
- End with no more than three next actions.

## First Automation Checklist

1. Define the weekly schedule.
2. Standardize agent handoff fields.
3. Build a draft-only weekly brief generator.
4. Add tests that public content, policies, KPI changes, and production actions require approval.
5. Enable internal AgentMail sending only after the brief template is approved.
