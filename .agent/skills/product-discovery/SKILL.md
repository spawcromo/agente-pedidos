---
name: Product Discovery
description: Run a structured product discovery session and produce a discovery.md document.
---

# Product Discovery

Use at project start to understand **what to build, for whom, and what's the MVP**.

## Process

1. **Understand the problem** — ask the client:
   - What problem are we solving? Who has this problem?
   - What does a win look like for you? How do you measure it?
   - Is there a current solution or workaround?
   - Hard constraints? (budget, timeline, integrations, regulations)

2. **Define who uses it** (max 3 personas): role, goal, main frustration.

3. **What do users need to accomplish?** For each persona: what's the core task they need to get done? What's the ideal outcome?

4. **Define MVP scope** — list candidate features, prioritize with MoSCoW (Must / Should / Could / Won't). Be ruthless with Must-haves.

5. **Flag risks**: technical unknowns, third-party dependencies, anything that could block delivery.

## Output → `docs/discovery.md`

```markdown
# Discovery: [Project Name]

## Problem
## Users
## Core Needs
## MVP Scope (MoSCoW)
## Risks & Open Questions
```

One page. If it's longer, you're overthinking it.
