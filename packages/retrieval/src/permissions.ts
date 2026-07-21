export interface PrincipalAccess {
  tenantId: string;
  principalId: string;
  role: "admin" | "steward" | "member" | "agent";
  groups: ReadonlySet<string>;
  delegatedPrincipalId?: string;
}

export interface AclProtectedRecord {
  id: string;
  tenantId: string;
  allowPrincipalIds: readonly string[];
  allowGroupIds: readonly string[];
  minimumRole?: "admin" | "steward" | "member" | "agent";
}

const roleRank: Record<PrincipalAccess["role"], number> = {
  agent: 0,
  member: 1,
  steward: 2,
  admin: 3,
};

export function canReadRecord(principal: PrincipalAccess, record: AclProtectedRecord): boolean {
  if (principal.tenantId !== record.tenantId) return false;
  if (record.minimumRole && roleRank[principal.role] < roleRank[record.minimumRole]) return false;
  const effectivePrincipal = principal.delegatedPrincipalId ?? principal.principalId;
  return (
    record.allowPrincipalIds.includes(effectivePrincipal) ||
    record.allowGroupIds.some((group) => principal.groups.has(group))
  );
}

export function permissionFilter<T extends AclProtectedRecord>(
  principal: PrincipalAccess,
  records: readonly T[],
): T[] {
  return records.filter((record) => canReadRecord(principal, record));
}

export function allEvidenceReadable(
  principal: PrincipalAccess,
  evidence: readonly AclProtectedRecord[],
): boolean {
  return evidence.length > 0 && evidence.every((record) => canReadRecord(principal, record));
}
