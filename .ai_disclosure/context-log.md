# Development Log

Engineering notes and AI assistance context during development.

---

## Prompt 1: Project Scaffolding & Architecture Planning

Scaffold a new Next.js app for a micro-tasking platform with four screens: Task Composer (admin creates tasks), Tasks Feed (workers browse/claim), Tasks Management (admin CRUD table), and Submissions Review (admin approves/rejects). No backend needed — use a client-side mock store since this is a frontend evaluation. Use react-hook-form + zod for the composer form, TanStack Virtual for the task and submission lists (PRD says "1000s of tasks" so virtualization is non-negotiable), and shadcn/ui as the component foundation.

While setting up TanStack Virtual the cards were rendering but overlapping badly. The fixed `estimateSize` of 108px didn't account for variable card heights based on description length. Fix it using the `measureElement` callback to dynamically measure each row, and add `data-index` attributes so the measurement works correctly:

```typescript
// Before (broken):
estimateSize: () => 108

// After (working):
estimateSize: () => 96,
measureElement: (el) => el.getBoundingClientRect().height
```

---

## Prompt 2: TypeScript Discriminated Unions for Task Types

The three task types (form_submission, email_sending, social_media_liking) each have completely different detail fields. Right now they're in a single `Task` interface with optional fields everywhere and TypeScript isn't catching errors when I access `task.details.postUrl` on a form_submission task. Fix this using a discriminated union with `type` as the discriminant:

```typescript
type Task = FormSubmissionTask | EmailSendingTask | SocialMediaTask

interface FormSubmissionTask {
  type: "form_submission"
  details: { targetUrl: string; formFields: string[] }
  // ... common fields
}
```

Also create matching zod schemas using `z.discriminatedUnion()` that mirror the TypeScript types. There's a validation error — "Invalid discriminator value" — it's a typo in one of the literal values (`"form_submision"` missing an 's'), fix that too.

---

## Prompt 3: Design System Implementation

