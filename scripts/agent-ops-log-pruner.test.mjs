import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test, { before, after } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);

function loadTypeScriptModule(file, extraModules = {}, contextOverrides = {}) {
  const source = readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: file,
  }).outputText;

  const compiledModule = { exports: {} };

  function customRequire(id) {
    if (Object.prototype.hasOwnProperty.call(extraModules, id)) {
      return extraModules[id];
    }
    return nativeRequire(id);
  }

  vm.runInNewContext(output, {
    exports: compiledModule.exports,
    module: compiledModule,
    require: customRequire,
    process,
    Date,
    Math,
    __dirname: dirname(resolve(file)),
    __filename: resolve(file),
    ...contextOverrides,
  });

  return compiledModule.exports;
}

// Load dependency chain.
const logBuilderModule = loadTypeScriptModule("lib/agentOpsLogBuilder.ts");
const writerModule = loadTypeScriptModule("lib/agentOpsLogWriter.ts", {
  "./agentOpsLogBuilder": logBuilderModule,
});
const prunerModule = loadTypeScriptModule("lib/agentOpsLogPruner.ts", {
  "./agentOpsLogWriter": writerModule,
});

const {
  pruneAgentOpsLogs,
  parseLogFileDate,
  InvalidDaysToKeepError,
  ProductionPruneBlockedError,
} = prunerModule;

// Shared temp directory — created once, torn down after all tests.
let TEST_LOG_DIR;

before(() => {
  TEST_LOG_DIR = mkdtempSync(join(tmpdir(), "agent-ops-pruner-test-"));
});

