# Context Log

Key prompts and context provided to AI during development.

---

## Session 1: Initial Setup

"read the PRD carefully. build the task marketplace with 4 screens - composer, feed, management, submissions. use react-hook-form with zod for the composer. need to handle 1000s of submissions so use tanstack virtual"

---

## Session 2: Types

"the task types should be discriminated unions. form_submission, email_sending, and social_media_liking each have different detail fields. make typescript actually useful here"

---

## Session 3: Design System

"adapt the design system from secDash reference - Space Grotesk font, indigo primary, warm off-white background, ghost borders. add prefers-reduced-motion support for ADHD users"

---

## Session 4: Reactivity Bug

"the store is using useState with initializer which snapshots data at mount. tasks created in composer dont show in feed without refresh. add a simple pub/sub pattern to fix this without pulling in zustand"

---

## Session 5: Code Review Fixes

"remove typescript ignoreBuildErrors from next config. clean up gitignore. fix the stale state bug properly with useSyncExternalStore"
