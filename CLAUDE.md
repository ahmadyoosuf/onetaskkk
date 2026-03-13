# TaskMarket

Micro-task marketplace. Posters create tasks, workers claim and submit, admins review.

## Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- Shadcn UI (customized, not default)
- react-hook-form + zod
- MSW 2.x for mocking
- TanStack Virtual for large lists
- Web Workers for off-thread computation

No state management libraries. React state + context only.

## Architecture

```
features/
  composer/
    components/    # TitleField, DescriptionField, DeadlineField, CategoryField, BudgetField, SkillsField, AttachmentField
    hooks/
  feed/
    components/    # TaskCard, TaskFilters, SelectionIndicator
    hooks/         # useKeyboardNavigation, useTaskSelection
  management/
    components/    # TaskTable, TaskRow, StatusSelect
  submissions/
    components/    # SubmissionsTable, VirtualRow, StatusBadge, RunningTotals
    workers/       # filter-sort.worker.ts

components/ui/     # Shadcn primitives (customized)
lib/types.ts       # Shared types
mocks/
  handlers/        # MSW handlers by domain
  data/            # Seed data generators
```

## Code Standards

- No `any` types
- No unused imports
- No TODO comments (implement or delete)
- No dead code
- One responsibility per file
- Mobile-first responsive design

## Mock Data Requirements

MSW handlers, not hardcoded arrays. Data must feel real:

- 20+ tasks across statuses: draft, open, in_progress, review, completed, cancelled
- Categories: development, design, writing, research, marketing, data
- Budgets: $50-$5000 range
- 100+ submissions with varied statuses spanning 6 months

---

## Phase 1

### Task Composer

Single `TaskForm` component. Accepts optional `task` prop for edit mode.

- Routes: `/composer` (create), `/composer/[id]` (edit)
- Each field is its own component, not inline inputs
- Zod validation: deadline must be future, skills minimum 1
- Attachment field is UI-only (no persistence)

### Tasks Feed

Keyboard-first interaction:

- `role="listbox"` container, `role="option"` cards with `aria-selected`
- Roving tabindex (only focused item has `tabindex=0`)
- Arrow keys move focus, Home/End jump, Space toggles selection
- Multi-select up to 5 items. 6th attempt shows toast rejection
- Filters fully keyboard accessible (Tab to reach, arrows to operate)
- Filter by: status, category, budget range

### Tasks Management

Admin table:

- Columns: title, category, submissions, deadline, status, delete
- Status column is interactive Select with optimistic update
- Delete removes task
- No drag-drop (Phase 2)

### Submissions Screen

Virtualized table for 100+ rows:

- TanStack Virtual with `useVirtualizer`, absolute positioning
- Columns: task name, submitter, status, date
- Running totals at top (total + per-status breakdown)
- Filter/sort logic runs in Web Worker (`filter-sort.worker.ts`)
- Batch DOM writes per animation frame

---

## Phase 2

Branch exists at `phase-2`. Requirements TBD.
