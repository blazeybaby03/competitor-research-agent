# Customer Engagement Agent Workflow Spec

This workflow defines how the Customer Engagement Agent handles onboarding, routine support, troubleshooting, objections, and activation messaging through AgentMail.

This is documentation only. Do not wire live AgentMail API calls, edit customer data, edit saved reports, deploy, update public docs, or change billing, auth, database, report-generation, prompt, scraping, or storage logic from this spec.

## Workflow Objective

Reduce friction from signup to first report to upgrade by answering routine customer questions quickly while escalating sensitive, legal, billing, security, data, and non-routine issues.

## Primary Inbox

- `support@mail.competeiq.com`

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready.

## Intake Triggers

| Trigger | Default risk | Approval default |
| --- | --- | --- |
| New user onboarding question | P3 | Level 1 |
| Routine support question | P3/P2 | Level 1 |
| Competitor URL setup confusion | P2 | Level 1 |
| Report-generation troubleshooting | P2/P1 | Level 1 or route |
| Billing-adjacent question | P2 | Route to Revenue & Billing if needed |
| Complaint or frustrated customer | P1/P2 | Level 2 if sensitive |
| Legal complaint or data deletion request | P0 | Level 3 |
| Security promise or public statement request | P0/P1 | Level 3 |

## Inputs

- AgentMail support thread.
- Safe customer/account reference.
- Business setup status when available.
- Competitor URL validation context when relevant.
- Report-generation status when relevant.
- Read-only billing status summary when relevant.
- Product facts from README and agent docs.

## Triage Workflow

1. Classify the request as `onboarding`, `product_usage`, `url_setup`, `report_troubleshooting`, `billing_adjacent`, `complaint`, `feature_request`, `legal_data_policy`, or `security_sensitive`.
2. Decide whether the issue can be answered from approved product facts.
3. Send Level 1 routine support, onboarding, or troubleshooting guidance through AgentMail.
4. Route billing issues to Revenue & Billing Agent and report-quality issues to Report Quality Agent.
5. Escalate sensitive complaints, legal issues, data deletion, refunds, discounts, security promises, public statements, and non-routine communications.
6. Log customer objections and repeated confusion patterns.
7. Hand patterns and unresolved risks to Weekly Briefing Agent.

## Allowed Actions

Level 0:

- Log support category and status.
- Summarize objections.
- Draft help-doc improvement notes.
- Route specialist issues.

Level 1:

- Send standard customer replies.
- Send onboarding replies.
- Send routine troubleshooting guidance.
- Send factual upgrade explanation using approved plan facts.

## Blocked Actions

Human approval is required before:

- Sending non-routine customer communication.
- Handling legal complaints.
- Handling data deletion requests.
- Promising refunds, discounts, security outcomes, product changes, custom handling, or public apologies.
- Publishing or changing public support docs.
- Editing saved reports or customer data.

## AgentMail Outputs

Use:

- [Routine Outbound Message](../templates/routine-outbound-message-template.md)
- [Specialist Handoff](../templates/specialist-handoff-template.md)
- [Human Approval Request](../templates/human-approval-request-template.md)
- [Weekly Briefing Handoff](../templates/weekly-briefing-handoff-template.md)

## Log Fields

Minimum safe log fields:

- `task_id`
- `agentmail_thread_id`
- `support_category`
- `customer_reference`
- `report_reference_safe`
- `billing_context_read_only`
- `risk_level`
- `approval_level`
- `message_type`
- `message_sent`
- `objection_or_confusion_point`
- `routed_to`
- `weekly_briefing.include`

## Weekly Briefing Handoff

Include:

- Repeated onboarding confusion.
- Repeated competitor URL setup issues.
- Report-generation friction.
- Customer complaints.
- Upgrade objections.
- Help-doc improvement candidates.

## First Automation Checklist

1. Draft templates for onboarding, URL setup, report troubleshooting, and upgrade explanation.
2. Add classifier tests that legal, data deletion, refunds, discounts, and security promises require approval.
3. Add safe-context rules for customer/account data.
4. Start with draft replies, then enable Level 1 routine sends after template review.
