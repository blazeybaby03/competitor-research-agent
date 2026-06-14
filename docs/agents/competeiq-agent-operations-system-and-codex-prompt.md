# CompeteIQ Agent Operations System — Locked Specification + Codex Build Prompt

## Source Context

This specification is based on the CompeteIQ README and the agreed operating model.

CompeteIQ is an AI competitor research SaaS that generates detailed AI-powered competitor intelligence reports from simple URL inputs.

Core product stack from README:

- Next.js 15 App Router + TypeScript
- Tailwind CSS
- Supabase for authentication and database
- Stripe for subscriptions
- ScraperAPI for website scraping
- Anthropic Claude for AI report generation
- Vercel deployment
- New users receive 1 free report
- Pro subscription is A$159/month for 100 reports/month
- Core flow: signup → dashboard → business details + 1–5 competitor URLs → scrape → Claude report generation → report saved/viewed/copied

Important README security note:

- If `.env.local` or any local environment file has ever been committed/shared, keys must be rotated immediately.
- `.env*.local` must never be committed.
- Sensitive systems include Supabase service role key, Anthropic API key, ScraperAPI key, Stripe secret key, and Stripe webhook secret.

Future work noted in README:

- PDF / CSV export
- Slack notifications
- Scheduled / recurring reports
- Broader platform-wide rate limiting before scaling
- Stripe customer portal for self-service subscription management

---

# Locked Decision Summary

## Starting Agent Team

The starting team is intentionally compact. Do not build a bloated AI org chart.

Locked starting agents:

1. Lead Operations Agent
2. System Health & Security Agent
3. Revenue & Billing Agent
4. Customer Engagement Agent
5. Report Quality Agent
6. Weekly Briefing Agent

Deferred agents:

- Growth & Lead Capture Agent
- Product & Backlog Agent
- Legal & Compliance Agent
- Data Analytics Agent
- Content Repurposing Agent
- QA Regression Agent
- Partnerships Agent

These can be added later after the core product, revenue path, and support operations are stable.

---

# Locked Communication Rule

## Absolute Rule

No Gmail.

Gmail must not be used for:

- Customer communication
- Billing communication
- Support inboxes
- Agent-to-agent communication
- Notifications
- Internal routing
- Weekly briefings
- Intake workflows

## Approved Communication Layer

AgentMail only.

AgentMail will be used for:

- Dedicated agent inboxes
- Customer support communication
- Billing communication
- Upgrade nudges
- Bug reports
- Internal operational routing
- Weekly briefings
- Agent escalation workflows
- Email thread search and audit trail
- Outbound email automation

---

# AgentMail Inbox Structure

## Fastest Version

Use AgentMail native inboxes first if branded domain setup is not ready:

- lead-ops@agentmail.to
- security@agentmail.to
- billing@agentmail.to
- support@agentmail.to
- report-quality@agentmail.to
- briefings@agentmail.to

## Scalable Version

Move to branded CompeteIQ inboxes once the system is stable:

- lead-ops@mail.competeiq.com
- security@mail.competeiq.com
- billing@mail.competeiq.com
- support@mail.competeiq.com
- reports@mail.competeiq.com
- briefings@mail.competeiq.com

Recommended final mapping:

| Agent | Email Address | Purpose |
|---|---|---|
| Lead Operations Agent | lead-ops@mail.competeiq.com | Internal coordination, escalation, routing |
| System Health & Security Agent | security@mail.competeiq.com | Security, incidents, technical alerts |
| Revenue & Billing Agent | billing@mail.competeiq.com | Stripe, subscriptions, failed payments, billing support |
| Customer Engagement Agent | support@mail.competeiq.com | Customer support, onboarding, troubleshooting |
| Report Quality Agent | reports@mail.competeiq.com | Report issues, quality feedback, output failures |
| Weekly Briefing Agent | briefings@mail.competeiq.com | Weekly summaries, operating reports, internal briefs |

---

# Overall Agent System Workflow

## Core Flow

```text
CompeteIQ Event Happens
        ↓
Lead Operations Agent classifies the event
        ↓
Correct specialist agent receives the task
        ↓
Specialist agent investigates / drafts / logs / recommends / sends approved routine communications
        ↓
Approval gate check
        ↓
Safe action runs OR approval request is sent
        ↓
Weekly Briefing Agent summarises the activity
```

