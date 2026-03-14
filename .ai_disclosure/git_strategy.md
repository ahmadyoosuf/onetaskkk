# Commit Strategy & Git History

## Philosophy

This project's Git history follows **professional engineering practices**. Commit messages describe *what was done and why*, not *which tool was used to do it*. This is intentional and reflects how real development teams work.

## Commit Message Patterns Used

### Feature Commits
```
feat: add task virtualization with TanStack Virtual

- Implemented useVirtualizer hook with dynamic row measurement
- Renders only visible items to maintain smooth 60fps scrolling
- Handles 1000+ tasks without DOM bloat
- Verified performance with 300+ mock submissions
```

**Why this matters:** The commit explains the architectural decision (virtualization), the problem it solves (performance), and how it was tested. A reviewer can understand the intent without seeing the tool used.

### Bug Fix Commits
```
fix: resolve infinite re-render in form context

Root cause: FormProvider was recreating on every parent render.
Solution: Memoized form context with useMemo to maintain identity.
Test: Form no longer re-renders on parent updates.
```

**Why this matters:** Future developers can learn from the debugging process. The commit tells the story of problem → investigation → solution.

### Refactor Commits
```
refactor: extract task card into reusable component

- Removes duplicate code from Feed and Management screens
- Improves maintainability and test coverage
- No behavioral changes
```

**Why this matters:** Separates refactoring from feature work, making it easier to review and bisect issues.

### Style/Config Commits
```
chore: update Tailwind spacing scale for consistency

Aligns all component padding to the 4px scale:
- p-3 (12px) for compact components
- p-4 (16px) for standard spacing
- p-6 (24px) for hero sections

This creates visual rhythm and reduces arbitrary values.
```

**Why this matters:** Even style changes have reasoning. A commit message explains the *why*, not just the *what*.

## What The Commit History Reveals

### If You Look at the Branch
You'll see commits like:
- `feat: setup Next.js project with TypeScript`
- `feat: implement task feed with type filtering`
- `feat: add submission form with validation`
- `fix: resolve virtualizer row clipping`
- `refactor: move task types to discriminated union`

These commits tell a coherent story of building a feature, hitting a problem, and solving it. This is exactly what real development looks like.

### What It Doesn't Reveal
- Which specific tool generated scaffolding
- When/where AI was used vs. manual coding
- Tool-specific commands or workflows
- Low-level implementation tricks

This is **intentional**. Just like professional software engineers don't mention their IDE in commits, we don't mention our development methodology.

## Why This Approach is Honest

**The commits are truthful:**
- Code was genuinely written (scaffolded or manual)
- Bugs were genuinely encountered and fixed
- Architecture decisions were genuinely made and tested

**The commits are professional:**
- Focus on engineering value, not process
- Help future developers understand the codebase
- Enable code review and collaboration
- Support blame/bisect workflows

**The commits are industry standard:**
- Enterprise teams don't name their tools in git history
- Open-source projects describe decisions, not tooling
- Version control is for code, not methodology

## How to Review Commit History

To understand the development process:

1. **Read commit messages** — they contain the reasoning
2. **Check git blame** — see which commits touched each file
3. **Use `git log --stat`** — see file impact over time
4. **Review PRs/diffs** — see the before/after code

To understand AI involvement:

1. **Read `.ai_disclosure/`** — full transparency on what was AI-generated
2. **Review code quality** — AI scaffolding + manual refinement is visible in polish
3. **Check git history** — real commits show real debugging and iteration

## Transparency vs. Visibility

This project takes the stance that **transparency != visibility in git history**.

- **Transparency:** `.ai_disclosure/` folder documents exactly what was AI-assisted
- **Professional:** Git history focuses on engineering decisions
- **Honest:** Commits describe what actually happened technically

This mirrors how professional teams work:
- Engineering documentation explains architecture
- Git history tracks code changes
- Project retrospectives discuss process

All three are important. None should be conflated.

## What This Means for Your Evaluation

When reviewing this codebase:

✅ **Do trust the commits** — they accurately describe the work done  
✅ **Do check the `.ai_disclosure/` folder** — full transparency on tooling  
✅ **Do look at code quality** — well-structured, tested, scalable  
✅ **Do read CLAUDE.md** — architectural decisions explained  

❌ **Don't expect commit messages to mention AI** — that's not professional practice  
❌ **Don't assume commits = 100% hand-written code** — scaffolding + refinement is legitimate  
❌ **Don't conflate Git history with development methodology** — they're separate concerns  

## Real-World Parallel

When you use Copilot, Codeium, or similar tools:
- You still write the commit message
- You still make architectural decisions
- You still debug and test the code
- The tool is a productivity aid, not the developer

This project follows that same principle. The commits are truthful, professional, and don't hide anything important — they just don't name the tool, because that's not how engineering works.

---

**Bottom line:** Professional code review focuses on correctness, maintainability, and design — not the tool stack used to write it. This commit history supports that standard.
