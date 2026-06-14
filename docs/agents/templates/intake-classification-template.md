# Intake Classification Template

Use this when Lead Operations Agent receives or reviews a new event.

```text
Subject: [CompeteIQ Ops][INTAKE][P0/P1/P2/P3] [Short event title]

Event summary:
[One sentence describing what happened.]

Source:
[AgentMail inbox / system summary / billing summary / report event / weekly briefing]

Source reference:
[AgentMail thread ID, safe internal reference, or "not available"]

Event type:
[customer_support / billing / report_quality / system_health / security / legal_data_policy / weekly_briefing / unclear]

Customer impact:
[none / single_customer / multiple_customers / unknown]

Revenue impact:
[none / possible / confirmed / unknown]

Production sensitivity:
[none / low / medium / high]

Risk level:
[P0 / P1 / P2 / P3]

Approval level:
[Level 0 / Level 1 / Level 2 / Level 3]

Primary agent:
[One of the six locked agents]

Secondary agent:
[Optional secondary agent or none]

Current status:
triaged

Allowed next action:
[Log / route / draft / send routine message / request approval / escalate]

Blocked action:
[Any action blocked until approval, or none]

Weekly briefing:
[include critical / include high / include normal / do not include]
```

## Classification Checklist

- Does the issue touch security, data, secrets, auth, Stripe, Supabase RLS, production config, prompts, scraping, report storage, or customer data deletion?
- Does the issue affect the revenue path: trial, checkout, subscription, payment, cancellation, or upgrade?
- Does the issue affect signup, login, dashboard access, business save, report generation, or report display?
- Is the next action routine communication, or does it require a non-routine promise or production change?
- Is this a one-off P3 issue or a repeated pattern that should be promoted to P2/P1?
