# Agent Workflow Specs

This folder contains implementation-ready workflow specs for the six locked CompeteIQ agents. These files are still documentation only; they do not authorize live AgentMail API calls, production deploys, credentials, or changes to Stripe, Supabase, Vercel, Anthropic, ScraperAPI, auth, billing, database, scraping, report storage, or production prompts.

## Workflow Index

- [Lead Operations Agent](./lead-operations-agent-workflow.md)
- [System Health & Security Agent](./system-health-security-agent-workflow.md)
- [Revenue & Billing Agent](./revenue-billing-agent-workflow.md)
- [Customer Engagement Agent](./customer-engagement-agent-workflow.md)
- [Report Quality Agent](./report-quality-agent-workflow.md)
- [Weekly Briefing Agent](./weekly-briefing-agent-workflow.md)

## Build Order

1. Lead Operations Agent: routing and approval gates.
2. Weekly Briefing Agent: low-risk summaries.
3. Revenue & Billing Agent: routine revenue recovery communication.
4. Customer Engagement Agent: routine support and onboarding.
5. Report Quality Agent: scoring and internal bug reports.
6. System Health & Security Agent: draft-heavy incident workflow with strict approval gates.

## Shared Dependencies

- [Agent Operations Templates](../templates/README.md)
- [Approval Gates](../approval-gates.md)
- [AgentMail Communication Layer](../agentmail-communication-layer.md)
- [Implementation Roadmap](../implementation-roadmap.md)
