---
name: Backend Scaffold
description: Bootstrap the backend API with database, auth, and route stubs.
---

# Backend Scaffold

## Prerequisites

- `docs/architecture.md` exists with data model and API design.
- `01-project-context.md` specifies the backend framework and database.

## Steps

1. **Init project** for the chosen stack. Always TypeScript if Node.

2. **Structure** per `02-code-and-file-standards.md` (routes/, services/, models/, middleware/, lib/, types/).

3. **Database**: define models from `architecture.md`, set up migrations, create initial migration, add dev seed data.

4. **Middleware**: error handler (consistent JSON), request logger, CORS. Add **auth middleware** only if the project requires protected routes.

5. **Health check**: `GET /health` → `{ status: "ok", timestamp }`, verifies DB connectivity.

6. **Route stubs**: create endpoint files matching API design in `architecture.md`. Return `501 Not Implemented`.

7. **Environment**: `.env.example` with `DATABASE_URL`, `PORT`, `JWT_SECRET`, etc. `.env` in `.gitignore`.

## Verification

`cd backend && npm run dev` must work. `GET /health` must return OK.
