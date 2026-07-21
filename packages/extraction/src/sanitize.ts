const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /(?:system|developer)\s+prompt\s*:/i,
  /reveal\s+(?:the\s+)?(?:system|developer)\s+(?:message|prompt)/i,
  /(?:call|invoke|use)\s+(?:the\s+)?(?:tool|function)\b/i,
  /exfiltrat(?:e|ion)|steal\s+(?:credentials|secrets|tokens)/i,
  /<\/?(?:system|assistant|tool|developer)(?:\s|>)/i,
] as const;

export interface SanitizedContent {
  content: string;
  redactions: number;
  suspiciousLines: readonly number[];
}

export function sanitizeUntrustedContent(input: string): SanitizedContent {
  const normalized = input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "");
  const suspiciousLines: number[] = [];
  let redactions = 0;
  const lines = normalized.split(/\r?\n/).map((line, index) => {
    if (!INJECTION_PATTERNS.some((pattern) => pattern.test(line))) return line;
    suspiciousLines.push(index + 1);
    redactions += 1;
    return "[untrusted instruction-like content redacted]";
  });

  return { content: lines.join("\n").trim(), redactions, suspiciousLines };
}

export async function hashRawContent(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}
