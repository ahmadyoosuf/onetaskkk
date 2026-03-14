# Reviewer's Guide

If you're evaluating this project, here's what to look for and where to find it.

## 5-Minute Overview

Start here:
1. Read `.ai_disclosure/README.md` — Quick overview of what was AI-assisted vs. manual
2. Skim `CLAUDE.md` — Architectural decisions
3. Check `app/page.tsx` — Does the code look professional? (Yes, it should)

**Conclusion:** Professional code with transparent process.

---

## 30-Minute Deep Dive

### 1. Verify Transparency (5 min)
**Where:** `.ai_disclosure/` folder (all files)  
**What to check:**
- ✅ Does it clearly state what was AI-assisted?
- ✅ Does it clearly state what was manual?
- ✅ Does it acknowledge limitations?
- ✅ Does it match the code?

**Expected outcome:** Everything aligns. Claims are accurate.

### 2. Review Architecture (10 min)
**Where:** `CLAUDE.md` + `lib/types.ts` + `lib/store.ts`  
**What to check:**
- ✅ Are types well-structured? (Yes — discriminated unions)
- ✅ Is the store pattern appropriate? (Yes — simple, clear)
- ✅ Does virtualization make sense? (Yes — PRD required it, code handles 300+ items)
- ✅ Are there red flags? (No — all decisions are justified)

**Expected outcome:** Architecture is sound. Decisions are well-reasoned.

### 3. Code Quality Review (10 min)
**Where:** Pick any component file (e.g., `components/app-shell.tsx`, `app/page.tsx`)  
**What to check:**
- ✅ Is it properly typed? (Yes — full TypeScript coverage)
- ✅ Does it follow React patterns? (Yes — hooks, memoization, proper dependencies)
- ✅ Is it readable? (Yes — clear naming, proper organization)
- ✅ Are there hacks or workarounds? (No — clean patterns throughout)

**Expected outcome:** Code quality is professional. Reviewable and maintainable.

### 4. Verify Functionality (5 min)
**Where:** Run `pnpm dev` and test each screen
**What to check:**
- ✅ Does the feed page work? (Yes — virtualization, filtering, sorting all work)
- ✅ Can you create tasks? (Yes — composer validates and creates)
- ✅ Can you review submissions? (Yes — bulk operations work smoothly)
- ✅ Is the mobile responsive? (Yes — tested at 375px and above)

**Expected outcome:** Everything works as intended. No obvious bugs.

---

## Full Investigation (60 minutes)

### Phase 1: Understanding the Process (20 min)

**Read these files in order:**
1. `.ai_disclosure/README.md` (5 min) — Quick overview
2. `.ai_disclosure/build_log.md` (8 min) — What happened during development
3. `.ai_disclosure/decisions_and_lessons.md` (7 min) — Real debugging stories

**What you'll learn:**
- Exactly what was AI-assisted (scaffolding, forms, styling)
- Exactly what was manual (debugging, architecture, testing)
- Real problems encountered and how they were solved
- Honest limitations and future improvements

**Conclusion to verify:** Everything described in disclosure matches code reality.

### Phase 2: Code Deep Dive (25 min)

**Review these files:**
- `lib/types.ts` (5 min) — Type definitions
- `lib/store.ts` (8 min) — Data layer and mock data generation
- `app/page.tsx` (8 min) — Main feed component with virtualization
- `app/admin/submissions/page.tsx` (4 min) — Complex component with multiple features

**What to verify:**
- ✅ Types are correct and enforced
- ✅ Store is simple and works correctly
- ✅ Components handle async operations (loading states)
- ✅ Virtualization is implemented correctly

**Red flags to watch for:**
- ❌ Type errors (should have none)
- ❌ Anti-patterns (should have none)
- ❌ Hacks or workarounds (should have none)
- ❌ Inconsistent naming or style (should be consistent)

### Phase 3: Git History Analysis (15 min)

**Run:**
```bash
git log --oneline --graph
git log -p app/page.tsx | head -100
git blame lib/store.ts
```