## Communication Flow

```text
Customer / System / Tool Event
        ↓
Dedicated AgentMail inbox
        ↓
Relevant agent receives and classifies thread
        ↓
Agent drafts response, sends routine response, or prepares action
        ↓
Approval gate check
        ↓
Approved message/action sent through AgentMail
        ↓
Thread logged for weekly briefing
```

---

# Event Routing

| Event | Primary Agent | Secondary Agent |
|---|---|---|
| New signup | Customer Engagement Agent | Revenue & Billing Agent |
| Free report used | Revenue & Billing Agent | Customer Engagement Agent |
| Report generated | Report Quality Agent | Weekly Briefing Agent |
| Report failed | System Health & Security Agent | Report Quality Agent |
| Competitor URL validation issue | Report Quality Agent | System Health & Security Agent |
| ScraperAPI error | System Health & Security Agent | Report Quality Agent |
| Claude report-generation issue | System Health & Security Agent | Report Quality Agent |
| Supabase auth/database issue | System Health & Security Agent | Lead Operations Agent |
| Stripe checkout started | Revenue & Billing Agent | Weekly Briefing Agent |
| Stripe checkout abandoned | Revenue & Billing Agent | Customer Engagement Agent |
| Payment failed | Revenue & Billing Agent | Customer Engagement Agent |
| Subscription cancelled | Revenue & Billing Agent | Customer Engagement Agent |
| Customer support email | Customer Engagement Agent | Lead Operations Agent |
| Security warning | System Health & Security Agent | Lead Operations Agent |
| Deployment issue | System Health & Security Agent | Lead Operations Agent |
| Weekly summary due | Weekly Briefing Agent | Lead Operations Agent |
| Unclear / high-risk issue | Lead Operations Agent | Relevant specialist |

---

# Operating Priority Order

When multiple events occur, agents must prioritise in this order:

1. Security risk
2. Payment or revenue failure
3. Signup/login failure
4. Report-generation failure
5. Customer complaint
6. Report quality issue
7. Feature request
8. Growth/content task
9. General admin

---

# Approval Gate Levels

## Level 0 — Fully Automatic

Agents can complete without human approval:

- Log events
- Summarise issues
- Score reports
- Track failed payments
- Track signups
- Track cancellations
- Add items to weekly briefing
- Draft internal summaries
- Send routine customer replies
- Send billing emails
- Send upgrade nudges
- Send bug reports to the internal system

## Level 1 — Draft + Send for Approved Routine Communication

Agents may draft and send the following through AgentMail without manual approval:

- Standard customer support replies
- Basic onboarding replies
- Troubleshooting guidance
- Failed-payment emails
- Checkout recovery emails
- Upgrade nudges
- Cancellation follow-up emails
- Internal bug reports
- Report-quality bug reports

## Level 2 — Approval Required

Agents need approval before:

- Updating public help documentation
- Recommending onboarding flow changes
- Creating product-direction GitHub issues
- Sending anything involving sensitive complaints
- Sending non-routine customer communications
- Changing weekly KPI definitions
- Changing support documentation used publicly

## Level 3 — Hard Approval Required

Agents must never act without explicit human approval before:

- Deploying to production
- Changing production code
- Changing Supabase RLS/security settings
- Changing Stripe pricing/products/webhooks
- Issuing refunds
- Offering discounts
- Rotating API keys
- Changing environment variables
- Changing production AI prompts
- Changing Anthropic/Claude model settings
- Changing scraping logic
- Changing report storage logic
- Editing saved customer reports
- Automatically regenerating customer reports
- Handling legal complaints
- Handling data deletion requests
- Sending security promises
- Sending public apology statements
- Publishing public content
- Updating legal/privacy/refund/security policies
- Deleting customer data
- Running destructive scripts

---

# Human Approval Request Format

Every approval request must use this format:

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

---

# Risk Levels

## P0 — Critical

Immediate human review required.

Examples:

- Stripe checkout broken
- Stripe webhook failing
- Supabase auth broken
- API key exposure risk
- Production app down
- User data security risk
- Multiple report failures
- Live payment issue

