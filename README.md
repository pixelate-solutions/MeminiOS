# MeminiOS

MeminiOS is a permissions-aware company brain: it turns scattered institutional knowledge into cited answers, proactive Signals, a legible entity map, and human-governed skills that AI agents can safely use.

This repository contains a working, seeded M0 product and the contracts for the later production adapters. The four product surfaces are complete enough to evaluate as a product: **Brief · Ask · Map · Skills**. The edge API, MCP bridge, deterministic ingestion, signal detectors, model router, RLS migration, worker entrypoints, marketing site, and local demo all live in the same strict TypeScript monorepo.

## What you can run now

- **Brief:** cited commitment, staleness, duplicate-work, and next-action stories; keyboard navigation; action and dismissal feedback.
- **Ask:** a document-style answer with inline citations, evidence rail, explicit gaps, follow-up sections, and an expert-interview handoff.
- **Map:** a focused one-hop graph, plain-language edges, time scrubber, and entity profile drawer.
- **Skills:** governed library, trust levels, freshness, procedure documents, diffs, and steward approval.
- **Command palette:** press <kbd>⌘K</kbd> or <kbd>Ctrl K</kbd> to reach product nouns and hidden admin surfaces.
- **Marketing:** a separate Next.js app with the animated Brief demo, security custody ladder, integrations, pricing, and MCP setup.
- **API/MCP:** Hono REST routes plus `brain_search`, `brain_answer`, `brain_graph_query`, `brain_get_skill`, `brain_propose_fact`, and `brain_signals`.

The demo company is **Acme Robotics**. Its seed includes 20 people, 500 Slack messages, 50 Drive documents, restricted HR material, prompt-injection payloads, stale policy conflicts, open commitments, and duplicate-work evidence.

## Quick start

Requirements: Node 24+, Docker, and Corepack.

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open the product at [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:8787](http://localhost:8787). The marketing site is intentionally separate; run it with:

```bash
pnpm --filter @meminios/landing dev
```

Then open [http://localhost:3000](http://localhost:3000).

The product falls back to its deterministic fixture when the local edge API is not running, so design review does not require cloud credentials.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
```

`pnpm test` includes the 1,000-case randomized tenant isolation fuzzer and prompt-injection corpus. `pnpm test:integration` starts a disposable pgvector Postgres container, applies the real migration, switches to the non-superuser runtime role, and proves both tenant and object ACL isolation.

## Design gallery

The internal component gallery is at [http://localhost:5173/gallery](http://localhost:5173/gallery). It shows the binding editorial primitives in both themes: evidence chips, signal story cards, trust badges, and the answer canvas.

## Architecture

```text
apps/landing        Next.js marketing deployable (Vercel, no customer data)
apps/web            Vite + React product SPA (Cloudflare static assets)
apps/api            Hono edge API, REST/OpenAPI, MCP, realtime Durable Object
apps/*-worker       Container-friendly ingest, enrich, signal, and dream stages

packages/db         Drizzle schema, pgvector/FTS migration, RLS, seed, isolation tests
packages/auth       WorkOS boundary and development session verifier
packages/connectors ConnectorProvider, Composio boundary, native Slack/Drive adapters
packages/model-router Provider routing, policies, metering, fallback, VCR replay
packages/extraction Zero-LLM sanitization, graph extraction, and chunking
packages/retrieval  RRF hybrid ranking and ACL filtering
packages/synthesis  Injection-safe evidence assembly and gap-analysis contract
packages/signals    Detector framework, quality throttle, three deterministic detectors
packages/skills     Approval/trust state machine and governed definitions registry
packages/mcp        npx-compatible stdio-to-HTTP bridge
packages/ui         Tokens and shared editorial product components
packages/shared     Validated cross-surface contracts and seeded fixtures
```

Every data-plane endpoint comes from configuration. The landing app imports shared design language but has no database or customer-data dependency.

## MCP setup

Build the local bridge, then point an MCP-aware client at it:

```bash
pnpm --filter @meminios/mcp build
node packages/mcp/dist/index.js --url http://127.0.0.1:8787/mcp
```

A published deployment uses the one-command shape:

```bash
npx @meminios/mcp@latest --url https://brain.yourcompany.com/mcp
```

Use `MEMINIOS_MCP_TOKEN` instead of putting bearer credentials into an agent config.

## Security invariants

- Every table carries `tenant_id`; RLS is enabled **and forced**.
- API work executes with tenant, principal, and role set transaction-locally.
- A Signal or skill is visible only when its complete evidence set is visible.
- Graph edges carry source IDs so each hop can be permission checked.
- Source records are immutable to the runtime role; ACL refreshes are separate snapshots.
- Ingested text is normalized and delimited as untrusted evidence.
- The synchronous ingest path cannot import or call the model router.
- Autonomous skills require independent steward and admin approval.
- Governed terms cannot be inferred when no approved definition exists.

## External services

The local product needs none. WorkOS, Composio, model providers, Stripe, Neon, Cloudflare, and Vercel remain behind typed adapters and environment variables. Supplying credentials enables those adapters; credentials are never committed.

See [VERSIONS.md](./VERSIONS.md) for the verified dependency baseline and [PROGRESS.md](./PROGRESS.md) for shipped scope and remaining production work.
