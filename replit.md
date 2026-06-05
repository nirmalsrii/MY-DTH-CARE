# DTH Customer Manager

A full-stack web application for a Sri Lankan business managing Indian DTH (Direct-to-Home) TV subscriptions. Tracks customers, recharges, due dates, and revenue across all major Indian DTH providers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React 19 + Vite + Tailwind CSS + shadcn/ui + Recharts
- Auth: express-session (username/password)

## Where things live

- `lib/db/src/schema/` — DB schema (customers, recharges tables)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/dth-manager/src/pages/` — React frontend pages
- `artifacts/dth-manager/src/components/` — shared UI components

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod validators
- Session-based auth: express-session with SESSION_SECRET env var; no JWT
- Currency: all amounts stored in INR; LKR calculated at runtime using a configurable rate stored in localStorage (default: 3.6)
- Status auto-calculation: `refreshAllStatuses` endpoint recomputes active/expiring_soon/expired based on `next_recharge_date`
- SMS: stub endpoint logs in dev; requires `SMS_GATEWAY_URL` + `SMS_API_KEY` env vars to actually send

## Product

- **Admin Login** — secure username/password login (default: admin / dth@admin2024)
- **Dashboard** — stats (total, active, expiring, expired), monthly revenue, provider pie chart, urgent alerts preview
- **Customers** — searchable/filterable table with status, days remaining, last recharge amount
- **Customer Detail** — full recharge history + add new recharge form with SMS toggle
- **Due Alerts** — tabbed view: overdue / today / 3 days / 7 days / 15 days
- **Settings** — configure INR→LKR exchange rate, admin credential docs, SMS gateway docs

## Providers supported

Tata Play, Airtel Digital TV, Dish TV, Sun Direct, d2h, Zing Digital, DD Free Dish

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after any change to `lib/db` or `lib/api-spec` before running leaf package typechecks
- After editing `openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks
- `useGetDueAlerts` hook signature: `(params?, options?)` — pass `{ query: { queryKey: ... } }` as the **second** argument
- `daysUntilExpiry` is typed `number | null | undefined` — use `!= null` (not `!== null`) for null checks

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
