# Routine Outbound Message Template

Use this for Level 1 routine communication that agents may send through AgentMail.

```text
Subject: [Clear customer-facing subject]

Hi [First name or "there"],

[Short acknowledgement of the issue or action.]

[One or two factual paragraphs using approved product facts only.]

[Clear next step, if any.]

Thanks,
[Agent/team name]
CompeteIQ
```

## Allowed Routine Message Types

- Standard customer replies.
- Basic onboarding replies.
- Routine troubleshooting guidance.
- Billing emails.
- Failed-payment emails.
- Checkout recovery emails.
- Upgrade nudges.
- Cancellation follow-up emails.
- Internal bug reports.
- Report-quality bug reports.

## Required Internal Log

```text
Sent by:
[Agent name]

Sent from:
[AgentMail inbox]

Message type:
[support / onboarding / troubleshooting / billing / failed_payment / checkout_recovery / upgrade_nudge / cancellation_follow_up / bug_report / report_quality_bug_report]

Approval basis:
Level 1 routine communication

Thread status:
sent
```

## Message Guardrails

- Do not promise refunds, discounts, legal outcomes, security outcomes, custom product changes, report regeneration, or data deletion.
- Do not include secrets, payment details, private credentials, or unnecessary personal data.
- Do not describe internal implementation details beyond what is needed for the customer.
- Do not send from any non-AgentMail channel.
