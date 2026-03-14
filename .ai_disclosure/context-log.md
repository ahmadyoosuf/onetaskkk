# Development Log

Engineering notes and AI assistance context during development.

---

## Session 1: Project Scaffolding & Architecture Planning

**Date:** March 12, 2026  
**Duration:** ~2.5 hours

Started by reading through the PRD requirements carefully. The platform needs 4 main screens: Task Composer (admin creates tasks), Tasks Feed (workers browse/claim), Tasks Management (admin CRUD), and Submissions Review (admin approves/rejects).

Initial architecture decision: went with a client-side mock store instead of setting up a full backend since the PRD emphasizes frontend evaluation. Used AI to help scaffold the initial file structure and component hierarchy.

Key technical choices made:
- **react-hook-form + zod** for the composer form - the PRD specifically calls out form validation as important, and zod gives us runtime validation that matches TypeScript types
- **TanStack Virtual** for the task/submission lists - PRD mentions "1000s of tasks" so virtualization is non-negotiable for performance
- **shadcn/ui** as component foundation - matches the recommended stack and gives accessible primitives

Spent about 40 minutes debugging the initial TanStack Virtual setup. The cards were rendering but overlapping each other badly. Turns out I was using a fixed `estimateSize` of 108px but the actual card height varied based on description length. AI suggested using `measureElement` callback which dynamically measures each row - this fixed the overlap issue completely.

```typescript
// Before (broken):
estimateSize: () => 108

// After (working):
estimateSize: () => 96,
measureElement: (el) => el.getBoundingClientRect().height
```

Also added `data-index` attribute to each row div which is required for measureElement to work properly. This wasn't obvious from the TanStack docs.

---

## Session 2: TypeScript Discriminated Unions for Task Types

**Date:** March 12, 2026  
**Duration:** ~1 hour

The three task types (form_submission, email_sending, social_media_liking) each have completely different detail fields:
- Form submission needs `targetUrl` and `formFields[]`
- Email sending needs `targetEmail` and `emailContent`
- Social media needs `postUrl` and `platform`

Initially tried a single `Task` interface with optional fields everywhere - TypeScript wasn't catching errors when I accessed `task.details.postUrl` on a form_submission task. Asked AI for help structuring this properly.

Solution was discriminated unions with a `type` field as the discriminant:

```typescript
type Task = FormSubmissionTask | EmailSendingTask | SocialMediaTask

interface FormSubmissionTask {
  type: "form_submission"
  details: { targetUrl: string; formFields: string[] }
  // ... common fields
}
```

Now TypeScript narrows correctly inside `if (task.type === "form_submission")` blocks. Also created corresponding zod schemas that mirror the types using `z.discriminatedUnion()` - this was tricky because the zod API is slightly different from the TS syntax.

Hit a wall for ~20 minutes when the zod schema wasn't validating correctly. Error was cryptic: "Invalid discriminator value". Turned out I had a typo in one of the literal values (`"form_submision"` missing an 's'). AI helped spot this by asking me to compare the schema literals against the type literals.

---

## Session 3: Design System Implementation

**Date:** March 12, 2026  
**Duration:** ~1.5 hours

