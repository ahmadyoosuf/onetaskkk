# Development Decisions & Lessons Learned

## Key Architectural Decisions

### 1. Module-Level Store Over Context API

**Decision:** Use a simple `store.ts` module with pub/sub pattern instead of React Context + Reducer.

**Rationale:**
- Context re-creates objects on every parent render, causing unnecessary child re-renders
- A module-level store is simpler to reason about for this small app
- No provider boilerplate needed

**Tradeoff:** Doesn't scale to complex state machines. For production, would use TanStack Query or Redux.

**What I learned:** Sometimes the "React way" (Context) isn't the simplest way for a demo. Pragmatism beats dogma.

### 2. Discriminated Unions for Task Types

**Decision:** Use TypeScript discriminated unions instead of a single flat Task interface with optional fields.

```ts
type Task = 
  | FormSubmissionTask & { type: "form_submission" }
  | EmailSendingTask & { type: "email_sending" }
  | SocialMediaTask & { type: "social_media_liking" }
```

**Rationale:**
- TypeScript narrows types automatically based on `task.type` value
- Can't accidentally access wrong fields
- Self-documenting code — type tells you exactly what fields exist

**Tradeoff:** Makes the type definition verbose. IDE autocomplete is cleaner though.

**What I learned:** Better to be explicit about domain constraints than rely on runtime checks.

### 3. TanStack Virtual for Lists

**Decision:** Use virtualization even for 5-20 items initially, because PRD mentioned "handle 1000s."

**Challenges:**
- Fixed `estimateSize` caused card clipping because actual height was dynamic
- Solved by using `measureElement` callback for real DOM measurement
- Had to be careful with React keys and indexes

**Rationale:**
- Component design must support scale from day one
- Easier to test with 300+ mock items than wait for production data
- Shows intent: this app is built for growth

**What I learned:** Premature optimization for scale is actually good architecture — don't optimize early, but *design* for it.

### 4. SWR Instead of Custom Hooks

**Decision:** Add SWR for data fetching as specified in PRD.

**Implementation:**
- Paired SWR with `useSyncExternalStore` for optimistic updates
- SWR handles request deduplication, caching, revalidation
- Local store mutations immediately update UI (optimistic)

**Tradeoff:** Slight complexity in combining two patterns, but gains us best of both worlds.

**What I learned:** SWR's minimal API is deceptive — there's a lot of smart caching logic built in.

### 5. Simulated Network Delays

**Decision:** Add 2-second fetch delay and 1-3 second mutation delays as per PRD.

**Why it matters:**
- Fake delay forces UI to show loading states
- Exposes race conditions that only appear under latency
- Makes the app feel more realistic than instant responses

**Testing insight:** The 2-second delay caught a bug where the loading state wasn't showing because mutations were too fast to see the skeleton.

**What I learned:** Latency simulation is a powerful testing tool that's often overlooked.

## Debugging Stories

### Issue 1: Virtualizer Cards Were Clipping

**Symptoms:** Bottom row of each card (submission count + badge) was cut off.

**Root cause:** Used `estimateSize: () => 108` but actual card height was ~120px because of line wrapping.

**Investigation:**
1. First thought: CSS issue with overflow
2. Checked: border-box sizing was correct
3. Realized: virtualizer's internal height calculation was wrong
4. Solution: Switched to `measureElement: (el) => el.getBoundingClientRect().height`

**Lesson:** Trust the DOM. When virtualizer seems broken, it's usually the estimate, not the math.

### Issue 2: Infinite Re-renders in Form

**Symptoms:** Input field would re-render 50+ times per keystroke.

**Root cause:** Form context was recreating on every parent render because it wasn't memoized.

**Fix:** Wrapped form provider in useMemo:
```ts
const form = useMemo(() => createFormContext(...), [])
```

**Lesson:** React's "single source of truth" can become "constant source of re-renders" if not memoized properly.

### Issue 3: CSS @import Placement

**Symptoms:** Build error — "@import rules must precede all rules."

**Root cause:** Google Fonts @import statements were accidentally placed after regular CSS rules.

**Fix:** Moved all @import to the very top of globals.css (after @theme).

**Lesson:** CSS has weird ordering rules. Use a linter that catches this.

## Things I'd Do Differently

### 1. Add Error Boundaries Earlier
Currently mutations just fail silently. Should have added error handling from the start.

### 2. Component Testing
Built UI first, didn't write tests. Should have written tests alongside components to catch issues earlier.

### 3. Separate Concerns Better
Some components are doing too much (form components handle validation + UI + data). Could split into:
- Presentational components (pure, testable)
- Container components (data, side effects)

### 4. Type Safety in Event Handlers
Event handlers sometimes lose types because React events don't narrow properly. Would use a type-safe event wrapper.

### 5. Performance Profiling Earlier
Didn't profile the app with React DevTools Profiler until late. Finding re-render issues earlier would have saved time.

## What Worked Well

### 1. TypeScript for Domain Modeling
Discriminated unions + strict types caught bugs at compile time that would have shipped to production.

### 2. Component Composition
Isolating form fields into separate components made the Composer screen flexible and easy to modify.

### 3. Mock Data at Scale
Having 300+ pre-seeded submissions let us test virtualization and filtering without waiting for a real backend.

### 4. Mobile-First Responsive Design
Starting with mobile constraints forced clean layouts. Desktop just adds more space.

### 5. Glass Design System
The consistent use of opacity, backdrop blur, and spacing created a cohesive visual language without effort.

## PRD vs Reality

**PRD Required:**
- ✅ TanStack Virtual for lists
- ✅ React Hook Form + Zod validation
- ✅ SWR for data fetching
- ✅ Simulated network latency
- ✅ 4 screens (feed, composer, management, submissions)
- ✅ Task type discrimination
- ✅ Responsive design
- ✅ Loading states

**What I Added:**
- Mobile bottom sheets for detail panels
- Glass morphism header design
- Bulk operations on tasks
- Rich submission filtering
- ADHD-friendly UX principles

**What I Didn't Do:**
- Real database connection
- Authentication system
- Error recovery UI
- Analytics logging
- Automated tests

These were explicit non-requirements for the eval, but would be first priorities in production.

---

**Written:** March 14, 2026  
**Reflection:** Building this forced me to think about scalability, type safety, and UX. The PRD's requirement for TanStack Virtual was the right call — it shaped the whole architecture toward resilience and performance.
