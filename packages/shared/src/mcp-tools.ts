/**
 * MCP tool definitions shared by the API (`tools/list`) and the product UI.
 * `annotations` follow the MCP tool-annotation hints so clients can tell read
 * tools from write tools without reading descriptions.
 */
export const mcpTools = [
  {
    name: "brain_search",
    description: "Search permission-visible company knowledge.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    annotations: { title: "Search the brain", readOnlyHint: true },
  },
  {
    name: "brain_answer",
    description: "Synthesize a cited answer with explicit gaps.",
    inputSchema: {
      type: "object",
      properties: { question: { type: "string" } },
      required: ["question"],
    },
    annotations: { title: "Answer with citations", readOnlyHint: true },
  },
  {
    name: "brain_graph_query",
    description: "Traverse typed, permission-checked relationships.",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    annotations: { title: "Query the entity map", readOnlyHint: true },
  },
  {
    name: "brain_get_skill",
    description: "Get a human-approved executable skill.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    annotations: { title: "Fetch an approved skill", readOnlyHint: true },
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
    annotations: { title: "Propose a fact", readOnlyHint: false, destructiveHint: false },
  },
  {
    name: "brain_signals",
    description: "List proactive signals whose entire evidence set is readable.",
    inputSchema: { type: "object", properties: { state: { type: "string" } } },
    annotations: { title: "List signals", readOnlyHint: true },
  },
] as const;

export type McpTool = (typeof mcpTools)[number];
