import { demoBootstrap } from "@meminios/shared/demo";
import type { Context } from "hono";
import type { Env, Variables } from "./env";
import { auditRead } from "./audit";

type ApiContext = Context<{ Bindings: Env; Variables: Variables }>;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: { name?: string; arguments?: Record<string, unknown> };
}

const tools = [
  {
    name: "brain_search",
    description: "Search permission-visible company knowledge.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "brain_answer",
    description: "Synthesize a cited answer with explicit gaps.",
    inputSchema: {
      type: "object",
      properties: { question: { type: "string" } },
      required: ["question"],
    },
  },
  {
    name: "brain_graph_query",
    description: "Traverse typed, permission-checked relationships.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "brain_get_skill",
    description: "Get a human-approved executable skill.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "brain_propose_fact",
    description: "Propose a pending fact for human review; never publishes directly.",
    inputSchema: {
      type: "object",
      properties: {
        statement: { type: "string" },
        source_ids: { type: "array", items: { type: "string" } },
      },
      required: ["statement", "source_ids"],
    },
  },
  {
    name: "brain_signals",
    description: "List proactive signals whose entire evidence set is readable.",
    inputSchema: { type: "object", properties: { state: { type: "string" } } },
  },
] as const;

function textResult(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

export async function handleMcp(context: ApiContext) {
  const body = await context.req.json<JsonRpcRequest>();
  const base = { jsonrpc: "2.0" as const, id: body.id ?? null };
  if (body.method === "initialize") {
    return context.json({
      ...base,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "meminios", version: "0.1.0" },
      },
    });
  }
  if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
  if (body.method === "tools/list") return context.json({ ...base, result: { tools } });
  if (body.method !== "tools/call")
    return context.json({ ...base, error: { code: -32601, message: "Method not found" } }, 404);

  const name = body.params?.name;
  const args = body.params?.arguments ?? {};
  const tenant = context.get("tenant");
  const requestId = context.get("requestId");
  if (name === "brain_search") {
    const query = String(args.query ?? "").toLocaleLowerCase();
    const evidence = demoBootstrap.featuredAnswer.evidence.filter((item) =>
      `${item.title} ${item.excerpt}`.toLocaleLowerCase().includes(query.split(/\s+/)[0] ?? query),
    );
    await auditRead(
      tenant,
      requestId,
      "mcp_search",
      evidence.map((item) => item.id),
      evidence.map((item) => item.id),
    );
    return context.json({ ...base, result: textResult(evidence) });
  }
  if (name === "brain_answer") {
    await auditRead(
      tenant,
      requestId,
      "mcp_answer",
      [demoBootstrap.featuredAnswer.id],
      demoBootstrap.featuredAnswer.evidence.map((item) => item.id),
    );
    return context.json({
      ...base,
      result: textResult({
        ...demoBootstrap.featuredAnswer,
        question: String(args.question ?? demoBootstrap.featuredAnswer.question),
      }),
    });
  }
  if (name === "brain_graph_query") {
    await auditRead(
      tenant,
      requestId,
      "mcp_graph",
      demoBootstrap.graph.nodes.map((node) => node.id),
      demoBootstrap.featuredAnswer.evidence.map((item) => item.id),
    );
    return context.json({ ...base, result: textResult(demoBootstrap.graph) });
  }
  if (name === "brain_get_skill") {
    const skill = demoBootstrap.skills.find(
      (item) => item.id === args.id && item.status === "approved",
    );
    return context.json({
      ...base,
      result: textResult(skill ?? { error: "No approved, permission-visible skill found." }),
    });
  }
  if (name === "brain_propose_fact") {
    return context.json({
      ...base,
      result: textResult({
        id: crypto.randomUUID(),
        state: "pending",
        statement: args.statement,
        note: "A steward must approve this before it can influence answers.",
      }),
    });
  }
  if (name === "brain_signals") {
    await auditRead(
      tenant,
      requestId,
      "mcp_signals",
      demoBootstrap.signals.map((signal) => signal.id),
      demoBootstrap.signals.flatMap((signal) => signal.evidence.map((item) => item.id)),
    );
    return context.json({ ...base, result: textResult(demoBootstrap.signals) });
  }
  return context.json(
    { ...base, error: { code: -32602, message: `Unknown tool: ${name ?? "missing"}` } },
    400,
  );
}
