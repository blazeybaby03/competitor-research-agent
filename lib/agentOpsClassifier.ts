export type AgentOpsEventType =
  | "customer_support"
  | "billing"
  | "report_quality"
  | "system_health"
  | "security"
  | "legal_data_policy"
  | "weekly_briefing"
  | "unclear";

export type AgentOpsRiskLevel = "P0" | "P1" | "P2" | "P3";

export type AgentOpsApprovalLevel = "Level 0" | "Level 1" | "Level 2" | "Level 3";

export type AgentOpsAgent =
  | "Lead Operations Agent"
  | "System Health & Security Agent"
  | "Revenue & Billing Agent"
  | "Customer Engagement Agent"
  | "Report Quality Agent"
  | "Weekly Briefing Agent";

export type AgentOpsStatus =
  | "triaged"
  | "routed"
  | "drafted"
  | "approval_needed";

export type AgentOpsBriefingPriority = "critical" | "high" | "normal" | "none";

export interface AgentOpsEventInput {
  title: string;
  description?: string;
  requestedAction?: string;
  source?: string;
  tags?: string[];
}

export interface AgentOpsClassification {
  eventType: AgentOpsEventType;
  riskLevel: AgentOpsRiskLevel;
  approvalLevel: AgentOpsApprovalLevel;
  primaryAgent: AgentOpsAgent;
  secondaryAgent: AgentOpsAgent | null;
  status: AgentOpsStatus;
  allowedActions: string[];
  blockedActions: string[];
  briefingPriority: AgentOpsBriefingPriority;
  rationale: string[];
}

interface Level3Rule {
  action: string;
  reason: string;
  pattern: RegExp;
  p0?: boolean;
}

const LEVEL_3_RULES: Level3Rule[] = [
  {
    action: "deploy_to_production",
    reason: "Production deploys require hard approval.",
    pattern: /\b(deploy|deployment|release)\b.*\b(production|prod|live)\b|\bproduction deploy\b/,
    p0: true,
  },
  {
    action: "change_production_code",
    reason: "Production code changes require hard approval.",
    pattern: /\b(change|edit|patch|modify|rewrite|fix)\b.*\bproduction code\b|\bproduction code\b.*\b(change|edit|patch|modify|rewrite|fix)\b/,
  },
  {
    action: "change_supabase_security",
    reason: "Supabase RLS, auth, service-role, and database policy changes require hard approval.",
    pattern: /\b(rls|row level security|service role|service_role|supabase auth|database policy|db policy|migration)\b/,
    p0: true,
  },
  {
    action: "change_stripe_configuration",
    reason: "Stripe product, price, checkout configuration, and webhook changes require hard approval.",
    pattern: /\bstripe\b.*\b(price|pricing|product|webhook|checkout config|checkout configuration)\b|\b(webhook|price|pricing|product)\b.*\bstripe\b/,
    p0: true,
  },
  {
    action: "issue_refund",
    reason: "Refunds require hard approval.",
    pattern: /\b(refund|refunds|refunded)\b/,
  },
  {
    action: "offer_discount",
    reason: "Discounts require hard approval.",
    pattern: /\b(discount|discounts|coupon|promo code|promotional code)\b/,
  },
  {
    action: "rotate_or_change_keys",
    reason: "API key rotation and credential changes require hard approval.",
    pattern: /\b(rotate|regenerate|change|replace)\b.*\b(api key|key|secret|token|credential|credentials)\b|\b(api key|secret|token|credential|credentials)\b.*\b(rotate|regenerate|change|replace|exposed|leaked|committed)\b/,
    p0: true,
  },
  {
    action: "change_environment_variables",
    reason: "Environment variable changes require hard approval.",
    pattern: /\b(env var|environment variable|\.env|railway variable|NEXT_PUBLIC_|STRIPE_|SUPABASE_|ANTHROPIC_|SCRAPERAPI_|AGENTMAIL_)\b/,
  },
  {
    action: "change_production_ai_prompt",
    reason: "Production AI prompt changes require hard approval.",
    pattern: /\b(production prompt|ai prompt|system prompt|prompt change|change prompt|update prompt)\b/,
  },
  {
    action: "change_model_settings",
    reason: "Claude/Anthropic model setting changes require hard approval.",
    pattern: /\b(claude|anthropic|ai_model|model setting|model settings|change model|switch model)\b/,
  },
  {
    action: "change_scraping_logic",
    reason: "Scraping logic changes require hard approval.",
    pattern: /\b(scraping logic|scraperapi logic|change scraper|change scraping|crawler logic|scrape logic)\b/,
  },
  {
    action: "change_report_storage_logic",
    reason: "Report storage logic changes require hard approval.",
    pattern: /\b(report storage|storage logic|save report|saved report storage|report persistence)\b/,
  },
  {
    action: "edit_saved_customer_report",
    reason: "Saved customer report edits require hard approval.",
    pattern: /\b(edit|modify|rewrite|change)\b.*\b(saved|customer)\b.*\breport\b|\bsaved customer report\b/,
  },
  {
    action: "regenerate_customer_report",
    reason: "Automatic customer report regeneration requires hard approval.",
    pattern: /\b(regenerate|rerun|re-run)\b.*\b(customer report|saved report|report)\b|\bautomatically regenerate\b/,
  },
  {
    action: "handle_legal_or_data_request",
    reason: "Legal complaints, policy issues, and data deletion requests require hard approval.",
    pattern: /\b(legal complaint|legal|privacy policy|refund policy|security policy|terms|data deletion|delete my data|gdpr|ccpa|privacy request)\b/,
    p0: true,
  },
  {
    action: "send_public_statement",
    reason: "Public content, public apologies, and security promises require hard approval.",
    pattern: /\b(public apology|public statement|publish public|public content|security promise|promise security|security guarantee)\b/,
    p0: true,
  },
  {
    action: "delete_customer_data_or_run_destructive_script",
    reason: "Customer data deletion and destructive scripts require hard approval.",
    pattern: /\b(delete customer data|drop database|truncate|destructive script|delete user data|wipe data|remove all data)\b/,
    p0: true,
  },
];

