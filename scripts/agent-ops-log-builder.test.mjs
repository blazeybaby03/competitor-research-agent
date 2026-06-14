import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadTypeScriptModule(file) {
  const source = readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: file,
  }).outputText;

  const compiledModule = { exports: {} };
  vm.runInNewContext(output, {
    exports: compiledModule.exports,
    module: compiledModule,
    Date,
    Math,
  });
  return compiledModule.exports;
}

const { classifyAgentOpsEvent } = loadTypeScriptModule("lib/agentOpsClassifier.ts");
const { buildAgentOpsLog, redactUnsafeValues } = loadTypeScriptModule("lib/agentOpsLogBuilder.ts");

function classify(input) {
  return classifyAgentOpsEvent(input);
}

function build(input, options) {
  return buildAgentOpsLog(input, classify(input), options ?? {});
}

// --- Core log structure ---

test("log builder returns a safe log object for a routine checkout recovery event", () => {
  const input = {
    title: "Checkout abandoned",
    description: "Customer started checkout but no subscription was created. Send checkout recovery email.",
    requestedAction: "checkout recovery",
  };
  const log = build(input);

  assert.match(log.task_id, /^ops_\d{8}_[a-z0-9]{6}$/, "task_id should match ops_YYYYMMDD_shortid format");
  assert.match(log.created_at, /^\d{4}-\d{2}-\d{2}T/, "created_at should be ISO timestamp");
  assert.match(log.updated_at, /^\d{4}-\d{2}-\d{2}T/, "updated_at should be ISO timestamp");
  assert.equal(log.event_type, "billing");
  assert.equal(log.risk_level, "P2");
  assert.equal(log.approval_level, "Level 1");
  assert.equal(log.primary_agent, "Revenue & Billing Agent");
  assert.equal(log.secondary_agent, "Customer Engagement Agent");
  assert.equal(log.status, "routed");
  assert.equal(log.approval_request.required, false);
  assert.equal(log.approval_request.reason, null);
  assert.equal(log.approval_request.requested_at, null);
  assert.equal(Array.isArray(log.messages_sent), true);
  assert.equal(log.messages_sent.length, 0, "messages_sent must start empty — no live sends");
  assert.equal(log.final_outcome, null);
  assert.equal(typeof log.event_summary, "string");
  assert.ok(log.event_summary.length > 0);
});

// --- Approval gate enforcement ---

test("Level 3 refund and discount event creates approval_request.required true", () => {
  const input = {
    title: "Refund and discount request",
    description: "Customer asked for a refund and a discount coupon after cancelling.",
  };
  const log = build(input);

  assert.equal(log.approval_level, "Level 3");
  assert.equal(log.approval_request.required, true);
  assert.ok(log.approval_request.reason !== null, "reason must be set for Level 3");
  assert.ok(log.approval_request.requested_at !== null, "requested_at must be set for Level 3");
  assert.equal(log.approval_request.decision, null);
  assert.equal(log.approval_request.decided_at, null);
  assert.ok(
    log.blocked_actions.includes("issue_refund"),
    "issue_refund must be blocked"
  );
  assert.ok(
    log.blocked_actions.includes("offer_discount"),
    "offer_discount must be blocked"
  );
});

test("Level 2 event creates approval_request.required true with Level 2 reason", () => {
  const input = {
    title: "Update public help docs",
    description: "We want to update the public support documentation.",
  };
  const log = build(input);

  assert.equal(log.approval_level, "Level 2");
  assert.equal(log.approval_request.required, true);
  assert.ok(log.approval_request.reason !== null);
  assert.ok(log.approval_request.reason.includes("Level 2"));
});

test("Level 0 and Level 1 events have approval_request.required false", () => {
  const weekly = build({ title: "Weekly operating summary", description: "Prepare the weekly briefing." });
  assert.equal(weekly.approval_request.required, false);

  const checkout = build({
    title: "Checkout recovery",
    description: "Send checkout recovery email.",
    requestedAction: "checkout recovery",
  });
  assert.equal(checkout.approval_request.required, false);
});

// --- Weekly briefing ---

test("P0 incident gets weekly_briefing priority critical and include true", () => {
  const input = {
    title: "Stripe webhook failing",
    description: "Production subscription updates are not syncing from Stripe webhook events.",
    requestedAction: "Change Stripe webhook configuration",
  };
  const log = build(input);

  assert.equal(log.risk_level, "P0");
  assert.equal(log.weekly_briefing.priority, "critical");
  assert.equal(log.weekly_briefing.include, true);
  assert.ok(log.weekly_briefing.summary !== null);
  assert.ok(typeof log.weekly_briefing.summary === "string");
});