Referenced the secDash design for visual direction - clean, professional, warm tones. Key design tokens:
- **Primary:** Indigo (#4F46E5) - professional but not boring
- **Background:** Warm off-white (#FAFAF8) - easier on eyes than pure white
- **Borders:** Ghost borders at 30% opacity - subtle separation without harsh lines
- **Font:** Space Grotesk for headings (geometric, modern), system sans for body (performance)

Implemented the glass morphism header with `backdrop-blur-xl` and semi-transparent background. Looks great but had to be careful about z-index stacking with the mobile bottom sheets.

Added `prefers-reduced-motion` support throughout:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This was important for accessibility - animations can be problematic for users with vestibular disorders or ADHD. AI reminded me to also use `transition-duration: 0.01ms` not `0ms` because some browsers ignore 0ms transitions.

Mobile-first approach: designed the card layout for 320px width first, then enhanced for larger screens. The filter dropdowns were tricky - on mobile they take full width, on desktop they sit inline. Used `flex-wrap` with `min-w-0` on the flex children to handle this gracefully.

---

## Session 4: State Management & Reactivity Bug

**Date:** March 13, 2026  
**Duration:** ~2 hours

Found a critical bug: creating a task in the Composer, then navigating to the Feed, the new task wouldn't appear. Had to refresh the page to see it. 

Root cause analysis took a while. The issue was in how I initialized the store:

```typescript
// Bug: useState captures initial value at mount time
const [tasks] = useState(() => getInitialTasks())
```

When the Feed component mounts, it creates its own snapshot of the tasks array. When Composer adds a task to the store, the Feed's local state doesn't update because useState doesn't re-run the initializer.

Considered several solutions:
1. **Zustand** - overkill for this project, adds dependency
2. **React Context** - would need to lift state way up, prop drilling nightmare  
3. **Custom pub/sub** - lightweight, fits the use case

Went with option 3. Asked AI to help implement a minimal pub/sub pattern:

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

Then used `useSyncExternalStore` (React 18 hook specifically designed for external stores) to subscribe components to changes:

```typescript
export function useTasks(): Task[] {
  return useSyncExternalStore(subscribe, getTasksSnapshot, getTasksSnapshot)
}
```

The key insight (from AI) was that `useSyncExternalStore` requires the snapshot to be referentially stable - if you return a new array reference on every call, it causes infinite re-renders. Fixed by caching the snapshot and only updating it in `notify()`.

Tested by rapidly creating tasks in Composer and watching them appear in Feed without navigation. Works perfectly now.

---

## Session 5: Code Review & Production Readiness

**Date:** March 13, 2026  
**Duration:** ~1 hour

Self-review before submission. Found several issues:

1. **TypeScript `ignoreBuildErrors: true`** was in next.config.js - this was a crutch from early development. Removed it and fixed the ~15 type errors that surfaced. Most were missing null checks on `selectedTask?.id` patterns.

2. **Unused imports** scattered throughout - `useEffect` imported but not used in page.tsx, `useCallback` imported unnecessarily. ESLint caught these once I enabled strict mode.

3. **Console.logs left in** - had debugging statements like `console.log("task created", task)` in the store. Removed all of them.

4. **`.gitignore` was missing entries** - added `.env*.local`, `.vercel`, and other standard Next.js ignores.

5. **Mobile touch targets** - some buttons were only 32px tall, below the 44px minimum recommended by Apple HIG. Added `min-h-[44px]` to interactive elements, but had to scope it carefully to avoid bloating Badge components.

AI helped identify that the touch target CSS was too aggressive:
```css
/* Too broad - affects badges, chips, etc */
button, a { min-height: 44px; }

/* Better - only affects real interactive buttons */
button:not([data-state]):not(.touch-target-sm) { min-height: 44px; }
```

---

## Session 6: TanStack Query & Simulated Latency

**Date:** March 14, 2026  
**Duration:** ~1.5 hours

PRD explicitly requires simulated network delays (fetches and mutations). Retrofitted this into the existing store.

Created async fetchers with artificial delays. Fetch delay started at a fixed 2s but this was later revised (see Session 8).

Mutations got random delays between 3-5 seconds to simulate variable network conditions:
```typescript
const delay = 3000 + Math.random() * 2000
await new Promise(r => setTimeout(r, delay))
```

Switched from SWR to TanStack Query for data fetching. TanStack Query fit better with the existing store pattern and gave cleaner mutation handling with `invalidateQueries`. The hybrid approach means initial load shows a loading state, but after that, local mutations appear immediately (optimistic) while the cache stays in sync.

Also scaled up mock data from 5 tasks to 500 tasks and 1000 submissions to properly stress-test the virtualizer. Verified smooth scrolling on mobile with Chrome DevTools throttling.

---

## Session 7: Submissions Page, Details Field, and Admin Table Refactors

**Date:** March 14, 2026  
**Duration:** ~2 hours

Three focused refactors in one session:

**1. Task details field to Markdown.** The composer was storing HTML from a rich-text editor. Switched it to a plain textarea outputting Markdown, with `react-markdown` rendering it in detail panels. Cleaner storage, no sanitization headaches.

**2. TanStack Table for admin tasks.** The hand-rolled table was getting hard to extend. Replaced it with a TanStack Table implementation (`@tanstack/react-table`). Got sortable columns, row selection, and action menus for free with much less custom code.

**3. Bulk edit label fix.** The bulk edit dialog was labeling the field "Max Submissions" but the PRD uses "Amount". Updated the label everywhere it appeared including the composer form field.

Also stripped fake trend math from the stats cards. The percentages were calculated from the current data in a way that didn't mean anything (dividing by total + 3, etc.). Replaced with static values since there's no historical data to trend against.

---

## Session 8: Lexical Rich-Text Editor

**Date:** March 14, 2026  
**Duration:** ~1.5 hours

Replaced the plain textarea in the composer details field with a proper Lexical rich-text editor. The requirement is that the stored value stays Markdown, so the editor needs to output Markdown on every change.

Integration with react-hook-form was the main complexity. Lexical is not a standard controlled input, so `register()` doesn't work. Used `Controller` instead, which wraps Lexical and wires it up manually. `OnChangePlugin` fires on every editor state change, calls `$convertToMarkdownString(TRANSFORMERS)` inside `editorState.read()`, and passes the result to `field.onChange`. For edit mode, `$convertFromMarkdownString` seeds the editor from the existing form value in `initialConfig.editorState`.

Added a toolbar with bold, italic, strikethrough, inline code, H2, H3, blockquote, undo, and redo. Also enabled `MarkdownShortcutPlugin` so users can type Markdown syntax directly.

Hit a build failure when deploying: `$wrapNodes` from `@lexical/selection` was deprecated in v0.33+ and its recursive type signature caused TypeScript to throw "excessive stack depth" during compilation. Switched to `$setBlocksType` which is the current API. Also had a version mismatch where `@lexical/selection` was accidentally pinned to `^0.41.0` while all other Lexical packages were at `^0.33.0`. Fixed both.

---

## Session 9: Mobile Drawers, Fetch Delay Fix, and Form Reset

**Date:** March 14, 2026  
**Duration:** ~2 hours

Several PRD compliance fixes and UX improvements:

**1. Vaul bottom-sheet drawers.** The app has a 70% mobile audience per the PRD. Dialog components feel wrong on mobile. Replaced Dialog-based mobile detail views on both the submissions and worker feed pages with Vaul drawers. Vaul gives proper drag-to-dismiss, spring physics, and the correct visual weight for a bottom sheet. Created a shared `components/ui/drawer.tsx` wrapping Vaul with design system tokens.

**2. Submissions page refactor.** The submissions page had duplicate detail UI coded inline for both desktop (panel) and mobile (dialog). Replaced both with the existing `SubmissionDetail` component. No more divergence between what desktop and mobile users see.

**3. Fetch delay corrected.** The PRD specifies 1-3 seconds for data fetching, not a fixed 2 seconds. Updated the store to use `randomFetchDelay()` which returns a value in that range. Mutations were already randomised in the correct 3-5s range.

**4. Composer form reset.** After creating a task the app was always redirecting to `/admin/tasks`. Added a success dialog instead that gives two options: "View All Tasks" (redirect) or "Create Another Task" (reset form and stay). `reset()` from react-hook-form clears all fields back to defaults.

Also aligned the login page test mocks with the actual fetch-based auth implementation. The tests were mocking a direct function call but the real implementation uses `fetch()` to hit an API route.

---

## Session 10: Dark Mode

**Date:** March 15, 2026  
**Duration:** ~1 hour

Added a complete dark mode to the app. The design direction was deep navy base (not pure black), layered card surfaces, and the indigo primary kept vibrant but slightly lighter for contrast on dark backgrounds.

Implementation has three parts:

**CSS tokens.** Added a `.dark` block in `globals.css` with a full set of overrides for every design token. Background is `hsl(228 22% 9%)`, cards at `hsl(228 20% 13%)` and `hsl(228 20% 11%)` for layering, primary brightened to `hsl(240 70% 68%)`.

**ThemeProvider.** A client component that reads preference from `localStorage` (key: `onetaskkk-theme`), falls back to `prefers-color-scheme` on first visit, applies `.dark` to `<html>`, and exposes `theme`/`setTheme` via context. Supports `"light"`, `"dark"`, and `"system"` values.

**Anti-flash script.** The server always renders without `.dark` since it doesn't know the user's preference. Without a fix, dark mode users see a white flash before React hydrates. Added a tiny inline `<script>` in `layout.tsx` that runs synchronously before any rendering, reads `localStorage`, and adds `.dark` to `<html>` immediately. This causes a React hydration mismatch warning in dev (the server HTML doesn't have the class but the client does) but that's expected and safe. It's the same pattern used by next-themes and every other theme implementation.

ThemeToggle component placed in the app-shell header and also inside the user dropdown menu as a three-way Light/Dark/System control.

---

## AI Tools Used

- **Claude (via v0.dev)** - All architecture decisions, debugging, code generation, and refactoring across all sessions
- **Claude.ai** - Architecture discussion and trade-off analysis between sessions (localStorage vs IndexedDB scale question, Lexical integration approach)

Total AI-assisted development time: ~15 hours across 10 sessions
