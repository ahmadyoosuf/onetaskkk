# AI Assistance Disclosure

This project was built with significant AI assistance through v0.dev (Claude).

## What AI helped with

Initial scaffold and boilerplate, component structure, TypeScript type definitions, form validation patterns with react-hook-form + zod, TanStack Virtual integration, TanStack Table for the admin tasks view, Lexical rich-text editor integration with react-hook-form via Controller, Vaul bottom-sheet drawer replacing Dialog components on mobile, dark mode implementation (CSS tokens, ThemeProvider, anti-flash inline script), shared SubmissionDetail component refactor, and iterative bug fixes across build cycles.

## What I directed and decided

- Architecture decisions: discriminated unions for Task types, pub/sub store pattern, in-memory data structure
- PRD interpretation: which spec requirements to prioritise and how strictly to follow delay specs (1-3s fetch, 3-5s mutation)
- Design system: color palette, typography choices (Space Grotesk + IBM Plex Mono), ADHD-friendly UX considerations
- Mobile-first decisions: Vaul over Dialog, 70% mobile audience assumption driving layout choices
- Component decomposition: isolated field components in composer, shared detail panels
- Known limitations to document: localStorage scale ceiling, IndexedDB migration path
- Code review: accepting, rejecting, or redirecting AI output at each step

## How it evolved

Started with AI generating the initial scaffold. Over time the prompts got more specific as the PRD requirements became clearer. Later sessions were mostly targeted refactors rather than greenfield generation: replacing the textarea with a Lexical editor, replacing the custom table with TanStack Table, replacing Dialog with Vaul, stripping fake trend math from stats cards. Each change was reviewed before merging.

## Tools used

- v0.dev (Claude-powered) for all code generation and refactoring
- Claude.ai for architecture discussions and trade-off analysis (see screenshot in repo context)
