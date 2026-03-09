import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus, OrderItem } from '@/types/database'

export type OrderWithDetails = Order & {
    client: { id: string; name: string; phone: string; client_type: string }
    order_items: (OrderItem & { product: { name: string; unit: string } })[]
}

export async function getOrders(filters?: {
    delivery_date?: string
    status?: OrderStatus | OrderStatus[] | 'all'
}): Promise<OrderWithDetails[]> {
    const supabase = createClient()
    let query = supabase
        .from('orders')
        .select(`
      *,
      client:clients(id, name, phone, client_type),
      order_items(*, product:products(name, unit))
    `)
        .order('created_at', { ascending: false })

    if (filters?.delivery_date) {
        query = query.eq('delivery_date', filters.delivery_date)
    }

    if (filters?.status && filters.status !== 'all') {
        if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status)
        } else {
            query = query.eq('status', filters.status)
        }
    }

    const { data, error } = await query
    if (error) throw new Error(`Error al obtener pedidos: ${error.message}`)
    return (data ?? []) as OrderWithDetails[]
}

export async function getOrderById(id: string): Promise<OrderWithDetails> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      client:clients(id, name, phone, client_type),
      order_items(*, product:products(name, unit))
    `)
        .eq('id', id)
        .single()

    if (error) throw new Error(`Error al obtener pedido: ${error.message}`)
    return data as OrderWithDetails
}

export async function updateOrderStatus(
    id: string,
    status: OrderStatus
): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
    if (error) throw new Error(`Error al actualizar pedido: ${error.message}`)
}

export async function bulkUpdateOrderStatus(
    ids: string[],
    status: OrderStatus
): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', ids)
    if (error) throw new Error(`Error al actualizar pedidos: ${error.message}`)
}

// Create order with items
export interface CreateOrderPayload {
    client_id: string
    delivery_date: string
    notes: string | null
    source: 'manual' | 'whatsapp'
    items: { product_id: string; quantity: number; unit_price: number }[]
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
    const supabase = createClient()

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            client_id: payload.client_id,
            delivery_date: payload.delivery_date,
            notes: payload.notes,
            source: payload.source,
            status: 'pending',
        })
        .select()
        .single()

    if (orderError) throw new Error(`Error al crear pedido: ${orderError.message}`)

    if (payload.items.length > 0) {
        const { error: itemsError } = await supabase.from('order_items').insert(
            payload.items.map((item) => ({ ...item, order_id: order.id }))
        )
        if (itemsError) throw new Error(`Error al crear items: ${itemsError.message}`)
    }

    return order
}

// Replace all items of an order
export async function updateOrderItems(
    orderId: string,
    items: { product_id: string; quantity: number; unit_price: number }[]
): Promise<void> {
    const supabase = createClient()

    const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)

    if (deleteError) throw new Error(`Error al limpiar items: ${deleteError.message}`)

    if (items.length > 0) {
        const { error: insertError } = await supabase
            .from('order_items')
            .insert(items.map((item) => ({ ...item, order_id: orderId })))
        if (insertError) throw new Error(`Error al insertar items: ${insertError.message}`)
    }
}

export async function updateOrderNotes(id: string, notes: string | null): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ notes }).eq('id', id)
    if (error) throw new Error(`Error al actualizar notas: ${error.message}`)
}
