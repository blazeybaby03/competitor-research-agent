import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test, { before, after } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const __filePath = fileURLToPath(import.meta.url);
const __dir = dirname(__filePath);
const nativeRequire = createRequire(import.meta.url);

// loadTypeScriptModule: compiles a .ts file and runs it in a vm context.
// extraModules: map of module specifier -> pre-compiled module exports, used
// to resolve relative imports that would otherwise need real require() resolution.
// contextOverrides: additional vm context globals (e.g. a mock process).
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

// Load dependencies in order. Each module is compiled once and reused.
const classifierModule = loadTypeScriptModule("lib/agentOpsClassifier.ts");
const logBuilderModule = loadTypeScriptModule("lib/agentOpsLogBuilder.ts");
const { classifyAgentOpsEvent } = classifierModule;
const { buildAgentOpsLog } = logBuilderModule;

const writerModule = loadTypeScriptModule(
  "lib/agentOpsLogWriter.ts",
  { "./agentOpsLogBuilder": logBuilderModule }
);
const { writeAgentOpsLog, getLogFilePath, ProductionWriteBlockedError, DEFAULT_LOG_DIR } =
  writerModule;

// --- Test fixtures ---

let TEST_LOG_DIR;

before(() => {
  TEST_LOG_DIR = mkdtempSync(join(tmpdir(), "agent-ops-log-writer-test-"));
});

