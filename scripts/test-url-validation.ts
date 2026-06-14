/**
 * URL validation smoke-test.
 * Run: npx tsx scripts/test-url-validation.ts
 */
import { validateCompetitorUrl } from "../lib/validateUrl";

const shouldFail = [
  "http://localhost",
  "http://localhost.",
  "http://127.0.0.1",
  "http://127.1",
  "http://0.0.0.0",
  "http://10.0.0.1",
  "http://172.16.0.1",
  "http://172.31.255.255",
  "http://192.168.1.1",
  "http://169.254.169.254",
  "http://[::1]",
  "http://[::ffff:7f00:1]",
  "http://0177.0.0.1",
  // NOTE: "http://0x7f000001.example.com" is intentionally NOT in this list.
  // WHATWG URL treats "0x7f000001.example.com" as a multi-label domain name,
  // not as a hex IP. DNS resolution happens on ScraperAPI's end; there is no
  // SSRF risk to our own infrastructure from this form. This is the expected
  // WHATWG-compliant behaviour and the test spec marks it "(if applicable)."
  "http://user:pass@example.com",
  "ftp://example.com",
];

const shouldPass = [
  "https://example.com",
  "https://competitor.io/pricing",
  "http://1.2.3.4",
];

let failures = 0;

console.log("=== URLs that should be REJECTED ===\n");
for (const url of shouldFail) {
  const result = validateCompetitorUrl(url);
  const ok = !result.valid;
  const marker = ok ? "✅ PASS" : "❌ FAIL";
  console.log(`${marker}  ${url}`);
  if (!ok) {
    console.log(`       → returned valid:true, normalized="${result.normalized}"`);
    failures++;
  } else {
    console.log(`       → ${result.error}`);
  }
}

console.log("\n=== URLs that should be ACCEPTED ===\n");
for (const url of shouldPass) {
  const result = validateCompetitorUrl(url);
  const ok = result.valid;
  const marker = ok ? "✅ PASS" : "❌ FAIL";
  console.log(`${marker}  ${url}`);
  if (!ok) {
    console.log(`       → returned valid:false, error="${result.error}"`);
    failures++;
  } else {
    console.log(`       → normalized="${result.normalized}"`);
  }
}

console.log(`\n${"=".repeat(50)}`);
if (failures === 0) {
  console.log("All tests passed ✅");
} else {
  console.log(`${failures} test(s) FAILED ❌`);
  process.exit(1);
}
