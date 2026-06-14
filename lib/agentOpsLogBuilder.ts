import type {
  AgentOpsEventInput,
  AgentOpsClassification,
  AgentOpsApprovalLevel,
  AgentOpsBriefingPriority,
  AgentOpsEventType,
  AgentOpsRiskLevel,
} from "./agentOpsClassifier";

// --- Types ---

export type AgentOpsCustomerImpact = "none" | "single_customer" | "multiple_customers" | "unknown";
export type AgentOpsRevenueImpact = "none" | "possible" | "confirmed" | "unknown";
export type AgentOpsProductionSensitivity = "none" | "low" | "medium" | "high";

export interface AgentOpsApprovalRequest {
  required: boolean;
  reason: string | null;
  requested_at: string | null;
  decision: string | null;
  decided_at: string | null;
}

export interface AgentOpsMessageSent {
  sent_at: string;
  from_inbox: string;
  message_type: string;
  agent: string;
}

export interface AgentOpsWeeklyBriefing {
  include: boolean;
  summary: string | null;
  priority: AgentOpsBriefingPriority;
}

export interface AgentOpsLog {
  task_id: string;
  created_at: string;
  updated_at: string;
  agentmail_thread_id: string | null;
  source: string;
  source_reference: string | null;
  event_type: AgentOpsEventType;
  event_summary: string;
  customer_reference: string | null;
  customer_impact: AgentOpsCustomerImpact;
  revenue_impact: AgentOpsRevenueImpact;
  production_sensitivity: AgentOpsProductionSensitivity;
  risk_level: AgentOpsRiskLevel;
  approval_level: AgentOpsApprovalLevel;
  primary_agent: string;
  secondary_agent: string | null;
  status: string;
  allowed_actions: string[];
  blocked_actions: string[];
  approval_request: AgentOpsApprovalRequest;
  messages_sent: AgentOpsMessageSent[];
  weekly_briefing: AgentOpsWeeklyBriefing;
  final_outcome: string | null;
}

export interface AgentOpsLogOptions {
  agentmailThreadId?: string | null;
  source?: string;
  sourceReference?: string | null;
  customerReference?: string | null;
  reportReference?: string | null;
  stripeReferenceSummary?: string | null;
  customerImpact?: AgentOpsCustomerImpact;
  revenueImpact?: AgentOpsRevenueImpact;
  productionSensitivity?: AgentOpsProductionSensitivity;
}

// --- Redaction ---

interface RedactionRule {
  pattern: RegExp;
  replacement: string;
}

