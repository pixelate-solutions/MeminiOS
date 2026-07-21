import {
  CommitmentOpenDetector,
  DuplicateWorkDetector,
  KnowledgeStaleDetector,
  runDetectors,
  type DetectorContext,
  type DetectorQuality,
} from "@meminios/signals";

const detectors = [
  new CommitmentOpenDetector(),
  new KnowledgeStaleDetector(),
  new DuplicateWorkDetector(),
] as const;

export function detectSignals(
  context: DetectorContext,
  quality: Readonly<Record<string, DetectorQuality>> = {},
) {
  return runDetectors(context, detectors, quality);
}
