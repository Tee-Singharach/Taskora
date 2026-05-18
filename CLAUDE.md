# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Taskora** is a Thai-language internal request management system built with Next.js 16, React 19, and TypeScript. Users file requests that flow through staff → officer → manager approval.

The app currently runs entirely on **localStorage** (no backend wired up yet). A MySQL database has been provisioned and seeded via Prisma, and the next planned step is to migrate `AppProvider` from localStorage to Server Actions backed by Prisma. Until that migration lands, localStorage is still the live data path.

## Development Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production (also runs TypeScript checks)
npm run lint     # Run ESLint
```

There are no tests.

### Database (Prisma 7 + MySQL)

```bash
npx prisma db push        # Sync schema.prisma → MySQL (creates/updates tables)
npx prisma generate       # Regenerate client into lib/generated/prisma
npx tsx prisma/seed.ts    # Wipe + reseed all tables from lib/mockData.ts
```

- **Use `db push`, NOT `prisma migrate dev`.** The MySQL user on Plesk shared hosting lacks permission to create the shadow database that `migrate` requires (`P3014`). `db push` does not need it.
- The MySQL server is remote (Plesk). Local dev connects over the public IP; the box must have Remote Access enabled in Plesk for the dev machine's IP.

## Critical: Next.js 16 + Turbopack on Windows

- **Turbopack is the default** dev bundler. If it panics with `0xc0000142` (Windows DLL error), run `Remove-Item -Recurse -Force .next; npm install` then restart.
- This is Next.js **16**, not 13/14/15. Check `node_modules/next/dist/docs/` before using any API that could have changed.

## Critical: Prisma 7 specifics

Prisma 7 differs sharply from 6 and earlier — most online examples are wrong for this repo:

- **No `url` in `schema.prisma`.** The `datasource db` block has only `provider = "mysql"`. The connection URL lives in `prisma.config.ts` (`datasource.url` reads `process.env.DATABASE_URL`). Putting `url` back in the schema fails validation (`P1012`).
- **`.env` is not auto-loaded by the Prisma CLI.** `prisma.config.ts` does `import "dotenv/config"`; standalone scripts (e.g. `prisma/seed.ts`) must `import 'dotenv/config'` themselves.
- **Driver adapters are mandatory.** `PrismaClient` cannot connect on its own — it must be constructed with `new PrismaClient({ adapter })` where `adapter = new PrismaMariaDb(process.env.DATABASE_URL!)`. The MySQL adapter package is `@prisma/adapter-mariadb` (works for MySQL too); there is no `@prisma/adapter-mysql2`.
- **Generated client is committed in-tree** at `lib/generated/prisma/` (no `index.ts` — import from `lib/generated/prisma/client`). `lib/db.ts` exports the shared singleton `db`; use it for all server-side queries.

## Architecture

### State Management (the most important thing to understand)

All application state is managed by `components/providers/AppProvider.tsx`, a client component that wraps the entire `(app)` route group. It:
- Loads from / saves to **localStorage** (`taskora_store`, schema version 4 — see `lib/store.ts`)
- Exposes every mutation as a named function via React Context (`useApp()`)
- **Pages never mutate store directly** — always call the provider functions

When the localStorage `schemaVersion` doesn't match `SCHEMA_VERSION` in `lib/store.ts`, the store resets to `lib/mockData.ts`. Bump `SCHEMA_VERSION` whenever the `AppStore` shape changes.

`AppProvider` is the single seam for the planned backend migration: every page already goes through `useApp()`, so swapping the localStorage internals for Server Actions touches only this file plus the new server layer — no page changes.

### Data Layer

`lib/types.ts` is the hand-written source of truth for UI-facing data shapes (`User`, `Request` with embedded `events[]`/`attachments[]`, `AppStore`). `prisma/schema.prisma` mirrors these into relational tables (the embedded arrays become `request_events` / `request_attachments`). `lib/mockData.ts` is both the localStorage seed and the Prisma seed source.

### Routing & Layouts

The `(app)` route group (`app/(app)/`) shares the authenticated shell (`layout.tsx` → Sidebar + Topbar). `login` and the root redirect live outside it. Routes: `dashboard`, `requests` (list, `[id]`, `[id]/edit`, `new`), `approval`, `officer/inbox`, `admin/{users,departments,audit}`, `settings`.

### Role-Based Access

Four roles drive navigation and capabilities. Sidebar nav is generated per role in `components/layout/Sidebar.tsx`.

| Role | Thai | Can do |
|---|---|---|
| `staff` | พนักงาน | Create & track own requests |
| `officer` | เจ้าหน้าที่ | Take, reassign, update progress |
| `manager` | หัวหน้างาน | Approve/reject, view dashboard |
| `admin` | ผู้ดูแลระบบ | Manage users, departments, audit log |

### Modals

`components/ui/BaseModal.tsx` is the shared modal shell — pass `footer` (sticky action row) and optional `maxWidth` (default 440). Do not hand-roll the overlay/header/footer markup. The request-detail action modals (`Take`, `Approve`, `Reject`, `Assign`, `Progress`, `Status`) live in `components/requests/`; each owns its local form state and reports results via an `onConfirm` callback so the page stays thin.

## Key Utilities (`lib/utils.ts`)

Always import from here rather than reimplementing:

- **`fullName(user)`** → `"สมชาย รุ่งโรจน์"` — Avatar `name` props, sidebar, greetings ("สวัสดี"), informal UI
- **`formalName(user)`** → `"นายสมชาย รุ่งโรจน์"` — request detail, documents, any formal display
- **`fmtDate` / `fmtDateTime` / `fmtRelative`** — Thai Buddhist calendar display
- **`statusBadgeClass(status)`** — full Tailwind class string for status badges
- **`deptById(id, departments?)`** — department lookup; falls back to the static `DEPARTMENTS` constant

`User` has **no `name` field** — only `title + firstName + lastName`. Avatar `name` props take `fullName()` (for initials/color); displayed names in request context use `formalName()`.

## `showToast` Signature

```ts
showToast(type: 'success' | 'error' | 'warning' | 'info', message: string)
```

Type comes **first**. Calling it in the wrong order is a TypeScript error.

## Styling

- Tailwind CSS 4 via PostCSS (`@tailwindcss/postcss`); no component-scoped CSS — Tailwind utilities inline or `@apply` in `app/globals.css`
- Global badge classes (`.badge`, `.badge-sky`, etc.) defined in `globals.css`
- Thai font **Sarabun** loaded via `next/font/google` in `app/layout.tsx`

## TypeScript

Strict mode. Path alias `@/*` resolves to the repo root. `noUnusedLocals` is **not** enforced, so unused imports do not fail the build — keep them out manually. Run `npm run build` to type-check; the Turbopack dev server does not always surface type errors.
