# Balar iBOOK

Online hotel reservation system for **Balar Hotel & Spa** (Boac, Marinduque, Philippines).

## Stack
- React + Vite frontend (`artifacts/balar-ibook`)
- Node.js + Express API (`artifacts/api-server`) with session-based auth (`express-session` + bcrypt)
- PostgreSQL via Drizzle ORM (`lib/db`)
- Shared OpenAPI contract in `lib/api-spec`, codegen'd to `lib/api-zod` and `lib/api-client-react`

## Default Accounts (seeded)
- Admin: `admin@balarhotel.com` / `Admin#2026`
- Guest: `maria@example.com` / `Guest#2026`

## Database SQL
A standalone schema + seed script lives at `balar_ibook.sql` (project root).
Apply to a fresh Postgres with `psql $DATABASE_URL -f balar_ibook.sql`.

## Required env vars
- `DATABASE_URL` (Postgres connection string)
- `SESSION_SECRET` (long random string)

## Scripts
- `pnpm --filter @workspace/scripts run seed` — seed via Drizzle
- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm --filter @workspace/balar-ibook run dev`

## Branding
Palette: black, gold (`hsl(43 74% 49%)`), white, shades of yellow.
Fonts: Playfair Display (serif headings), Plus Jakarta Sans (body).
Logo asset: `attached_assets/balar_logo_1776822257809.png`.

## Render deploy notes
- Build the api-server with `pnpm install && pnpm --filter @workspace/api-server run build`
- Start command: `node artifacts/api-server/dist/index.mjs`
- Set `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`
- Build the web app with `pnpm --filter @workspace/balar-ibook run build` and serve `dist/`
