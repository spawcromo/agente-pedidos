---
description: Repeatable cycle for implementing a single feature from definition to merge
---

# Feature Cycle

## 1. Pick and branch

Pick the next item from the current milestone in `docs/plan.md`, then:

```bash
git checkout main && git pull origin main
git checkout -b feat/<feature-name>
```

Use `fix/` for bugs, `chore/` for non-functional.

## 2. Define

Before coding, write in the PR description:
- **What** (reference user story from requirements if applicable)
- **Acceptance criteria**
- **Out of scope**

## 3. Implement

Follow rules in `02-code-and-file-standards.md` and `03-git-conventions.md`. Commit in small increments.

## 4. UI & Design check

Before testing, verify the feature visually:
- **Consistency**: uses design tokens (colors, spacing, typography) — no ad-hoc inline styles
- **Components**: reuses existing shadcn/ui components — no custom reimplementations
- **Responsive**: works on mobile (min 375px) and desktop
- **States**: empty state, loading state, and error state are handled
- **Dark mode**: all colors use CSS variables, not hardcoded hex

If the feature introduces a new visual pattern, document it in `docs/design-system.md`.

## 5. Test

Run `npm run build` — zero errors. Manually verify happy path + key edge cases.

## 6. PR and merge

Run self-review checklist from `03-git-conventions.md`, then:

```bash
# open PR → review → merge to main
git checkout main && git pull origin main
git branch -d feat/<feature-name>
```

## 7. Deploy to staging

Run `/deploy` targeting staging.
