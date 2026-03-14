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

Built with AI assistance. See [.ai_disclosure/](./.ai_disclosure/) for details.