const LEVEL_2_PATTERNS = [
  /\b(update|change|publish)\b.*\b(help doc|help docs|support doc|support docs|public docs|documentation)\b/,
  /\b(non-routine|sensitive complaint|customer complaint|complaint)\b/,
  /\b(product direction|product issue|feature request|backlog)\b/,
  /\b(kpi|metric definition|weekly metric)\b/,
];

const LEVEL_1_MESSAGE_RULES = [
  { action: "send_standard_customer_reply", pattern: /\b(standard customer reply|routine support|support reply|customer reply)\b/ },
  { action: "send_onboarding_reply", pattern: /\b(onboarding|welcome email|getting started)\b/ },
  { action: "send_troubleshooting_guidance", pattern: /\b(troubleshooting|troubleshoot|how do i|help with|issue saving|url setup)\b/ },
  { action: "send_billing_email", pattern: /\b(billing email|billing question|invoice question|routine billing)\b/ },
  { action: "send_failed_payment_email", pattern: /\b(failed payment|payment failed|card declined|dunning)\b/ },
  { action: "send_checkout_recovery_email", pattern: /\b(checkout recovery|checkout abandoned|abandoned checkout|checkout started but no subscription)\b/ },
  { action: "send_upgrade_nudge", pattern: /\b(upgrade nudge|upgrade email|free report used|trial used|trial complete)\b/ },
  { action: "send_cancellation_follow_up", pattern: /\b(cancellation follow-up|cancelled subscription|subscription cancelled|canceled subscription)\b/ },
  { action: "send_internal_bug_report", pattern: /\b(bug report|internal bug|technical bug)\b/ },
  { action: "send_report_quality_bug_report", pattern: /\b(report-quality bug|report quality bug|thin report|malformed report)\b/ },
];

