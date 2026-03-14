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

## Session 6: SWR Integration & Simulated Latency

**Date:** March 14, 2026  
**Duration:** ~1.5 hours

PRD explicitly requires SWR for data fetching and simulated network delays (2s for fetches, 1-3s for mutations). Retrofitted this into the existing store.

Created async fetchers with artificial delays:
```typescript
export async function fetchTasks(): Promise<Task[]> {
  await new Promise(r => setTimeout(r, 2000)) // 2s delay per PRD
  return [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
```

Mutations got random delays between 1-3 seconds to simulate variable network conditions:
```typescript
const delay = 1000 + Math.random() * 2000
await new Promise(r => setTimeout(r, delay))
```

Updated hooks to use SWR while maintaining local reactivity for optimistic updates:
```typescript
export function useTasks() {
  const { data, isLoading } = useSWR("tasks", fetchTasks, {
    fallbackData: getTasksSnapshot(),
  })
  const snapshot = useSyncExternalStore(subscribe, getTasksSnapshot, getTasksSnapshot)
  return { tasks: data || snapshot, isLoading }
}
```

This hybrid approach means: initial load shows loading state for 2s, but after that, local mutations appear instantly (optimistic) while the SWR cache stays in sync.

Also scaled up mock data from 5 tasks to 120 tasks and 300 submissions to properly stress-test the virtualizer. Verified smooth scrolling on mobile with Chrome DevTools throttling.

---

## AI Tools Used

- **Claude (via v0.dev)** - Architecture decisions, debugging assistance, code review
- **GitHub Copilot** - Inline completions for repetitive patterns

Total AI-assisted time: ~8 hours across 6 sessions  
Estimated time saved: ~4-6 hours (mainly on debugging and boilerplate)
