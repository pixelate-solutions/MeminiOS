import type { Role, TrustLevel } from "@meminios/shared";

export type SkillState = "proposed" | "in_review" | "approved" | "retired";

export interface ApprovalRecord {
  role: Role;
  principalId: string;
  approvedAt: Date;
}

export function canTransitionSkill(from: SkillState, to: SkillState, actorRole: Role): boolean {
  const transitions: Readonly<Record<SkillState, readonly SkillState[]>> = {
    proposed: ["in_review", "retired"],
    in_review: ["proposed", "approved", "retired"],
    approved: ["in_review", "retired"],
    retired: ["proposed"],
  };
  if (!transitions[from].includes(to)) return false;
  if (to === "approved") return actorRole === "steward" || actorRole === "admin";
  if (to === "retired") return actorRole === "steward" || actorRole === "admin";
  return actorRole !== "agent";
}

export function trustRequirementsMet(
  level: TrustLevel,
  approvals: readonly ApprovalRecord[],
): boolean {
  if (level === "reference")
    return approvals.some((approval) => approval.role === "steward" || approval.role === "admin");
  if (level === "draft_for_approval")
    return approvals.some((approval) => approval.role === "steward" || approval.role === "admin");
  const hasSteward = approvals.some((approval) => approval.role === "steward");
  const hasAdmin = approvals.some((approval) => approval.role === "admin");
  return hasSteward && hasAdmin;
}

export function effectiveTrustLevel(options: {
  desired: TrustLevel;
  expiresAt: Date;
  lastVerifiedAt: Date;
  provenanceMateriallyChanged: boolean;
  now: Date;
}): TrustLevel {
  if (options.expiresAt <= options.now || options.provenanceMateriallyChanged) return "reference";
  return options.desired;
}