function normalizeEvent(input: AgentOpsEventInput): string {
  return [input.title, input.description, input.requestedAction, input.source, ...(input.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function getLevel3Matches(text: string): Level3Rule[] {
  return LEVEL_3_RULES.filter((rule) => rule.pattern.test(text));
}

function classifyEventType(text: string): AgentOpsEventType {
  if (/\b(legal|data deletion|delete my data|privacy policy|refund policy|security policy|terms|public apology|public statement|public content)\b/.test(text)) {
    return "legal_data_policy";
  }

  if (/\b(secret|credential|api key|token|rls|row level security|service role|service_role|security warning|security risk|exposed|leaked)\b/.test(text)) {
    return "security";
  }

  if (/\b(stripe|checkout|payment|subscription|billing|refund|discount|invoice|upgrade|cancellation|cancelled|failed payment)\b/.test(text)) {
    return "billing";
  }

  if (/\b(report quality|thin report|malformed report|hallucination|prompt|model|scrape quality|saved report|regenerate|report output)\b/.test(text)) {
    return "report_quality";
  }

  if (/\b(auth|login|signup|dashboard|railway|deploy|deployment|build|runtime|webhook|supabase|scraperapi|anthropic|claude|report generation failed|app down)\b/.test(text)) {
    return "system_health";
  }

  if (/\b(weekly|briefing|weekly summary|operating summary)\b/.test(text)) {
    return "weekly_briefing";
  }

  if (/\b(customer|support|onboarding|troubleshooting|help|url setup|competitor url)\b/.test(text)) {
    return "customer_support";
  }

  return "unclear";
}

function classifyRisk(text: string, eventType: AgentOpsEventType, level3Matches: Level3Rule[]): AgentOpsRiskLevel {
  if (level3Matches.some((rule) => rule.p0)) {
    return "P0";
  }

  if (/\b(checkout broken|webhook failing|webhook failure|auth broken|app down|production down|live payment|exposed key|leaked key|user data security|multiple report failures|repeated report failures)\b/.test(text)) {
    return "P0";
  }

  if (eventType === "security" || eventType === "legal_data_policy") {
    return "P0";
  }

  if (level3Matches.length > 0) {
    return "P1";
  }

  if (/\b(payment failed|failed payment|cancellation|cancelled subscription|customer complaint|complaint|unusable report|signup friction|login issue|deployment warning|scraperapi failure|report generation failed|report failure|subscription mismatch)\b/.test(text)) {
    return "P1";
  }

  if (eventType === "billing" || eventType === "report_quality" || matchesAny(text, LEVEL_2_PATTERNS)) {
    return "P2";
  }

  return "P3";
}

function classifyApprovalLevel(text: string, level3Matches: Level3Rule[]): AgentOpsApprovalLevel {
  if (level3Matches.length > 0) {
    return "Level 3";
  }

  if (matchesAny(text, LEVEL_2_PATTERNS)) {
    return "Level 2";
  }

  if (LEVEL_1_MESSAGE_RULES.some((rule) => rule.pattern.test(text))) {
    return "Level 1";
  }

  return "Level 0";
}

function routeAgents(eventType: AgentOpsEventType, text: string): Pick<AgentOpsClassification, "primaryAgent" | "secondaryAgent"> {
  if (eventType === "legal_data_policy") {
    return { primaryAgent: "Lead Operations Agent", secondaryAgent: "Customer Engagement Agent" };
  }

  if (eventType === "security" || eventType === "system_health") {
    return { primaryAgent: "System Health & Security Agent", secondaryAgent: "Lead Operations Agent" };
  }

  if (eventType === "billing") {
    const secondaryAgent: AgentOpsAgent = /\b(webhook|subscription mismatch|stripe config|stripe webhook)\b/.test(text)
      ? "System Health & Security Agent"
      : "Customer Engagement Agent";
    return { primaryAgent: "Revenue & Billing Agent", secondaryAgent };
  }

  if (eventType === "report_quality") {
    const secondaryAgent: AgentOpsAgent = /\b(scrape|scraperapi|malformed|empty|repeated|generation failed|model|prompt)\b/.test(text)
      ? "System Health & Security Agent"
      : "Customer Engagement Agent";
    return { primaryAgent: "Report Quality Agent", secondaryAgent };
  }

  if (eventType === "weekly_briefing") {
    return { primaryAgent: "Weekly Briefing Agent", secondaryAgent: "Lead Operations Agent" };
  }

  if (eventType === "customer_support") {
    return { primaryAgent: "Customer Engagement Agent", secondaryAgent: "Lead Operations Agent" };
  }

  return { primaryAgent: "Lead Operations Agent", secondaryAgent: null };
}

function getAllowedActions(approvalLevel: AgentOpsApprovalLevel): string[] {
  if (approvalLevel === "Level 3" || approvalLevel === "Level 2") {
    return ["log_event", "classify_event", "route_to_owner", "draft_approval_request"];
  }

  if (approvalLevel === "Level 1") {
    return ["log_event", "classify_event", "route_to_owner", "send_approved_routine_agentmail_message"];
  }

  return ["log_event", "classify_event", "route_to_owner", "draft_internal_summary"];
}

function getBlockedActions(approvalLevel: AgentOpsApprovalLevel, level3Matches: Level3Rule[]): string[] {
  if (approvalLevel === "Level 3") {
    return [...new Set(level3Matches.map((rule) => rule.action))];
  }

  if (approvalLevel === "Level 2") {
    return ["send_non_routine_customer_message_without_approval"];
  }

  return [];
}

function getStatus(approvalLevel: AgentOpsApprovalLevel): AgentOpsStatus {
  if (approvalLevel === "Level 3" || approvalLevel === "Level 2") {
    return "approval_needed";
  }

  if (approvalLevel === "Level 1") {
    return "routed";
  }

  return "triaged";
}

function getBriefingPriority(riskLevel: AgentOpsRiskLevel): AgentOpsBriefingPriority {
  if (riskLevel === "P0") {
    return "critical";
  }

  if (riskLevel === "P1") {
    return "high";
  }

  if (riskLevel === "P2") {
    return "normal";
  }

  return "none";
}

export function classifyAgentOpsEvent(input: AgentOpsEventInput): AgentOpsClassification {
  const text = normalizeEvent(input);
  const level3Matches = getLevel3Matches(text);
  const eventType = classifyEventType(text);
  const riskLevel = classifyRisk(text, eventType, level3Matches);
  const approvalLevel = classifyApprovalLevel(text, level3Matches);
  const agents = routeAgents(eventType, text);
  const blockedActions = getBlockedActions(approvalLevel, level3Matches);

  return {
    eventType,
    riskLevel,
    approvalLevel,
    ...agents,
    status: getStatus(approvalLevel),
    allowedActions: getAllowedActions(approvalLevel),
    blockedActions,
    briefingPriority: getBriefingPriority(riskLevel),
    rationale: [
      `Classified as ${eventType}.`,
      `Assigned ${riskLevel} risk and ${approvalLevel} approval.`,
      ...level3Matches.map((rule) => rule.reason),
    ],
  };
}
