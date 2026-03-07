---
description: Full sequence to start a new client project from scratch
---

# New Project Kickoff

// turbo-all

## 1. Copy template and init git

```bash
cp -r project-template/ <project-name>/
cd <project-name>
git init && git add . && git commit -m "chore: init from Antigravity template"
```

Create remote repo and push.

## 2. Fill project context

Edit `.agent/rules/01-project-context.md`: client, project type, stack, URLs.

## 3. Product discovery

Use **Product Discovery** skill → `docs/discovery.md`

## 4. Requirements

Use **Requirements** skill → `docs/requirements.md`

## 5. System architecture

Use **System Architecture** skill → `docs/architecture.md`

## 6. Project planning

Use **Project Planning** skill → `docs/plan.md`

## 7. Scaffold frontend

Use **Frontend Scaffold** skill. Verify: `cd frontend && npm run dev`

## 8. Scaffold backend

Use **Backend Scaffold** skill. Verify: `cd backend && npm run dev`, `GET /health` OK.

## 9. Automations (if needed)

Use **n8n Automations** skill to plan and document.

## 10. Commit and push scaffold

```bash
git add . && git commit -m "chore: complete scaffold"
git push origin main
```

## 11. First deploy

Run `/deploy` for staging.

Ready for `/feature-cycle`.
