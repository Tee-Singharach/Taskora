# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Taskora** is a Thai-language internal request management system built with Next.js 16, React 19, and TypeScript. Users file requests that flow through staff → officer → manager approval.

Data is persisted in **MySQL via Prisma**. The client talks to the DB exclusively through Server Actions in `app/actions.ts`; there is no localStorage data path anymore (`lib/store.ts` was removed). The only client-persisted state is the impersonated `currentUserId` (no real auth yet) and notification read-state, both in localStorage.

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
- **Generated client lives at `lib/generated/prisma/`** but is **gitignored** — run `npx prisma generate` after a fresh clone or any `schema.prisma` change. There is no `index.ts`; import from `lib/generated/prisma/client`. `lib/db.ts` exports the shared singleton `db`; use it for all server-side queries. Server-side data access goes through Server Actions in `app/actions.ts` (`getStore` + one function per mutation); `AppProvider` calls these and refetches `getStore` after each write.

## Architecture

### State Management (the most important thing to understand)

`components/providers/AppProvider.tsx` (client component wrapping the `(app)` route group) is the single data seam. The flow is:

- On mount it calls `getStore()` (Server Action) once and holds the whole store (`users`, `departments`, `requests`, `auditLog`) in React state.
- Every mutation in `useApp()` is a thin wrapper that calls the matching Server Action in `app/actions.ts`, then **refetches `getStore()`** and replaces local state (a `run()` helper does call → refetch → toast, with an error toast on failure). There is no optimistic update.
- **Pages never mutate or fetch directly** — they read `store.*` and call the provider functions. Keep it that way; adding a new mutation means: add a Server Action, add a wrapper in `AppProvider`, expose it on the context type.
- `currentUserId` is **not** server state — it is impersonation, kept in React state and mirrored to `localStorage` (`taskora_uid`). `setCurrentUserId` (used by the login page) just swaps it.

Mutation wrappers are `async` and most pages fire-and-forget them; `addRequest` is the exception — it returns the created `Request` (used by `requests/new` to navigate), so its call site must `await`.

### Data Layer

`lib/types.ts` is the hand-written source of truth for UI-facing data shapes (`User`, `Request` with embedded `events[]`/`attachments[]`, `AppStore`). `prisma/schema.prisma` mirrors these into relational tables — the embedded arrays become the `request_events` / `request_attachments` tables, and `app/actions.ts#getStore` re-assembles them back into the embedded shape (and converts `Date` → ISO strings) so the UI types are unchanged. `lib/mockData.ts` is the Prisma seed source (`prisma/seed.ts`).

A `Request` has a `type` (`RequestType`: `repair | budget | equipment | staffing | general`) for classification; Thai labels for it live in `REQUEST_TYPE_INFO` in `lib/utils.ts` (same pattern as `STATUS_INFO` / `PRIORITY_INFO`). Any new enum on a model means: edit `schema.prisma` **and** `lib/types.ts`, then `npx prisma db push && npx prisma generate`, update `mockData.ts`, and reseed.

### Notifications

`components/layout/Topbar.tsx` derives the bell dropdown entirely from `store.requests` events at render time (no notification table): for the current user it surfaces events on requests they're involved in, excluding their own actions. Read-state is per-item, persisted as a key array in `localStorage` (`taskora_notif_read`). Clicking an item routes to `/requests/{id}?from=…&ev={idx}`; the detail page reads `ev` and scrolls to / briefly highlights that event.

### Routing & Layouts

The `(app)` route group (`app/(app)/`) shares the authenticated shell (`layout.tsx` → Sidebar + Topbar). `login` and the root redirect live outside it. Routes: `dashboard`, `requests` (list, `[id]`, `[id]/edit`, `new`), `approval`, `officer/inbox`, `admin/{users,departments,audit}`, `settings`.

### Access Control (department-based — `lib/access.ts` is the single source of truth)

**Never inline an access rule.** All visibility/approval decisions go through `lib/access.ts`; pages and Server Actions both import from it. Adding/altering a rule = edit this one file.

A request's `department` is the **destination** department that handles it (the requester picks it on the new-request form — it is *not* the requester's own dept). Routing & scope follow that field:

| Role | Sees (`canViewRequest`) | Approves (`canApprove`) |
|---|---|---|
| `staff` | only requests they filed | — |
| `officer` | requests routed to their dept | — |
| `manager` | requests routed to their dept | only if `r.approverId === me` **and** `r.department === my dept` and status `waiting_approval` |
| `admin` | everything | any `waiting_approval` |

- **Approver is dynamic**: at creation `approverId = deptApprover(users, destDept)` (the manager whose `dept` matches). Seed data guarantees every department has exactly one manager — keep it that way or routing breaks.
- **Approval is enforced server-side too**: `app/actions.ts#assertCanApprove` re-checks `canApprove` before `approveRequest`/`rejectRequest` mutate — the UI gate is not trusted alone.
- Officer reassignment is limited to `sameDeptOfficers(users, request.department)`.
- Sidebar nav is still generated per role in `components/layout/Sidebar.tsx`.

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