## P1 — High

Must be reviewed before high-risk action.

Examples:

- Payment failure pattern
- Subscription cancellation pattern
- Customer complaint
- Report output unusable
- Signup flow friction
- Deployment warning
- ScraperAPI failure pattern

## P2 — Medium

Can be drafted and queued.

Examples:

- Help doc improvement
- Upgrade email improvement
- Report formatting issue
- Feature request
- Minor support confusion
- Weekly churn-risk review

## P3 — Low

Log only unless repeated.

Examples:

- One-off user confusion
- Minor UI copy issue
- Low-priority content idea
- Non-critical dashboard improvement
- Future feature idea

---

# Agent Role Specifications

Each final agent file must follow this layout:

```text
[AGENT ROLE TITLE]

Main Job

[JOB DESCRIPTION HERE]

AI: [BEST LLM MODEL HERE]
Effort: [EFFORT LEVEL HERE]
Tool stack: [LIST THE TOOLS/SKILLS IT SHOULD USE]

Triggers

Use the [AGENT ROLE] when:

- [EVENT TRIGGER]
- [EVENT TRIGGER]
- [EVENT TRIGGER]

Inputs

- [INPUT HERE]
- [INPUT HERE]
- [INPUT HERE]

Workflow

1. [WORKFLOW STEP]
2. [WORKFLOW STEP]
3. [WORKFLOW STEP]
4. [WORKFLOW STEP]
5. [WORKFLOW STEP]

Outputs

- [OUTPUT HERE]
- [OUTPUT HERE]
- [OUTPUT HERE]

Approval Gates

You must get approval before:

- [APPROVAL GATE]
- [APPROVAL GATE]
- [APPROVAL GATE]

Automation Process

Trigger:

[TRIGGER DESCRIPTION]

Automation:

[AUTOMATION DESCRIPTION]

Output:

[OUTPUT TASK]

Next action:

[NEXT ACTION ADVISED]
```

---

# Agent 1 — Lead Operations Agent

## Main Job

The Lead Operations Agent oversees the full CompeteIQ operating layer. It classifies incoming events, routes tasks to specialist agents, enforces approval gates, tracks risk, resolves agent conflicts, and maintains a clean operating picture.

## AI

Claude Opus 4.8 or GPT-5.5 Thinking.

## Effort

High.

## Tool Stack

- AgentMail inbox: lead-ops@mail.competeiq.com
- AgentMail API and webhooks
- GitHub/Codex
- Vercel dashboard/logs
- Supabase dashboard/logs
- Stripe dashboard/logs
- ScraperAPI dashboard/logs
- Anthropic console/logs
- Internal operating docs
- Agent logs
- Weekly briefing archive

## Responsibilities

- Classify all important operational events
- Route tasks to specialist agents
- Enforce approval gates
- Track P0/P1/P2/P3 risk levels
- Summarise incident status
- Maintain current operating priorities
- Escalate sensitive decisions to the human operator
- Keep the agent system simple and non-bloated

---

# Agent 2 — System Health & Security Agent

## Main Job

The System Health & Security Agent monitors and diagnoses the technical and security state of CompeteIQ. It protects uptime, auth, database safety, API reliability, payment webhooks, scraping reliability, AI generation stability, and secret hygiene.

## AI

Codex with GPT-5.5 for technical audits and code-level investigation.

## Effort

High for audits and incidents. Medium for routine monitoring.

## Tool Stack

- AgentMail inbox: security@mail.competeiq.com
- AgentMail API and webhooks
- GitHub/Codex
- Vercel logs
- Supabase auth/database/RLS logs
- Stripe webhook logs
- ScraperAPI logs
- Anthropic API/report-generation logs
- Environment variable checklist
- README security notes
- Incident log

## Responsibilities

- Monitor failed builds and deployment issues
- Monitor login/signup/auth failures
- Monitor Supabase RLS and database risks
- Monitor Stripe webhook failures
- Monitor ScraperAPI failures
- Monitor Claude/API report-generation errors
- Detect missing environment variables
- Flag exposed key risk
- Draft technical bug reports
- Draft security incident reports
- Draft fix plans without applying production changes

---

