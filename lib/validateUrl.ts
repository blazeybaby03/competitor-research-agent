// Server-side URL validation for competitor URLs.
// Blocks internal/private network targets; only allows http/https.
// Rejects credentials, ambiguous octal IP forms, and all private/loopback ranges.

// WHATWG URL normalizes IPv4: hex (0x7f000001), decimal-int (2130706433),
// and compressed (127.1) forms all become dotted-decimal before these run.
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,                         // loopback 127.0.0.0/8 (catches 127.1 → 127.0.0.1 after normalization)
  /^10\./,                          // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,    // RFC 1918
  /^192\.168\./,                    // RFC 1918
  /^169\.254\./,                    // link-local
];

// parsed.hostname for IPv6 URLs includes brackets, e.g. "[::1]"
const PRIVATE_IPV6_PATTERNS = [
  /^\[::1\]$/,                      // loopback
  /^\[::ffff:/i,                    // IPv4-mapped (e.g. [::ffff:7f00:1])
  /^\[fc/i,                         // unique local fc00::/7
  /^\[fd/i,                         // unique local fd00::/8
  /^\[fe[89ab]/i,                   // link-local fe80::/10 (fe80–febf)
];

export interface UrlValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

export function validateCompetitorUrl(raw: string): UrlValidationResult {
  if (raw.trim().length > 2048) {
    return { valid: false, normalized: "", error: "URL exceeds maximum length of 2048 characters" };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { valid: false, normalized: "", error: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, normalized: "", error: "Only http and https URLs are allowed" };
  }

  // Reject embedded credentials (user:pass@host)
  if (parsed.username || parsed.password) {
    return { valid: false, normalized: "", error: "URLs with embedded credentials are not allowed" };
  }

  // Strip trailing dots from hostname (e.g. "localhost." → "localhost", "example.com." → "example.com")
  const host = parsed.hostname.toLowerCase().replace(/\.+$/, "");

  if (!host) {
    return { valid: false, normalized: "", error: "Invalid URL format" };
  }

  // Block reserved hostnames
  if (host === "localhost" || host === "0.0.0.0") {
    return { valid: false, normalized: "", error: "This URL target is not allowed" };
  }

  // Block bare single-label hostnames (internal: "intranet", "server1") but allow IPv6 in brackets
  if (!host.includes(".") && !host.startsWith("[")) {
    return { valid: false, normalized: "", error: "Internal hostnames are not allowed" };
  }

  // Block private/loopback IPv6
  for (const pattern of PRIVATE_IPV6_PATTERNS) {
    if (pattern.test(host)) {
      return { valid: false, normalized: "", error: "Private and internal IP addresses are not allowed" };
    }
  }

  // Block private/loopback IPv4 (WHATWG already normalized hex/decimal-int/compressed forms)
  for (const pattern of PRIVATE_IPV4_PATTERNS) {
    if (pattern.test(host)) {
      return { valid: false, normalized: "", error: "Private and internal IP addresses are not allowed" };
    }
  }

  // Block ambiguous octal-style IPv4 octets (e.g. "0177.0.0.1") — some HTTP clients
  // treat leading-zero octets as octal, mapping 0177 → 127, which would be loopback.
  const dotQuadMatch = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (dotQuadMatch) {
    const octets = [dotQuadMatch[1], dotQuadMatch[2], dotQuadMatch[3], dotQuadMatch[4]];
    if (octets.some((o) => o.length > 1 && o.startsWith("0"))) {
      return { valid: false, normalized: "", error: "Ambiguous IP address format is not allowed" };
    }
  }

  // Rebuild normalized URL: cleaned hostname (trailing dots removed), no credentials
  const cleanHost = host + (parsed.port ? `:${parsed.port}` : "");
  const normalized = new URL(`${parsed.protocol}//${cleanHost}${parsed.pathname}${parsed.search}`)
    .toString()
    .replace(/\/$/, "");

  return { valid: true, normalized };
}

export function validateCompetitorUrls(
  rawUrls: unknown[]
): { valid: true; normalized: string[] } | { valid: false; error: string } {
  if (!Array.isArray(rawUrls) || rawUrls.length < 1 || rawUrls.length > 5) {
    return { valid: false, error: "Provide between 1 and 5 competitor URLs" };
  }

  const normalized: string[] = [];
  for (const raw of rawUrls) {
    if (typeof raw !== "string" || raw.trim() === "") {
      return { valid: false, error: "Each URL must be a non-empty string" };
    }
    const result = validateCompetitorUrl(raw);
    if (!result.valid) {
      return { valid: false, error: `Invalid URL "${raw}": ${result.error}` };
    }
    normalized.push(result.normalized);
  }

  return { valid: true, normalized };
}
