# AgentMail Communication Layer

## No Gmail Rule

Gmail must not be used anywhere in the CompeteIQ Agent Operations System.

No Gmail inboxes, forwarding, support workflow, notifications, customer communication, billing communication, internal routing, weekly briefings, or agent-to-agent communication are allowed.

## AgentMail-Only Rule

AgentMail is the only approved communication layer for the agent system.

Use AgentMail for:

- Dedicated agent inboxes.
- Customer support communication.
- Billing communication.
- Failed-payment and checkout recovery emails.
- Upgrade nudges.
- Cancellation follow-up emails.
- Internal bug reports.
- Report-quality bug reports.
- Escalation workflows.
- Weekly briefings.
- Email thread search and audit trail.

## Inbox Mapping

Target branded inboxes:

| Agent | Target Inbox | Purpose |
| --- | --- | --- |
| Lead Operations Agent | lead-ops@mail.competeiq.com | Internal coordination, classification, routing, approval escalation. |
| System Health & Security Agent | security@mail.competeiq.com | Security warnings, incidents, deployment issues, technical alerts. |
| Revenue & Billing Agent | billing@mail.competeiq.com | Stripe, subscriptions, failed payments, checkout recovery, billing support. |
| Customer Engagement Agent | support@mail.competeiq.com | Support, onboarding, troubleshooting, customer education. |
| Report Quality Agent | reports@mail.competeiq.com | Report issues, output quality feedback, scrape/report bug routing. |
| Weekly Briefing Agent | briefings@mail.competeiq.com | Weekly summaries, operating reports, internal briefs. |

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready:

- lead-ops@agentmail.to
- security@agentmail.to
- billing@agentmail.to
- support@agentmail.to
- report-quality@agentmail.to
- briefings@agentmail.to

The target structure remains the branded CompeteIQ inbox setup.

## Customer, System, and Tool Event Flow

```text
Customer / System / Tool Event
        |
        v
AgentMail inbox
        |
        v
Lead Operations Agent or direct specialist intake
        |
        v
Classification: event type, customer impact, risk level, owner
        |
        v
Specialist workflow
        |
        v
Approval gate check
        |
        v
Routine send, internal bug report, approval request, or escalation
        |
        v
Thread logged for weekly briefing
```

## AgentMail Trigger Assumptions

The first automation version may assume AgentMail can trigger workflows from:

- New inbound email.
- Reply on an existing thread.
- Internal event email from CompeteIQ systems.
- Billing event email generated from Stripe summaries or future internal tooling.
- Report-quality event email generated from future report checks.
- Weekly scheduled briefing trigger.

Do not wire live AgentMail API calls until the human operator approves implementation and the repository has clear environment variable patterns for the integration.

## Thread Logging Expectation

Every operational thread should preserve:

- AgentMail thread ID.
- Event type.
- Assigned agent.
- Customer or account reference, if available and safe to store.
- Risk level.
- Current task status.
- Messages sent.
- Approval requests and decisions.
- Final outcome.
- Weekly briefing inclusion flag.

Do not log API keys, passwords, payment data, private credentials, or unnecessary personal data.

## Escalation Routing

- P0 security, payment, auth, production, or data risk routes to Lead Operations Agent and System Health & Security Agent.
- Billing disputes, refund requests, discounts, failed-payment patterns, and Stripe configuration concerns route to Revenue & Billing Agent and Lead Operations Agent.
- Sensitive customer complaints route to Customer Engagement Agent and Lead Operations Agent.
- Report failures, poor-quality output, scrape failures, and hallucination risk route to Report Quality Agent and System Health & Security Agent.
- Legal complaints, data deletion requests, public statements, and policy changes require human approval before response or action.

## Outbound Sending Rules

Agents may send Level 1 routine operational communication through AgentMail:

- Standard customer replies.
- Billing emails.
- Failed-payment emails.
- Checkout recovery emails.
- Upgrade nudges.
- Cancellation follow-up emails.
- Internal bug reports.
- Report-quality bug reports.

Outbound messages must:

- Be sent only from the mapped AgentMail inbox.
- Stay within approved product facts from the repository docs.
- Avoid secrets, payment details, and unnecessary personal data.
- Avoid legal, security, refund, discount, or policy promises.
- Include escalation notes when human approval is required.