after(() => {
  try {
    rmSync(TEST_LOG_DIR, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
});

function makeLog(inputOverrides = {}, logOptions = {}) {
  const input = {
    title: "Checkout abandoned",
    description: "Customer started checkout but no subscription was created.",
    requestedAction: "checkout recovery",
    ...inputOverrides,
  };
  return buildAgentOpsLog(input, classifyAgentOpsEvent(input), logOptions);
}

function readLines(filePath) {
  return readFileSync(filePath, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
}

// --- Path helpers ---

test("getLogFilePath returns YYYY-MM-DD.jsonl inside the log directory", () => {
  const date = new Date("2026-06-06T10:00:00Z");
  const p = getLogFilePath("/some/dir", date);
  assert.match(p, /2026-06-06\.jsonl$/);
  assert.ok(p.includes("some") && p.includes("dir"));
});

test("getLogFilePath uses the date portion only (not time)", () => {
  const morning = getLogFilePath("/logs", new Date("2026-06-06T00:01:00Z"));
  const evening = getLogFilePath("/logs", new Date("2026-06-06T23:59:00Z"));
  assert.equal(morning, evening);
});

// --- Basic write ---

test("writeAgentOpsLog creates the log directory if it does not exist", () => {
  const subDir = join(TEST_LOG_DIR, "new-subdir");
  const log = makeLog();
  writeAgentOpsLog(log, { logDir: subDir, now: new Date("2026-06-06T12:00:00Z") });
  assert.ok(existsSync(subDir));
});

test("writeAgentOpsLog writes a JSONL line to the daily file", () => {
  const log = makeLog();
  const filePath = writeAgentOpsLog(log, {
    logDir: TEST_LOG_DIR,
    now: new Date("2026-06-06T12:00:00Z"),
  });
  assert.ok(existsSync(filePath));
  const lines = readLines(filePath);
  assert.ok(lines.length >= 1);
});

test("writeAgentOpsLog returns the path to the log file", () => {
  const log = makeLog();
  const filePath = writeAgentOpsLog(log, {
    logDir: TEST_LOG_DIR,
    now: new Date("2026-06-07T08:00:00Z"),
  });
  assert.match(filePath, /2026-06-07\.jsonl$/);
});

test("written line is valid JSON and contains expected log fields", () => {
  const log = makeLog();
  const now = new Date("2026-06-07T09:00:00Z");
  const filePath = writeAgentOpsLog(log, { logDir: TEST_LOG_DIR, now });
  const lines = readLines(filePath);
  const last = lines[lines.length - 1];
  const parsed = JSON.parse(last);

  assert.ok(typeof parsed.task_id === "string");
  assert.match(parsed.task_id, /^ops_\d{8}_[a-z0-9]{6}$/);
  assert.equal(parsed.event_type, "billing");
  assert.equal(parsed.risk_level, "P2");
  assert.equal(parsed.approval_level, "Level 1");
  assert.equal(Array.isArray(parsed.allowed_actions), true);
  assert.equal(Array.isArray(parsed.blocked_actions), true);
  assert.equal(Array.isArray(parsed.messages_sent), true);
  assert.equal(parsed.messages_sent.length, 0);
});

test("multiple writes to the same day append separate lines", () => {
  const dayDir = join(TEST_LOG_DIR, "multi");
  const now = new Date("2026-06-08T10:00:00Z");
  writeAgentOpsLog(makeLog(), { logDir: dayDir, now });
  writeAgentOpsLog(makeLog(), { logDir: dayDir, now });
  writeAgentOpsLog(makeLog(), { logDir: dayDir, now });

  const filePath = getLogFilePath(dayDir, now);
  const lines = readLines(filePath);
  assert.equal(lines.length, 3);
  for (const line of lines) {
    assert.doesNotThrow(() => JSON.parse(line), `each line must be valid JSON: ${line}`);
  }
});

test("writes on different days go to separate files", () => {
  const dayDir = join(TEST_LOG_DIR, "multiday");
  writeAgentOpsLog(makeLog(), { logDir: dayDir, now: new Date("2026-06-09T00:00:00Z") });
  writeAgentOpsLog(makeLog(), { logDir: dayDir, now: new Date("2026-06-10T00:00:00Z") });

  assert.ok(existsSync(join(dayDir, "2026-06-09.jsonl")));
  assert.ok(existsSync(join(dayDir, "2026-06-10.jsonl")));
});

// --- Redaction: build-time defense ---

test("logs are redacted before write: Stripe live key in description is not in the file", () => {
  const stripeKey = "sk_" + "live_" + "AbCdEfGhIjKlMnOpQrStUvWxYz01";
  const log = makeLog({
    title: "Exposed key alert",
    description: `Key ${stripeKey} appeared in application output.`,
  });

  // The log builder already redacts at build time.
  assert.doesNotMatch(log.event_summary, /sk_live_/, "log builder must redact before write");

  const now = new Date("2026-06-06T11:00:00Z");
  const filePath = writeAgentOpsLog(log, { logDir: join(TEST_LOG_DIR, "r1"), now });
  const content = readFileSync(filePath, "utf8");

  assert.doesNotMatch(content, /sk_live_/, "file must not contain raw Stripe key");
  assert.match(content, /\[REDACTED:stripe-key\]/, "file must contain redaction marker");
});

test("logs are redacted before write: webhook secret in description is not in the file", () => {
  const secret = "whsec_TestWebhookSecretAbCdEfGhIjKlMnOpQrStUvWx";
  const log = makeLog({ title: "Webhook secret", description: `Using ${secret}` });

  const filePath = writeAgentOpsLog(log, {
    logDir: join(TEST_LOG_DIR, "r2"),
    now: new Date("2026-06-06T11:00:00Z"),
  });
  const content = readFileSync(filePath, "utf8");

  assert.doesNotMatch(content, /whsec_/);
  assert.match(content, /\[REDACTED:webhook-secret\]/);
});

test("logs are redacted before write: email address is not in the file", () => {
  const log = makeLog({
    title: "Support ticket",
    description: "Customer user@example.com reported a login issue.",
  });

  const filePath = writeAgentOpsLog(log, {
    logDir: join(TEST_LOG_DIR, "r3"),
    now: new Date("2026-06-06T11:00:00Z"),
  });
  const content = readFileSync(filePath, "utf8");

  assert.doesNotMatch(content, /user@example\.com/);
  assert.match(content, /\[REDACTED:email\]/);
});

test("logs are redacted before write: credit card number is not in the file", () => {
  const log = makeLog({
    title: "Payment issue",
    description: "Card 4242 4242 4242 4242 appeared in debug output.",
  });

  const filePath = writeAgentOpsLog(log, {
    logDir: join(TEST_LOG_DIR, "r4"),
    now: new Date("2026-06-06T11:00:00Z"),
  });
  const content = readFileSync(filePath, "utf8");

  assert.doesNotMatch(content, /4242 4242 4242 4242/);
  assert.match(content, /\[REDACTED:card-number\]/);
});

// --- Redaction: writer final-pass defense ---

test("writer catches unsafe values injected into a log object after build", () => {
  const log = makeLog();
  // Simulate a caller mutating the log after it was safely built.
  log.event_summary = "Injected secret: " + "sk_" + "live_" + "PostBuildMutatedKey1234567890";

  const filePath = writeAgentOpsLog(log, {
    logDir: join(TEST_LOG_DIR, "post-build"),
    now: new Date("2026-06-06T12:00:00Z"),
  });
  const content = readFileSync(filePath, "utf8");

  assert.doesNotMatch(
    content,
    new RegExp("sk_" + "live_PostBuildMutatedKey"),
    "writer must catch post-build injected Stripe key"
  );
  assert.match(content, /\[REDACTED:stripe-key\]/);
});

test("writer catches JWT injected into source_reference after build", () => {
  const log = makeLog();
  log.source_reference =
    "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  const filePath = writeAgentOpsLog(log, {
    logDir: join(TEST_LOG_DIR, "post-build-jwt"),
    now: new Date("2026-06-06T12:00:00Z"),
  });
  const content = readFileSync(filePath, "utf8");

  assert.doesNotMatch(content, /eyJhbGci/);
  assert.match(content, /\[REDACTED:jwt\]/);
});

test("writer catches card number injected into customer_reference after build", () => {
  const log = makeLog();
  log.customer_reference = "4111-1111-1111-1111";

  const filePath = writeAgentOpsLog(log, {
    logDir: join(TEST_LOG_DIR, "post-build-card"),
    now: new Date("2026-06-06T12:00:00Z"),
  });
  const content = readFileSync(filePath, "utf8");

  assert.doesNotMatch(content, /4111-1111-1111-1111/);
  assert.match(content, /\[REDACTED:card-number\]/);
});

// --- Production guard ---

test("writeAgentOpsLog throws ProductionWriteBlockedError when NODE_ENV is production", () => {
  const log = makeLog();
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.throws(
      () => writeAgentOpsLog(log, { logDir: TEST_LOG_DIR }),
      (err) => {
        assert.equal(err.name, "ProductionWriteBlockedError");
        assert.match(err.message, /draft-only/);
        return true;
      }
    );
  } finally {
    // Always restore so subsequent tests are not affected.
    if (prev === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prev;
    }
  }
});

