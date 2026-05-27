# Simple Form

A Typeform-style form builder, built solo for the hackathon. You design a form visually, publish it, share a link (or embed it anywhere), and collect and analyze responses. Respondents never need an account.

What makes this one different: it isn't running on a managed platform that sleeps. It's a real, self-hosted product on my own Linux VPS — its own Postgres, automatic HTTPS, live transactional email, and a one-command deploy. Beautiful forms *and* full ownership of your data and your domain.

## Live links

- App: https://simple-form.dosomething.qzz.io
- API + interactive docs (Scalar): https://back-form.dosomething.qzz.io/docs
- OpenAPI spec: https://back-form.dosomething.qzz.io/openapi.json

## Demo credentials

- Email: `baruntiwary620@gmail.com`
- Password: `12345678`

The demo account is pre-seeded with themed forms, real submissions, and populated analytics, so you can sign in and immediately see charts, response tables, and per-field breakdowns — no setup required to review the product.

## The 60-second tour (for judges)

1. Open the app and sign in with the demo credentials above.
2. Dashboard → open any seeded form → check the Analytics tab (KPIs, submission trend, audience/device breakdown, per-field distributions).
3. Open the builder on a form: drag fields in, set validation, toggle required/optional, preview, publish.
4. Visit the public Explore page to see published public forms.
5. Open a form's public link in an incognito window and submit it without logging in — you'll hit the thank-you screen, and the response shows up in the dashboard.
6. Visit the Pricing page and click an upgrade option — the feedback form that opens is itself a Simple Form form, embedded via iframe (more on that below).

## Why it stands out

- **It's actually deployed and self-hosted**, not a localhost screenshot. Real DB, real HTTPS, real email.
- **Versioned form schemas.** A form points at a *published version*; editing creates drafts. Publishing or unpublishing never mutates the form a respondent is currently filling out.
- **Type-safe end to end.** The same Zod schemas validate both the form a creator *builds* and the response a respondent *submits*.
- **It dogfoods itself.** The pricing page's feedback form is built in Simple Form and embedded with an iframe — proving forms are embeddable and collecting real product feedback at the same time.

## Tech stack

Turborepo, pnpm, TypeScript, Express 5, tRPC 11, Zod 4, trpc-to-openapi, Scalar, PostgreSQL 15, Drizzle ORM, Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Radix UI, dnd-kit, Recharts, TanStack Query, TanStack Table, JWT auth, Nodemailer, Resend, Docker, Caddy, PM2.

## Architecture

A Turborepo monorepo with two deployable apps and shared packages:

- `apps/api` — Express + tRPC server. Also exposes a REST/OpenAPI mirror that Scalar renders as live, interactive docs at `/docs`.
- `apps/web` — Next.js dashboard, drag-and-drop builder, public form renderer, landing and pricing pages.
- `packages/database` — Drizzle schema and migrations. Form definitions are versioned and stored as JSONB.
- `packages/trpc` — all routers and Zod models, shared by both apps so types flow across the wire.
- `packages/services` — business logic (validation, slug generation, analytics aggregation, plan gating) kept out of the transport layer.
- `packages/mailer` — transactional email behind a pluggable transport (Nodemailer or Resend).
- `packages/logger`, `packages/eslint-config`, `packages/typescript-config` — shared infrastructure.

## Features

### Core (all done)

- Email/password auth with JWT sessions and a protected creator dashboard.
- Full form lifecycle: create, edit, publish, unpublish, archive, close, restore, duplicate, soft-delete.
- Dynamic fields with per-field validation (min/max, length, regex) and required/optional settings.
- Field types: short text, long text, email, number, phone, dropdown, single choice, multiple choice, date, and date & time. (A 0–10 choice scale covers rating, used in the live NPS field; file upload is stubbed as "coming soon".)
- Multi-page forms organized as pages → sections → fields.
- Public and Unlisted visibility. Public forms surface on the Explore page; Unlisted forms are reachable only by direct link.
- Strict visibility checks: unpublished, archived, closed, deleted, and invalid links are all handled gracefully and never accept responses.
- Public submission without login, ending in a configurable thank-you / confirmation screen.
- Response management and analytics: KPIs, submission trends, audience/device/browser breakdown, and per-field response distributions.
- Email flows (live): welcome on signup, first-form, and submission/forms milestone notifications.
- Landing page and pricing page.
- Scalar API documentation generated from the tRPC router.
- Seeded demo data and demo credentials.

