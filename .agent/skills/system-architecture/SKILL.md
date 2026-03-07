---
name: System Architecture
description: Design how to implement the requirements — stack, data model, APIs, integrations, and technical decisions.
---

# System Architecture

Use after requirements to design **how to build it**.

## Process

1. Read `docs/requirements.md`.
2. Identify components: frontend, backend, database, external services, automations.
3. Define data model, API surface, and integrations.
4. Document quality constraints and the decisions they drive.

## Output → `docs/architecture.md`

```markdown
# Architecture: [Project Name]

## System Overview
One paragraph, high level.

## Component Diagram
Mermaid diagram showing how components connect.

## Tech Stack
| Layer    | Technology | Why |
|----------|-----------|-----|

## Data Model
Mermaid ER diagram. Key fields only. v1 scope.

## API Design
Resource groups and endpoints. REST unless there's a reason not to.

## Integrations
| Service | Purpose | Protocol |
|---------|---------|----------|

## Quality Attributes
Technical constraints that shape the design:
- Performance targets (e.g. page load < 2s)
- Security requirements (e.g. data encryption, auth method)
- Availability / uptime expectations
- Browser / device support

## Key Decisions
For anything non-obvious, document:
- **Context**: why this came up
- **Choice**: what we went with
- **Tradeoff**: what we're giving up
```

## Rules

- Must be implementable with the stack in `01-project-context.md`.
- Prefer boring technology. Complex tools need to justify themselves.
- v1 scope only — don't design for hypothetical futures.
- Quality Attributes should connect to Key Decisions: every constraint should trace to a choice that addresses it.
- **No over-architecture**: Do not introduce microservices, message queues, or complex infra unless requirements explicitly justify the complexity.