test("writeAgentOpsLog does not write any file when production guard fires", () => {
  const log = makeLog();
  const guardDir = join(TEST_LOG_DIR, "prod-guard");
  const now = new Date("2026-06-06T15:00:00Z");
  const expectedPath = getLogFilePath(guardDir, now);

  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    try { writeAgentOpsLog(log, { logDir: guardDir, now }); } catch {}
  } finally {
    if (prev === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = prev;
    }
  }

  assert.equal(
    existsSync(expectedPath),
    false,
    "no file should be created when production guard fires"
  );
});

// --- Source safety checks ---

test("log writer source has no live send write-to-remote or deploy behavior", () => {
  const source = readFileSync("lib/agentOpsLogWriter.ts", "utf8");

  assert.doesNotMatch(source, /\bfetch\b/, "must not use fetch");
  assert.doesNotMatch(source, /XMLHttpRequest/, "must not use XMLHttpRequest");
  assert.doesNotMatch(source, /supabase\s*\.\s*from/, "must not call Supabase");
  assert.doesNotMatch(source, /stripe\s*\.\s*(refunds|charges|customers)/, "must not call Stripe");
  assert.doesNotMatch(source, /agentmail\s*\.\s*send/, "must not send AgentMail");
  assert.doesNotMatch(source, /createClient/, "must not initialise a Supabase client");
  assert.doesNotMatch(source, /new Stripe/, "must not initialise Stripe");
});

test("DEFAULT_LOG_DIR points to the local .agent-ops/logs directory", () => {
  assert.equal(DEFAULT_LOG_DIR, ".agent-ops/logs");
});

// --- .gitignore ---

test(".agent-ops/logs/ is listed in .gitignore", () => {
  const gitignore = readFileSync(".gitignore", "utf8");
  assert.ok(
    gitignore.includes(".agent-ops/logs"),
    ".agent-ops/logs must be in .gitignore to prevent committing local dev logs"
  );
});
