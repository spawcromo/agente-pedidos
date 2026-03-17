# Code & File Standards

## Principles

- **Ship working software.** Right-size everything to the project scope. An MVP doesn't need the same structure as a full product.
- Prefer explicit over clever. Readability wins.
- TypeScript by default. English for code; Spanish for user-facing copy if required.

## Naming

- Variables/functions: `camelCase`
- Components/classes: `PascalCase`
- Files: `kebab-case.ts` (utilities), `PascalCase.tsx` (components)
- Constants: `UPPER_SNAKE_CASE`
- DB tables/columns: `snake_case`

## Code

- Always type function parameters and return values.
- Never silently swallow errors. Log with context (what failed, with what input).
- Don't add a library for something you can write in <30 lines.

## Project Structure

Adapt depth to project size. This is the full structure — flatten for smaller projects.

```
frontend/src/
├── app/           → pages and routing
├── components/
│   ├── ui/        → reusable (Button, Modal)
│   └── features/  → domain-specific (InvoiceTable)
├── hooks/         → custom React hooks
├── services/      → API calls
├── lib/           → utilities, constants
└── types/

backend/src/
├── routes/        → thin: validate → call service → respond
├── services/      → business logic lives here
├── models/        → DB models / ORM schemas
├── middleware/     → auth, validation, error handling
├── lib/           → utilities
└── types/

docs/              → discovery.md, requirements.md, architecture.md
automations/       → n8n workflow documentation (if applicable)
```

## Architecture Rules

- Routes are thin. Business logic lives in services, never in routes.
- DB queries live in models/repositories, not in services.
- One component per file. Co-locate tests: `Button.tsx` → `Button.test.tsx`.
- Don't install UI libraries (Chakra, MUI) unless the project explicitly requires them.

## Database & Supabase Rules

- **PostgreSQL Views — CRITICAL:** `CREATE OR REPLACE VIEW` in PostgreSQL **CANNOT** add, remove, or reorder columns. It will throw `42P16: cannot change name of view column`. You MUST ALWAYS do:
  ```sql
  DROP VIEW IF EXISTS view_name;
  CREATE VIEW view_name AS ...;
  ```
  Never use `CREATE OR REPLACE VIEW` when changing columns. No exceptions.

- **Migrations:** Every migration file in `backend/supabase/migrations/` must be self-contained and idempotent where possible. Use `IF NOT EXISTS` / `IF EXISTS` guards.

- **SQL for user execution:** When generating SQL that the user must run manually in Supabase, double-check syntax before handing it over. The user should never have to debug your SQL.