Implement the design system with these tokens:
- **Primary:** Indigo (#4F46E5)
- **Background:** Warm off-white (#FAFAF8)
- **Borders:** Ghost borders at 30% opacity
- **Font:** Space Grotesk for headings, system sans for body

Add a glass morphism header with `backdrop-blur-xl`. Add `prefers-reduced-motion` support — use `0.01ms` not `0ms` because some browsers ignore the latter:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Design mobile-first at 320px, then enhance for larger screens. The filter dropdowns should be full-width on mobile and inline on desktop — use `flex-wrap` with `min-w-0` on flex children to handle this.

---

## Prompt 4: State Management & Reactivity Bug

There's a bug: creating a task in the Composer then navigating to the Feed doesn't show the new task. The Feed only updates on full page refresh. The root cause is that `useState` captures the initial value at mount time — when Composer adds to the store, the Feed's local state snapshot doesn't update.

Fix this with a minimal custom pub/sub pattern and `useSyncExternalStore`:

```typescript
const listeners = new Set<() => void>()

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  listeners.forEach(l => l())
}
```

The snapshot must be referentially stable — returning a new array reference on every call causes infinite re-renders. Cache the snapshot and only update it inside `notify()`.

---

## Prompt 5: Code Review & Production Readiness

Do a pre-submission code review and fix everything that would fail in production:

1. Remove `ignoreBuildErrors: true` from next.config.js and fix the type errors that surface (mostly missing null checks on `selectedTask?.id` patterns).
2. Remove all unused imports (`useEffect`, `useCallback`, etc).
3. Remove all `console.log` debug statements left in the store.
4. Add missing `.gitignore` entries: `.env*.local`, `.vercel`, standard Next.js ignores.
5. Fix mobile touch targets — some buttons are only 32px tall, below the 44px minimum. Add `min-h-[44px]` but scope it carefully so it doesn't affect Badge components. The broad selector is wrong:

```css
/* Too broad - affects badges, chips, etc */
button, a { min-height: 44px; }

/* Better - only affects real interactive buttons */
button:not([data-state]):not(.touch-target-sm) { min-height: 44px; }
```

---

## Prompt 6: TanStack Query & Simulated Latency

The PRD explicitly requires simulated network delays. Add async fetchers with artificial delays — fetch delay should be randomised 1-3s, mutations should be randomised 3-5s:

```typescript
const delay = 3000 + Math.random() * 2000
await new Promise(r => setTimeout(r, delay))
```

Switch from SWR to TanStack Query. TanStack Query fits better with the store pattern and has cleaner mutation handling via `invalidateQueries`.

Also scale up mock data from 5 tasks to 500 tasks and 1000 submissions to properly stress-test the virtualizer. Verify smooth scrolling on mobile using Chrome DevTools throttling.

---

## Prompt 7: Submissions Page, Details Field, and Admin Table Refactors

Three focused changes:

**1.** Switch the composer details field from a rich-text HTML editor to a plain textarea outputting Markdown. Render it with `react-markdown` in detail panels. Cleaner storage, no sanitization headaches.

**2.** Replace the hand-rolled admin tasks table with a TanStack Table implementation (`@tanstack/react-table`) to get sortable columns, row selection, and action menus with less custom code.

**3.** The bulk edit dialog labels the field "Max Submissions" but the PRD calls it "Amount". Fix the label everywhere it appears including in the composer form.

Also strip the fake trend math from the stats cards — the percentages are calculated in a way that means nothing (dividing by total + 3, etc.). Replace with static values since there's no historical data.

---

## Prompt 8: Lexical Rich-Text Editor

Replace the plain textarea in the composer details field with a Lexical rich-text editor. The stored value must stay as Markdown, so the editor needs to output Markdown on every change.

Wire Lexical into react-hook-form using `Controller` (not `register` — Lexical isn't a standard controlled input). Use `OnChangePlugin` to fire on every editor state change, call `$convertToMarkdownString(TRANSFORMERS)` inside `editorState.read()`, and pass the result to `field.onChange`. For edit mode, seed the editor from the existing form value using `$convertFromMarkdownString` in `initialConfig.editorState`.

Add a toolbar with bold, italic, strikethrough, inline code, H2, H3, blockquote, undo, and redo. Enable `MarkdownShortcutPlugin` so users can type Markdown syntax directly.

There's a build failure: `$wrapNodes` from `@lexical/selection` is deprecated in v0.33+ and its recursive type signature causes TypeScript to throw "excessive stack depth". Switch to `$setBlocksType`. Also fix a version mismatch where `@lexical/selection` is pinned to `^0.41.0` while all other Lexical packages are at `^0.33.0`.

---

## Prompt 9: Mobile Drawers, Fetch Delay Fix, and Form Reset

Fix four PRD compliance issues:

**1.** The app has a 70% mobile audience per the PRD. Replace Dialog-based mobile detail views on the submissions and worker feed pages with Vaul bottom-sheet drawers. Create a shared `components/ui/drawer.tsx` wrapping Vaul with design system tokens.

**2.** The submissions page has duplicate detail UI coded inline for desktop (panel) and mobile (dialog). Replace both with the shared `SubmissionDetail` component.

**3.** The fetch delay is a fixed 2 seconds but the PRD specifies 1-3 seconds. Change it to use a `randomFetchDelay()` that returns a value in that range.

**4.** After creating a task, the app always redirects to `/admin/tasks`. Instead show a success dialog with two options: "View All Tasks" (redirect) or "Create Another Task" (reset the form and stay on the page using `reset()` from react-hook-form).

---

## Prompt 10: Dark Mode

Add complete dark mode. Use a deep navy base (not pure black), layered card surfaces, and keep indigo primary vibrant but slightly lighter for dark background contrast.

Three parts to implement:

**CSS tokens.** Add a `.dark` block in `globals.css` overriding every design token. Background `hsl(228 22% 9%)`, cards at `hsl(228 20% 13%)` and `hsl(228 20% 11%)` for layering, primary at `hsl(240 70% 68%)`.

**ThemeProvider.** A client component that reads from `localStorage` (key: `onetaskkk-theme`), falls back to `prefers-color-scheme` on first visit, applies `.dark` to `<html>`, and exposes `theme`/`setTheme` via context. Support `"light"`, `"dark"`, and `"system"`.

**Anti-flash script.** Add a tiny inline `<script>` in `layout.tsx` that runs synchronously before any rendering, reads `localStorage`, and applies `.dark` to `<html>` immediately. This will cause a React hydration mismatch warning in dev — that's expected and safe, same pattern as next-themes.

Put a ThemeToggle in the app-shell header and also inside the user dropdown as a three-way Light/Dark/System control.

---

## Prompt 11: IndexedDB Migration & State Management Overhaul

Replace synchronous localStorage with async idb-keyval (IndexedDB) in store.ts to eliminate 5MB quota crashes and main-thread blocking. Rewrite image-upload.tsx to read files as base64 data URIs using FileReader instead of ephemeral blob: URLs so evidence persists across sessions.

Gut the redundant useSyncExternalStore implementation in use-store.ts so TanStack Query strictly manages all state and loading flags (restoring the PRD-mandated 1-3s simulated fetch delays). Make the description field truly optional in schemas.ts. Inject the full task details and description into SubmissionDetail to satisfy the PRD's ADHD UX requirement.

Implement the missing sortBy (date/status) functionality on the Submissions page. Prevent DOM explosion on the Admin Tasks page by adding pagination to TasksTable and virtualizing the mobile card list. Add validation to block bulk-editing maxSubmissions below any selected task's currentSubmissions.

---

## Prompt 12: Unified API Layer & ADHD UX Fixes

Stop the direct store import pattern by moving all data operations behind a unified `api` object so Client Components never touch raw data arrays directly, truly mimicking the "Server Experience" mandated by the PRD:

```typescript
export const api = {
  tasks: { list, get, create, update, updateStatus, delete },
  submissions: { list, get, create, updateStatus },
  users: { current, admin },
}
```

Fix the ADHD/common sense UX failure on the worker feed by widening the instructions panel — it is currently too narrow to read. Add mandatory confirmation dialogs to all destructive Admin actions (Bulk Delete) to prevent accidental data loss.

Repair the lazy mock data logic in store.ts which currently only assigns submissions to the first 200 tasks. Distribute the 1,000 mock submissions across the entire 500-task set by changing `taskIndex = i % 200` to `taskIndex = i % generatedTasks.length`.

---

## AI Tools Used

- **Claude (via v0.dev)** - All code generation, refactoring, and debugging across all prompts
- **Claude.ai** - Architecture discussions between prompts (localStorage vs IndexedDB scale question, Lexical integration approach)
