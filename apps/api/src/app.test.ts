import { describe, expect, it } from "vitest";
import { app } from "./app";

const env = {
  APP_ORIGIN: "http://localhost:5173",
  DEV_AUTH_ENABLED: "true",
} as never;

describe("Hono API", () => {
  it("serves a health check without authentication", async () => {
    const response = await app.request("/health", {}, env);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });

  it("returns the typed demo bootstrap through dev auth", async () => {
    const response = await app.request(
      "/api/bootstrap",
      { headers: { "x-meminios-dev-principal": "dev" } },
      env,
    );
    expect(response.status).toBe(200);
    const body = await response.json<{ masthead: string; signals: unknown[] }>();
    expect(body.masthead).toContain("commitments");
    expect(body.signals.length).toBeGreaterThan(0);
  });
});
