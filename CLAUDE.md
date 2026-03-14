# onetaskkk

Frontend evaluation — micro-task platform with admin and worker roles.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Shadcn UI (customized design system)
- TanStack Query (data fetching & mutations)
- react-hook-form + zod (form validation)
- TanStack Virtual (virtualized lists)
- nuqs (URL state management)

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
  schemas.ts    — zod schemas for form validation
  store.ts      — in-memory CRUD with 500 tasks, 1000 submissions
  auth.ts       — mock authentication helpers

components/
  app-shell.tsx           — shared layout with glass header + user menu
  error-boundary.tsx      — error handling components
  providers/
    query-provider.tsx    — TanStack Query provider
    auth-provider.tsx     — Authentication context + redirects
  composer/               — isolated form field components
  ui/                     — customized shadcn components

hooks/
  use-store.ts            — TanStack Query hooks for tasks/submissions

app/
  login/page.tsx          — Mock login page
  page.tsx                — Role Picker
  worker/page.tsx         — Tasks Feed (nuqs for URL state)
  admin/composer/         — Task Composer
  admin/tasks/            — Tasks Management (nuqs for URL state)
  admin/submissions/      — Submissions (nuqs for URL state)
```

## Key Decisions

**Why TanStack Query?**  
PRD explicitly recommends it. Provides automatic caching, loading states, and mutation invalidation. Replaced SWR.

**Why nuqs for URL state?**  
PRD recommends it. Filter states (type, sort, status) persist in URL for shareability and browser navigation.

**Why mock auth?**  
PRD says "lay out basic mock authentication." Demonstrates auth flow without real backend.

**Why discriminated unions for Task?**  
Each task type has different `details` shape. Union types let TypeScript enforce correct field access per type.

**Why TanStack Virtual?**  
PRD says "should handle 1000s of tasks." Virtualization renders only visible rows — no DOM bloat.

**Why isolated field components?**  
Composer has `TitleField`, `RewardField`, etc. Each owns validation state via `useFormContext`. Easier to test and modify.

## Customized shadcn Components

- **Button** — Added `loading` prop with spinner, `success` and `warning` variants
- **Card** — Added `interactive` (hover states) and `status` (left border color) props
- **Badge** — Added `dot` prop, status variants (pending/approved/rejected), `pulse` variant
- **Input** — Added `error` prop, `leftIcon` and `rightIcon` props

## Network Delays (PRD Compliance)

- Fetch delay: 2 seconds
- Mutation delay: 3-5 seconds (random)

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
