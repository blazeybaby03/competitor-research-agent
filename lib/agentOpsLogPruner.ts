// Draft-only local dev log pruner.
// Removes .agent-ops/logs/YYYY-MM-DD.jsonl files older than daysToKeep days.
// Never touches production systems, Supabase, Stripe, or AgentMail.

import { readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_LOG_DIR } from "./agentOpsLogWriter";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AgentOpsLogPruneOptions {
  logDir?: string;
  now?: Date;
  dryRun?: boolean;
}

export interface AgentOpsLogPruneResult {
  deleted: string[];
  kept: string[];
  dryRun: boolean;
}

export class InvalidDaysToKeepError extends Error {
  constructor(value: unknown) {
    super(
      `daysToKeep must be a safe positive integer, got: ${String(value)} (${typeof value})`
    );
    this.name = "InvalidDaysToKeepError";
  }
}

export class ProductionPruneBlockedError extends Error {
  constructor() {
    super(
      "AgentOps log pruner is draft-only and must not run in production (NODE_ENV=production)."
    );
    this.name = "ProductionPruneBlockedError";
  }
}

function validateDaysToKeep(value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new InvalidDaysToKeepError(value);
  }
}

// Returns the parsed UTC midnight date from a YYYY-MM-DD.jsonl filename, or
// null if the filename does not match the expected pattern.
export function parseLogFileDate(filename: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2})\.jsonl$/.exec(filename);
  if (!match) return null;
  const d = new Date(match[1] + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

export function pruneAgentOpsLogs(
  daysToKeep: number,
  options: AgentOpsLogPruneOptions = {}
): AgentOpsLogPruneResult {
  if (process.env.NODE_ENV === "production") {
    throw new ProductionPruneBlockedError();
  }

  validateDaysToKeep(daysToKeep);

  const logDir = options.logDir ?? DEFAULT_LOG_DIR;
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;

  // Midnight UTC of today, used for age calculation.
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  let filenames: string[];
  try {
    filenames = readdirSync(logDir);
  } catch {
    // Directory does not exist yet — nothing to prune.
    return { deleted: [], kept: [], dryRun };
  }

  const deleted: string[] = [];
  const kept: string[] = [];

  for (const filename of filenames) {
    const fileDate = parseLogFileDate(filename);
    if (!fileDate) continue; // Not a YYYY-MM-DD.jsonl file — skip.

    const filePath = join(logDir, filename);
    const ageInDays = Math.floor((todayMs - fileDate.getTime()) / MS_PER_DAY);

    if (ageInDays >= daysToKeep) {
      if (!dryRun) {
        unlinkSync(filePath);
      }
      deleted.push(filePath);
    } else {
      kept.push(filePath);
    }
  }

  return { deleted, kept, dryRun };
}
