# PPDO Next — AI Coding Agent Guide

## Overview

- Stack: Next.js App Router + Convex (DB/Auth/HTTP) + MongoDB (select APIs) + OpenAI.
- Auth: `@convex-dev/auth` protects routes via middleware and providers.
- Hybrid backend: Most domain data lives in Convex; some API routes call MongoDB or external services.

## Run, Build, Debug

- Dev (Next + Convex):
  - `npm run dev` runs both: Next (`next dev`) and Convex (`convex dev`). See [package.json](../package.json).
  - Optional pre-setup flow is in `predev` and `setup.mjs`; it helps seed Convex Auth env.
- Build/Start: `npm run build` then `npm run start` (Next only; Convex deploy runs separately).
- Lint: `npm run lint` (Convex generated code is ignored).

## Required Environment

- Next: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_HRMO_API_URL` (for external proxy), images are whitelisted in [next.config.ts](../next.config.ts).
- Convex: `CONVEX_SITE_URL`, `APP_ENV` (see [convex/config.ts](../convex/config.ts) and README’s env guide).
- Services: `OPENAI_API_KEY` (chat), Mongo: `MONGODB_URI` (+ optional `MONGODB_DB`). See [lib/mongodb.ts](../lib/mongodb.ts).

## Architecture & Boundaries

- Convex
  - Schema is composed in [convex/schema.ts](../convex/schema.ts) from feature tables under [convex/schema/](../convex/schema/).
  - HTTP router in [convex/http.ts](../convex/http.ts) delegates to `auth.addHttpRoutes(http)` from [convex/auth.ts](../convex/auth.ts).
  - Auth server/client providers wired in [app/layout.tsx](../app/layout.tsx) and [components/ConvexClientProvider.tsx](../components/ConvexClientProvider.tsx).
- Next API Routes
  - OpenAI chat: [app/api/chat/route.ts](../app/api/chat/route.ts) (uses `OPENAI_API_KEY`).
  - Mongo-backed resources: [app/api/offices/route.ts](../app/api/offices/route.ts) and connection helpers in [lib/mongodb.ts](../lib/mongodb.ts).
  - External proxy: [app/api/ppdo/external/ppe/route.ts](../app/api/ppdo/external/ppe/route.ts) uses `NEXT_PUBLIC_HRMO_API_URL`.
- Route protection: see [middleware.ts](../middleware.ts) using `convexAuthNextjsMiddleware`.

## Convex Conventions (critical)

- Use new function syntax with validators (query/mutation/action/internal*). Reference functions via `api.*`or`internal.\*`.
- Always add `args` and `returns` validators; return `v.null()` when no result.
- Prefer indexed access with `.withIndex(...)` over `.filter(...)` for queries; design indexes in `schema/`.
- Pagination: use `paginationOptsValidator` and `.paginate(...)` where lists are large.
- Actions: include "use node" when using Node APIs; do not access `ctx.db` in actions.
- HTTP endpoints: register in [convex/http.ts](../convex/http.ts) with `httpRouter()` and `httpAction`.
- See detailed patterns in [/.cursor/rules/convex_rules.mdc](../.cursor/rules/convex_rules.mdc).

## Frontend Patterns

- Providers: `ConvexAuthNextjsServerProvider` (server) + `ConvexAuthNextjsProvider` (client) set in [app/layout.tsx](../app/layout.tsx) and [components/ConvexClientProvider.tsx](../components/ConvexClientProvider.tsx).
- UI: Shadcn components under [components/ui/](../components/ui) with Tailwind v4; forms typically use React Hook Form + Zod.
- RBAC utilities and labels in [lib/rbac.ts](../lib/rbac.ts) — check role/permission helpers before gating UI.

## Working Examples

- Get environment from Convex: [convex/config.ts](../convex/config.ts) and usage via client query.
- Secure pages: ensure routes are matched in [middleware.ts](../middleware.ts); redirect unauthenticated to `/signin`.
- Mixing data sources: use Convex for core domain tables; use Next API for external integrations (Mongo/OpenAI/proxies).

## Git & Quality

- Commit style: follow prefixes in [README.md](../README.md) (feat/fix/docs/...).
- ESLint: Next core-web-vitals + Convex plugin via [eslint.config.mjs](../eslint.config.mjs).
- TS config: path alias `@/*` in [tsconfig.json](../tsconfig.json); strict is enabled.
