# onetaskkk

Micro-task marketplace. Workers complete tasks, admins manage and review submissions.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any demo account from `/login`.

## Validation

```bash
pnpm lint
pnpm test
pnpm build
```

## Routes

| Route | Role | Description |
|-------|------|-------------|
| `/login` | Public | Demo login, pick a mock account |
| `/` | Public | Role picker |
| `/worker` | Worker | Task feed, browse, filter, submit |
| `/admin/composer` | Admin | Create / edit tasks (3 types) |
| `/admin/tasks` | Admin | Task management with stats |
| `/admin/submissions` | Admin | Review, approve, or reject submissions |

## Task Types

- **Social Media Posting** - post content on LinkedIn, Twitter, or Instagram
- **Email Sending** - send templated emails to specified recipients
- **Social Media Liking** - engage with posts on social platforms

## Phase 2

Phase 2 adds task phases, drip feed slot release, worker earnings tracking, past submissions history, admin phase filtering, and bulk CSV task upload.

### New Routes

| Route | Role | Description |
|-------|------|-------------|
| `/worker/earnings` | Worker | Earnings dashboard with breakdown and activity |
| `/worker/submissions` | Worker | Past submissions list with status and detail view |

### Task Phases

Tasks can optionally be broken into sequential phases (e.g. Phase 1: 20 slots, Phase 2: 50 slots). Each phase has its own name, slot count, instructions, and reward. Workers see only the active phase. Admins see all phases with progress bars. A phase auto-advances when its slots fill up.

### Drip Feed

Slot release can be controlled at the task level. When enabled, slots are released in batches on a timed interval (e.g. 5 slots every 6 hours). Workers see a live countdown timer until the next batch. Drip feed has three states: active (slots available), waiting (next batch pending), and completed (all slots released).

### Worker Earnings

Workers see a dashboard at `/worker/earnings` with total earnings, confirmed earnings, pending earnings, approval rate, top-earning tasks, and a recent activity feed. Earnings compute correctly for phased tasks by using each phase's reward amount. Pending submissions are shown as optimistic earnings.

### Worker Past Submissions

Workers can view all their past submissions at `/worker/submissions`. The list supports status filtering (all, pending, approved, rejected), sort controls, and a detail drawer showing evidence images, admin notes, review timestamps, and phase indicators.

### Bulk CSV Upload

Admins can create multiple tasks at once by uploading a CSV file in the composer. The upload supports drag-and-drop, file validation, error highlighting per row, and a preview dialog before import. A downloadable CSV template is provided with columns for all three task types.

### Admin Phase Filtering

The admin submissions page now shows a phase filter dropdown when viewing a phased task. Submission rows display phase badges (P1, P2, etc.) inline. The filter works alongside existing task, status, and group-by-task controls.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn UI, Lexical (rich-text Markdown editor), TanStack Query, TanStack Table, TanStack Virtual, react-hook-form + zod, nuqs, Vaul (bottom-sheet drawer), idb-keyval (IndexedDB)

## Notes

- All data persists to IndexedDB via `idb-keyval` — eliminates localStorage's 5MB quota limit and main-thread blocking.
- Images are stored as base64 data URIs for cross-session persistence (no ephemeral blob URLs).
- Fetch delay is randomised 1-3s, mutation delay is randomised 3-5s per PRD spec.
- Dark mode is fully implemented with system-preference detection and `localStorage` persistence.
- 70% mobile audience assumed. Bottom-sheet drawers (Vaul) replace dialogs on small screens.
- TanStack Query is the single source of truth for all state — no conflicting pub/sub stores.
- Unified `api` object in store.ts provides "Server Experience" — Client Components never touch raw data.
- Mock data: 1,000 submissions distributed across all 500 tasks (not concentrated in first 200).
- Confirmation dialogs prevent accidental bulk deletions (ADHD UX requirement).

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed decisions.

## AI Usage

AI tools were used as a coding assistant for boilerplate and scaffolding. Architecture, design, and all technical decisions were developer-led. See [.ai_disclosure/](./.ai_disclosure/) for the full log.
