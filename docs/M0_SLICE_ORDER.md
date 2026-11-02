# M0 vertical-slice order

1. **Contracts and design tokens** — strict shared schemas, editorial type/palette/motion tokens, and a component gallery for the masthead, evidence chip, story card, and answer canvas.
2. **Tenant-safe persistence** — complete first migration, RLS helper functions and policies, request-scoped tenant/principal context, seed identities, then the two-tenant isolation test.
3. **Ingest to retrieval** — connector contract and adapters, immutable source records, untrusted-content normalization, deterministic entity/edge extraction, chunking, and hybrid RRF ranking.
4. **Useful product loop** — seeded Acme Robotics data through the Hono API into the Brief and Ask surfaces, with evidence access and a keyboard-first command palette.
5. **Operational shell** — queue/container entrypoints, local Postgres+pgvector, Wrangler bindings, environment contract, CI, and concise runbooks.
6. **Verification** — typecheck, unit/isolation/injection tests, production builds, and visual/a11y review of light and dark themes.

Each slice leaves the preceding path runnable. External providers remain behind adapters and use deterministic local fixtures until credentials are supplied.
