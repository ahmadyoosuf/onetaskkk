# AI Assistance Disclosure

This project used AI tools as part of the development workflow.

## How AI was used

AI acted as a coding assistant for boilerplate generation, component scaffolding, and syntax lookup. Specific areas where AI accelerated implementation: initial file structure, TypeScript type definitions, Lexical editor wiring, TanStack Virtual measurement callbacks, and dark mode CSS token generation.

Every piece of generated code was reviewed, tested, and modified before being committed. Multiple outputs were rejected or substantially rewritten when they didn't meet the architectural direction I'd set.

## What I owned and decided

- **Architecture**: Discriminated unions for task types, pub/sub store pattern (later replaced with TanStack Query as single source of truth), unified `api` object for "Server Experience"
- **PRD interpretation**: Prioritised which spec requirements mattered most, decided on 1-3s/3-5s delay ranges, chose to enforce `allowMultipleSubmissions` as a hard lock rather than a soft warning
- **Design system**: Colour palette, Space Grotesk + IBM Plex Mono pairing, ADHD-focused UX decisions (reduced motion, clear hierarchy, confirmation dialogs on destructive actions)
- **Mobile-first strategy**: 70% mobile audience assumption drove Vaul over Dialog, full-width filters, touch target enforcement
- **Data layer migration**: Identified localStorage's 5MB ceiling as a production risk, drove the IndexedDB migration and base64 image persistence
- **Component decomposition**: Isolated field components in composer, shared `SubmissionDetail` panel, error boundaries
- **Bug diagnosis and fixes**: TanStack Virtual overlap (estimateSize vs measureElement), `$wrapNodes` deprecation in Lexical, useSyncExternalStore infinite re-render from unstable snapshots, mock data only assigned to first 200 tasks
- **Code review**: Rejected overengineered patterns (unnecessary keyboard navigation, tab-based filters where a dropdown sufficed), caught and removed fake trend math from stats cards

## Development approach

The project started with AI generating an initial scaffold from the PRD. From there, each iteration was a specific, targeted change driven by my reading of the requirements. Later sessions were mostly debugging and refactoring — replacing the textarea with Lexical, swapping the custom table for TanStack Table, replacing Dialog with Vaul, migrating from localStorage to IndexedDB. I directed what to build, reviewed what came back, and decided what shipped.

## Tools used

- v0.dev (Claude-powered) for code generation and refactoring
- Claude.ai for architecture discussions and trade-off analysis between sessions
