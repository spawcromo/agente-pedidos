---
name: Frontend Scaffold
description: Bootstrap the frontend app with routing, design tokens, and base components.
---

# Frontend Scaffold

## Prerequisites

- `docs/architecture.md` exists with tech stack.
- `01-project-context.md` specifies the frontend framework.

## Steps

1. **Init project** with the framework CLI:
   - Next.js: `npx -y create-next-app@latest ./frontend --typescript --app --eslint`
   - Vite: `npx -y create-vite@latest ./frontend --template react-ts`
   - Always TypeScript. Adapt flags to project.

2. **Design tokens** in `frontend/src/lib/design-tokens.ts`:
   Minimal tokens only (colors, typography, spacing). Avoid a full design system for v1.

3. **Base components** in `frontend/src/components/ui/`:
   Minimal UI primitives: `Button.tsx` (variants), `Input.tsx` (label + error), `Layout.tsx` (page shell).

4. **Routes**: placeholder pages matching requirements scope.

5. **API client** in `frontend/src/services/api.ts`:
   Base URL from env, fetch wrapper with error handling, auth token injection.

6. **Environment**: `.env.example` with required vars. `.env` in `.gitignore`.

## Verification

`cd frontend && npm run dev` must work.
