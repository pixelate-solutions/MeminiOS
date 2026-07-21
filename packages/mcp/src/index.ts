#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const tools = [
  {
    name: "brain_search",
    description: "Search permission-visible company knowledge.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "brain_answer",
    description: "Synthesize a cited answer with explicit knowledge gaps.",
    inputSchema: {
      type: "object",
      properties: { question: { type: "string" } },
      required: ["question"],
    },
  },
  {
    name: "brain_graph_query",
    description: "Traverse typed relationships with ACL checks at every hop.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "brain_get_skill",
    description: "Read a human-approved governed skill.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "brain_propose_fact",
    description: "Submit a pending fact proposal for steward review.",
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
    description: "List proactive signals with fully readable evidence sets.",
    inputSchema: { type: "object", properties: { state: { type: "string" } } },
  },
] as const;

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const endpoint = argument("--url") ?? process.env.MEMINIOS_MCP_URL;
const token = argument("--token") ?? process.env.MEMINIOS_MCP_TOKEN;

if (!endpoint) {
  throw new Error("MeminiOS MCP needs --url or MEMINIOS_MCP_URL.");
}

const remoteEndpoint: string = endpoint;

let requestId = 0;

async function callRemote(name: string, args: Record<string, unknown> | undefined) {
  const response = await fetch(remoteEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : { "x-meminios-dev-principal": "dev" }),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++requestId,
      method: "tools/call",
      params: { name, arguments: args ?? {} },
    }),
  });
  if (!response.ok) throw new Error(`MeminiOS returned HTTP ${response.status}`);
  const payload = (await response.json()) as {
    result?: { content: Array<{ type: "text"; text: string }> };
    error?: { message: string };
  };
  if (payload.error) throw new Error(payload.error.message);
  return payload.result ?? { content: [{ type: "text" as const, text: "No result" }] };
}

const server = new Server({ name: "meminios", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools] }));
server.setRequestHandler(CallToolRequestSchema, async (request) =>
  callRemote(request.params.name, request.params.arguments),
);

await server.connect(new StdioServerTransport());
