---
trigger: always_on
---

# Project Context

> **Only file edited per project.** All other rules are universal.

## Project Info

- **Client**: Avícola Baccaro
- **Project**: Gestión de Pedidos y Logística
- **Type**: Full product (WhatsApp Bot + Web Dashboard)
- **Start Date**: 2026-03-07
- **Repo**: https://github.com/spawcromo/agente-pedidos
- **Staging URL**: https://agente-pedidos.vercel.app
- **Production URL**: [URL]

## Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Hosting**: Vercel (frontend), Railway (n8n)
- **Automations**: n8n self-hosted (WhatsApp bot, notificaciones)

## External Services

| Service | Purpose | Dashboard URL |
|---------|---------|---------------|
| Supabase | DB, Auth, API, Realtime | [url] |
| n8n | WhatsApp bot y flujos de notificación | [url] |
| Meta | WhatsApp Cloud API | [url] |
| Google Maps | Distance Matrix + Directions para rutas | [url] |

## Notes

- Validación humana obligatoria para todos los pedidos.
- Sin integración con ERP/stock existente en v1.
- Catálogo de ~15-20 productos. 30-50 pedidos/día. Zona: Gran Mendoza.
