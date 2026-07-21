import type { Graph, GraphNode } from "@meminios/shared";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { ArrowUpRight, CalendarRange, Focus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

const nodeColor: Record<GraphNode["type"], string> = {
  person: "var(--blue)",
  company: "var(--attention)",
  team: "var(--watch)",
  process: "var(--positive)",
  system: "var(--reference)",
  document: "var(--approval)",
};

export function MapSurface({
  graph,
  onToast,
}: {
  graph: Graph;
  onToast: (message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(graph.focusNodeId);
  const [asOf, setAsOf] = useState(100);
  const selected = graph.nodes.find((node) => node.id === selectedId) ?? graph.nodes[0];
  const nodes = useMemo<Node[]>(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        position: { x: node.x, y: node.y },
        data: {
          label: (
            <div className="graph-node-inner">
              <span style={{ background: nodeColor[node.type] }}>
                {node.type.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{node.label}</strong>
                <small>{node.detail}</small>
              </div>
            </div>
          ),
        },
        className: `graph-node graph-node--${node.type}${node.id === selectedId ? " is-selected" : ""}`,
        style: { opacity: asOf < 22 && node.id === "nordwell" ? 0.16 : 1 },
      })),
    [asOf, graph.nodes, selectedId],
  );
  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13 },
        style: { stroke: "var(--hairline-strong)", strokeWidth: 1.2 },
        labelStyle: {
          fill: "var(--ink-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: 8,
        },
        labelBgStyle: { fill: "var(--paper)", fillOpacity: 0.9 },
      })),
    [graph.edges],
  );

  return (
    <div className="map-surface">
      <header className="surface-intro map-intro">
        <div>
          <span className="eyebrow">Company map · 4,812 relationships</span>
          <h1>See the shape behind an answer.</h1>
          <p>Start with one noun. Expand only what matters.</p>
        </div>
        <label className="map-search">
          <Search size={15} />
          <input defaultValue="Elena Rossi" aria-label="Find an entity in the map" />
          <kbd>↵</kbd>
        </label>
      </header>

      <section className="map-workspace">
        <div className="graph-canvas" aria-label="Entity graph">
          <div className="graph-toolbar">
            <span>
              <Focus size={14} /> Focused neighborhood
            </span>
            <button type="button" onClick={() => onToast("View centered on Elena Rossi")}>
              Recenter
            </button>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.55}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={28}
              size={0.7}
              color="var(--hairline-strong)"
            />
          </ReactFlow>

          <div className="time-scrubber">
            <CalendarRange size={14} />
            <span>
              {asOf < 22 ? "Before Nordwell · Jun 2026" : asOf < 75 ? "Early July 2026" : "Today"}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={asOf}
              onChange={(event) => setAsOf(Number(event.target.value))}
              aria-label="View graph as of date"
            />
          </div>
        </div>

        {selected && (
          <aside className="profile-drawer">
            <button
              className="drawer-close"
              type="button"
              onClick={() => setSelectedId("")}
              aria-label="Close profile"
            >
              <X size={15} />
            </button>
            <span className="profile-monogram" style={{ background: nodeColor[selected.type] }}>
              {selected.label
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span className="eyebrow">{selected.type}</span>
            <h2>{selected.label}</h2>
            <p className="profile-role">{selected.detail}</p>
            <p className="profile-summary">
              {selected.id === "elena"
                ? "Elena owns EMEA commercial approvals and is the recorded steward for the region’s pricing exception skill."
                : `${selected.label} appears in ${selected.evidenceCount} permission-visible sources in your brain.`}
            </p>
            <dl className="profile-facts">
              <div>
                <dt>Evidence</dt>
                <dd>{selected.evidenceCount} sources</dd>
              </div>
              <div>
                <dt>Open signals</dt>
                <dd>{selected.id === "elena" ? 1 : 0}</dd>
              </div>
              <div>
                <dt>Owned skills</dt>
                <dd>{selected.id === "elena" ? 2 : 0}</dd>
              </div>
            </dl>
            <button
              className="text-action"
              type="button"
              onClick={() => onToast(`Opened the cited profile for ${selected.label}`)}
            >
              Open full profile <ArrowUpRight size={14} />
            </button>
            <div className="drawer-relationships">
              <span className="eyebrow">Visible relationships</span>
              {graph.edges
                .filter((edge) => edge.source === selected.id || edge.target === selected.id)
                .map((edge) => {
                  const otherId = edge.source === selected.id ? edge.target : edge.source;
                  const other = graph.nodes.find((node) => node.id === otherId);
                  return (
                    <button key={edge.id} type="button" onClick={() => setSelectedId(otherId)}>
                      <span>{edge.label}</span>
                      {other?.label}
                    </button>
                  );
                })}
            </div>
          </aside>
        )}
      </section>
    </div>
  );
}
