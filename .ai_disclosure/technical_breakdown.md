# Implementation Details

## Form Validation Strategy

Used **Zod** schemas with **react-hook-form** for progressive validation:

```ts
// Example schema for task creation
const taskSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("form_submission"),
    targetUrl: z.string().url("Invalid URL"),
    formFields: z.array(z.string().min(1))
  }),
  z.object({
    type: z.literal("email_sending"),
    targetEmail: z.string().email(),
    emailContent: z.string().min(10)
  })
])
```

This approach ensures TypeScript knows exactly which fields are valid for each task type at compile time.

## Data Flow Architecture

```
Component Tree
    ↓
useTasks() / useSubmissions() [SWR hooks]
    ↓
store.ts [In-memory CRUD]
    ↓
Mock data generation [120 tasks, 300 submissions]
```

Each hook returns `{ data, isLoading, error }`. Components show loading states during the 2-second simulated fetch delay.

## Virtualization Implementation

TanStack Virtual with `measureElement` callback for dynamic row heights:

```ts
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 96,  // Initial guess
  measureElement: (el) => el.getBoundingClientRect().height,  // Real measurement
  overscan: 5  // Extra rows to render off-screen for smooth scrolling
})
```

This handles 300+ rows without lag because only visible items render to the DOM.

## Why Discriminated Unions

Task types have wildly different shapes:
- Form submission needs `targetUrl` + `formFields`
- Email sending needs `targetEmail` + `emailContent`
- Social media liking needs `postUrl` + `platform`

Using a discriminated union on the `type` field means TypeScript enforces correct field access:

```ts
// This is a type error — field doesn't exist on this variant
task.details.targetEmail  // TS2339: no such property
```

Catch bugs at build time instead of runtime.

## Mobile Responsiveness

All screens are mobile-first with responsive breakpoints:

```ts
// Example: task card padding
<CardContent className="p-3 sm:p-4">  // 12px on mobile, 16px on tablet+
```

Bottom sheets replace side panels on mobile:
```ts
if (window.innerWidth < 1024) {
  setShowMobileDetail(true)  // Open bottom sheet instead of side panel
}
```

## Testing at Scale

Mock data generators create 120 tasks + 300 submissions. This verifies:

1. **Virtualization performance** — lists scroll smoothly with 300+ items
2. **Filter/sort logic** — tested with large datasets
3. **Bulk operations** — selecting/deleting multiple tasks doesn't lag
4. **Search functionality** — filtering 120 tasks returns instant results

In production, the same component would handle real datasets of 1000+ items with the virtualization already tested.

## SWR Configuration

```ts
useSWR("tasks", fetchTasks, {
  fallbackData: getTasksSnapshot(),  // Instant UI with cached data
  revalidateOnFocus: false,          // Don't refetch on window focus
  dedupingInterval: 60000,           // Cache for 60 seconds
})
```

This creates a fast, responsive UI that fetches data in the background.

## Simulated Network Delays

Per PRD requirements:
- **Data fetches:** 2 second delay
- **Mutations:** 1-3 second random delay

```ts
async function simulateFetchDelay<T>(data: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return data
}

function randomMutationDelay(): number {
  return 1000 + Math.random() * 2000
}
```

This simulates real API latency without needing a backend. Production would use actual network requests with real variance.

## Component Composition Pattern

Each feature has isolated, testable components:

```
composer/
  ├── TitleField.tsx       (owned by context)
  ├── RewardField.tsx      (owned by context)
  ├── FormSubmissionFields.tsx
  ├── EmailSendingFields.tsx
  └── SocialMediaFields.tsx

page.tsx (composes them all)
```

Each field component uses `useFormContext()` to avoid prop drilling. Easy to test, reuse, modify independently.

## Error Handling Strategy

Current implementation shows loading states but doesn't have error recovery. Production would add:

```ts
{error && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Something went wrong</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
    <Button onClick={() => mutate()}>Retry</Button>
  </Alert>
)}
```

This pattern keeps error handling centralized and visible.

---

**Note:** This implementation prioritizes clarity and education over production-ready resilience. A real app would add retry logic, exponential backoff, error boundaries, and monitoring.
