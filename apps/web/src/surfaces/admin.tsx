import { ArrowLeft, Check, Database, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

export function AdminSurface({
  focus,
  onBack,
}: {
  focus: "connectors" | "models";
  onBack: () => void;
}) {
  return (
    <div className="admin-surface">
      <button className="text-action" type="button" onClick={onBack}>
        <ArrowLeft size={14} /> Back to Brief
      </button>
      <header className="surface-intro">
        <div>
          <span className="eyebrow">Workspace control</span>
          <h1>{focus === "models" ? "Model policy" : "Connector health"}</h1>
          <p>Administrative surfaces stay one command away, never in persistent navigation.</p>
        </div>
      </header>
      {focus === "connectors" ? (
        <div className="admin-list">
          {[
            ["Slack", "18,442 messages", "Synced 4 min ago"],
            ["Google Drive", "1,284 documents", "Synced 11 min ago"],
            ["GitHub", "632 discussions & RFCs", "Synced 7 min ago"],
          ].map(([name, count, status]) => (
            <div className="admin-row" key={name}>
              <span className="admin-icon">
                <Database size={17} />
              </span>
              <span>
                <strong>{name}</strong>
                <small>{count}</small>
              </span>
              <span className="admin-status">
                <Check size={13} /> {status}
              </span>
              <button type="button">Manage</button>
            </div>
          ))}
          <div className="admin-note">
            <ShieldCheck size={19} />
            <div>
              <strong>ACL snapshots are current</strong>
              <p>
                All connected-source permissions were refreshed within the 24-hour policy window.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="model-policy">
          <div className="policy-row">
            <span>
              <Sparkles size={17} />
            </span>
            <div>
              <strong>Synthesis</strong>
              <p>Frontier answer composition with fallback and per-request metering.</p>
            </div>
            <code>anthropic:claude-sonnet → openai:gpt</code>
            <span className="policy-allowed">Allowed</span>
          </div>
          <div className="policy-row">
            <span>
              <Sparkles size={17} />
            </span>
            <div>
              <strong>Enrichment</strong>
              <p>Async summaries, topic labels, and candidate skills.</p>
            </div>
            <code>google:gemini-flash → openai-compatible</code>
            <span className="policy-allowed">Allowed</span>
          </div>
          <div className="policy-row">
            <span>
              <KeyRound size={17} />
            </span>
            <div>
              <strong>Bring your own endpoint</strong>
              <p>Route every model call through Acme’s designated zero-retention account.</p>
            </div>
            <code>Not configured</code>
            <button type="button">Configure</button>
          </div>
        </div>
      )}
    </div>
  );
}
