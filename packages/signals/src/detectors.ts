import type { DetectedSignal, DetectorContext, DetectorSource, SignalDetector } from "./framework";

const DAY = 86_400_000;
const PROMISE = /\b(?:i(?:'|’)ll|i will|we(?:'|’)ll|we will|i can|we can)\s+([^.!?\n]{4,140})/gi;
const DATE_WORD =
  /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|end of (?:the )?week)\b/i;

function fingerprint(parts: readonly string[]): string {
  let hash = 2166136261;
  for (const character of parts.join("|").toLocaleLowerCase()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `sig_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function inferDueDate(source: DetectorSource, phrase: string): Date {
  const due = new Date(source.createdAt);
  const match = phrase.match(DATE_WORD)?.[1]?.toLocaleLowerCase();
  if (match === "today") return due;
  if (match === "tomorrow") return new Date(due.getTime() + DAY);
  if (match === "next week") return new Date(due.getTime() + 7 * DAY);
  if (match?.includes("end of")) return new Date(due.getTime() + 5 * DAY);
  const weekday = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ].indexOf(match ?? "");
  if (weekday >= 0) {
    const delta = (weekday - due.getUTCDay() + 7) % 7 || 7;
    return new Date(due.getTime() + delta * DAY);
  }
  return new Date(due.getTime() + 3 * DAY);
}

export class CommitmentOpenDetector implements SignalDetector {
  readonly id = "commitment-open-v1";
  readonly type = "commitment_open" as const;

  async detect(context: DetectorContext): Promise<readonly DetectedSignal[]> {
    const results: DetectedSignal[] = [];
    for (const source of context.sources) {
      for (const match of source.content.matchAll(PROMISE)) {
        const promise = match[0].trim();
        const action = match[1]?.trim() ?? promise;
        const due = inferDueDate(source, promise);
        if (due >= context.now) continue;
        const signalFingerprint = fingerprint([source.author, action]);
        if (context.closedCommitmentFingerprints.has(signalFingerprint)) continue;
        const daysLate = Math.max(1, Math.floor((context.now.getTime() - due.getTime()) / DAY));
        results.push({
          detectorId: this.id,
          type: this.type,
          severity: daysLate >= 5 ? "critical" : "attention",
          headline: `${source.author}’s commitment is ${daysLate} day${daysLate === 1 ? "" : "s"} late`,
          summary: `“${promise}” has no later source that closes the loop.`,
          confidence: DATE_WORD.test(promise) ? 0.94 : 0.77,
          evidenceIds: [source.id],
          suggestedAction: `Nudge ${source.author}`,
          fingerprint: signalFingerprint,
        });
      }
    }
    return results;
  }
}

export class KnowledgeStaleDetector implements SignalDetector {
  readonly id = "knowledge-stale-v1";
  readonly type = "knowledge_stale" as const;

  constructor(private readonly staleAfterDays = 180) {}

  async detect(context: DetectorContext): Promise<readonly DetectedSignal[]> {
    return context.sources
      .filter(
        (source) => context.now.getTime() - source.updatedAt.getTime() > this.staleAfterDays * DAY,
      )
      .map((source) => ({
        detectorId: this.id,
        type: this.type,
        severity: "watch" as const,
        headline: `${source.title} has gone quiet`,
        summary: `No supporting source has changed in more than ${this.staleAfterDays} days.`,
        confidence: 0.88,
        evidenceIds: [source.id],
        suggestedAction: "Ask the owner to verify it",
        fingerprint: fingerprint([source.id, "stale"]),
      }));
  }
}

function tokens(content: string): Set<string> {
  return new Set(
    content
      .toLocaleLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3),
  );
}

function jaccard(left: Set<string>, right: Set<string>): number {
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export class DuplicateWorkDetector implements SignalDetector {
  readonly id = "duplicate-work-v1";
  readonly type = "duplicate_work" as const;

  constructor(private readonly threshold = 0.48) {}

  async detect(context: DetectorContext): Promise<readonly DetectedSignal[]> {
    const results: DetectedSignal[] = [];
    for (let leftIndex = 0; leftIndex < context.sources.length; leftIndex += 1) {
      const left = context.sources[leftIndex];
      if (!left) continue;
      for (let rightIndex = leftIndex + 1; rightIndex < context.sources.length; rightIndex += 1) {
        const right = context.sources[rightIndex];
        if (!right || !left.team || !right.team || left.team === right.team) continue;
        const similarity = jaccard(tokens(left.content), tokens(right.content));
        if (similarity < this.threshold) continue;
        results.push({
          detectorId: this.id,
          type: this.type,
          severity: "watch",
          headline: `${left.team} and ${right.team} may be solving the same problem`,
          summary: `${left.title} and ${right.title} share ${Math.round(similarity * 100)}% of their distinctive language.`,
          confidence: Math.min(0.97, 0.6 + similarity / 2),
          evidenceIds: [left.id, right.id],
          suggestedAction: "Bring the owners together",
          fingerprint: fingerprint([left.id, right.id].sort()),
        });
      }
    }
    return results;
  }
}
