import { DevSessionVerifier, toTenantContext } from "@meminios/auth";
import type { MiddlewareHandler } from "hono";
import type { Env, Variables } from "./env";

const DEMO_TENANT = "10000000-0000-4000-8000-000000000001";
const DEMO_PRINCIPAL = "10000000-0000-4000-8000-000000000002";

export const authenticate: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (
  context,
  next,
) => {
  const requestId = context.req.header("cf-ray") ?? crypto.randomUUID();
  context.set("requestId", requestId);
  if (context.req.path === "/health" || context.req.path === "/openapi.json") return next();

  const token = context.req.header("x-meminios-dev-principal") ?? "dev";
  const verifier = new DevSessionVerifier(
    DEMO_TENANT,
    DEMO_PRINCIPAL,
    context.env.DEV_AUTH_ENABLED === "true",
  );
  try {
    context.set("tenant", toTenantContext(await verifier.verify(token)));
    return next();
  } catch {
    return context.json(
      { error: { code: "UNAUTHENTICATED", message: "A valid session is required." }, requestId },
      401,
    );
  }
};
