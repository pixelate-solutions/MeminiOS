import { zValidator } from "@hono/zod-validator";
import { searchRequestSchema, signalFeedbackSchema } from "@meminios/shared";
import { demoBootstrap } from "@meminios/shared/demo";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auditRead, getLocalAudit } from "./audit";
import { authenticate } from "./auth-middleware";
import type { Env, Variables } from "./env";
import { handleMcp } from "./mcp";

export const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", logger());
app.use("*", async (context, next) =>
  cors({ origin: context.env.APP_ORIGIN, credentials: true })(context, next),
);
app.use("*", authenticate);

app.get("/health", (context) =>
  context.json({ status: "ok", service: "meminios-api", version: "0.1.0" }),
);

app.get("/api/bootstrap", async (context) => {
  const tenant = context.get("tenant");
  await auditRead(
    tenant,
    context.get("requestId"),
    "workspace_bootstrap",
    [demoBootstrap.viewer.tenantId],
    demoBootstrap.signals.flatMap((signal) => signal.evidence.map((item) => item.id)),
  );
  return context.json({
    ...demoBootstrap,
    viewer: { ...demoBootstrap.viewer, id: tenant.principalId, tenantId: tenant.tenantId },
  });
});

app.post("/api/search", zValidator("json", searchRequestSchema), async (context) => {
  const { query, limit } = context.req.valid("json");
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const evidence = demoBootstrap.featuredAnswer.evidence
    .map((item) => ({
      item,
      score: terms.reduce(
        (score, term) =>
          score + (`${item.title} ${item.excerpt}`.toLocaleLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
  await auditRead(
    context.get("tenant"),
    context.get("requestId"),
    "search",
    evidence.map(({ item }) => item.id),
    evidence.map(({ item }) => item.id),
  );
  return context.json({ query, results: evidence });
});

app.post("/api/answer", async (context) => {
  const payload = await context.req.json<{ question?: string }>();
  const answer = {
    ...demoBootstrap.featuredAnswer,
    question: payload.question?.trim() || demoBootstrap.featuredAnswer.question,
  };
  await auditRead(
    context.get("tenant"),
    context.get("requestId"),
    "answer",
    [answer.id],
    answer.evidence.map((item) => item.id),
  );
  return context.json(answer);
});

app.get("/api/graph", async (context) => {
  await auditRead(
    context.get("tenant"),
    context.get("requestId"),
    "graph",
    demoBootstrap.graph.nodes.map((node) => node.id),
    demoBootstrap.featuredAnswer.evidence.map((item) => item.id),
  );
  return context.json(demoBootstrap.graph);
});

app.get("/api/skills", async (context) => {
  await auditRead(
    context.get("tenant"),
    context.get("requestId"),
    "skills",
    demoBootstrap.skills.map((skill) => skill.id),
    demoBootstrap.skills.flatMap((skill) => skill.evidence.map((item) => item.id)),
  );
  return context.json({ skills: demoBootstrap.skills });
});

app.patch("/api/signals/:id", zValidator("json", signalFeedbackSchema), async (context) => {
  const signal = demoBootstrap.signals.find((item) => item.id === context.req.param("id"));
  if (!signal)
    return context.json({ error: { code: "NOT_FOUND", message: "Signal not found" } }, 404);
  const feedback = context.req.valid("json");
  return context.json({ id: signal.id, ...feedback, recordedAt: new Date().toISOString() });
});

app.get("/api/audit/recent", (context) => {
  if (context.get("tenant").role !== "admin" && context.get("tenant").role !== "steward") {
    return context.json({ error: { code: "FORBIDDEN", message: "Steward access required" } }, 403);
  }
  return context.json({ events: getLocalAudit().slice(-50) });
});

app.post("/mcp", handleMcp);

app.get("/openapi.json", (context) =>
  context.json({
    openapi: "3.1.0",
    info: {
      title: "MeminiOS API",
      version: "0.1.0",
      description: "Permissions-aware company brain API",
    },
    paths: {
      "/api/search": { post: { summary: "Hybrid search", security: [{ bearerAuth: [] }] } },
      "/api/answer": {
        post: { summary: "Cited synthesis with gap analysis", security: [{ bearerAuth: [] }] },
      },
      "/api/graph": {
        get: { summary: "Permission-checked graph neighborhood", security: [{ bearerAuth: [] }] },
      },
      "/api/skills": { get: { summary: "Governed skills", security: [{ bearerAuth: [] }] } },
      "/mcp": {
        post: { summary: "MCP streamable HTTP transport", security: [{ bearerAuth: [] }] },
      },
    },
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
  }),
);

app.notFound((context) =>
  context.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404),
);
app.onError((error, context) => {
  console.error(error);
  return context.json(
    {
      error: { code: "INTERNAL", message: "The request could not be completed." },
      requestId: context.get("requestId"),
    },
    500,
  );
});

export type AppType = typeof app;
