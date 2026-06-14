# P0 Incident Escalation Template

Use this when an issue could affect security, customer data, auth, production uptime, Stripe checkout, Stripe webhooks, subscription state, exposed keys, or repeated report-generation failures.

```text
P0 Incident Escalation

Issue:
[What is broken or at risk]

First detected:
[Timestamp or "unknown"]

Detected by:
[Agent / AgentMail thread / system source]

Affected systems:
[Stripe / Supabase / Vercel / ScraperAPI / Anthropic / AgentMail / app route / unknown]

Customer impact:
[none / single_customer / multiple_customers / unknown]

Revenue impact:
[none / possible / confirmed / unknown]

Security or data impact:
[none / possible / confirmed / unknown]

Current evidence:
[Safe summary only. No secrets, tokens, full logs, full payment data, or unnecessary personal data.]

Actions already taken:
[Log / route / notify / draft / none]

Blocked action:
[What cannot proceed without human approval]

Recommended immediate next step:
[Smallest safe diagnostic or action]

Approval needed:
[Yes/no and why]

Weekly briefing:
include critical
```

## P0 Rules

- Do not deploy.
- Do not rotate keys.
- Do not change environment variables.
- Do not change Stripe webhooks, products, prices, or subscriptions.
- Do not change Supabase RLS, auth, service-role behavior, or database policy.
- Do not send security promises or public statements.
- Do not delete or edit customer data.
- Do not run destructive scripts.
