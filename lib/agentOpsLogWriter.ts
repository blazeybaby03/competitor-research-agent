// Draft-only local dev log writer.
// Writes redacted AgentOpsLog objects to .agent-ops/logs/YYYY-MM-DD.jsonl.
// Never writes to production systems, Supabase, Stripe, or AgentMail.
// The .agent-ops/logs/ directory is in .gitignore and is never committed.

import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentOpsLog } from "./agentOpsLogBuilder";
import { redactUnsafeValues } from "./agentOpsLogBuilder";

export const DEFAULT_LOG_DIR = ".agent-ops/logs";

export interface AgentOpsLogWriteOptions {
  logDir?: string;
  now?: Date;
}

export class ProductionWriteBlockedError extends Error {
  constructor() {
    super(
      "AgentOps log writer is draft-only and must not run in production (NODE_ENV=production)."
    );
    this.name = "ProductionWriteBlockedError";
  }
}

export function getLogFilePath(logDir: string, date: Date): string {
  const dateStr = date.toISOString().slice(0, 10);
  return join(logDir, `${dateStr}.jsonl`);
}

export function writeAgentOpsLog(
  log: AgentOpsLog,
  options: AgentOpsLogWriteOptions = {}
): string {
  // Guard: refuse to write if running in production.
  if (process.env.NODE_ENV === "production") {
    throw new ProductionWriteBlockedError();
  }

  const logDir = options.logDir ?? DEFAULT_LOG_DIR;
  const now = options.now ?? new Date();
  const filePath = getLogFilePath(logDir, now);

  // Serialize the log and apply a final redaction pass over the full JSON
  // string. This catches any unsafe values that were set on the log object
  // after it was built (e.g., during testing or direct field mutation).
  const rawJson = JSON.stringify(log);
  const safeJson = redactUnsafeValues(rawJson);

  mkdirSync(logDir, { recursive: true });
  appendFileSync(filePath, safeJson + "\n", "utf8");

  return filePath;
}
