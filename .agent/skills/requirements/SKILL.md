---
name: Requirements
description: Generate a unified requirements document defining what to build.
---

# Requirements

Use after product discovery to define **what we're building** in a single document readable by the client.

## Output → `docs/requirements.md`

```markdown
# Requirements: [Project Name]

## Overview
One paragraph: what is this product and who is it for.

## Goals
Numbered measurable objectives.

## User Stories
As a [persona], I want to [action], so that [outcome].
Group by feature area. Each story **must** have clear, observable acceptance criteria.

## Scope
Refine the MoSCoW from discovery into the definitive v1 boundary.
### In Scope (v1)
### Out of Scope

## Constraints & Assumptions
Business constraints: budget, timeline, regulations, existing systems the client already uses.
```

## Rules

- Everything in this document should be understandable by a non-technical stakeholder.
- Reference `docs/discovery.md` — don't duplicate, reference.
- No technical design here. No API endpoints, no data models, no stack choices, no integrations. That's `architecture.md`.
