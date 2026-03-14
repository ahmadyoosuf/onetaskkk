# onetaskkk

Frontend evaluation — micro-task platform with admin and worker roles.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- shadcn UI (customized design system)
- Lexical + `@lexical/react` + `@lexical/markdown` (rich-text task details editor, outputs Markdown)
- TanStack Query (data fetching & mutations — single source of truth)
- TanStack Table (admin tasks table with pagination)
- react-hook-form + zod (form validation)
- TanStack Virtual (virtualized worker feed and mobile task cards)
- idb-keyval (IndexedDB persistence)
- nuqs (URL state management)
- Vaul (bottom-sheet drawer for mobile detail views)
- `react-markdown` (renders stored Markdown in detail panels)

## Routes

| Path | Role | Screen |
|------|------|--------|
| `/login` | Public | Mock Login — select demo account |
| `/` | Public | Role Picker — choose Worker or Admin |
| `/worker` | Worker | Tasks Feed — browse, filter, submit work |
| `/admin/composer` | Admin | Task Composer — create new tasks |
| `/admin/tasks` | Admin | Tasks Management — overview, stats, delete |
| `/admin/submissions` | Admin | Submissions — review, approve/reject |

## Task Types

| Type | Fields |
|------|--------|
| Social Media Posting | platform, postContent, accountHandle |
| Email Sending | targetEmail, emailContent |
| Social Media Liking | postUrl, platform |

## Architecture

```
lib/
  types.ts      — discriminated union types (Task, Submission)
  schemas.ts    — zod schemas for form validation (description now optional)
  store.ts      — IndexedDB-backed CRUD with 500 tasks, 1000 submissions
  auth.ts       — mock authentication helpers

components/
  app-shell.tsx             — shared layout with glass header, user menu, theme toggle
  error-boundary.tsx        — error handling components
  providers/
    query-provider.tsx      — TanStack Query provider
    auth-provider.tsx       — authentication context + redirects
    theme-provider.tsx      — dark/light/system theme with localStorage persistence
  composer/                 — isolated form field components (Lexical editor for details)
  admin/
    tasks-table.tsx         — TanStack Table implementation for admin tasks
  submissions/
    submission-detail.tsx   — shared detail panel used by both desktop and mobile
  ui/                       — customized shadcn components + Vaul drawer

hooks/
  use-store.ts              — TanStack Query hooks (sole state manager, no pub/sub)

app/
  login/page.tsx          — mock login page
  page.tsx                — role picker
  worker/page.tsx         — tasks feed (nuqs URL state, Vaul drawer for mobile)
  admin/composer/         — task composer (Lexical rich-text, post-create dialog)
  admin/tasks/            — tasks management (TanStack Table, nuqs URL state)
  admin/submissions/      — submissions (SubmissionDetail component, Vaul drawer)
```

## Key Decisions

**Why TanStack Query?**
PRD explicitly recommends it. Provides automatic caching, loading states, and mutation invalidation.

**Why TanStack Table for admin tasks?**
Replaces a custom hand-rolled table with a headless, sortable, row-selection-aware implementation that scales cleanly.

**Why nuqs for URL state?**
PRD recommends it. Filter states (type, sort, status) persist in URL for shareability and browser navigation.

**Why Lexical for the details field?**
Rich-text authoring with Markdown output. `$convertToMarkdownString(TRANSFORMERS)` runs inside `OnChangePlugin` and feeds the string to react-hook-form via `Controller`. Seeded from existing value via `$convertFromMarkdownString` for edit mode.

**Why Vaul for mobile drawers?**
70 % mobile audience per PRD. Vaul bottom-sheets feel native on iOS/Android; `Dialog` components do not.

**Why `SubmissionDetail` as a shared component?**
Eliminates duplicate detail UI between the desktop panel and mobile drawer on the submissions page.

**Why mock auth?**
PRD says "lay out basic mock authentication." Demonstrates auth flow without a real backend.

**Why discriminated unions for Task?**
Each task type has a different `details` shape. Union types let TypeScript enforce correct field access per type.

**Why TanStack Virtual?**
PRD says "should handle 1000s of tasks." Virtualization renders only visible rows — no DOM bloat.

**Why isolated field components?**
Composer has `TitleField`, `RewardField`, etc. Each owns validation state via `useFormContext`. Easier to test and modify.

**Why IndexedDB via idb-keyval?**
Migrated from localStorage to eliminate the 5MB quota ceiling and main-thread blocking that causes jank. `idb-keyval` provides a simple async key-value API that scales to production volumes without synchronous write issues.

**Why base64 data URIs for images?**
Previously used ephemeral `blob:` URLs that disappeared on page reload. Now images are read as base64 via FileReader and stored directly in IndexedDB, ensuring evidence screenshots persist across sessions.

**Why TanStack Query as single source of truth?**
Removed the conflicting `useSyncExternalStore` pub/sub implementation. TanStack Query now strictly manages all state and loading flags, including the PRD-mandated 1-3s simulated fetch delays.

## Customized shadcn Components

- **Button** — Added `loading` prop with spinner, `success` and `warning` variants
- **Card** — Added `interactive` (hover states) and `status` (left border color) props
- **Badge** — Added `dot` prop, status variants (pending/approved/rejected), `pulse` variant
- **Input** — Added `error` prop, `leftIcon` and `rightIcon` props

## Network Delays (PRD Compliance)

- Fetch delay: 1–3 seconds (randomised)
- Mutation delay: 3–5 seconds (randomised)

## Testing Notes

- 500 tasks and 1000 submissions for virtualizer stress testing
- Login at `/login`, select demo user, test role-specific navigation
- Status updates are interactive — click badges to change
- URL state persists across navigation (try `/worker?type=email_sending&sort=reward`)
- Mobile: all screens work at 375px viewport

## ADHD-Friendly UX

- **Reduced motion support** — respects `prefers-reduced-motion`
- **Clear visual hierarchy** — consistent color tokens
- **Minimal cognitive load** — status badges are clickable
- **Consistent spacing** — all sections use same spacing scale
- **Glass header** — sticky, always visible reference point

## AI Disclosure

See `/.ai_disclosure/` for transparency on AI assistance used during development.