// Rules are applied in order. Earlier rules take precedence.
// Never store: API keys, tokens, passwords, private credentials, full payment data, unnecessary PII.
const REDACTION_RULES: ReadonlyArray<RedactionRule> = [
  // Stripe live and test secret / restricted keys
  { pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g, replacement: "[REDACTED:stripe-key]" },
  { pattern: /\brk_(?:live|test)_[A-Za-z0-9]{20,}\b/g, replacement: "[REDACTED:stripe-key]" },
  // Stripe webhook signing secret
  { pattern: /\bwhsec_[A-Za-z0-9+/=_-]{20,}/g, replacement: "[REDACTED:webhook-secret]" },
  // Anthropic API keys
  { pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, replacement: "[REDACTED:anthropic-key]" },
  // Supabase / generic JWT tokens: three base64url parts separated by dots
  { pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, replacement: "[REDACTED:jwt]" },
  // Bearer tokens in text
  { pattern: /\bBearer\s+[A-Za-z0-9_\-./+=]{10,}/gi, replacement: "Bearer [REDACTED:token]" },
  // Named API key patterns
  { pattern: /\b(?:api[_\s-]?key|apikey|api_key)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{6,}["']?/gi, replacement: "[REDACTED:api-key]" },
  // Named token patterns
  { pattern: /\b(?:access_token|auth_token|secret_token|authorization)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{6,}["']?/gi, replacement: "[REDACTED:token]" },
  { pattern: /\btoken\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{6,}["']?/gi, replacement: "[REDACTED:token]" },
  // Password patterns
  { pattern: /\bpassword\s*[:=]\s*["']?[^\s"',]{4,}["']?/gi, replacement: "[REDACTED:password]" },
  // Named secret patterns
  { pattern: /\bsecret\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{6,}["']?/gi, replacement: "[REDACTED:secret]" },
  // ScraperAPI key
  { pattern: /\b(?:scraperapi[_\s-]?key|SCRAPERAPI_KEY)\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}["']?/gi, replacement: "[REDACTED:scraperapi-key]" },
  // AgentMail API key
  { pattern: /\b(?:agentmail[_\s-]?(?:api[_\s-]?)?key|AGENTMAIL_API_KEY|AGENTMAIL_KEY)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{10,}["']?/gi, replacement: "[REDACTED:agentmail-key]" },
  // Credit card-like 16-digit numbers with optional space or hyphen separators
  { pattern: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, replacement: "[REDACTED:card-number]" },
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: "[REDACTED:email]" },
  // Long base64/random-looking strings (50+ chars). Applied last as a catch-all.
  // May over-redact in rare edge cases involving long encoded content.
  { pattern: /[A-Za-z0-9+/=]{50,}/g, replacement: "[REDACTED:secret]" },
];

export function redactUnsafeValues(text: string): string {
  if (!text) return text;
  let result = text;
  for (const rule of REDACTION_RULES) {
    rule.pattern.lastIndex = 0;
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

// --- Task ID ---

function generateTaskId(now: Date): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = Math.random().toString(36).slice(2, 8).padEnd(6, "0");
  return `ops_${date}_${shortId}`;
}

// --- Impact / Sensitivity Defaults ---

function defaultCustomerImpact(
  eventType: AgentOpsEventType,
  riskLevel: AgentOpsRiskLevel
): AgentOpsCustomerImpact {
  if (
    eventType === "security" ||
    (eventType === "system_health" && (riskLevel === "P0" || riskLevel === "P1"))
  ) {
    return "multiple_customers";
  }
  if (eventType === "weekly_briefing") return "none";
  if (
    eventType === "billing" ||
    eventType === "customer_support" ||
    eventType === "report_quality" ||
    eventType === "legal_data_policy"
  ) {
    return "single_customer";
  }
  return "unknown";
}

function defaultRevenueImpact(
  eventType: AgentOpsEventType,
  riskLevel: AgentOpsRiskLevel
): AgentOpsRevenueImpact {
  if (eventType === "billing") {
    return riskLevel === "P0" ? "confirmed" : "possible";
  }
  if (eventType === "system_health" && riskLevel === "P0") return "possible";
  if (eventType === "weekly_briefing") return "none";
  return "none";
}

function defaultProductionSensitivity(
  eventType: AgentOpsEventType,
  riskLevel: AgentOpsRiskLevel,
  approvalLevel: AgentOpsApprovalLevel
): AgentOpsProductionSensitivity {
  if (approvalLevel === "Level 3") return "high";
  if (eventType === "security" || eventType === "legal_data_policy") return "high";
  if (eventType === "system_health") {
    return riskLevel === "P0" || riskLevel === "P1" ? "medium" : "low";
  }
  if (eventType === "billing" && (riskLevel === "P0" || riskLevel === "P1")) return "medium";
  if (eventType === "weekly_briefing") return "none";
  return "low";
}

// --- Sub-builders ---

function buildApprovalRequest(
  approvalLevel: AgentOpsApprovalLevel,
  blockedActions: string[],
  nowIso: string
): AgentOpsApprovalRequest {
  if (approvalLevel === "Level 3") {
    return {
      required: true,
      reason:
        blockedActions.length > 0
          ? `Blocked actions require explicit approval: ${blockedActions.join(", ")}.`
          : "Level 3 action requires hard approval before proceeding.",
      requested_at: nowIso,
      decision: null,
      decided_at: null,
    };
  }
  if (approvalLevel === "Level 2") {
    return {
      required: true,
      reason: "Level 2 action requires human approval before proceeding.",
      requested_at: nowIso,
      decision: null,
      decided_at: null,
    };
  }
  return {
    required: false,
    reason: null,
    requested_at: null,
    decision: null,
    decided_at: null,
  };
}

function buildWeeklyBriefing(
  riskLevel: AgentOpsRiskLevel,
  briefingPriority: AgentOpsBriefingPriority,
  eventSummary: string
): AgentOpsWeeklyBriefing {
  const include = riskLevel !== "P3" && briefingPriority !== "none";
  return {
    include,
    summary: include ? eventSummary.slice(0, 200) : null,
    priority: briefingPriority,
  };
}

function buildEventSummary(input: AgentOpsEventInput): string {
  const parts: string[] = [input.title];
  if (input.description) parts.push(input.description);
  const raw = parts.join(" — ").slice(0, 500);
  return redactUnsafeValues(raw);
}

// --- Main Builder ---

export function buildAgentOpsLog(
  input: AgentOpsEventInput,
  classification: AgentOpsClassification,
  options: AgentOpsLogOptions = {}
): AgentOpsLog {
  const now = new Date();
  const nowIso = now.toISOString();
  const taskId = generateTaskId(now);
  const eventSummary = buildEventSummary(input);

  const customerImpact =
    options.customerImpact ??
    defaultCustomerImpact(classification.eventType, classification.riskLevel);
  const revenueImpact =
    options.revenueImpact ??
    defaultRevenueImpact(classification.eventType, classification.riskLevel);
  const productionSensitivity =
    options.productionSensitivity ??
    defaultProductionSensitivity(
      classification.eventType,
      classification.riskLevel,
      classification.approvalLevel
    );

  return {
    task_id: taskId,
    created_at: nowIso,
    updated_at: nowIso,
    agentmail_thread_id:
      options.agentmailThreadId != null
        ? redactUnsafeValues(options.agentmailThreadId)
        : null,
    source: options.source ? redactUnsafeValues(options.source) : "internal",
    source_reference:
      options.sourceReference != null
        ? redactUnsafeValues(options.sourceReference)
        : null,
    event_type: classification.eventType,
    event_summary: eventSummary,
    customer_reference:
      options.customerReference != null
        ? redactUnsafeValues(options.customerReference)
        : null,
    customer_impact: customerImpact,
    revenue_impact: revenueImpact,
    production_sensitivity: productionSensitivity,
    risk_level: classification.riskLevel,
    approval_level: classification.approvalLevel,
    primary_agent: classification.primaryAgent,
    secondary_agent: classification.secondaryAgent,
    status: classification.status,
    allowed_actions: [...classification.allowedActions],
    blocked_actions: [...classification.blockedActions],
    approval_request: buildApprovalRequest(
      classification.approvalLevel,
      classification.blockedActions,
      nowIso
    ),
    messages_sent: [],
    weekly_briefing: buildWeeklyBriefing(
      classification.riskLevel,
      classification.briefingPriority,
      eventSummary
    ),
    final_outcome: null,
  };
}
