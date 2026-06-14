# Agent Operations Templates

These templates standardize how CompeteIQ agents classify, route, escalate, send routine communication, and hand work into the weekly briefing.

Use these templates before building live automation. They are designed for AgentMail-only workflows and must not introduce credentials, production configuration changes, deployment actions, or changes to Stripe, Supabase, Vercel, Anthropic, ScraperAPI, billing, auth, database, scraping, report storage, or production prompt logic.

## Template Index

- [Intake Classification](./intake-classification-template.md)
- [Specialist Handoff](./specialist-handoff-template.md)
- [Human Approval Request](./human-approval-request-template.md)
- [P0 Incident Escalation](./p0-incident-escalation-template.md)
- [Routine Outbound Message](./routine-outbound-message-template.md)
- [Weekly Briefing Handoff](./weekly-briefing-handoff-template.md)

## Usage Rules

- Use AgentMail only.
- Keep messages factual and based on repository documentation or approved operational facts.
- Do not include secrets, tokens, private credentials, full payment details, or unnecessary personal data.
- Keep Level 1 routine messages narrow: support replies, billing emails, failed-payment emails, checkout recovery emails, upgrade nudges, cancellation follow-ups, internal bug reports, and report-quality bug reports.
- Use the approval request template for all Level 2 and Level 3 actions.
- Use the P0 incident escalation template for security, data, auth, payment, webhook, production outage, exposed key, or repeated report-generation failures.
