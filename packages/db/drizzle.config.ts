import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://meminios:meminios@127.0.0.1:55432/meminios",
  },
  strict: true,
  verbose: true,
});
