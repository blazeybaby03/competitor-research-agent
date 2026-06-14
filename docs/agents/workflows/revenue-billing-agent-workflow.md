# Revenue & Billing Agent Workflow Spec

This workflow defines how the Revenue & Billing Agent protects trial, checkout, subscription, payment, cancellation, and upgrade operations through AgentMail-only communication.

This is documentation only. Do not wire live Stripe or AgentMail API calls, create credentials, issue refunds, offer discounts, change Stripe products/prices/webhooks, deploy, or change Supabase subscription data from this spec.

## Workflow Objective

Keep CompeteIQ revenue operations moving with low human overhead while blocking refunds, discounts, disputes, and Stripe configuration changes until human approval.

## Primary Inbox

- `billing@mail.competeiq.com`

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready.

## Intake Triggers

| Trigger | Default risk | Approval default |
| --- | --- | --- |
| Free report used | P2 | Level 1 for upgrade nudge |
| Checkout started | P3 | Level 0 log |
| Checkout abandoned | P2 | Level 1 checkout recovery |
| Payment failed | P1 | Level 1 failed-payment email |
| Subscription created | P2 | Level 0 log |
| Subscription cancelled | P1 | Level 1 cancellation follow-up |
| Customer asks routine billing question | P2 | Level 1 |
| Refund, discount, dispute, pricing, product, or webhook request | P1 | Level 3 |
| Subscription state mismatch | P0/P1 | Level 3 for data/config changes |

## Inputs

- AgentMail billing thread.
- Stripe event summary or dashboard-derived status.
- Supabase profile/subscription context when safe.
- Trial usage summary.
- Plan facts: one free report, Pro plan is A$159/month for 100 reports per 30 days.
- Prior customer conversation.
- Lead Operations risk and approval classification.

## Triage Workflow

1. Classify the event as `trial_used`, `checkout_started`, `checkout_abandoned`, `payment_failed`, `subscription_created`, `subscription_cancelled`, `routine_billing_question`, `refund_discount_dispute`, or `subscription_mismatch`.
2. Confirm whether the action is routine communication or a blocked billing decision.
3. Use Level 1 routine templates for failed payments, checkout recovery, upgrade nudges, cancellation follow-up, and basic billing replies.
4. Escalate refunds, discounts, disputes, Stripe configuration changes, and subscription data edits to Lead Operations Agent.
5. Log revenue movement and customer status without storing sensitive payment details.
6. Hand notable billing movement and all P0/P1 risks to Weekly Briefing Agent.

## Allowed Actions

Level 0:

- Log checkout starts.
- Log subscription created/updated/cancelled summaries.
- Track free report usage.
- Summarize revenue movement.

Level 1:

- Send failed-payment emails.
- Send checkout recovery emails.
- Send upgrade nudges.
- Send cancellation follow-up emails.
- Send routine billing replies based on approved product facts.

## Blocked Actions

Human approval is required before:

- Issuing refunds.
- Offering discounts.
- Handling disputes.
- Changing Stripe products, prices, checkout, portal, or webhooks.
- Manually changing subscription status.
- Editing customer billing data.
- Sending non-routine billing commitments.
- Promising custom terms.

## Routine Message Types

Use [Routine Outbound Message](../templates/routine-outbound-message-template.md) for:

- `failed_payment`
- `checkout_recovery`
- `upgrade_nudge`
- `cancellation_follow_up`
- `routine_billing_reply`

Each message must stay factual and must not promise refunds, discounts, product changes, or manual subscription changes.

## Log Fields

Minimum safe log fields:

- `task_id`
- `agentmail_thread_id`
- `billing_event_type`
- `customer_reference`
- `stripe_reference_safe`
- `subscription_state_summary`
- `trial_usage_summary`
- `risk_level`
- `approval_level`
- `message_type`
- `message_sent`
- `blocked_actions`
- `weekly_briefing.include`

## Weekly Briefing Handoff

Include:

- New subscriptions.
- Failed-payment count.
- Checkout recovery count.
- Cancellations.
- Refund/discount/dispute requests.
- Subscription state mismatches.
- Upgrade nudge volume and outcomes when known.

## First Automation Checklist

1. Draft approved templates for failed payment, checkout recovery, upgrade nudge, and cancellation follow-up.
2. Build classification tests that refund, discount, dispute, and Stripe configuration requests always require Level 3 approval.
3. Add redaction tests for payment data.
4. Start with logging and draft messages before enabling automatic Level 1 sends.
