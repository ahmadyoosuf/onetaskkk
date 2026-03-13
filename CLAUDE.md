# Yoke Task Marketplace

Frontend evaluation — micro-task platform with admin and worker views.

## Stack

- Next.js 15, React 19, Tailwind v4, Shadcn UI
- react-hook-form + zod for form validation
- TanStack Virtual for submissions table (1000+ rows)
- No state management libraries — React state + shared store module

## Routes

| Path | Role | Purpose |
|------|------|---------|
| `/` | Worker | Browse tasks, filter, submit work |
| `/admin/composer` | Admin | Create new task |
| `/admin/tasks` | Admin | View all tasks, status, submissions |
| `/admin/submissions` | Admin | Review/approve/reject submissions |

## Task Types

Each type has different fields and validation:

- **Form Submission** — target URL, instructions
- **Email Sending** — email content, recipient count
- **Social Media Liking** — post URL, platform, engagement type

## Architecture Decisions

**Forms:** Using react-hook-form with zod schemas. The composer has conditional fields per task type, and proper validation matters for the UX. Deadline must be future date, required fields enforced.

**Virtualization:** Submissions table uses TanStack Virtual. The PRD says "should handle 1000s of tasks" — standard DOM rendering would tank performance.

**State:** Shared store in `/lib/store.ts` with getter/setter functions. No Redux. The app is small enough that this pattern is cleaner.

**Design system:** Adapted from a security dashboard reference — Space Grotesk + IBM Plex Mono fonts, indigo primary, warm surfaces, ghost borders (`border-border/30`), glass header.

## Phase 2 Scope (not implemented)

- Drag-and-drop reordering
- Real file uploads
- Database integration
- Auth with roles
