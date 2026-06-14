# CompeteIQ Agent Operations System

This folder is the source of truth for the first version of the CompeteIQ Agent Operations System. It defines the starting AI agent team, AgentMail communication layer, event routing, approval gates, and operating workflows that can later be converted into real automations.

CompeteIQ is an AI competitor research SaaS. Users sign up, enter a business name, industry, and 1-5 competitor URLs, then CompeteIQ scrapes those sites, generates a Claude-powered competitor intelligence report, saves it, and supports upgrades through Stripe billing.

## Locked Starting Team

Only these six agents are in scope for the first version:

1. Lead Operations Agent
2. System Health & Security Agent
3. Revenue & Billing Agent
4. Customer Engagement Agent
5. Report Quality Agent
6. Weekly Briefing Agent

Do not add extra agents until the core launch, revenue, support, and report-quality workflows are stable.

## Communication Rule

Gmail must not be used for anything in this system.

Do not use Gmail inboxes, Gmail forwarding, Gmail-based support workflows, Gmail-based notifications, or Gmail-based agent communication. AgentMail is the only approved communication layer.

Target branded AgentMail inboxes:

- lead-ops@mail.competeiq.com
- security@mail.competeiq.com
- billing@mail.competeiq.com
- support@mail.competeiq.com
- reports@mail.competeiq.com
- briefings@mail.competeiq.com

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready. The target state is the branded CompeteIQ inbox setup above.

## High-Level Workflow

1. A customer, system, billing, report, or tool event arrives through AgentMail or an internal event source.
2. Lead Operations Agent classifies the event, assigns a risk level, and routes it to the correct specialist agent.
3. The specialist agent investigates, logs, drafts, sends approved routine communication, or prepares an approval request.
4. Approval gates determine whether the action can run automatically, be sent as routine communication, or must wait for human approval.
5. Weekly Briefing Agent summarizes activity, risks, metrics, and next actions.

## Documentation Map

- [Agent System Overview](./agent-system-overview.md)
- [Approval Gates](./approval-gates.md)
- [AgentMail Communication Layer](./agentmail-communication-layer.md)
- [Implementation Roadmap](./implementation-roadmap.md)
- [Agent Operations Templates](./templates/README.md)
- [Lead Operations Workflow Spec](./workflows/lead-operations-agent-workflow.md)
- [System Health & Security Workflow Spec](./workflows/system-health-security-agent-workflow.md)
- [Revenue & Billing Workflow Spec](./workflows/revenue-billing-agent-workflow.md)
- [Customer Engagement Workflow Spec](./workflows/customer-engagement-agent-workflow.md)
- [Report Quality Workflow Spec](./workflows/report-quality-agent-workflow.md)
- [Weekly Briefing Workflow Spec](./workflows/weekly-briefing-agent-workflow.md)
- [Lead Operations Agent](./roles/lead-operations-agent.md)
- [System Health & Security Agent](./roles/system-health-security-agent.md)
- [Revenue & Billing Agent](./roles/revenue-billing-agent.md)
- [Customer Engagement Agent](./roles/customer-engagement-agent.md)
- [Report Quality Agent](./roles/report-quality-agent.md)
- [Weekly Briefing Agent](./roles/weekly-briefing-agent.md)

## Implementation Notes

This is documentation and workflow foundation only. Do not wire live AgentMail API calls yet unless the repository has clear environment variable patterns and the human operator explicitly approves implementation.

Do not add secrets, create live credentials, deploy, or alter production-sensitive files. Do not change Stripe, Supabase, Vercel, Anthropic, ScraperAPI, billing, auth, database, scraping, report storage, or production AI prompt configuration as part of this documentation layer.
