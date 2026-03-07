---
name: Project Planning
description: Transform discovery, requirements, and architecture into a concrete implementation plan.
---

# Project Planning

Use after architecture to define **in what order** to build, grouped into milestones.

## Inputs

- `docs/discovery.md` — MVP scope, risks
- `docs/requirements.md` — user stories, acceptance criteria
- `docs/architecture.md` — data model, API design, integrations

## Process

1. List all user stories from `requirements.md`.
2. Identify dependencies using `architecture.md`: what needs to exist before what? (data model before API, API before UI, auth before protected routes).
3. Group stories into 3-5 milestones, each ending with something **demoable to the client**.
4. Order stories within each milestone by dependency, then by priority (MoSCoW from discovery).
5. Estimate each milestone in weeks (not days — false precision doesn't help).

## Output → `docs/plan.md`

```markdown
# Plan: [Project Name]

## Milestones

### M1: [Name] — ~[X] weeks
Goal: [what the client can see/use at the end of this milestone]
- [ ] [User story or task]
- [ ] [User story or task]

### M2: [Name] — ~[X] weeks
Goal: [demoable outcome]
- [ ] ...

### M3: [Name] — ~[X] weeks
...

## Dependencies
[Story/task] → blocks → [Story/task]
List only non-obvious dependencies. Don't state the obvious.

## Risks
Carry over unresolved risks from discovery. Add any new ones revealed by planning.
```

## Rules

- Every milestone must end with something the client can see working — not just "backend done."
- Don't create more than 5 milestones. If you need more, the scope is too big for v1.
- Each user story appears exactly once. Don't split stories across milestones unless they're genuinely independent parts.
- This plan feeds directly into `/feature-cycle` — each cycle picks the next item from the current milestone.
