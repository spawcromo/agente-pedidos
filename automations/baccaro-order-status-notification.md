# baccaro-order-status-notification

## Purpose
Enviar notificación automática al cliente por WhatsApp cuando su pedido es confirmado o rechazado.

## Trigger
Supabase Database Webhook: `UPDATE` en tabla `orders` cuando `status` cambia a `confirmed` o `rejected`.

## Flow
1. **Receive** → Webhook de Supabase con el registro del pedido actualizado.
2. **Fetch** → Obtener datos del cliente (nombre, teléfono) y los items del pedido.
3. **Template** → Armar mensaje según estado:
   - **Confirmado**: "✅ ¡Hola [nombre]! Tu pedido para el [fecha] fue confirmado. Detalle: [productos]. Te avisaremos cuando salga el reparto."
   - **Rechazado**: "❌ Hola [nombre], lamentablemente no podemos completar tu pedido para el [fecha]. Contactanos para más info."
4. **Send** → Enviar mensaje por Meta WhatsApp Cloud API.

## Error Handling
- Fallo de WhatsApp API → Reintentar 1 vez. Si falla, loguear en tabla `notification_log` con status `failed`.
- Teléfono inválido → Loguear error, no reintentar.

## Dependencies
- **Supabase**: Database Webhook configurado para `orders` table, event `UPDATE`.
- **Meta WhatsApp Cloud API**: Template messages aprobados por Meta.
- **n8n credentials**: `supabase-service-role`, `meta-whatsapp-token`.

## Testing
1. Cambiar el status de un pedido a `confirmed` desde el dashboard.
2. Verificar que el cliente recibe el WhatsApp.
3. Repetir con `rejected`.
