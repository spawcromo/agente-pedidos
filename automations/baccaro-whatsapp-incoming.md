# baccaro-whatsapp-incoming

## Purpose
Recibir mensajes de WhatsApp de clientes y ejecutar el flujo del bot para capturar pedidos.

## Trigger
Webhook de Meta WhatsApp Cloud API (incoming message).

## Flow
1. **Receive** → Webhook recibe mensaje de Meta.
2. **Identify** → Buscar cliente en Supabase por número de teléfono.
3. **Route** → Según el contenido del mensaje:
   - "pedir" / "nuevo pedido" → Iniciar flujo de nuevo pedido.
   - "repetir" → Buscar último pedido del cliente, mostrar resumen, pedir confirmación.
   - "estado" → Buscar último pedido pendiente, informar estado.
   - Otro → Mensaje de ayuda con opciones disponibles.
4. **New Order Flow** →
   - Enviar catálogo de productos (lista interactiva de WhatsApp).
   - Recopilar selección de productos y cantidades (múltiples turnos).
   - Solicitar fecha de entrega.
   - Permitir agregar nota (opcional).
   - Mostrar resumen y pedir confirmación.
5. **Save** → Crear `order` + `order_items` en Supabase con status `pending`, source `whatsapp`.
6. **Confirm** → Enviar mensaje de confirmación al cliente: "Tu pedido fue recibido. Te avisamos cuando lo confirmemos."

## Error Handling
- Cliente no encontrado → Responder solicitando registro (o crear automáticamente con datos mínimos).
- Timeout del flujo (cliente no responde en 30 min) → Cancelar sesión, enviar "Tu pedido no se completó. Escribí 'pedir' para empezar de nuevo."
- Error de Supabase → Log del error + responder al cliente "Hubo un problema, intenta de nuevo en unos minutos."

## Dependencies
- **Meta WhatsApp Cloud API**: Webhook URL configurado en Meta App Dashboard.
- **Supabase**: Service Role Key para leer/escribir sin RLS.
- **n8n credentials**: `supabase-service-role`, `meta-whatsapp-token`.

## Testing
1. Enviar "pedir" al número de WhatsApp del bot.
2. Seguir el flujo guiado.
3. Verificar que el pedido aparece en Supabase con status `pending`.
