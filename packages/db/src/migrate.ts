import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import postgres from "postgres";

export async function migrate(databaseUrl = process.env.DATABASE_URL): Promise<void> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const migrationUrl = new URL("../migrations/0000_foundation.sql", import.meta.url);
    await sql.unsafe(await readFile(fileURLToPath(migrationUrl), "utf8"));
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await migrate();
  console.log("Applied MeminiOS foundation migration.");
}
