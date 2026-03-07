---
name: n8n Automations
description: Design, document, and organize n8n automation workflows.
---

# n8n Automations

Use when the project needs automated workflows (notifications, data sync, scheduled tasks, integrations).

## When to Use n8n

- **Event-driven**: webhooks, schedules, external events
- **Integration-heavy**: connecting 2+ services
- **Non-core**: email sequences, alerts, reports — not core business logic

## Naming: `[project]-[trigger]-[action]`

Examples: `acme-signup-welcome-email`, `acme-daily-report-slack`

## Documentation

For each workflow, create a file in `automations/`:

```markdown
# [Workflow Name]

## Purpose
One sentence.

## Trigger
Webhook, cron, or app event.

## Flow
1. Receive → 2. Fetch → 3. Transform → 4. Send

## Error Handling
## Dependencies (services, credentials, endpoints)
## Testing (how to manually trigger and verify)
```

## Rules

- One workflow, one purpose.
- Credentials in n8n's store, never hardcoded.
- If it's not in `automations/`, it doesn't exist.
