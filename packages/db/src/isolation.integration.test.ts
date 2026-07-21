import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { GenericContainer, Wait, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const tenantA = "20000000-0000-4000-8000-000000000001";
const tenantB = "30000000-0000-4000-8000-000000000001";
const principalA = "20000000-0000-4000-8000-000000000002";
const principalB = "30000000-0000-4000-8000-000000000002";
const sourceA = "20000000-0000-4000-8000-000000000003";
const restrictedA = "20000000-0000-4000-8000-000000000004";
const sourceB = "30000000-0000-4000-8000-000000000003";

describe("Postgres RLS two-tenant isolation", () => {
  let container: StartedTestContainer;
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    container = await new GenericContainer("pgvector/pgvector:pg16")
      .withEnvironment({
        POSTGRES_USER: "test",
        POSTGRES_PASSWORD: "test",
        POSTGRES_DB: "meminios",
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
      .start();
    sql = postgres(
      `postgres://test:test@${container.getHost()}:${container.getMappedPort(5432)}/meminios`,
      { max: 1 },
    );
    const migration = await readFile(
      fileURLToPath(new URL("../migrations/0000_foundation.sql", import.meta.url)),
      "utf8",
    );
    await sql.unsafe(migration);
    await sql`INSERT INTO tenants (tenant_id, slug, name, region) VALUES (${tenantA}, 'tenant-a', 'Tenant A', 'us'), (${tenantB}, 'tenant-b', 'Tenant B', 'us')`;
    await sql`INSERT INTO principals (tenant_id, id, external_id, type, role, display_name) VALUES (${tenantA}, ${principalA}, 'a', 'human', 'member', 'Alice'), (${tenantB}, ${principalB}, 'b', 'human', 'member', 'Bob')`;
    const baseRecord = (id: string, tenantId: string, externalId: string, isPublic: boolean) => ({
      id,
      tenantId,
      externalId,
      isPublic,
    });
    for (const row of [
      baseRecord(sourceA, tenantA, "source-a", true),
      baseRecord(restrictedA, tenantA, "restricted-a", false),
      baseRecord(sourceB, tenantB, "source-b", true),
    ]) {
      await sql`INSERT INTO source_records (tenant_id, id, source_system, external_id, permalink, title, source_created_at, source_updated_at, raw_content_hash, sanitized_content, acl_snapshot, metadata, injection_flags) VALUES (${row.tenantId}, ${row.id}, 'test', ${row.externalId}, 'https://example.com', ${row.externalId}, now(), now(), 'hash', 'content', ${sql.json({ public: row.isPublic })}, ${sql.json({})}, ${sql.json([])})`;
    }
  }, 120_000);

  afterAll(async () => {
    await sql?.end();
    await container?.stop();
  });

  async function readAs(tenantId: string, principalId: string): Promise<string[]> {
    return sql.begin(async (transaction) => {
      await transaction`SET LOCAL ROLE meminios_runtime`;
      await transaction`SELECT set_config('app.tenant_id', ${tenantId}, true), set_config('app.principal_id', ${principalId}, true), set_config('app.role', 'member', true)`;
      const rows = await transaction<{ id: string }[]>`SELECT id FROM source_records ORDER BY id`;
      return rows.map((row) => row.id);
    });
  }

  it("returns only same-tenant, ACL-readable rows", async () => {
    await expect(readAs(tenantA, principalA)).resolves.toEqual([sourceA]);
    await expect(readAs(tenantB, principalB)).resolves.toEqual([sourceB]);
  });

  it("does not leak another tenant even when its source is public", async () => {
    const visible = await readAs(tenantA, principalA);
    expect(visible).not.toContain(sourceB);
  });
});
