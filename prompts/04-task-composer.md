build the task composer for admins to create new tasks

requirements from PRD:
- use react-hook-form with zod validation
- each field should be its own component not inline inputs (TitleField, DescriptionField, etc)
- the form should show different fields based on task type selected
- deadline must be future date
- reward has min/max validation

put it at /admin/composer

make sure validation errors show properly and the form feels like a real product not a homework assignment. use the shadcn form primitives but style them to match our design system
