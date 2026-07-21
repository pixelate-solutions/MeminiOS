import type { TrustLevel } from "@meminios/shared";
import { Bot, BookOpen, MousePointerClick } from "lucide-react";

const labels: Record<TrustLevel, string> = {
  reference: "Reference",
  draft_for_approval: "Human approval",
  autonomous: "Autonomous",
};

export function TrustBadge({ level }: { level: TrustLevel }) {
  const Icon =
    level === "autonomous" ? Bot : level === "draft_for_approval" ? MousePointerClick : BookOpen;
  return (
    <span className={`trust-badge trust-badge--${level}`}>
      <Icon size={12} aria-hidden="true" /> {labels[level]}
    </span>
  );
}
