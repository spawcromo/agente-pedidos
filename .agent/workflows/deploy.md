---
description: Build, validate, and deploy to staging or production
---

# Deploy

## Strategy

Choose based on project maturity:

- **Manual**: run steps below locally. Use for first deploys, MVPs, projects without CI.
- **CI/CD**: automate steps 1-3 in a pipeline triggered on merge to `main`. Add step 4 as post-deploy hook or run manually.

Configure which strategy and platform in `01-project-context.md`.

## 1. Validate

```bash
cd frontend && npm run build && npm run lint
cd backend && npm run build && npm test
```

All must pass. If running manually, do this **before** merging to `main`.
If using CI/CD, the pipeline blocks deploy on failure.

## 2. Environment variables

Compare `.env.example` against the target environment's config.

- No missing values.
- No placeholder values (`changeme`, `xxx`, `TODO`).
- Secrets are set in the platform, not committed to the repo.

## 3. Database migrations

If there are pending migrations:

- **Staging**: run directly.
- **Production**: back up the database first, then run.
- **Destructive migrations** (dropping columns, renaming tables): deploy the code change first without the destructive migration, verify the app works without the old column/table, then run the migration separately.

## 4. Deploy

**Staging**: deploy from current branch or `main`.
**Production**: deploy from `main` only.

Use the platform commands for the hosting configured in `01-project-context.md`.

## 5. Verify

After deploy, check manually (or with automated smoke tests if configured):

- [ ] App loads — no blank screen, no console errors
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] Auth flow works (login → access protected route → logout)
- [ ] One full pass of the core user journey

## 6. On failure

**If no destructive migration was run:**
Revert via platform rollback or `git revert HEAD && git push origin main`.

**If a destructive migration was run:**
Don't revert. Fix forward on a `fix/` branch, validate, and re-deploy.

**In both cases:**
Communicate to client/team if users are affected. Document what broke and why in the PR or commit message.
