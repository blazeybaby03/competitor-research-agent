# Approval Gates

Approval gates keep the agent system useful without letting automation change launch-critical production behavior.

## Level 0 - Fully Automatic

Agents may complete these actions without human approval:

- Log events.
- Classify events.
- Summarize issues.
- Score reports.
- Track failed payments.
- Track signups.
- Track cancellations.
- Add items to the weekly briefing.
- Draft internal summaries.
- Draft bug reports.
- Draft report-quality notes.
- Route tasks to the correct specialist agent.

## Level 1 - Draft + Send for Approved Routine Communication

Agents may draft and send these routine messages through AgentMail without manual approval:

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

Level 1 messages must stay factual, concise, and limited to existing product behavior. They must not promise security outcomes, refunds, discounts, legal positions, or product changes.

## Level 2 - Approval Required

Agents need human approval before:

- Updating public help documentation.
- Recommending onboarding flow changes.
- Creating product-direction issues intended for implementation.
- Sending sensitive complaint responses.
- Sending non-routine customer communications.
- Changing weekly KPI definitions.
- Changing support documentation used publicly.
- Making recommendations that affect pricing, refunds, legal terms, security promises, or customer data handling.

## Level 3 - Hard Approval Required

Agents must never act without explicit human approval before:

- Deploying to production.
- Changing production code.
- Changing Supabase RLS or security settings.
- Changing Stripe pricing, products, or webhooks.
- Issuing refunds.
- Offering discounts.
- Rotating API keys.
- Changing environment variables.
- Changing production AI prompts.
- Changing Claude or Anthropic model settings.
- Changing scraping logic.
- Changing report storage logic.
- Editing saved customer reports.
- Automatically regenerating customer reports.
- Handling legal complaints.
- Handling data deletion requests.
- Sending security promises.
- Sending public apology statements.
- Publishing public content.
- Updating legal, privacy, refund, or security policies.
- Deleting customer data.
- Running destructive scripts.

## Risk Levels

| Risk | Meaning | Examples |
| --- | --- | --- |
| P0 | Critical. Immediate human review required. | Stripe checkout broken, webhook failing, Supabase auth broken, exposed key risk, production app down, user data security risk, repeated report failures, live payment issue. |
| P1 | High. Must be reviewed before risky action. | Payment failure pattern, cancellation pattern, customer complaint, unusable report, signup friction, deployment warning, ScraperAPI failure pattern. |
| P2 | Medium. Can be drafted and queued. | Help doc improvement, upgrade email improvement, report formatting issue, feature request, minor support confusion, churn-risk review. |
| P3 | Low. Log only unless repeated. | One-off user confusion, minor UI copy issue, low-priority content idea, non-critical dashboard improvement, future feature idea. |

## Human Approval Request Format

Use this exact format for approval requests:

```text
Approval Request

Agent:
[Agent name]

Issue:
[What happened]

Recommended action:
[What the agent wants to do]

Risk level:
[P0 / P1 / P2 / P3]

Why approval is needed:
[Reason]

Approve / reject / revise:
[Decision needed]
```

## Absolute No-Go Actions

Agents must not:

- Use or route through any non-AgentMail communication layer.
- Add secrets or expose secret values in logs, docs, messages, issues, or reports.
- Bypass Stripe price allowlisting or webhook signature verification.
- Weaken Supabase RLS, auth protections, service-role isolation, or trial-credit controls.
- Remove server-side competitor URL validation or SSRF protections.
- Store empty or malformed completed reports.
- Modify production-sensitive configuration without approval.
- Delete customer data without explicit human approval and a documented legal/data request process.
- Run destructive scripts without explicit human approval.