test("P1 incident gets weekly_briefing priority high", () => {
  const input = {
    title: "Payment failure pattern",
    description: "Multiple failed payment notifications from Stripe.",
  };
  const log = build(input);

  assert.equal(log.weekly_briefing.priority, "high");
  assert.equal(log.weekly_briefing.include, true);
});

test("P2 event gets weekly_briefing priority normal and include true", () => {
  const log = build({
    title: "Checkout abandoned",
    description: "Customer started checkout but no subscription was created.",
    requestedAction: "checkout recovery",
  });

  assert.equal(log.weekly_briefing.priority, "normal");
  assert.equal(log.weekly_briefing.include, true);
});

test("P3 event gets weekly_briefing include false", () => {
  const log = build({
    title: "Weekly operating summary",
    description: "Prepare the weekly briefing from agent logs.",
  });

  assert.equal(log.weekly_briefing.include, false);
  assert.equal(log.weekly_briefing.summary, null);
  assert.equal(log.weekly_briefing.priority, "none");
});

// --- Redaction ---

test("Stripe live key is redacted from event_summary", () => {
  const key = "sk_" + "live_" + "AbCdEfGhIjKlMnOpQrStUv01";
  const log = build({
    title: "Exposed key found in logs",
    description: `The key ${key} was found in an application log.`,
  });

  assert.doesNotMatch(log.event_summary, /sk_live_/, "sk_live_ key must be redacted");
  assert.match(log.event_summary, /\[REDACTED:stripe-key\]/, "replacement marker must be present");
});

test("Stripe webhook secret is redacted from event_summary", () => {
  const secret = "whsec_AbCdEfGhIjKlMnOpQrStUvWxYz1234567";
  const log = build({
    title: "Webhook config issue",
    description: `Webhook secret ${secret} may have been logged.`,
  });

  assert.doesNotMatch(log.event_summary, /whsec_/, "whsec_ secret must be redacted");
  assert.match(log.event_summary, /\[REDACTED:webhook-secret\]/);
});

test("Anthropic API key is redacted from event_summary", () => {
  const log = build({
    title: "AI key exposure",
    description: "Key sk-ant-AbCdEfGhIjKlMnOpQrStUvWxYz found in debug output.",
  });

  assert.doesNotMatch(log.event_summary, /sk-ant-/);
  assert.match(log.event_summary, /\[REDACTED:anthropic-key\]/);
});

test("JWT-looking token is redacted from event_summary", () => {
  const jwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  const log = build({
    title: "Supabase token found in error trace",
    description: `Token value: ${jwt}`,
  });

  assert.doesNotMatch(log.event_summary, /eyJhbGci/);
  assert.match(log.event_summary, /\[REDACTED:jwt\]/);
});

test("credit card-like numbers are redacted from event_summary", () => {
  const log = build({
    title: "Payment data in log",
    description: "Saw card number 4242 4242 4242 4242 appear in a debug trace.",
  });

  assert.doesNotMatch(log.event_summary, /4242 4242 4242 4242/);
  assert.match(log.event_summary, /\[REDACTED:card-number\]/);
});

test("credit card number without spaces is also redacted", () => {
  const log = build({
    title: "Card in log",
    description: "Card 4111111111111111 was logged.",
  });

  assert.doesNotMatch(log.event_summary, /4111111111111111/);
  assert.match(log.event_summary, /\[REDACTED:card-number\]/);
});

test("email addresses are redacted from event_summary", () => {
  const log = build({
    title: "Support ticket from user",
    description: "Customer user@example.com reported a login issue.",
  });

  assert.doesNotMatch(log.event_summary, /user@example\.com/);
  assert.match(log.event_summary, /\[REDACTED:email\]/);
});

test("email addresses are redacted from source_reference when passed as option", () => {
  const log = build(
    { title: "Support request" },
    { sourceReference: "Thread from support@test-customer.com re: login" }
  );

  assert.doesNotMatch(log.source_reference ?? "", /support@test-customer\.com/);
  assert.match(log.source_reference ?? "", /\[REDACTED:email\]/);
});

