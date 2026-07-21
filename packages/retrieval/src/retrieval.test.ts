import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { canReadRecord, hybridRank, permissionFilter, retrievalSql } from "./index";

describe("hybrid retrieval", () => {
  it("rewards candidates present in both rankings", async () => {
    const shared = { id: "shared", sourceRecordId: "s1", content: "pricing owner" };
    const results = await hybridRank({
      query: "pricing owner",
      vectorResults: [{ id: "vector", sourceRecordId: "s2", content: "discount" }, shared],
      textResults: [shared, { id: "text", sourceRecordId: "s3", content: "owner" }],
    });
    expect(results[0]?.item.id).toBe("shared");
  });

  it("keeps SQL hybrid search and recursive graph traversal inside RLS context", () => {
    expect(retrievalSql.hybrid).toContain("app.current_tenant_id()");
    expect(retrievalSql.hybrid).toContain("FULL OUTER JOIN");
    expect(retrievalSql.graph).toContain("WITH RECURSIVE");
    expect(retrievalSql.graph).toContain("JOIN edges");
  });
});

describe("permission filtering", () => {
  it("never returns another tenant's records across randomized ACL matrices", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.uuid(), { maxLength: 20 }),
        (tenantId, otherTenantId, principalId, ids) => {
          fc.pre(tenantId !== otherTenantId);
          const principal = {
            tenantId,
            principalId,
            role: "member" as const,
            groups: new Set<string>(),
          };
          const records = ids.map((id) => ({
            id,
            tenantId: otherTenantId,
            allowPrincipalIds: [principalId],
            allowGroupIds: [],
          }));
          expect(permissionFilter(principal, records)).toEqual([]);
        },
      ),
      { numRuns: 1_000 },
    );
  });

  it("uses the human's scope for delegated agents", () => {
    const record = { id: "r1", tenantId: "t1", allowPrincipalIds: ["human"], allowGroupIds: [] };
    expect(
      canReadRecord(
        {
          tenantId: "t1",
          principalId: "agent",
          delegatedPrincipalId: "human",
          role: "agent",
          groups: new Set(),
        },
        record,
      ),
    ).toBe(true);
  });
});
