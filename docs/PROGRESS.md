# MeminiOS progress

Updated 2026-07-21.

## Shipped in this build

### M0 — foundation and useful product loop

- Pinned pnpm/Turbo strict TypeScript monorepo with all prescribed deployables and packages.
- Editorial light/dark design system, internal gallery, top-center surface switcher, and global command palette.
- Complete seeded Brief, Ask, Map, Skills, admin, and marketing experiences with responsive/keyboard behavior.
- Full first Postgres migration with pgvector, FTS, tenant columns, forced RLS, evidence-scoped policies, runtime role, indexes, and immutable audit/source paths.
- Two-tenant integration suite plus a 1,000-case randomized ACL isolation test.
- Acme Robotics seed: 20 principals, 500 Slack messages, 50 Drive documents, restricted records, injection payloads, deterministic chunks, graph facts, and a visible Signal.
- ConnectorProvider boundary, Composio-only SDK boundary, native Slack and Google Drive adapter contracts, resumable cursors, and ACL refresh paths.
- Deterministic untrusted-content normalization, source hashing, graph extraction, and chunking. No model import exists in the ingest worker.
- Hybrid RRF retrieval, delegated-principal ACL filtering, injection-safe synthesis contract, and comprehensive read audit seam.
- Hono Worker API, local auth fallback, OpenAPI description, Signal feedback, realtime Durable Object, queue bindings, and nightly cron enqueue.
- Cloudflare Container-compatible worker handlers for ingest, enrich, signals, and the resumable dream cycle.

### Later-milestone product slices included early

- MCP HTTP tools and an npx-compatible stdio bridge, including pending-only fact proposals.
- Model router with call classes, tenant policy, token budget, retries/fallback, metering, provider adapters, and VCR replay.
- Commitment, staleness, and duplicate-work detectors with feedback-based auto-throttling.
- Skill approval/trust state machine, staleness demotion, and governed-definition hard block.
- Complete public Next.js landing page and deployment/IaC shells.

## Decisions

- Postgres remains the graph store until measured traversal depth or latency justifies another system.
- Skills are shaped as a governed superset of the agent-skills convention; Markdown export is the intended interop format.
- Tenant-facing autonomy stays behind approved skills and MCP. No general autonomous agent is added here.
- Local model mode defaults to VCR replay. No live model call is required to evaluate or test the product.
- The newest stable TypeScript is used across the workspace. The Next.js app uses the newest compatible 6.x release because Next 16.2.10 still resolves an entry removed by TypeScript 7; root strict checks still cover shared code.

## Remaining production integration work

- Exchange the deterministic API repository for Neon/Hyperdrive queries in deployed environments and persist audit events instead of the local audit buffer.
- Supply real WorkOS organization/session/SCIM flows and secret-manager-backed connector credentials.
- Implement provider-specific Composio actions and native Slack/Drive HTTP transports against real OAuth accounts.
- Provision actual Cloudflare/Neon/Vercel resources from the Terraform shell after account, domain, region, and credential choices are available.
- Add the remaining native connectors, Slack/email digests, Stripe billing, customer-risk/next-action model-assisted detectors, exports, DSR deletion, and HYOK cloud-grant operations.
- Run production load/latency evaluation and observability calibration with real data-plane endpoints.

Those gaps require external accounts, policy choices, or workload measurements; the repository keeps each behind a stable contract so completing them does not change the product surface or security model.
