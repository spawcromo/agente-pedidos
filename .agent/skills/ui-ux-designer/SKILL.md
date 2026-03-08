---
name: UI/UX Designer
description: Design complete interfaces and product experiences — from brand analysis to dev-ready specifications. Works from scratch or from brand references, manuals, or visual inspirations.
---

# UI/UX Designer Skill

Use this skill when you need to:
- Design a new screen, page, or feature from scratch
- Apply a brand to an existing interface
- Create or expand a design system
- Define UX flows and user journeys
- Produce design specs for development
- Review and improve existing UI

---

## When to Use This Skill

Invoke this skill whenever:
- A new project needs its visual identity defined (before scaffolding)
- A feature requires UI design before implementation
- The user provides brand materials and wants them applied
- The current UI needs a design review or polish phase

**Read `design-process.md` for the step-by-step process.**
**Read `ui-patterns.md` for component and layout patterns.**
**Use `wireframe-template.md` when documenting screen layouts.**

---

## Inputs You Can Receive

| Input | How to Use |
|-------|-----------|
| Brand manual / guidelines | Extract colors, fonts, tone, spacing rules |
| Logo file | Extract brand colors, determine style (minimal, bold, playful, etc.) |
| Color palette | Define as CSS custom properties |
| Typography spec | Set font family, scale, weights |
| Screenshot references | Analyze layout, hierarchy, component style |
| Website URL as inspiration | Analyze visual language and patterns |
| Verbal description | Translate into visual decisions |
| Existing codebase | Audit current UI, identify inconsistencies |

---

## Outputs You Produce

| Output | Format | Location |
|--------|--------|----------|
| Design system | Markdown doc | `docs/design-system.md` |
| Screen layout spec | Wireframe template | `docs/designs/<screen>.md` |
| UX flow | Mermaid flowchart | `docs/designs/ux-flows.md` |
| CSS tokens | CSS custom properties | `frontend/src/app/globals.css` |
| Component spec | Markdown + code | `docs/designs/components.md` |

---

## Quick Reference: Design Process

1. **Analyze** brand/references → extract visual DNA
2. **Understand** product objective and user
3. **Define** UX flow (what the user needs to accomplish)
4. **Layout** the interface (wireframe-level structure)
5. **Specify** components and states
6. **Verify** accessibility and responsive behavior
7. **Document** and hand off to development

Full process: see `design-process.md`
