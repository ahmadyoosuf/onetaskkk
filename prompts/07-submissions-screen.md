submissions review screen at /admin/submissions

this needs to handle 100+ rows without jank. use tanstack virtual with useVirtualizer

columns: task title, worker name, status badge, submitted date, actions

features:
- running totals at top (total submissions, pending, approved, rejected counts)
- filter by status
- filter by task (support deep linking via ?task=xxx query param)
- clicking a row shows detail panel with full submission info
- approve/reject buttons with optional admin notes

the virtualization is important, PRD specifically mentions handling 1000s of submissions. only render visible rows plus some overscan

make status badges visually distinct - pending yellow, approved green, rejected red