# Agent 3 — Revenue & Billing Agent

## Main Job

The Revenue & Billing Agent protects CompeteIQ's revenue path. It tracks trial usage, checkout flow, paid subscriptions, failed payments, cancellation risk, upgrade opportunities, and billing communication through AgentMail.

## AI

GPT-5.5 or Claude Sonnet 4.6.

## Effort

Medium.

## Tool Stack

- AgentMail inbox: billing@mail.competeiq.com
- AgentMail API and webhooks
- Stripe dashboard/logs
- Supabase user/subscription data
- Internal CRM or customer log
- Weekly briefing log
- Pricing/trial documentation

## Responsibilities

- Track new paid subscribers
- Track free-trial usage
- Track checkout abandonment
- Track failed payments
- Track cancellations
- Send routine billing emails
- Send failed-payment recovery emails
- Send checkout recovery emails
- Send upgrade nudges
- Summarise revenue movement
- Escalate refunds, discounts, disputes, and Stripe configuration changes

---

# Agent 4 — Customer Engagement Agent

## Main Job

The Customer Engagement Agent handles customer support, onboarding, troubleshooting, user education, objections, and activation messaging. It reduces friction between signup, first report, and paid upgrade.

## AI

Claude Sonnet 4.6.

## Effort

Medium.

## Tool Stack

- AgentMail inbox: support@mail.competeiq.com
- AgentMail API and webhooks
- Help docs
- Product documentation
- Supabase user/report context
- Stripe billing status context, read-only
- Customer objection log
- Weekly briefing log

## Responsibilities

- Send standard customer support replies
- Send onboarding messages
- Send troubleshooting guidance
- Explain product features
- Explain report-generation flow
- Log objections and confusion points
- Flag support patterns
- Draft help-doc improvements
- Escalate refunds, legal complaints, data deletion, security promises, and sensitive complaints

---

# Agent 5 — Report Quality Agent

## Main Job

The Report Quality Agent reviews generated reports for usefulness, clarity, structure, factual risk, scrape quality, formatting, and commercial value. Its core test is whether the report helps justify the Pro plan.

## AI

Claude Opus 4.8 for deep review. Claude Sonnet 4.6 for routine review.

## Effort

Medium to High.

## Tool Stack

- AgentMail inbox: reports@mail.competeiq.com
- AgentMail API and webhooks
- Supabase report records
- Report generation outputs
- ScraperAPI scrape outputs
- Claude output logs
- URL validation results
- Quality scoring rubric
- Weekly briefing log

## Responsibilities

- Score generated reports
- Identify thin reports
- Detect poor scrape inputs
- Detect hallucination risk
- Check report formatting
- Check missing insight patterns
- Send internal report-quality bug reports
- Recommend prompt improvements
- Escalate production prompt, model, scraping, or report-storage changes

---

# Agent 6 — Weekly Briefing Agent

## Main Job

The Weekly Briefing Agent produces a concise operating brief across revenue, users, support, report quality, system health, incidents, risks, and next actions.

## AI

Claude Sonnet 4.6 or GPT-5.5.

## Effort

Medium.

## Tool Stack

- AgentMail inbox: briefings@mail.competeiq.com
- AgentMail API and webhooks
- Agent logs
- Stripe summaries
- Supabase summaries
- Vercel incident summaries
- Report quality summaries
- Customer support summaries
- Internal operating docs

## Responsibilities

- Pull weekly logs from all agents
- Summarise revenue movement
- Summarise signup and trial movement
- Summarise report generation volume
- Summarise report failures
- Summarise system incidents
- Summarise customer issues
- Summarise billing issues
- Recommend next 3 priorities
- Send weekly brief through AgentMail

---

# Recommended Repo Documentation Structure

Codex should inspect the repository first, then create or update documentation in a clean structure similar to:

```text
docs/
  agents/
    README.md
    agent-system-overview.md
    approval-gates.md
    agentmail-communication-layer.md
    roles/
      lead-operations-agent.md
      system-health-security-agent.md
      revenue-billing-agent.md
      customer-engagement-agent.md
      report-quality-agent.md
      weekly-briefing-agent.md
```

If the repository already has a better documentation location, Codex may adapt while preserving clarity.
