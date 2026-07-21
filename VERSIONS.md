# MeminiOS dependency baseline

Resolved from the npm registry on 2026-07-21. Versions are pinned exactly in package manifests so a clean install is reproducible.

## Runtime and workspace

| Package                 | Version |
| ----------------------- | ------: |
| Node.js (local runtime) |  24.4.0 |
| pnpm                    | 11.15.1 |
| Turbo                   |  2.10.5 |
| TypeScript              |   7.0.2 |
| tsx                     |  4.23.1 |
| concurrently            |  10.0.3 |
| dotenv                  |  17.4.2 |

Next.js 16.2.10 still resolves the classic `typescript/lib/typescript.js` entry during its
production build. TypeScript 7.0.2 intentionally no longer exports that entry, so
`apps/landing` uses the newest compatible stable line, TypeScript 6.0.3; the rest of the
workspace uses 7.0.2 and the root strict typecheck covers the shared code.

## Product surfaces

| Package                     |      Version |
| --------------------------- | -----------: |
| React                       |       19.2.7 |
| React DOM                   |       19.2.7 |
| Vite                        |        8.1.5 |
| `@vitejs/plugin-react`      |        6.0.3 |
| Next.js                     |      16.2.10 |
| Vercel CLI                  |       56.4.1 |
| Tailwind CSS                |        4.3.3 |
| `@tailwindcss/vite`         |        4.3.3 |
| TanStack Router             |     1.170.18 |
| TanStack Query              |      5.101.3 |
| Hono                        |      4.12.31 |
| `@hono/zod-openapi`         |        1.5.1 |
| Zod                         |        4.4.3 |
| Wrangler                    |      4.112.0 |
| `@cloudflare/workers-types` | 5.20260721.1 |
| XYFlow React                |      12.11.2 |
| Motion                      |      12.42.2 |
| Lucide React                |       1.25.0 |

## Data, identity, billing, and agents

| Package            | Version |
| ------------------ | ------: |
| Drizzle ORM        |  0.45.2 |
| Drizzle Kit        | 0.31.10 |
| postgres           |   3.4.9 |
| pg                 |  8.22.0 |
| WorkOS Node        |  10.8.0 |
| Stripe             |  22.3.2 |
| MCP TypeScript SDK |  1.29.0 |
| Composio Core      |  0.14.0 |

## Model providers

| Package       | Version |
| ------------- | ------: |
| OpenAI        |  6.48.0 |
| Anthropic SDK | 0.112.4 |
| Google Gen AI |  2.12.0 |

## Quality

| Package                     | Version |
| --------------------------- | ------: |
| Vitest                      |  4.1.10 |
| Vitest V8 coverage          |  4.1.10 |
| Testing Library React       |  16.3.2 |
| Testing Library User Event  |  14.6.1 |
| jsdom                       |  29.1.1 |
| Testcontainers              |  12.0.4 |
| fast-check                  |   4.9.0 |
| PostCSS (security override) |  8.5.20 |
| ESLint                      |  10.7.0 |
| typescript-eslint           |  8.65.0 |
| Prettier                    |   3.9.5 |

## Typography

All three families are self-hosted through Fontsource and use OFL-licensed sources.

| Package                 | Version | Role                                  |
| ----------------------- | ------: | ------------------------------------- |
| Newsreader Variable     |   5.3.0 | Editorial display and reading face    |
| Manrope Variable        |   5.3.0 | Interface grotesk                     |
| JetBrains Mono Variable |   5.3.0 | Evidence, IDs, and technical metadata |

## Infrastructure providers

Resolved from the official Terraform Registry on 2026-07-21.

| Provider   | Version |
| ---------- | ------: |
| Cloudflare |  5.22.0 |
| Neon       |  0.14.0 |
| Vercel     |   5.4.1 |
