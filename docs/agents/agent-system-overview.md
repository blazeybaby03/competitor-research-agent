# Agent System Overview

## Product Context

CompeteIQ is an AI competitor research SaaS built with Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase auth/database, Stripe subscriptions, ScraperAPI website scraping, Anthropic Claude report generation, and Vercel deployment.

The core user flow is:

1. User signs up and confirms email.
2. User is redirected to `/dashboard`.
3. User enters business name, industry, and 1-5 competitor URLs.
4. CompeteIQ validates and scrapes competitor websites.
5. Claude generates an AI competitor intelligence report.
6. The report is saved and displayed.
7. User can upgrade through Stripe billing for the Pro plan.

Launch-critical paths are signup/login, business and competitor save, report generation, Stripe checkout, Stripe webhook handling, subscription state, trial-credit behavior, URL validation, and secret hygiene.

## Overall Event Intake Workflow

```text
Customer / System / Tool / Billing / Report Event
        |
        v
AgentMail inbox or internal event log
        |
        v
Lead Operations Agent classifies event, risk, and owner
        |
        v
Specialist agent investigates, logs, drafts, sends routine messages, or requests approval
        |
        v
Approval gate check
        |
        v
Allowed action, queued approval request, or escalation
        |
        v
Weekly Briefing Agent summarizes outcomes and next actions
```

## Event Routing Table

| Event | Primary Agent | Secondary Agent |
| --- | --- | --- |
| New signup | Customer Engagement Agent | Revenue & Billing Agent |
| Free report used | Revenue & Billing Agent | Customer Engagement Agent |
| Report generated | Report Quality Agent | Weekly Briefing Agent |
| Report failed | System Health & Security Agent | Report Quality Agent |
| Competitor URL validation issue | Report Quality Agent | System Health & Security Agent |
| ScraperAPI error | System Health & Security Agent | Report Quality Agent |
| Claude report-generation issue | System Health & Security Agent | Report Quality Agent |
| Supabase auth or database issue | System Health & Security Agent | Lead Operations Agent |
| Stripe checkout started | Revenue & Billing Agent | Weekly Briefing Agent |
| Stripe checkout abandoned | Revenue & Billing Agent | Customer Engagement Agent |
| Payment failed | Revenue & Billing Agent | Customer Engagement Agent |
| Subscription cancelled | Revenue & Billing Agent | Customer Engagement Agent |
| Customer support email | Customer Engagement Agent | Lead Operations Agent |
| Report quality feedback | Report Quality Agent | Customer Engagement Agent |
| Security warning | System Health & Security Agent | Lead Operations Agent |
| Deployment issue | System Health & Security Agent | Lead Operations Agent |
| Weekly summary due | Weekly Briefing Agent | Lead Operations Agent |
| Unclear or high-risk issue | Lead Operations Agent | Relevant specialist |

## Operating Priority Order

1. Security risk
2. Payment or revenue failure
3. Signup or login failure
4. Report-generation failure
5. Customer complaint
6. Report quality issue
7. Feature request
8. Growth or content task
9. General admin

## Standard Task Statuses

- `new`: event received but not classified.
- `triaged`: event classified with owner and risk level.
- `routed`: specialist agent assigned.
- `investigating`: agent is gathering context or logs.
- `drafted`: response, report, or action plan is prepared.
- `sent`: approved routine communication was sent through AgentMail.
- `approval_needed`: human decision is required before action.
- `approved`: human approval received.
- `blocked`: action cannot proceed without external input.
- `done`: task completed and logged.
- `briefed`: included in the weekly briefing.

## Weekly Briefing Loop

1. Each agent logs completed tasks, unresolved risks, approval requests, and notable patterns.
2. Weekly Briefing Agent gathers revenue, signup, support, report quality, system health, and incident summaries.
3. Weekly Briefing Agent sends the internal weekly brief through the `briefings@mail.competeiq.com` AgentMail inbox.
4. Lead Operations Agent reviews open P0/P1 risks and approval requests.
5. Next-week priorities are set in plain language with no more than three main actions.

## Deferred Future Agents

These agents are future expansion only and must not be added to the starting system yet:

- Growth & Lead Capture Agent
- Product & Backlog Agent
- Legal & Compliance Agent
- Data Analytics Agent
- Content Repurposing Agent
- QA Regression Agent
- Partnerships Agent

The first version should stay compact until the core product, support, report quality, and billing workflows are stable.

## Implementation Notes

This overview defines the operating model only. It does not authorize live AgentMail API wiring, new credentials, production changes, deployment, prompt changes, billing changes, database changes, or scraping/report-generation logic changes.