test("generic named secret patterns are redacted from event_summary", () => {
  const logApiKey = build({
    title: "Credential in event",
    description: "api_key: someVeryLongApiKeyValue123 was found.",
  });
  assert.doesNotMatch(logApiKey.event_summary, /someVeryLongApiKeyValue123/);
  assert.match(logApiKey.event_summary, /\[REDACTED:api-key\]/);

  const logPassword = build({
    title: "Password in payload",
    description: "password: MySecretPass99 was seen.",
  });
  assert.doesNotMatch(logPassword.event_summary, /MySecretPass99/);
  assert.match(logPassword.event_summary, /\[REDACTED:password\]/);
});

test("redactUnsafeValues is exported and cleans input strings directly", () => {
  const cleaned = redactUnsafeValues("Bearer eyJhbGciOiJIUzI1NiJ9.abc123def456ghi789jkl.mno012pqr345stu678vwx");
  assert.doesNotMatch(cleaned, /eyJhbGci/);

  const withCard = redactUnsafeValues("Payment: 4242 4242 4242 4242");
  assert.match(withCard, /\[REDACTED:card-number\]/);

  const withEmail = redactUnsafeValues("Contact admin@competeiq.com");
  assert.doesNotMatch(withEmail, /admin@competeiq\.com/);
  assert.match(withEmail, /\[REDACTED:email\]/);
});

// --- Classifier passthrough ---

test("allowed actions from classifier are preserved in the log", () => {
  const log = build({
    title: "Checkout abandoned",
    description: "Customer started checkout but no subscription was created.",
    requestedAction: "checkout recovery",
  });

  assert.ok(
    log.allowed_actions.includes("send_approved_routine_agentmail_message"),
    "Level 1 allowed action must be preserved"
  );
});

test("blocked actions from classifier are preserved in the log", () => {
  const log = build({
    title: "Refund and discount request",
    description: "Customer asked for a refund and a discount coupon after cancelling.",
  });

  assert.ok(log.blocked_actions.includes("issue_refund"), "issue_refund must be preserved");
  assert.ok(log.blocked_actions.includes("offer_discount"), "offer_discount must be preserved");
});

test("Level 0 log preserves Level 0 allowed actions", () => {
  const log = build({
    title: "Weekly operating summary",
    description: "Prepare the weekly briefing from agent logs.",
  });

  assert.ok(log.allowed_actions.includes("draft_internal_summary"));
  assert.equal(log.blocked_actions.length, 0);
});

// --- Optional references ---

test("optional agentmailThreadId and sourceReference appear in log", () => {
  const log = build(
    {
      title: "Checkout abandoned",
      description: "Customer started checkout but no subscription was created.",
      requestedAction: "checkout recovery",
    },
    {
      agentmailThreadId: "thread_billing_001",
      sourceReference: "billing-summary-2026-06-06",
      customerReference: "acct_ref_001",
    }
  );

  assert.equal(log.agentmail_thread_id, "thread_billing_001");
  assert.equal(log.source_reference, "billing-summary-2026-06-06");
  assert.equal(log.customer_reference, "acct_ref_001");
});

test("unset options leave null fields", () => {
  const log = build({ title: "Routine check" });

  assert.equal(log.agentmail_thread_id, null);
  assert.equal(log.source_reference, null);
  assert.equal(log.customer_reference, null);
  assert.equal(log.final_outcome, null);
});

// --- No live sends, writes, or deploys ---

test("log builder source has no live send write or deploy behavior", () => {
  const source = readFileSync("lib/agentOpsLogBuilder.ts", "utf8");

  assert.doesNotMatch(source, /\bfetch\b/, "must not use fetch");
  assert.doesNotMatch(source, /XMLHttpRequest/, "must not use XMLHttpRequest");
  assert.doesNotMatch(source, /writeFileSync|appendFileSync|createWriteStream/, "must not write files");
  assert.doesNotMatch(source, /supabase\s*\.\s*from/, "must not call Supabase");
  assert.doesNotMatch(source, /stripe\s*\.\s*(refunds|charges|customers)/, "must not call Stripe");
  assert.doesNotMatch(source, /agentmail\s*\.\s*send/, "must not send AgentMail");
  assert.doesNotMatch(source, /\brequire\s*\(/, "compiled form should not call require at runtime");
});

test("returned log object is a plain data structure with no send or deploy methods", () => {
  const log = build({ title: "Health check", description: "Routine check." });

  assert.equal(typeof log.send, "undefined");
  assert.equal(typeof log.deploy, "undefined");
  assert.equal(typeof log.write, "undefined");
  assert.equal(Array.isArray(log.messages_sent), true);
  assert.equal(log.messages_sent.length, 0, "no messages must be sent at build time");
});
