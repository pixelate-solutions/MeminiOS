import type { Evidence } from "@meminios/shared";
import { ExternalLink } from "lucide-react";

const sourceGlyph: Record<Evidence["source"], string> = {
  slack: "S",
  "google-drive": "D",
  notion: "N",
  github: "G",
  calendar: "C",
  linear: "L",
};

export interface EvidenceChipProps {
  evidence: Evidence;
  compact?: boolean;
  index?: number;
}

export function EvidenceChip({ evidence, compact = false, index }: EvidenceChipProps) {
  const relative = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(evidence.timestamp));

  return (
    <a
      className={`evidence-chip${compact ? " evidence-chip--compact" : ""}`}
      href={evidence.permalink}
      target="_blank"
      rel="noreferrer"
      title={`${evidence.title} — ${evidence.excerpt}`}
      aria-label={`Open evidence: ${evidence.title}`}
    >
      {index !== undefined && <span className="evidence-index">{index}</span>}
      <span className={`source-favicon source-favicon--${evidence.source}`} aria-hidden="true">
        {sourceGlyph[evidence.source]}
      </span>
      <span className="evidence-chip-label">{evidence.sourceName}</span>
      {!compact && <span className="evidence-chip-time">{relative}</span>}
      <ExternalLink size={11} strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}
