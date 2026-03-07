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

## 4. Test

Write/update tests. Run suite. Manually verify happy path + key edge cases.

## 5. PR and merge

Run self-review checklist from `03-git-conventions.md`, then:

```bash
# open PR → review → merge to main
git checkout main && git pull origin main
git branch -d feat/<feature-name>
```

## 6. Deploy to staging

Run `/deploy` targeting staging.
