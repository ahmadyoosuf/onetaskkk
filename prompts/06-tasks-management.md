admin tasks management screen at /admin/tasks

show all tasks in a table with:
- title
- type  
- submissions count (and how many pending)
- reward amount
- status (open/completed/cancelled)
- actions (view submissions, delete)

add stats cards at top showing totals

status should be changeable via dropdown. when admin changes status it should update immediately (optimistic update pattern)

PRD hint says admin should see most info without clicking view details so make sure the table has enough columns. also link to submissions filtered by that task
