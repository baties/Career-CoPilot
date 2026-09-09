# Job Match Finder

A fast one-screen app that ranks recent job openings against a student's skills and preferences.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- No app-specific secrets or database tables are required.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/job-match-finder` — React frontend
- `artifacts/api-server/src/routes/jobs.ts` — live job retrieval and match scoring
- `lib/api-spec/openapi.yaml` — API contract

## Architecture decisions

- Search uses a public recent-jobs feed and falls back to credible query-specific demo results if the source is unavailable.
- Matching is deterministic and explainable, weighted across title, skills, location/work style, and recency.
- No login or persistence is used, keeping the hackathon path under one minute.

## Product

- Enter a target title, up to 10 skills, education, location, and work style.
- See up to 10 job listings from the last 30 days, ranked by match score.
- Open any result directly at its application/source page.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
