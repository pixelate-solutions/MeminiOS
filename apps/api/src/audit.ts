import type { TenantContext } from "@meminios/shared";

export interface AuditEvent {
  tenantId: string;
  principalId: string;
  action: string;
  resourceType: string;
  resourceIds: readonly string[];
  evidenceIds: readonly string[];
  requestId: string;
  occurredAt: string;
}

const localAudit: AuditEvent[] = [];

export async function auditRead(
  tenant: TenantContext,
  requestId: string,
  resourceType: string,
  resourceIds: readonly string[],
  evidenceIds: readonly string[],
): Promise<void> {
  localAudit.push({
    tenantId: tenant.tenantId,
    principalId: tenant.principalId,
    action: "read",
    resourceType,
    resourceIds,
    evidenceIds,
    requestId,
    occurredAt: new Date().toISOString(),
  });
  if (localAudit.length > 1_000) localAudit.shift();
}

export function getLocalAudit(): readonly AuditEvent[] {
  return localAudit;
}
