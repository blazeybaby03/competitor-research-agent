# Report Quality Agent Workflow Spec

This workflow defines how the Report Quality Agent reviews report usefulness, formatting, scrape quality, hallucination risk, and commercial value without changing production prompt, model, scraping, or report-storage behavior automatically.

This is documentation only. Do not wire live AgentMail API calls, edit saved reports, regenerate customer reports, change prompts, change Claude/Anthropic model settings, change scraping logic, change report storage, deploy, or alter customer data from this spec.

## Workflow Objective

Make sure generated reports are useful enough to support the CompeteIQ product promise and Pro upgrade path while escalating production-sensitive report changes for approval.

## Primary Inbox

- `reports@mail.competeiq.com`

Temporary AgentMail native inboxes may be used first if branded domain setup is not ready.

## Intake Triggers

| Trigger | Default risk | Approval default |
| --- | --- | --- |
| New report generated | P3 | Level 0 score/log |
| Thin or malformed report | P2 | Level 0/1 internal bug report |
| Customer report-quality complaint | P2/P1 | Level 1 acknowledgement, route if needed |
| Scrape output is thin or malformed | P2/P1 | Route to System Health & Security if repeated |
| Empty, malformed, repetitive, or low-value Claude output | P1/P2 | Level 2 or Level 3 for changes |
| Hallucination or factual-risk concern | P1 | Level 2 customer communication, Level 3 changes |
| Prompt, model, scraping, storage, saved-report edit, or regeneration request | P1/P0 | Level 3 |

## Inputs

- AgentMail report-quality thread.
- Safe report reference.
- Business and competitor context when safe.
- Scrape status summary.
- Claude output summary.
- URL validation notes.
- Customer feedback.
- Prior report-quality score.

## Quality Rubric

Score each category from 1 to 5:

| Category | What to check |
| --- | --- |
| Clarity | Is the report easy to read and structured? |
| Specificity | Does it mention concrete competitor observations? |
| Commercial value | Would this help a founder or operator make decisions? |
| Evidence caution | Does it avoid unsupported certainty and respect scraped-content limits? |
| Completeness | Does it cover all available competitors and key sections? |
| Formatting | Is the output readable and not empty, malformed, or repetitive? |

Suggested status:

- `pass`: average 4+ and no critical issue.
- `watch`: average 3-3.9 or minor issue.
- `fail`: average under 3 or empty/malformed/unsafe output.

## Triage Workflow

1. Classify the issue as `new_report`, `thin_report`, `formatting_issue`, `scrape_quality`, `ai_output`, `hallucination_risk`, `customer_feedback`, or `production_change_request`.
2. Score the report using the quality rubric.
3. Determine whether the problem is one-off, repeated, customer-impacting, or production-sensitive.
4. Send internal report-quality bug reports through AgentMail when routine.
5. Route system patterns to System Health & Security Agent.
6. Route customer-facing replies to Customer Engagement Agent.
7. Escalate prompt, model, scraping, storage, saved-report editing, or regeneration changes for approval.
8. Hand report-quality patterns to Weekly Briefing Agent.

## Allowed Actions

Level 0:

- Score reports.
- Log quality findings.
- Summarize scrape or AI output issues.
- Draft prompt improvement notes.
- Route system issues.

Level 1:

- Send internal report-quality bug reports.
- Send routine report-quality issue summaries to Customer Engagement Agent.

## Blocked Actions

Human approval is required before:

- Changing production AI prompts.
- Changing Claude or Anthropic model settings.
- Changing scraping logic.
- Changing report storage logic.
- Editing saved customer reports.
- Automatically regenerating customer reports.
- Sending non-routine customer communication about accuracy or remediation.

## Log Fields

Minimum safe log fields:

- `task_id`
- `agentmail_thread_id`
- `report_reference_safe`
- `quality_status`
- `clarity_score`
- `specificity_score`
- `commercial_value_score`
- `evidence_caution_score`
- `completeness_score`
- `formatting_score`
- `risk_level`
- `approval_level`
- `suspected_issue_type`
- `routed_to`
- `blocked_actions`
- `weekly_briefing.include`

## Weekly Briefing Handoff

Include:

- Failed quality checks.
- Repeated thin scrape patterns.
- Repeated malformed AI output.
- Customer report-quality complaints.
- Prompt improvement recommendations that need approval.
- Commercial-value concerns that could affect upgrades.

## First Automation Checklist

1. Create a deterministic quality scoring form.
2. Add tests that prompt/model/scraping/storage/report-edit/regeneration actions require Level 3 approval.
3. Add safe report-reference logging.
4. Start with scoring and internal bug reports before customer-facing automation.
