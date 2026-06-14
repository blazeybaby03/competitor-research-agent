#!/usr/bin/env node
/**
 * scripts/agent-ops-dev-sample.mjs
 *
 * Local dev tool — classifies, builds, and logs sample Agent Ops events.
 * Run: node scripts/agent-ops-dev-sample.mjs
 *
 * Output: .agent-ops/logs/YYYY-MM-DD.jsonl  (gitignored, never committed)
 *
 * This script is draft-only. It writes nothing in production.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

if (process.env.NODE_ENV === "production") {
  console.error("[agent-ops-dev-sample] This script is dev-only. Exiting.");
  process.exit(1);
}

const nativeRequire = createRequire(import.meta.url);

function loadTypeScriptModule(file, extraModules = {}) {
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
    require: (id) => {
      if (Object.prototype.hasOwnProperty.call(extraModules, id)) return extraModules[id];
      return nativeRequire(id);
    },
    process,
    Date,
    Math,
    __dirname: dirname(resolve(file)),
    __filename: resolve(file),
  });
  return compiledModule.exports;
}

// Load modules in dependency order.
const { classifyAgentOpsEvent } = loadTypeScriptModule("lib/agentOpsClassifier.ts");
const logBuilderModule = loadTypeScriptModule("lib/agentOpsLogBuilder.ts");
const { buildAgentOpsLog } = logBuilderModule;
const { writeAgentOpsLog } = loadTypeScriptModule("lib/agentOpsLogWriter.ts", {
  "./agentOpsLogBuilder": logBuilderModule,
});

// ---------------------------------------------------------------------------
// Sample events — representative of the range of event types and risk levels.
// ---------------------------------------------------------------------------

const SAMPLES = [
  {
    label: "Checkout recovery (billing P2 Level 1 — routine send allowed)",
    input: {
      title: "Checkout abandoned",
      description:
        "Customer started checkout but no subscription was created. Send checkout recovery email.",
      requestedAction: "checkout recovery",
    },
  },
  {
    label: "P0 webhook failure (billing P0 Level 3 — approval required)",
    input: {
      title: "Stripe webhook failing",
      description:
        "Production subscription updates are not syncing from Stripe webhook events.",
      requestedAction: "Change Stripe webhook configuration",
    },
  },
  {
    label: "Onboarding question (customer_support P3 Level 1 — routine reply)",
    input: {
      title: "New user onboarding",
      description: "User asks how to enter competitor URLs and get started.",
      requestedAction: "Send onboarding reply and routine troubleshooting guidance.",
    },
  },
  {
    label: "Weekly briefing (weekly_briefing P3 Level 0 — draft only)",
    input: {
      title: "Weekly operating summary",
      description: "Prepare the weekly briefing from agent logs.",
    },
  },
  {
    label: "Redaction demo — email and card number are scrubbed before write",
    input: {
      title: "Sensitive data in customer report",
      description:
        "Contact admin@example.com for follow-up. Card 4242 4242 4242 4242 appeared in debug output.",
    },
  },
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log("");
console.log("CompeteIQ Agent Ops — Dev Sample Runner");
console.log("========================================");
console.log(`Writing ${SAMPLES.length} sample events to .agent-ops/logs/\n`);

let writtenPath = null;

for (let i = 0; i < SAMPLES.length; i++) {
  const { label, input } = SAMPLES[i];
  const num = `[${i + 1}/${SAMPLES.length}]`;

  try {
    const classification = classifyAgentOpsEvent(input);
    const log = buildAgentOpsLog(input, classification);
    const filePath = writeAgentOpsLog(log);

    writtenPath = filePath;

    const approvalNote =
      log.approval_request.required
        ? `REQUIRED — ${log.blocked_actions.slice(0, 2).join(", ")}${log.blocked_actions.length > 2 ? "…" : ""}`
        : "not required";

    console.log(`${num} ${label}`);
    console.log(
      `      ${log.event_type} ${log.risk_level} ${log.approval_level} → ${log.primary_agent}`
    );
    console.log(
      `      status: ${log.status} | briefing: ${log.weekly_briefing.priority} | approval: ${approvalNote}`
    );

    // For the redaction demo: show what was cleaned.
    if (i === SAMPLES.length - 1) {
      const hasEmail = log.event_summary.includes("[REDACTED:email]");
      const hasCard = log.event_summary.includes("[REDACTED:card-number]");
      console.log(
        `      redaction: email=${hasEmail ? "scrubbed" : "MISSED"}, card=${hasCard ? "scrubbed" : "MISSED"}`
      );
    }

    console.log(`      task_id: ${log.task_id}`);
    console.log("");
  } catch (err) {
    console.error(`${num} FAILED: ${err.message}`);
  }
}

if (writtenPath) {
  const dir = writtenPath.replace(/[\\/][^\\/]+$/, "");
  const file = writtenPath.split(/[\\/]/).pop();
  console.log(`Log file: ${writtenPath}`);
  console.log(`All writes are local and gitignored (.agent-ops/logs/ is in .gitignore).`);
  console.log("Safe to commit — no log content will be staged.");
}
console.log("");
