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
  });
  return compiledModule.exports;
}

const { classifyAgentOpsEvent } = loadTypeScriptModule("lib/agentOpsClassifier.ts");

function classify(input) {
  return classifyAgentOpsEvent(input);
}

test("agent ops classifier routes routine checkout recovery as approved Level 1 billing communication", () => {
  const result = classify({
    title: "Checkout abandoned",
    description: "Customer started checkout but no subscription was created. Send checkout recovery email.",
    requestedAction: "checkout recovery",
  });

  assert.equal(result.eventType, "billing");
  assert.equal(result.riskLevel, "P2");
  assert.equal(result.approvalLevel, "Level 1");
  assert.equal(result.primaryAgent, "Revenue & Billing Agent");
  assert.equal(result.secondaryAgent, "Customer Engagement Agent");
  assert.equal(result.status, "routed");
  assert.equal(result.blockedActions.length, 0);
  assert.ok(result.allowedActions.includes("send_approved_routine_agentmail_message"));
});

test("agent ops classifier blocks refunds and discounts behind Level 3 approval", () => {
  const result = classify({
    title: "Refund and discount request",
    description: "Customer asked for a refund and a discount coupon after cancelling.",
  });

  assert.equal(result.eventType, "billing");
  assert.equal(result.riskLevel, "P1");
  assert.equal(result.approvalLevel, "Level 3");
  assert.equal(result.primaryAgent, "Revenue & Billing Agent");
  assert.equal(result.status, "approval_needed");
  assert.ok(result.blockedActions.includes("issue_refund"));
  assert.ok(result.blockedActions.includes("offer_discount"));
  assert.ok(!result.allowedActions.includes("send_approved_routine_agentmail_message"));
});

test("agent ops classifier treats Stripe webhook failures as P0 hard-approval incidents", () => {
  const result = classify({
    title: "Stripe webhook failing",
    description: "Production subscription updates are not syncing from Stripe webhook events.",
    requestedAction: "Change Stripe webhook configuration",
  });

  assert.equal(result.eventType, "billing");
  assert.equal(result.riskLevel, "P0");
  assert.equal(result.approvalLevel, "Level 3");
  assert.equal(result.primaryAgent, "Revenue & Billing Agent");
  assert.equal(result.secondaryAgent, "System Health & Security Agent");
  assert.equal(result.briefingPriority, "critical");
  assert.ok(result.blockedActions.includes("change_stripe_configuration"));
});

test("agent ops classifier blocks data deletion and legal requests under Lead Operations", () => {
  const result = classify({
    title: "Data deletion request",
    description: "Customer sent a legal request asking us to delete customer data.",
  });

  assert.equal(result.eventType, "legal_data_policy");
  assert.equal(result.riskLevel, "P0");
  assert.equal(result.approvalLevel, "Level 3");
  assert.equal(result.primaryAgent, "Lead Operations Agent");
  assert.equal(result.secondaryAgent, "Customer Engagement Agent");
  assert.ok(result.blockedActions.includes("handle_legal_or_data_request"));
  assert.ok(result.blockedActions.includes("delete_customer_data_or_run_destructive_script"));
});

test("agent ops classifier blocks production AI prompt and model changes", () => {
  const result = classify({
    title: "Report quality prompt change",
    description: "Thin reports suggest we should update the production prompt and switch Claude model settings.",
  });

  assert.equal(result.eventType, "report_quality");
  assert.equal(result.riskLevel, "P1");
  assert.equal(result.approvalLevel, "Level 3");
  assert.equal(result.primaryAgent, "Report Quality Agent");
  assert.equal(result.secondaryAgent, "System Health & Security Agent");
  assert.ok(result.blockedActions.includes("change_production_ai_prompt"));
  assert.ok(result.blockedActions.includes("change_model_settings"));
});

test("agent ops classifier blocks Supabase RLS and environment variable changes", () => {
  const result = classify({
    title: "Supabase RLS update",
    description: "Need to change Supabase RLS and add a Vercel env variable.",
  });

  assert.equal(result.eventType, "security");
  assert.equal(result.riskLevel, "P0");
  assert.equal(result.approvalLevel, "Level 3");
  assert.equal(result.primaryAgent, "System Health & Security Agent");
  assert.ok(result.blockedActions.includes("change_supabase_security"));
  assert.ok(result.blockedActions.includes("change_environment_variables"));
});

test("agent ops classifier allows routine onboarding support through Customer Engagement", () => {
  const result = classify({
    title: "New user onboarding",
    description: "User asks how to enter competitor URLs and get started.",
    requestedAction: "Send onboarding reply and routine troubleshooting guidance.",
  });

  assert.equal(result.eventType, "customer_support");
  assert.equal(result.riskLevel, "P3");
  assert.equal(result.approvalLevel, "Level 1");
  assert.equal(result.primaryAgent, "Customer Engagement Agent");
  assert.equal(result.secondaryAgent, "Lead Operations Agent");
  assert.equal(result.blockedActions.length, 0);
});

test("agent ops classifier keeps weekly summaries as Level 0 internal work", () => {
  const result = classify({
    title: "Weekly operating summary",
    description: "Prepare the weekly briefing from agent logs.",
  });

  assert.equal(result.eventType, "weekly_briefing");
  assert.equal(result.riskLevel, "P3");
  assert.equal(result.approvalLevel, "Level 0");
  assert.equal(result.primaryAgent, "Weekly Briefing Agent");
  assert.equal(result.secondaryAgent, "Lead Operations Agent");
  assert.equal(result.status, "triaged");
  assert.ok(result.allowedActions.includes("draft_internal_summary"));
});
