# Plan: Gestión de Pedidos — Avícola Baccaro

## Milestones

### M1: Fundación — COMPLETO ✅
**Goal**: Admin puede ver, crear y gestionar pedidos, clientes y productos desde el dashboard web. Base de datos funcional.

- [x] Scaffold frontend (Next.js + shadcn/ui) y backend (Supabase: tablas, RLS, auth)
- [x] US-09: CRUD de productos (nombre, unidad, precios retail/wholesale, activo, orden)
- [x] US-10: CRUD de clientes (nombre, teléfono, dirección, coordenadas, horario, tipo, notas)
- [x] US-06: Vista de pedidos pendientes (tabla filtrable por fecha y estado)
- [x] US-08: Editar productos/cantidades de un pedido antes de confirmar
- [x] US-05: Crear pedido manual desde el dashboard (source: "manual")

### M2: WhatsApp Bot — EN PROGRESO 🔄
**Goal**: Los clientes hacen pedidos por WhatsApp y el admin los ve en el dashboard. Las confirmaciones/rechazos se notifican automáticamente.

- [ ] Configurar Meta WhatsApp Cloud API + n8n
- [ ] US-01: Bot de WhatsApp que captura pedido (productos, cantidades, fecha)
- [ ] US-02: Opción "repetir último pedido" en el bot
- [ ] US-03: Agregar notas al pedido desde el bot
- [ ] US-05 (automático): Pedidos del bot llegan al dashboard con estado "pendiente"
- [x] US-07: Confirmación/rechazo masivo de pedidos
- [ ] US-04: Notificación automática al cliente vía WhatsApp al confirmar/rechazar

### M3: Logística y Ruteo — ~2 semanas
**Goal**: Admin genera la lista de reparto del día con ruta optimizada. Repartidor ve sus entregas en el celular y marca como entregadas.

- [x] US-13: Vista "Reparto del día" con pedidos confirmados para una fecha
- [x] US-11: Resumen de producción (totales por producto para una fecha)
- [ ] US-14: Optimización de ruta (Google Maps Distance Matrix + Directions)
- [x] US-15: Vista mobile para repartidor (lista de entregas, dirección, productos, notas, link a Maps)
- [x] US-16: Marcar entrega como realizada desde el celular

### M4: Inteligencia y Polish — ~1 semana
**Goal**: Dashboard con estadísticas de negocio. Precios diferenciados activos en el bot. Sistema pulido para uso diario.

- [ ] US-12: Dashboard de estadísticas (ranking clientes, productos top, tendencia por día, frecuencia)
- [ ] Precios diferenciados por tipo de cliente activos en el bot (Should)
- [ ] Historial completo de pedidos por cliente (Should)
- [ ] QA general, edge cases, y polish de UX

## Dependencies

- `Supabase schema (M1)` → bloquea → `Bot de WhatsApp (M2)` — n8n necesita las tablas para escribir pedidos.
- `Meta API config (M2)` → bloquea → `Notificaciones automáticas (M2)` — sin webhook de Meta no se puede enviar WhatsApp.
- `Confirmación de pedidos (M2)` → bloquea → `Reparto del día (M3)` — solo pedidos confirmados entran al reparto.
- `Coordenadas de clientes (M1)` → bloquea → `Optimización de ruta (M3)` — sin lat/lng no hay cálculo de distancias.

## Risks

- **WhatsApp API approval**: Meta puede tardar en aprobar el número de teléfono para la Cloud API. Iniciar trámite en semana 1.
- **Geocoding de direcciones**: Los clientes existentes probablemente no tienen coordenadas. Se necesita un paso de geocoding inicial (Google Geocoding API o manual).
- **Adopción del bot**: Testear con 2-3 clientes reales antes de hacer rollout masivo.
