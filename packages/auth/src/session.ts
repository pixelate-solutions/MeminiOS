import type { Role, TenantContext } from "@meminios/shared";

export interface SessionClaims {
  principalId: string;
  tenantId: string;
  role: Role;
  delegatedPrincipalId?: string;
  expiresAt: number;
}

export interface SessionVerifier {
  verify(token: string): Promise<SessionClaims>;
}

export class DevSessionVerifier implements SessionVerifier {
  constructor(
    private readonly tenantId: string,
    private readonly principalId: string,
    private readonly enabled: boolean,
  ) {}

  async verify(token: string): Promise<SessionClaims> {
    if (!this.enabled) throw new Error("Development authentication is disabled");
    if (token !== this.principalId && token !== "dev")
      throw new Error("Invalid development principal");
    return {
      tenantId: this.tenantId,
      principalId: this.principalId,
      role: "steward",
      expiresAt: Date.now() + 3_600_000,
    };
  }
}

export function toTenantContext(claims: SessionClaims): TenantContext {
  if (claims.expiresAt <= Date.now()) throw new Error("Session expired");
  return {
    tenantId: claims.tenantId,
    principalId: claims.delegatedPrincipalId ?? claims.principalId,
    role: claims.role,
  };
}
