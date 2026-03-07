# Git Conventions

## Branches

Trunk-based: feature branches merge directly to `main`.

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready. Always deployable. |
| `feat/<name>` | New features. Branch from `main`. |
| `fix/<name>` | Bug fixes. Branch from `main`. |
| `chore/<name>` | Refactors, deps, config. |

No `develop` branch. Keep it simple.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(scope): imperative short description
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## PRs

- Title follows commit format.
- Description: what, why, how to test.

## Self-Review Checklist

Before merging, check for:
- Leftover `console.log` / debug code
- Missing error handling
- Hardcoded values that should be config
- Missing types
