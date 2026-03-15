# Development Log

Engineering notes and key decisions made during development.

---

## Session 1: Project Scaffolding & Architecture

Set up the Next.js app structure for four screens: Task Composer, Tasks Feed, Tasks Management, and Submissions Review. Decided on a client-side mock store since this is a frontend evaluation with no backend requirement.

Chose react-hook-form + zod for form validation, TanStack Virtual for the task and submission lists (PRD says "1000s of tasks" so virtualization was non-negotiable), and shadcn/ui as the component foundation.

**Bug fixed:** TanStack Virtual cards were overlapping. The fixed `estimateSize` of 108px didn't account for variable card heights. Switched to `measureElement` callback for dynamic row measurement and added `data-index` attributes.

---

## Session 2: TypeScript Architecture for Task Types

The three task types have completely different detail shapes. Designed a discriminated union with `type` as the discriminant so TypeScript enforces correct field access per type:

```typescript
type Task = FormSubmissionTask | EmailSendingTask | SocialMediaTask
```

Created matching zod schemas using `z.discriminatedUnion()`. Caught a typo in one of the literal values during testing (`"form_submision"` missing an 's').

---

## Session 3: Design System

Defined design tokens: Indigo primary (#4F46E5), warm off-white background (#FAFAF8), ghost borders at 30% opacity. Chose Space Grotesk for headings. Added glass morphism header with `backdrop-blur-xl`.

Added `prefers-reduced-motion` support using `0.01ms` instead of `0ms` (some browsers ignore the latter). Designed mobile-first at 320px with `flex-wrap` + `min-w-0` for responsive filter layouts.

---

## Session 4: State Reactivity Bug

Found a bug: creating a task in the Composer then navigating to the Feed didn't show the new task until a full page refresh. Root cause was `useState` capturing the initial store snapshot at mount time.

Built a minimal pub/sub pattern with `useSyncExternalStore`. Key insight: the snapshot must be referentially stable — returning a new array reference on every call caused infinite re-renders. Fixed by caching the snapshot and only updating inside `notify()`.

*This was later replaced entirely by TanStack Query in Session 6.*

---

## Session 5: Production Readiness Pass

Removed `ignoreBuildErrors: true` from next.config.js and fixed the surfaced type errors (mostly missing null checks). Cleaned up unused imports, removed `console.log` debug statements, added missing `.gitignore` entries.

Fixed mobile touch targets: some buttons were only 32px tall, below the 44px minimum. Used a scoped selector to avoid affecting Badge components.

---

## Session 6: TanStack Query & Simulated Latency

Switched from SWR to TanStack Query — better fit with the store pattern and cleaner mutation handling via `invalidateQueries`. Added PRD-required simulated delays: 1-3s for fetches, 3-5s for mutations using randomised timeouts.

Scaled mock data from 5 tasks to 500 tasks and 1,000 submissions to stress-test virtualization. Verified smooth scrolling on mobile using Chrome DevTools throttling.

---

## Session 7: Targeted Refactors

Three focused changes:

1. Replaced rich-text HTML editor with plain textarea outputting Markdown, rendered with `react-markdown`. Cleaner storage, no sanitization overhead.
2. Replaced hand-rolled admin tasks table with TanStack Table for sortable columns, row selection, and action menus.
3. Fixed field labelling: "Max Submissions" should be "Amount" per PRD. Also stripped meaningless trend percentages from stats cards — the math was nonsensical (dividing by total + 3).

---

## Session 8: Lexical Rich-Text Editor

Replaced the plain textarea in the composer with a Lexical rich-text editor. Kept Markdown as the stored format — wired into react-hook-form using `Controller` since Lexical isn't a standard controlled input.

**Bugs fixed:** `$wrapNodes` from `@lexical/selection` is deprecated in v0.33+ and its recursive type signature causes a TypeScript "excessive stack depth" error — switched to `$setBlocksType`. Also resolved a version mismatch where `@lexical/selection` was pinned to a different major version than the other Lexical packages.

---

## Session 9: Mobile UX & PRD Compliance

Four changes driven by PRD re-read:

1. Replaced Dialog-based mobile detail views with Vaul bottom-sheet drawers (70% mobile audience per PRD).
2. Created shared `SubmissionDetail` component to eliminate duplicate detail UI between desktop panel and mobile drawer.
3. Changed fetch delay from fixed 2s to randomised 1-3s per PRD spec.
4. Added post-creation success dialog with "Create Another" option to reset the form without navigating away.

---

## Session 10: Dark Mode

Implemented complete dark mode with deep navy base (not pure black), layered card surfaces, and adjusted primary for dark background contrast.

Three parts: CSS token overrides in `.dark` class, ThemeProvider with `localStorage` persistence and `prefers-color-scheme` fallback, and an inline anti-flash script in `layout.tsx` that applies the theme before React hydrates (same pattern as next-themes).

---

## Session 11: IndexedDB Migration

Identified localStorage's 5MB quota as a production risk with 500 tasks + 1,000 submissions + base64 images. Migrated to IndexedDB via idb-keyval for async persistence.

Rewrote image upload to use FileReader base64 data URIs instead of ephemeral `blob:` URLs that disappeared on reload. Removed the conflicting `useSyncExternalStore` pub/sub so TanStack Query is the single source of truth. Fixed mock data distribution bug where submissions were only assigned to the first 200 tasks.

---

## Session 12: Unified API Layer

Moved all data operations behind a unified `api` object to match the PRD's "Server Experience" requirement — Client Components never touch raw data arrays directly.

Added confirmation dialogs to bulk destructive actions (ADHD UX requirement). Widened the worker feed instructions panel for better readability.

---

## Tools Used

- **v0.dev (Claude-powered)** for code generation and refactoring assistance
- **Claude.ai** for architecture discussions between sessions (localStorage vs IndexedDB trade-offs, Lexical integration approach)
