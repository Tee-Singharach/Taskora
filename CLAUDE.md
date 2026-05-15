# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MojiFlow** is a Thai-language request management system built with Next.js 16, React 19, and TypeScript. It's a modern SPA with server-side rendering capabilities, designed for internal organizational workflow management.

## Development Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run ESLint
```

## Key Technologies & Versions

- **Next.js 16.2.6** — App Router, Server Components, breaking changes from older versions (see warning below)
- **React 19.2.4** — Latest React with React Server Components support
- **TypeScript 5** — Strict mode enabled
- **Tailwind CSS 4** — PostCSS plugin-based
- **ESLint 9** — Configured for Next.js best practices and TypeScript

## Critical: Next.js 16 Breaking Changes

This is NOT the Next.js from training data. **Before writing any code**, read the relevant guide in `node_modules/next/dist/docs/` for the feature you're implementing. Pay special attention to:

- Server vs. Client Components behavior
- New API conventions
- Deprecation notices in TypeScript errors

See `AGENTS.md` for the full warning.

## Architecture & File Structure

### App Router Structure

The app uses Next.js App Router with grouped routes:

- **Root pages**: `app/page.tsx` (public), `app/login/page.tsx`
- **Protected routes**: `app/(app)/` — grouped layout containing authenticated pages
  - `dashboard/page.tsx`
  - `requests/` — request list, detail, new, edit views
  - `approval/page.tsx`
  - `admin/` — user and audit management

Route groups `(app)` and `(app)` allow shared layouts without affecting the URL structure.

### Component Organization

- **`components/layout/`** — App-wide layout components (AppLayout, Sidebar, Topbar)
- **`components/ui/`** — Reusable UI elements (Icon, Avatar, ToastContainer)
- **`components/providers/`** — Context/state providers (AppProvider for client-side state)
- **`app/globals.css`** — Global styles with Tailwind directives

### Key Configuration Files

- **`tsconfig.json`** — Strict TypeScript, `@/*` path alias pointing to root
- **`next.config.ts`** — Currently empty; modify here for Next.js config options
- **`postcss.config.mjs`** — Tailwind 4 PostCSS integration
- **`eslint.config.mjs`** — ESLint with Next.js Web Vitals and TypeScript rules

## Typography & Localization

The app uses the **Sarabun** Google Font (Thai + Latin subsets) with variable CSS custom properties for responsive sizing. Thai language is the default (`lang="th"` in root layout).

## State Management

**AppProvider** is a client component wrapping the entire app tree, enabling client-side state (React Context, hooks, etc.). This is the boundary between server and client.

## TypeScript & Path Aliases

- **Strict mode enabled** — all TypeScript checks active
- **`@/*` alias** — resolves to the repository root (e.g., `@/components/ui/Avatar`)

## Styling

- **Tailwind CSS 4** with PostCSS integration
- Global styles in `app/globals.css`
- No component-scoped CSS files (use Tailwind utilities and `@apply` in globals)

## ESLint

Run `npm run lint` to check for violations. The config uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Common issues: unused imports, missing alt text on images, improper use of Next.js APIs.
