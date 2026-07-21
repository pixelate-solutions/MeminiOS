import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(new URL("../migrations/0000_foundation.sql", import.meta.url)),
  "utf8",
);
const tenantTables = [
  "tenants",
  "principals",
  "groups",
  "group_memberships",
  "connectors",
  "source_records",
  "source_acl",
  "entities",
  "entity_aliases",
  "edges",
  "facts",
  "chunks",
  "signals",
  "signal_feedback",
  "skills",
  "skill_versions",
  "skill_approvals",
  "governed_definitions",
  "model_usage",
  "jobs",
  "audit_logs",
] as const;

describe("foundation migration", () => {
  it("places tenant_id on every application table", () => {
    for (const table of tenantTables) {
      const tableSql = migration.match(
        new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\n\\);`),
      )?.[1];
      expect(tableSql, `missing table ${table}`).toBeDefined();
      expect(tableSql, `${table} must carry tenant_id`).toMatch(/tenant_id uuid/);
    }
  });

  it("enables and forces RLS for the complete table set", () => {
    expect(migration).toContain("ALTER TABLE %I ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ALTER TABLE %I FORCE ROW LEVEL SECURITY");
    for (const table of tenantTables) expect(migration).toContain(`'${table}'`);
  });

  it("requires all evidence to be readable for signals and graph edges", () => {
    expect(migration).toMatch(/signals_read[\s\S]*app\.can_read_sources\(evidence_source_ids\)/);
    expect(migration).toMatch(/edges_read[\s\S]*app\.can_read_sources\(evidence_source_ids\)/);
  });
});
