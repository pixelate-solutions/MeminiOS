import { mcpTools } from "@meminios/shared";
import { Bot, Check, Copy, Eye, FilePen, Lock } from "lucide-react";
import { useState } from "react";

const guardrails: Record<string, string> = {
  brain_search: "Results filtered by the caller’s ACLs before ranking",
  brain_answer: "Synthesis only sees permission-visible evidence; every claim cited",
  brain_graph_query: "Each hop is permission-checked through its source IDs",
  brain_get_skill: "Returns approved skills only, at their trust level",
  brain_propose_fact: "Creates a pending fact; a steward must approve it",
  brain_signals: "Only signals whose full evidence set is readable",
};

const clientConfig = `{
  "mcpServers": {
    "meminios": {
      "command": "node",
      "args": [
        "packages/mcp/dist/index.js",
        "--url", "http://127.0.0.1:8787/mcp"
      ],
      "env": { "MEMINIOS_MCP_TOKEN": "<scoped agent token>" }
    }
  }
}`;

const sampleCall = `→ tools/call  brain_answer
  { "question": "Who approves pricing exceptions in EMEA?" }

← result  (acting for Elena Rossi · Sales)
  title:      "Elena owns the first decision; Finance is the backstop."
  confidence: high
  paragraphs: 3   citations: [1, 2, 3]
  evidence:   Pricing exception rubric v4 · #sales-emea · Ownership map
  withheld:   2 sources outside this principal’s access
  audit:      read logged with request ID and evidence IDs`;

export function AgentsSurface({ onToast }: { onToast: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clientConfig);
    } catch {
      // Clipboard may be unavailable in some browsers; the toast still confirms intent.
    }
    setCopied(true);
    onToast("MCP client config copied");
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="agents-surface">
      <header className="surface-intro">
        <div>
          <span className="eyebrow">MCP server · {mcpTools.length} tools</span>
          <h1>Agents see what you see.</h1>
          <p>
            Claude, Cursor, or any MCP client can use the brain with the same permissions as the
            person it acts for. Nothing more.
          </p>
        </div>
        <div className="agents-stat">
          <Bot size={18} />
          <span>
            <strong>5 read · 1 propose</strong>
            <small>No tool can publish, delete, or bypass ACLs</small>
          </span>
        </div>
      </header>

      <div className="agents-layout">
        <section className="agents-tools" aria-label="MCP tools">
          <div className="agents-tools__head">
            <span>Tool</span>
            <span>Access</span>
            <span>Guardrail</span>
          </div>
          {mcpTools.map((tool) => {
            const readOnly = tool.annotations.readOnlyHint;
            const args = Object.keys(tool.inputSchema.properties);
            return (
              <div className="agents-tool" key={tool.name}>
                <div>
                  <code>{tool.name}</code>
                  <p>{tool.description}</p>
                  <span className="agents-tool__args">
                    {args.map((arg) => (
                      <span key={arg}>{arg}</span>
                    ))}
                  </span>
                </div>
                <span className={`agents-access agents-access--${readOnly ? "read" : "propose"}`}>
                  {readOnly ? <Eye size={12} /> : <FilePen size={12} />}
                  {readOnly ? "Read" : "Propose"}
                </span>
                <span className="agents-guardrail">
                  <Lock size={12} />
                  {guardrails[tool.name]}
                </span>
              </div>
            );
          })}
        </section>

        <aside className="agents-side">
          <section className="agents-panel">
            <header>
              <span className="eyebrow">Connect a client</span>
              <button type="button" onClick={copy} aria-label="Copy MCP client config">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </header>
            <pre>{clientConfig}</pre>
          </section>
          <section className="agents-panel">
            <header>
              <span className="eyebrow">Sample call · demo fixture</span>
            </header>
            <pre>{sampleCall}</pre>
          </section>
        </aside>
      </div>
    </div>
  );
}
