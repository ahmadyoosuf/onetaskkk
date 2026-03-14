# TaskMarket

Micro-task marketplace - workers complete tasks, admins review submissions.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Validation

```bash
npm run lint
npm test
npm run build
```

## Screens

| Route | Description |
|-------|-------------|
| `/` | Role Picker - choose Worker or Admin mode |
| `/worker` | Tasks Feed - browse and submit tasks |
| `/admin/composer` | Create tasks (3 types) |
| `/admin/tasks` | Task overview with stats |
| `/admin/submissions` | Review and approve/reject |

## Task Types

- **Social Media Posting** - Workers post content on their social accounts (LinkedIn, Twitter, Instagram)
- **Email Sending** - Workers send templated emails to specified recipients
- **Social Media Liking** - Workers engage with posts on social platforms

## Stack

Next.js 16, React 19, Tailwind v4, Shadcn UI, react-hook-form + zod, TanStack Virtual

## Notes

- **Role Switching**: Landing page (`/`) lets users pick Worker or Admin mode. Each mode shows only relevant navigation tabs with a "Switch Role" button to return to the picker.
- SWR drives async loading/error states and mocked network delay behavior.
- The in-memory external store remains the live source for optimistic UI updates.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed decisions.

## AI Usage

Built with AI assistance. See [.ai_disclosure/](./.ai_disclosure/) for details.
