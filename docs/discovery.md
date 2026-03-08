# Discovery: Gestión de Pedidos — Avícola Baccaro

## Problem

Los pedidos llegan por WhatsApp sin estructura. El personal revisa mensajes uno por uno, consolida manualmente lo que pidió cada cliente, y arma los repartos del día siguiente a mano. Se pierde tiempo, se cometen errores, y no hay visibilidad general de la demanda diaria ni de la producción necesaria.

**Win condition**: pedidos organizados automáticamente, validación rápida desde un panel, resumen de producción diario, estadísticas de clientes, y rutas de reparto generadas sin intervención manual.

## Users

| Persona | Goal | Frustración |
|---------|------|-------------|
| **Admin** (personal de la avícola) | Procesar pedidos rápido, saber qué producir, organizar repartos, entender tendencias de demanda | Revisar mensajes de WhatsApp uno a uno, armar rutas a mano, no tener datos para tomar decisiones |
| **Cliente** (minorista/mayorista) | Hacer pedidos fácil, repetir pedidos habituales, saber si fue aceptado | No tener confirmación clara, tener que dictar el mismo pedido cada vez |
| **Repartidor** | Seguir una ruta clara y eficiente, marcar entregas realizadas | Rutas desorganizadas, falta de info de horarios y notas de clientes |

## Core Needs

- **Admin**: Ver todos los pedidos en un dashboard → confirmar masivamente → ver resumen de producción (totales por producto) → generar reparto con ruta optimizada → consultar estadísticas de clientes y demanda.
- **Cliente**: Hacer pedido por WhatsApp (bot guiado) → repetir pedido anterior con un tap → agregar notas → recibir confirmación automática.
- **Repartidor**: Ver lista de entregas ordenada con dirección, productos, notas del cliente y link a navegación → marcar cada entrega como realizada.

## MVP Scope (MoSCoW)

### Must
- Bot de WhatsApp que capture pedidos (productos, cantidades, fecha de entrega).
- Opción de "repetir último pedido" en el bot.
- Notas por pedido (cliente → admin/repartidor).
- Dashboard web interno: ver pedidos del día, confirmar/rechazar/editar.
- Confirmación masiva de pedidos.
- Resumen de producción (totales por producto para una fecha).
- Notificación automática al cliente (confirmado/rechazado) vía WhatsApp.
- Registro persistente de pedidos, clientes y productos.
- Lista de reparto del día siguiente.
- Sugerencia de ruta optimizada para repartidores.
- Vista mobile para repartidores con marcar entrega como realizada.
- Notas persistentes por cliente (visibles para repartidores).
- Dashboard de estadísticas: ranking clientes, productos más pedidos, tendencia por día, frecuencia.

### Should
- Precios diferenciados por tipo de cliente (mayorista/minorista).
- Historial completo de pedidos por cliente.

### Could
- Recordatorio proactivo por WhatsApp ("¿Hacemos el pedido de esta semana?").
- Foto de entrega como comprobante.
- Alertas de pedidos inusuales (volumen atípico).
- Predicción simple de demanda basada en historial.

### Won't (v1)
- Integración con sistema de stock/ERP existente.
- Pagos online.
- Tracking GPS en tiempo real de camiones.
- App nativa para repartidores.

## Context

- **Catálogo**: ~15-20 productos. Cortes de pollo (entero, pechuga, pata-muslo, suprema, alitas, muslos, patas, menudos), milanesas de pollo, y derivados (hamburguesas, nuggets, etc.).
- **Volumen**: 30-50 pedidos/día.
- **Zona**: Gran Mendoza (área urbana/suburbana).

## Risks

- **WhatsApp API**: Costos y límites de Meta Cloud API. Evaluar proveedor (directo vs. BSP).
- **Adopción del bot**: El bot tiene que ser más fácil que mandar un mensaje de texto libre, o los clientes lo van a ignorar. "Repetir pedido" es clave.
