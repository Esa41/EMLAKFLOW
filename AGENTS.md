# AGENTS.md

## Cursor Cloud specific instructions

EmlakFlow is a single Next.js 15 (App Router) multi-tenant PropTech SaaS. One dev
server serves every surface: CRM app (`/dashboard`, `/portfoy`, …), auth
(`/login`, `/register`), public office showcase (`/ofis/{slug}`), super-admin
(`/admin`), blog, and the `/api/*` backend. Standard commands live in
`package.json` `scripts` and the README ("Kurulum" section) — refer to those.

### Database (important: local Postgres, not Neon)
- The README/`.env.example` assume a hosted Neon Postgres. In the cloud VM we run a
  **local PostgreSQL 16** instead. The database, role, and password are all
  `emlakflow`; connection strings are already in `.env` (gitignored, persisted in
  the VM snapshot). Do not commit `.env`.
- Postgres is **not started automatically on VM boot**. Start it before running the
  app or any Prisma command: `sudo pg_ctlcluster 16 main start`.
- Schema is managed with `npx prisma db push` (there are no migration files).
  Seed demo data with `npx prisma db seed` — this DELETES and recreates the demo
  tenants each run, and backdates a few appointments so the dashboard's "today"
  widgets stay populated.

### Running / demo logins
- Dev server: `npm run dev` (port 3000). PWA is disabled in development.
- Demo accounts (password `demo1234`): `enes@vipgayrimenkul.com` (OWNER, real-estate),
  `sahibi@atlasgayrimenkul.com` (OWNER), `sahibi@akdenizotomotiv.com` (OWNER, auto
  dealer). Public showcases: `/ofis/vip-gayrimenkul`, `/ofis/akdeniz-otomotiv`.

### Lint / build notes
- There is **no lint script and no ESLint config** in this repo. `next.config.ts`
  sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`, so
  `next build` will not fail on type/lint errors. Use `npx tsc --noEmit` if you
  want type checking.
- External integrations (Cloudflare R2 media, OpenAI, Mapbox, Resend email,
  Meta/Instagram, Vercel Domains) are optional and degrade gracefully when their
  env vars are empty; only the specific feature is affected.
