import type { SignalSeverity, SignalType } from "@meminios/shared";

export interface DetectorSource {
  id: string;
  tenantId: string;
  author: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  team?: string;
}

export interface DetectedSignal {
  detectorId: string;
  type: SignalType;
  severity: SignalSeverity;
  headline: string;
  summary: string;
  confidence: number;
  evidenceIds: readonly string[];
  suggestedAction: string;
  fingerprint: string;
}

export interface DetectorContext {
  tenantId: string;
  now: Date;
  sources: readonly DetectorSource[];
  closedCommitmentFingerprints: ReadonlySet<string>;
}

export interface SignalDetector {
  readonly id: string;
  readonly type: SignalType;
  detect(context: DetectorContext): Promise<readonly DetectedSignal[]>;
}

export interface DetectorQuality {
  useful: number;
  dismissed: number;
}

export function detectorPrecision(quality: DetectorQuality): number | null {
  const total = quality.useful + quality.dismissed;
  return total < 10 ? null : quality.useful / total;
}

export function shouldThrottleDetector(quality: DetectorQuality): boolean {
  const precision = detectorPrecision(quality);
  return precision !== null && precision < 0.6;
}

export async function runDetectors(
  context: DetectorContext,
  detectors: readonly SignalDetector[],
  quality: Readonly<Record<string, DetectorQuality>>,
): Promise<DetectedSignal[]> {
  const results = await Promise.all(
    detectors
      .filter(
        (detector) => !shouldThrottleDetector(quality[detector.id] ?? { useful: 0, dismissed: 0 }),
      )
      .map((detector) => detector.detect(context)),
  );
  const unique = new Map<string, DetectedSignal>();
  for (const signal of results.flat()) {
    const current = unique.get(signal.fingerprint);
    if (!current || current.confidence < signal.confidence) unique.set(signal.fingerprint, signal);
  }
  return [...unique.values()].sort((left, right) => right.confidence - left.confidence);
}