### Non-functional

- Built on the provided Turborepo starter; frontend and backend run as separate apps.
- Shared packages for schemas, types, services, and API clients.
- Type-safe tRPC APIs; Zod for both form-definition and response validation.
- Clean, versioned Drizzle schema design.
- Rate limiting on public submission endpoints (per-IP) plus a honeypot for basic spam protection.
- Responsive UI with proper error and loading states.

### Bonus features

- Form preview before publishing.
- CSV export of responses.
- Charts and analytics dashboards.
- Custom form slugs.
- Public explore page.
- Form templates gallery.
- Response filtering and pagination (cursor-based).
- Form clone and archive.
- Iframe-embeddable forms (used for the feedback form).

### Intentionally not done yet (honest roadmap)

- Conditional logic between questions.
- Form expiry / response limits (manual close exists today).
- QR code sharing.
- Password-protected forms.
- A dedicated visual theme system (themed via content and templates for now).
- A separate admin UI (the `admin` role exists in the schema).
- **Custom-domain white-labeling for Pro/Business** — the headline paid feature on the roadmap. Competitors lock custom domains behind Enterprise or premium tiers; offering it on a product you can also self-host is the wedge.

## A note on billing

Real payments aren't required by the rules, and I didn't want to fake a checkout that goes nowhere. The plan model is real — Free, Pro, and Business tiers exist in the schema and the app enforces plan gating in code — but Pro and Business aren't sold yet.

Instead, when a user hits an upgrade point, they get an early-access feedback form asking what they'd actually pay for. That form is itself a Simple Form form, created through the product's own API and embedded into the pricing flow via an iframe. So the upsell surface dogfoods the builder, doubles as proof that any published form can be embedded into another site, and collects genuine willingness-to-pay signal.

## Running locally

Prerequisites: Node 18+ (Node 24 recommended), pnpm 9, Docker, `jq`, and `openssl`.

```bash
# 1. Install dependencies
pnpm install

# 2. Generate env files (dev defaults, no prompts)
bash setup.sh

# 3. Start Postgres (Docker, bound to 127.0.0.1)
docker compose up -d

# 4. Apply the database schema
pnpm run db:generate
pnpm run db:migrate

# 5. (Optional) seed demo forms + responses
pnpm tsx scripts/seed-demo-forms.mts

# 6. Run everything
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

Environment variables are driven by a single source of truth, `env-manifest.json`. `setup.sh` reads it and writes per-app `.env` files; `pnpm check:env` verifies the manifest matches the Zod env schemas in code.

## Deploying to production

The entire production stack stands up from one script:

```bash
bash deploy.sh
```

It installs the toolchain (nvm + Node 24, pnpm, Docker, Caddy, PM2), prompts once for production URLs and DB/mail credentials, generates env files, brings up Postgres, runs migrations, builds, starts both apps under PM2, configures Caddy as the HTTPS reverse proxy, and seeds the embedded feedback form. On a memory-light VPS it stops the apps and DB during the heavy web build, then brings them back.

Production specifics:

- Postgres runs in Docker bound to `127.0.0.1` only — never exposed to the internet. (An earlier internet-exposed instance with default credentials got hit by an automated ransomware bot; that's exactly why the DB is now loopback-only with real credentials.)
- Caddy handles automatic HTTPS via Let's Encrypt for both the frontend and backend subdomains.
- PM2 runs both apps and resurrects them on reboot ([ecosystem.config.js](ecosystem.config.js)).
- A dedicated mailbox was purchased specifically for this hackathon, so transactional email sends from a real, deliverable address.

## Project layout

```
apps/
  api/        Express + tRPC server, OpenAPI/Scalar docs, CSV export
  web/        Next.js dashboard, builder, public renderer, landing, pricing
packages/
  database/   Drizzle schema, migrations, versioned form schemas
  trpc/        Routers + Zod models (shared)
  services/    Business logic (validation, analytics, plan gating)
  mailer/      Transactional email (Nodemailer / Resend)
  logger/      Shared logging
scripts/      Seed data, feedback form creation, env drift check
setup.sh      Env bootstrapper (dev defaults / --prod prompts)
deploy.sh     One-command VPS deploy
```

## License

Built for the hackathon by a solo participant (team size 1).
