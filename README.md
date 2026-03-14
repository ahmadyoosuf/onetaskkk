# TaskMarket

Micro-task marketplace — workers complete tasks, admins review submissions.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Screens

| Route | Description |
|-------|-------------|
| `/` | Tasks Feed — workers browse and submit |
| `/admin/composer` | Create tasks (3 types) |
| `/admin/tasks` | Task overview with stats |
| `/admin/submissions` | Review and approve/reject |

## Stack

Next.js 15, React 19, Tailwind v4, Shadcn UI, react-hook-form + zod, TanStack Virtual

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed decisions.

## AI Usage

Built with AI assistance. See [.ai_disclosure/](./.ai_disclosure/) for details.
