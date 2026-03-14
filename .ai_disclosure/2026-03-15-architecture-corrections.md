# Architecture Corrections - March 15, 2026

## Summary

This session addressed critical architectural issues to achieve full PRD compliance.

## Changes Made

### 1. IndexedDB Migration (store.ts)

**Problem:** Synchronous localStorage caused 5MB quota crashes and main-thread blocking.

**Solution:** Migrated to async `idb-keyval` (IndexedDB wrapper):
- All CRUD operations are now async
- No storage quota issues
- No main-thread jank during writes
- Automatic JSON serialization/deserialization with Date revival

### 2. Base64 Image Persistence (image-upload.tsx)

**Problem:** `blob:` URLs were ephemeral and disappeared on page reload.

**Solution:** Rewrote to use FileReader for base64 data URIs:
- Images persist across sessions
- Evidence screenshots are stored directly in IndexedDB
- Inline preview support in SubmissionDetail

### 3. TanStack Query as Single Source of Truth (use-store.ts)

**Problem:** Conflicting `useSyncExternalStore` pub/sub implementation fought with TanStack Query.

**Solution:** Removed all pub/sub code:
- TanStack Query now strictly manages all state
- Loading flags are properly derived from query states
- PRD-mandated 1-3s fetch delays restored
- No duplicate subscriptions or race conditions

### 4. Optional Description Field (schemas.ts)

**Problem:** Description field had a 20-character minimum, making it required.

**Solution:** Made description truly optional:
- Removed min length validation
- Allows empty string or undefined
- Max length (500 chars) still enforced

### 5. Submissions Sort Functionality

**Problem:** sortBy (date/status) was missing from the Submissions page.

**Solution:** Implemented complete sorting:
- Added `sortBy` URL state via nuqs
- Options: newest, oldest, by status (pending first)
- Integrated into existing filter UI

### 6. TasksTable Pagination

**Problem:** Large task lists caused DOM explosion.

**Solution:** Added TanStack Table pagination:
- 10 items per page
- First/prev/next/last navigation
- Page counter display
- Only renders when tasks exceed page size

### 7. Mobile Cards Virtualization (Admin Tasks)

**Problem:** Mobile card list rendered all items, causing DOM bloat.

**Solution:** Added TanStack Virtual:
- Virtualized scrolling container
- ~200px estimated row height with measurement
- 5 item overscan for smooth scrolling
- Maintains all existing functionality

### 8. Bulk Edit Validation

**Problem:** Could set maxSubmissions below a task's currentSubmissions.

**Solution:** Added validation:
- Computes minimum across selected tasks
- Blocks invalid values with toast error
- Shows minimum hint in dialog input

### 9. SubmissionDetail Task Context

**Problem:** Detail view lacked full task information per PRD ADHD UX requirement.

**Solution:** Injected complete task object:
- Shows task title, type, reward
- Displays description and task-specific details
- Collapsible full instructions
- Visual distinction with primary/5 background

### 10. Unified API Layer (store.ts)

**Problem:** Client Components directly imported raw data arrays from store.

**Solution:** Created unified `api` object:
- `api.tasks.list`, `api.tasks.create`, `api.tasks.update`, etc.
- `api.submissions.list`, `api.submissions.create`, etc.
- `api.users.current()`, `api.users.admin()`
- Mimics "Server Experience" per PRD
- Easy swap to real API routes later

### 11. Mock Data Distribution Fix

**Problem:** 1,000 submissions only distributed across first 200 tasks.

**Solution:** Changed distribution to cover all 500 tasks:
- `taskIndex = i % generatedTasks.length` instead of `i % 200`
- All tasks now have realistic submission counts

### 12. Instructions Panel Width (Worker Feed)

**Problem:** Task detail panel too narrow for ADHD-friendly readability.

**Solution:** Widened panel:
- Changed from `lg:w-80 xl:w-96` to `lg:w-96 xl:w-[28rem]`
- Better readability for task instructions

### 13. Bulk Delete Confirmation Dialog

**Problem:** Bulk delete executed immediately without confirmation.

**Solution:** Added confirmation dialog:
- Shows count of tasks to be deleted
- Lists consequences (permanent, orphaned submissions)
- Requires explicit "Delete X Tasks" button click
- Prevents accidental data loss per ADHD UX requirement

## Files Modified

- `lib/store.ts` — IndexedDB rewrite + unified API object + distribution fix
- `hooks/use-store.ts` — Uses API object, pure TanStack Query
- `components/ui/image-upload.tsx` — Base64 data URI conversion
- `lib/schemas.ts` — Optional description
- `components/submissions/submission-detail.tsx` — Full task context
- `components/admin/tasks-table.tsx` — Pagination
- `app/admin/submissions/page.tsx` — sortBy, full task passing
- `app/admin/tasks/page.tsx` — Mobile virtualization, bulk edit validation, confirmation dialog
- `app/worker/page.tsx` — Widened instructions panel, uses API object
- `package.json` — Added idb-keyval dependency
- `README.md` — Updated architecture notes
- `CLAUDE.md` — Updated key decisions

## AI Tools Used

- Claude (Anthropic) via v0.app for implementation guidance and code generation