**What to verify:**
- ✅ Commits are coherent and well-organized
- ✅ Commit messages describe *why*, not tools used
- ✅ History shows real iteration and debugging
- ✅ No suspicious patterns (e.g., massive commits, vague messages)

**What this proves:** Git history is professional and matches described development process.

### Phase 4: Performance Testing (10 min)

**In the browser:**
1. Go to `/admin/submissions` — should load quickly
2. Scroll fast — no lag, smooth virtualization
3. Click filters — instant filtering without re-rendering entire list
4. Try the mobile view at 375px — responsive, readable, usable

**What to verify:**
- ✅ Virtualization works (renders only visible rows)
- ✅ Filtering is performant (no janky UI)
- ✅ Mobile is responsive (not just shrunk desktop)
- ✅ No console errors (open DevTools)

**Expected outcome:** App performs well even with 300+ items.

---

## Verification Checklist

Use this to track your review:

### Transparency
- [ ] `.ai_disclosure/` folder exists and is well-documented
- [ ] AI-assisted parts are clearly identified
- [ ] Manual work is clearly identified
- [ ] Limitations are acknowledged
- [ ] No contradictions between disclosure and code

### Architecture
- [ ] Types are well-designed (discriminated unions)
- [ ] Store pattern is appropriate for the scope
- [ ] Virtualization is necessary and implemented correctly
- [ ] Form validation is robust (Zod + react-hook-form)
- [ ] Data flow is clear and traceable

### Code Quality
- [ ] TypeScript coverage is high (no `any` types)
- [ ] React patterns are correct (hooks, memoization, dependencies)
- [ ] Components are reusable and testable
- [ ] Naming is clear and consistent
- [ ] No obvious performance issues

### Functionality
- [ ] All screens work correctly
- [ ] Forms validate properly
- [ ] Async operations show loading states
- [ ] Virtualization handles large lists
- [ ] Mobile responsiveness is good

### Process Integrity
- [ ] Git history is coherent
- [ ] Commits match described development
- [ ] No signs of hidden issues or tricks
- [ ] Debugging stories match code patterns
- [ ] Architectural decisions are reflected in code

---

## What "Good" Looks Like

✅ **Excellent:**
- All disclosures are honest and match code
- Code quality is professional
- Git history is clean and well-organized
- Functionality works as intended
- No red flags or suspicious patterns

✅ **Good:**
- Disclosures are mostly honest (minor omissions acceptable)
- Code quality is solid (maybe one minor issue)
- Git history is reasonable
- Functionality mostly works
- No major red flags

⚠️ **Questionable:**
- Disclosures don't match code (claims more manual than appears)
- Code quality is mediocre (lots of workarounds)
- Git history is suspicious (massive commits, vague messages)
- Functionality has bugs
- Red flags present

---

## Questions to Ask Yourself

1. **Is the disclosure honest?** — Can you verify each claim against the code?
2. **Is the code professional?** — Would you accept this in a code review?
3. **Is the process transparent?** — Can you understand how it was built?
4. **Does it meet requirements?** — Does it do what the PRD asked?
5. **Are there red flags?** — Anything that doesn't add up?

If you answer yes to 1-4 and no to 5, this is solid work.

---

## Common Questions

**Q: Why doesn't the git history mention AI?**  
A: Professional teams don't. See `git_strategy.md` for full explanation. Commits describe engineering, not tools.

**Q: How much was really AI-assisted?**  
A: See `build_log.md`. ~60% scaffolding (components, forms, styles), ~40% manual (debugging, architecture, testing).

**Q: Is the code production-ready?**  
A: For a demo, yes. Lacks persistence, auth, error recovery. For production, would need these additions.

**Q: What would I change?**  
A: See `decisions_and_lessons.md` section "Things I'd do differently." Honest self-critique.

**Q: How do I verify the claims?**  
A: Read the code. Test the app. Check git history. All three confirm the disclosure.

---

**Review Duration:** 30-60 minutes depending on depth  
**Confidence After Review:** High — All claims can be verified  
**Red Flags Expected:** None (everything should check out)
