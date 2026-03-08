# Requirements: Gestión de Pedidos — Avícola Baccaro

## Overview

Sistema para automatizar la toma de pedidos por WhatsApp, centralizar la gestión administrativa con estadísticas de negocio, y optimizar la logística de reparto de Avícola Baccaro en el Gran Mendoza.

## Goals

1. Capturar el 100% de los pedidos de forma estructurada vía bot de WhatsApp.
2. Reducir el tiempo de consolidación y validación de pedidos diarios en al menos un 70%.
3. Proveer visibilidad completa de la demanda: qué producir, para quién, y tendencias.
4. Generar rutas de reparto optimizadas automáticamente.
5. Que cada cliente reciba confirmación formal de su pedido sin intervención manual.

## User Stories

### Toma de Pedidos (WhatsApp)

- **US-01**: Como **Cliente**, quiero hacer mi pedido por WhatsApp respondiendo a un bot guiado, para no depender de que alguien me atienda.
  - AC: El bot solicita productos (del catálogo), cantidades y fecha de entrega. Muestra resumen antes de confirmar.

- **US-02**: Como **Cliente**, quiero repetir mi último pedido con un solo mensaje, para no tener que dictar lo mismo cada vez.
  - AC: El bot ofrece opción "Repetir último pedido". Muestra el resumen del pedido anterior y permite confirmar o modificar.

- **US-03**: Como **Cliente**, quiero agregar una nota a mi pedido, para comunicar instrucciones especiales de entrega.
  - AC: El bot permite agregar texto libre como nota antes de confirmar. La nota se guarda y es visible para admin y repartidor.

- **US-04**: Como **Cliente**, quiero recibir un mensaje automático cuando mi pedido sea confirmado o rechazado, para saber si cuento con la mercadería.
  - AC: WhatsApp enviado automáticamente al confirmar/rechazar desde el panel admin.

- **US-05**: Como **Admin**, quiero que los pedidos del bot lleguen automáticamente al sistema, para no transcribirlos a mano.
  - AC: Pedido creado en la base de datos con estado "pendiente" al completarse el flujo del bot.

### Gestión Administrativa (Dashboard Web)

- **US-06**: Como **Admin**, quiero ver todos los pedidos pendientes en una sola pantalla, para procesar la demanda del día rápido.
  - AC: Tabla con cliente, productos, cantidades, fecha de entrega, estado. Filtrable por fecha y estado.

- **US-07**: Como **Admin**, quiero confirmar o rechazar múltiples pedidos a la vez, para no procesar uno por uno cuando hay 50 pedidos.
  - AC: Checkboxes de selección + botón "Confirmar seleccionados". Cada confirmación dispara notificación (US-04).

- **US-08**: Como **Admin**, quiero editar los productos o cantidades de un pedido antes de confirmarlo, para ajustar según disponibilidad.
  - AC: Edición inline de items del pedido desde el detalle. Cambios reflejados en la notificación al cliente.

- **US-09**: Como **Admin**, quiero gestionar el catálogo de productos con precios, para que el bot muestre información actualizada.
  - AC: CRUD de productos con nombre, unidad de medida y precio. Precios diferenciables por tipo de cliente (minorista/mayorista).

- **US-10**: Como **Admin**, quiero gestionar los datos de los clientes, para que el sistema tenga la info necesaria para el reparto y el bot.
  - AC: CRUD de clientes con nombre, teléfono, dirección, coordenadas, horario de apertura, tipo de cliente y notas persistentes.

### Producción y Estadísticas

- **US-11**: Como **Admin**, quiero ver un resumen de producción con totales por producto para una fecha de entrega, para saber exactamente qué preparar.
  - AC: Vista "Producción del día" que suma cantidades de todos los pedidos confirmados agrupados por producto.

- **US-12**: Como **Admin**, quiero ver estadísticas de negocio, para entender tendencias y tomar mejores decisiones.
  - AC: Dashboard con: ranking de clientes por volumen/facturación, productos más pedidos, tendencia de pedidos por día de la semana, frecuencia de pedido por cliente (detectar clientes que dejaron de pedir).

### Logística y Ruteo

- **US-13**: Como **Admin**, quiero ver la lista de pedidos confirmados para una fecha de entrega específica, para organizar el reparto.
  - AC: Vista "Reparto del día" con lista de pedidos, datos de entrega y totales.

- **US-14**: Como **Admin**, quiero que el sistema sugiera un orden de entrega optimizado, para ahorrar tiempo y combustible.
  - AC: Ruta ordenada por proximidad y horarios de apertura. Mapa visual del recorrido.

- **US-15**: Como **Repartidor**, quiero ver mi lista de entregas con dirección, productos y notas del cliente en el celular, para saber a dónde ir y qué llevar.
  - AC: Vista mobile-friendly. Cada parada muestra dirección, contacto, productos, notas del cliente y botón de navegación (link a Google Maps).

- **US-16**: Como **Repartidor**, quiero marcar cada entrega como realizada desde el celular, para que el admin sepa qué se entregó y qué queda pendiente.
  - AC: Botón "Entregado" por parada. Estado visible en tiempo real en el dashboard del admin.

## Scope

### In Scope (v1)
- Bot de WhatsApp para captura de pedidos con repetición de pedido anterior (n8n + Meta API).
- Dashboard web para admin con gestión de pedidos, catálogo y clientes (Next.js + Supabase).
- Confirmación masiva y edición de pedidos.
- Resumen de producción diario (totales por producto).
- Dashboard de estadísticas de negocio.
- Notificación automática al cliente vía WhatsApp.
- Generación de lista de reparto y ruta optimizada (Google Maps API).
- Vista mobile para repartidores con marcar entrega como realizada.

### Out of Scope
- Integración con sistema de stock/ERP existente.
- Pagos online.
- Tracking GPS en tiempo real de camiones.
- App nativa para repartidores.
- Recordatorios proactivos por WhatsApp.
- Foto de entrega como comprobante.

## Constraints & Assumptions

- La validación de cada pedido es humana — el sistema organiza, no decide.
- Los clientes ya usan WhatsApp; no se requiere adopción de canal nuevo.
- El catálogo es de ~15-20 productos, manejable para un flujo de bot.
- Volumen esperado: 30-50 pedidos/día. No requiere infraestructura de alta escala.
- Zona de operación: Gran Mendoza.
