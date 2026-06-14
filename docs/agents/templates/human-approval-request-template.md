# Human Approval Request Template

Use this for every Level 2 or Level 3 action.

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

Approval level:
[Level 2 / Level 3]

Why approval is needed:
[Specific rule from approval-gates.md]

Customer/revenue/security impact:
[Known impact or unknown]

What the agent can safely do now:
[Log / draft / route / summarize / wait]

What remains blocked:
[Exact blocked action]

Approve / reject / revise:
[Decision needed]
```

## Approval Notes

Do not collapse multiple high-risk decisions into one vague approval request. Split separate production, billing, legal, security, data, prompt, scraping, or configuration decisions into separate requests so the human operator can approve or reject each one clearly.
