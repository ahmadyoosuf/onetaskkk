# TaskMarket

Frontend evaluation — micro-task platform with admin and worker roles.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v4
- Shadcn UI (customized design system)
- react-hook-form + zod (form validation)
- TanStack Virtual (virtualized lists)

No external state management — React state + module-level store.

## Routes

| Path | Role | Screen |
|------|------|--------|
| `/` | Worker | Tasks Feed — browse, filter, submit work |
| `/admin/composer` | Admin | Task Composer — create new tasks |
| `/admin/tasks` | Admin | Tasks Management — overview, stats, delete |
| `/admin/submissions` | Admin | Submissions — review, approve/reject |

## Task Types

| Type | Fields |
|------|--------|
| Form Submission | targetUrl, formFields[] |
| Email Sending | targetEmail, emailContent |
| Social Media Liking | postUrl, platform |

## Architecture

```
lib/
  types.ts      — discriminated union types (Task, Submission)
  schemas.ts    — zod schemas for form validation
  store.ts      — in-memory CRUD with 120+ mock submissions

components/
  app-shell.tsx — shared layout with glass header
  composer/     — isolated form field components

app/
  page.tsx              — Tasks Feed
  admin/composer/       — Task Composer
  admin/tasks/          — Tasks Management
  admin/submissions/    — Submissions
```

## Key Decisions

**Why discriminated unions for Task?**  
Each task type has different `details` shape. Union types let TypeScript enforce correct field access per type.

**Why TanStack Virtual?**  
PRD says "should handle 1000s of tasks." Virtualization renders only visible rows — no DOM bloat.

**Why isolated field components?**  
Composer has `TitleField`, `RewardField`, `FormSubmissionFields`, etc. Each component owns its validation state via `useFormContext`. Easier to test, reuse, modify.

**Why module-level store vs Context?**  
For a demo with no persistence, a simple `getTasks()`/`createTask()` module is cleaner than Context boilerplate. Would swap for real DB + React Query in production.

## Testing Notes

- Submissions page has 120 pre-seeded entries to test virtualization
- Create a task via Composer, verify it appears in Tasks Management
- Status updates in Tasks Management are interactive — click the status badge to change
- Filter submissions by status and task, verify counts update reactively
- Mobile: all screens work at 375px viewport

## ADHD-Friendly UX

- **Reduced motion support** — respects `prefers-reduced-motion` to disable animations for users sensitive to motion
- **Clear visual hierarchy** — consistent use of color tokens (primary, success, destructive) to signal action vs state
- **Minimal cognitive load** — status badges are clickable (not buried in menus), task count shows progress at a glance
- **Consistent spacing** — all sections use the same spacing scale (gap-4, p-4) to make layout predictable
- **Glass header** — sticky, always visible — easy reference point when scrolling

## AI Prompts

Development prompts are in `/prompts/` folder — raw context I fed to Claude during build.