after(() => {
  try {
    rmSync(TEST_LOG_DIR, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

// Fixed reference date for all date-sensitive tests.
const TEST_NOW = new Date("2026-06-10T12:00:00Z");

// Helper: create a minimal .jsonl file with a given date name in a directory.
function createLogFile(dir, dateStr) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${dateStr}.jsonl`), `{"date":"${dateStr}"}\n`, "utf8");
}

// Helper: extract filenames from result path arrays.
// Returns a plain host-realm Array (spread from vm array) so assert.equal
// and .includes() work correctly across vm contexts.
function fileNames(paths) {
  return [...paths].map((p) => p.split(/[\\/]/).pop());
}

// --- parseLogFileDate ---

test("parseLogFileDate returns a Date for a valid YYYY-MM-DD.jsonl filename", () => {
  const d = parseLogFileDate("2026-06-06.jsonl");
  assert.ok(d instanceof Date);
  assert.equal(d.toISOString(), "2026-06-06T00:00:00.000Z");
});

test("parseLogFileDate returns null for non-matching filenames", () => {
  assert.equal(parseLogFileDate("README.md"), null);
  assert.equal(parseLogFileDate("2026-06-06.json"), null);
  assert.equal(parseLogFileDate("2026-06-06.jsonl.bak"), null);
  assert.equal(parseLogFileDate("not-a-date.jsonl"), null);
  assert.equal(parseLogFileDate(".DS_Store"), null);
  assert.equal(parseLogFileDate(""), null);
});

test("parseLogFileDate returns null for an invalid date string", () => {
  assert.equal(parseLogFileDate("2026-99-99.jsonl"), null);
});

// --- daysToKeep validation ---

test("pruneAgentOpsLogs throws InvalidDaysToKeepError for zero", () => {
  assert.throws(
    () => pruneAgentOpsLogs(0, { logDir: TEST_LOG_DIR }),
    (e) => e.name === "InvalidDaysToKeepError"
  );
});

test("pruneAgentOpsLogs throws InvalidDaysToKeepError for a negative number", () => {
  assert.throws(
    () => pruneAgentOpsLogs(-1, { logDir: TEST_LOG_DIR }),
    (e) => e.name === "InvalidDaysToKeepError"
  );
});

test("pruneAgentOpsLogs throws InvalidDaysToKeepError for a float", () => {
  assert.throws(
    () => pruneAgentOpsLogs(7.5, { logDir: TEST_LOG_DIR }),
    (e) => e.name === "InvalidDaysToKeepError"
  );
});

test("pruneAgentOpsLogs throws InvalidDaysToKeepError for a string", () => {
  assert.throws(
    () => pruneAgentOpsLogs("7", { logDir: TEST_LOG_DIR }),
    (e) => e.name === "InvalidDaysToKeepError"
  );
});

test("pruneAgentOpsLogs throws InvalidDaysToKeepError for NaN", () => {
  assert.throws(
    () => pruneAgentOpsLogs(NaN, { logDir: TEST_LOG_DIR }),
    (e) => e.name === "InvalidDaysToKeepError"
  );
});

test("pruneAgentOpsLogs throws InvalidDaysToKeepError for Infinity", () => {
  assert.throws(
    () => pruneAgentOpsLogs(Infinity, { logDir: TEST_LOG_DIR }),
    (e) => e.name === "InvalidDaysToKeepError"
  );
});

test("pruneAgentOpsLogs throws InvalidDaysToKeepError for Number.MAX_SAFE_INTEGER + 1", () => {
  assert.throws(
    () => pruneAgentOpsLogs(Number.MAX_SAFE_INTEGER + 1, { logDir: TEST_LOG_DIR }),
    (e) => e.name === "InvalidDaysToKeepError"
  );
});

test("pruneAgentOpsLogs accepts 1 as a valid daysToKeep", () => {
  const dir = join(TEST_LOG_DIR, "valid-1");
  mkdirSync(dir);
  assert.doesNotThrow(() => pruneAgentOpsLogs(1, { logDir: dir, now: TEST_NOW }));
});

test("pruneAgentOpsLogs accepts 365 as a valid daysToKeep", () => {
  const dir = join(TEST_LOG_DIR, "valid-365");
  mkdirSync(dir);
  assert.doesNotThrow(() => pruneAgentOpsLogs(365, { logDir: dir, now: TEST_NOW }));
});

// --- Core pruning logic ---

test("files older than daysToKeep days are deleted", () => {
  const dir = join(TEST_LOG_DIR, "prune-old");
  // age 7 and 8 days should be deleted with daysToKeep=7
  createLogFile(dir, "2026-06-03"); // age 7 — delete
  createLogFile(dir, "2026-06-02"); // age 8 — delete

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  assert.equal(result.deleted.length, 2);
  assert.ok(!existsSync(join(dir, "2026-06-03.jsonl")));
  assert.ok(!existsSync(join(dir, "2026-06-02.jsonl")));
  assert.deepEqual(fileNames(result.deleted).sort(), ["2026-06-02.jsonl", "2026-06-03.jsonl"]);
});

test("files within daysToKeep days are kept", () => {
  const dir = join(TEST_LOG_DIR, "prune-keep");
  // ages 0, 1, 6 are all < 7 — keep
  createLogFile(dir, "2026-06-10"); // age 0
  createLogFile(dir, "2026-06-09"); // age 1
  createLogFile(dir, "2026-06-04"); // age 6

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  assert.equal(result.deleted.length, 0);
  assert.equal(result.kept.length, 3);
  assert.ok(existsSync(join(dir, "2026-06-10.jsonl")));
  assert.ok(existsSync(join(dir, "2026-06-09.jsonl")));
  assert.ok(existsSync(join(dir, "2026-06-04.jsonl")));
});

test("exactly daysToKeep days old is deleted (boundary condition)", () => {
  const dir = join(TEST_LOG_DIR, "prune-boundary");
  createLogFile(dir, "2026-06-03"); // age exactly 7 — delete
  createLogFile(dir, "2026-06-04"); // age 6 — keep

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  assert.equal(result.deleted.length, 1);
  assert.equal(result.kept.length, 1);
  assert.deepEqual(fileNames(result.deleted), ["2026-06-03.jsonl"]);
  assert.deepEqual(fileNames(result.kept), ["2026-06-04.jsonl"]);
});

test("mixed old and recent files are handled correctly", () => {
  const dir = join(TEST_LOG_DIR, "prune-mixed");
  createLogFile(dir, "2026-06-10"); // age 0 — keep
  createLogFile(dir, "2026-06-09"); // age 1 — keep
  createLogFile(dir, "2026-06-04"); // age 6 — keep
  createLogFile(dir, "2026-06-03"); // age 7 — delete
  createLogFile(dir, "2026-05-11"); // age 30 — delete

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  assert.equal(result.deleted.length, 2);
  assert.equal(result.kept.length, 3);
  assert.ok(fileNames(result.deleted).includes("2026-06-03.jsonl"));
  assert.ok(fileNames(result.deleted).includes("2026-05-11.jsonl"));
});

test("future-dated files are not deleted", () => {
  const dir = join(TEST_LOG_DIR, "prune-future");
  createLogFile(dir, "2026-06-15"); // 5 days in the future — keep
  createLogFile(dir, "2026-06-01"); // age 9 — delete

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  assert.ok(existsSync(join(dir, "2026-06-15.jsonl")), "future-dated file must not be deleted");
  assert.equal(fileNames(result.deleted).includes("2026-06-15.jsonl"), false);
  assert.ok(fileNames(result.deleted).includes("2026-06-01.jsonl"));
});

test("non-JSONL files and non-date files in the directory are ignored", () => {
  const dir = join(TEST_LOG_DIR, "prune-ignore");
  createLogFile(dir, "2026-06-01"); // old — will be deleted
  writeFileSync(join(dir, "README.md"), "# notes");
  writeFileSync(join(dir, ".DS_Store"), "");
  writeFileSync(join(dir, "2026-06-06.json"), "{}"); // .json not .jsonl
  writeFileSync(join(dir, "notes.jsonl"), "not-a-date");

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  // Only the valid old JSONL file is deleted; others are left alone.
  assert.equal(result.deleted.length, 1);
  assert.deepEqual(fileNames(result.deleted), ["2026-06-01.jsonl"]);
  assert.ok(existsSync(join(dir, "README.md")));
  assert.ok(existsSync(join(dir, "2026-06-06.json")));
  assert.ok(existsSync(join(dir, "notes.jsonl")));
});

test("pruneAgentOpsLogs returns empty result when directory does not exist", () => {
  const dir = join(TEST_LOG_DIR, "nonexistent-dir-xyz");
  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  assert.equal(result.deleted.length, 0);
  assert.equal(result.kept.length, 0);
  assert.equal(result.dryRun, false);
});

test("pruneAgentOpsLogs returns empty result when directory is empty", () => {
  const dir = join(TEST_LOG_DIR, "empty-dir");
  mkdirSync(dir);

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW });

  assert.equal(result.deleted.length, 0);
  assert.equal(result.kept.length, 0);
});

// --- Dry run ---

test("dryRun: true reports deletions but does not delete files", () => {
  const dir = join(TEST_LOG_DIR, "dry-run");
  createLogFile(dir, "2026-06-01"); // age 9 — would be deleted
  createLogFile(dir, "2026-06-10"); // age 0 — would be kept

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW, dryRun: true });

  assert.equal(result.dryRun, true);
  assert.equal(result.deleted.length, 1);
  assert.equal(result.kept.length, 1);

  // Files must still exist — dry run only reports.
  assert.ok(existsSync(join(dir, "2026-06-01.jsonl")), "dry run must not delete files");
  assert.ok(existsSync(join(dir, "2026-06-10.jsonl")));
});

test("dryRun: false (default) actually deletes files", () => {
  const dir = join(TEST_LOG_DIR, "wet-run");
  createLogFile(dir, "2026-06-01");

  const result = pruneAgentOpsLogs(7, { logDir: dir, now: TEST_NOW, dryRun: false });

  assert.equal(result.dryRun, false);
  assert.equal(result.deleted.length, 1);
  assert.ok(!existsSync(join(dir, "2026-06-01.jsonl")), "file must be deleted");
});

// --- daysToKeep boundary variants ---

test("daysToKeep: 1 keeps only today", () => {
  const dir = join(TEST_LOG_DIR, "days-1");
  createLogFile(dir, "2026-06-10"); // age 0 — keep
  createLogFile(dir, "2026-06-09"); // age 1 — delete

  const result = pruneAgentOpsLogs(1, { logDir: dir, now: TEST_NOW });

  assert.equal(result.kept.length, 1);
  assert.equal(result.deleted.length, 1);
  assert.deepEqual(fileNames(result.kept), ["2026-06-10.jsonl"]);
});

test("daysToKeep: 30 deletes files older than 30 days", () => {
  const dir = join(TEST_LOG_DIR, "days-30");
  createLogFile(dir, "2026-05-11"); // age 30 — delete
  createLogFile(dir, "2026-05-12"); // age 29 — keep

  const result = pruneAgentOpsLogs(30, { logDir: dir, now: TEST_NOW });

  assert.equal(result.deleted.length, 1);
  assert.deepEqual(fileNames(result.deleted), ["2026-05-11.jsonl"]);
  assert.deepEqual(fileNames(result.kept), ["2026-05-12.jsonl"]);
});

// --- Production guard ---

test("pruneAgentOpsLogs throws ProductionPruneBlockedError when NODE_ENV is production", () => {
  const dir = join(TEST_LOG_DIR, "prod-guard");
  mkdirSync(dir, { recursive: true });
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.throws(
      () => pruneAgentOpsLogs(7, { logDir: dir }),
      (e) => {
        assert.equal(e.name, "ProductionPruneBlockedError");
        assert.match(e.message, /draft-only/);
        return true;
      }
    );
  } finally {
    if (prev === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prev;
    }
  }
});

// --- Source safety ---

test("pruner source has no live remote calls", () => {
  const source = readFileSync("lib/agentOpsLogPruner.ts", "utf8");

  assert.doesNotMatch(source, /\bfetch\b/, "must not use fetch");
  assert.doesNotMatch(source, /XMLHttpRequest/, "must not use XMLHttpRequest");
  assert.doesNotMatch(source, /supabase\s*\.\s*from/, "must not call Supabase");
  assert.doesNotMatch(source, /new Stripe/, "must not initialise Stripe");
  assert.doesNotMatch(source, /agentmail\s*\.\s*send/, "must not send AgentMail");
  assert.doesNotMatch(source, /writeFileSync|appendFileSync/, "must not write new files");
});
