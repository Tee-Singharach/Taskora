# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Taskora** is a Thai-language internal request management system built with Next.js 16, React 19, and TypeScript. Users file requests that flow through staff → officer → manager approval. There is no backend yet — all state lives in localStorage.

## Development Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production (also runs TypeScript checks)
npm run lint     # Run ESLint
```

There are no tests.

## Critical: Next.js 16 + Turbopack on Windows

- **Turbopack is the default** dev bundler. If it panics with `0xc0000142` (Windows DLL error), run `Remove-Item -Recurse -Force .next; npm install` then restart.
- This is Next.js **16**, not 13/14/15. Check `node_modules/next/dist/docs/` before using any API that could have changed.

## Architecture

### State Management (the most important thing to understand)

All application state is managed by `components/providers/AppProvider.tsx`, a client component that wraps the entire `(app)` route group. It:
- Loads from / saves to **localStorage** (`taskora_store`, schema version 4)
- Exposes every mutation as a named function via React Context (`useApp()`)
- **Pages never mutate store directly** — always call the provider functions

When the localStorage `schemaVersion` doesn't match the constant in `lib/store.ts`, the store resets to `lib/mockData.ts`. Bump `SCHEMA_VERSION` whenever the `AppStore` shape changes.

### Data Layer

`lib/types.ts` is the single source of truth for all data shapes. Key types:

- **`User`** — `title`, `firstName`, `lastName`, `email`, `role`, `dept`
- **`Request`** — has `events: RequestEvent[]` (audit trail), `progress` (0–100), `assigneeId`, `approverId`
- **`AppStore`** — the full localStorage payload

`lib/mockData.ts` is the seed data. `lib/store.ts` handles serialization.

### Routing & Layouts

```
app/
  page.tsx              # Redirects to /login
  login/page.tsx        # Public
  (app)/
    layout.tsx          # Authenticated shell: Sidebar + Topbar
    dashboard/
    requests/           # list, [id], [id]/edit, new
    approval/
    officer/inbox/
    admin/users|departments|audit/
    settings/
```

The `(app)` route group shares the authenticated layout. Login/root are outside it.

### Role-Based Access

Four roles with different navigation and capabilities:

| Role | Thai | Can do |
|---|---|---|
| `staff` | พนักงาน | Create & track own requests |
| `officer` | เจ้าหน้าที่ | Take, reassign, update progress |
| `manager` | หัวหน้างาน | Approve/reject, view dashboard |
| `admin` | ผู้ดูแลระบบ | Manage users, departments, audit log |

Sidebar nav is generated dynamically per role in `components/layout/Sidebar.tsx`.

## Key Utilities (`lib/utils.ts`)

Always import from here rather than reimplementing:

- **`fullName(user)`** → `"สมชาย รุ่งโรจน์"` — for Avatar, sidebar, informal UI
- **`formalName(user)`** → `"นายสมชาย รุ่งโรจน์"` — for request detail, documents, any formal display
- **`fmtDate(iso)`** / **`fmtDateTime`** / **`fmtRelative`** — Thai Buddhist calendar display
- **`statusBadgeClass(status)`** — returns full Tailwind class string for status badges
- **`deptById(id, departments?)`** — looks up department; falls back to static `DEPARTMENTS` constant

## Naming Conventions

`User` has no `name` field — only `title + firstName + lastName`. Use `fullName()` for Avatar `name` props (initials/color), and `formalName()` everywhere a name is displayed as text in request context. Greetings ("สวัสดี") use `fullName()`.

## `showToast` Signature

```ts
showToast(type: 'success' | 'error' | 'warning' | 'info', message: string)
```

Type comes **first**. Pages that call it in the wrong order will get a TypeScript error.

## Styling

- Tailwind CSS 4 via PostCSS (`@tailwindcss/postcss`)
- No component-scoped CSS — use Tailwind utilities inline or `@apply` in `app/globals.css`
- Global badge classes (`.badge`, `.badge-sky`, etc.) defined in `globals.css`
- Thai font: **Sarabun** loaded via `next/font/google` in `app/layout.tsx`

## TypeScript

Strict mode. Path alias `@/*` resolves to the repo root. Run `npm run build` to type-check — the dev server (Turbopack) does not always surface type errors.
