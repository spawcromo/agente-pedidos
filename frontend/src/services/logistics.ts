import { createClient } from '@/lib/supabase/client'
import type { OrderWithDetails } from './orders'

export interface RouteStop {
    id: string
    route_id: string
    order_id: string
    position: number
    status: 'pending' | 'delivered'
    completed_at: string | null
    order: OrderWithDetails
}

export interface DeliveryRoute {
    id: string
    delivery_date: string
    driver_id: string | null
    status: 'draft' | 'active' | 'completed'
    driver?: { id: string; email: string }
    stops: RouteStop[]
}

export async function getRoutes(date?: string): Promise<DeliveryRoute[]> {
    const supabase = createClient()
    let query = supabase
        .from('delivery_routes')
        .select(`
            *,
            driver:profiles(id, email),
            stops:delivery_stops(
                *,
                order:orders(
                    *,
                    client:clients(id, name, phone, address, client_type),
                    order_items(*, product:products(name, unit))
                )
            )
        `)
        .order('created_at', { ascending: false })

    if (date) {
        query = query.eq('delivery_date', date)
    }

    const { data, error } = await query
    if (error) throw new Error(`Error al obtener rutas: ${error.message}`)
    return data as DeliveryRoute[]
}

export async function getMyRoutes(driverId: string): Promise<DeliveryRoute[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('delivery_routes')
        .select(`
            *,
            stops:delivery_stops(
                *,
                order:orders(
                    *,
                    client:clients(id, name, phone, address, client_type),
                    order_items(*, product:products(name, unit))
                )
            )
        `)
        .eq('driver_id', driverId)
        .neq('status', 'completed')
        .order('delivery_date', { ascending: true })

    if (error) throw new Error(`Error al obtener mis rutas: ${error.message}`)
    return data as DeliveryRoute[]
}

export async function createRoute(date: string, driverId: string | null, orderIds: string[]): Promise<void> {
    const supabase = createClient()

    // 1. Create the route
    const { data: route, error: routeError } = await supabase
        .from('delivery_routes')
        .insert({
            delivery_date: date,
            driver_id: driverId,
            status: 'active'
        })
        .select()
        .single()

    if (routeError) throw new Error(`Error al crear ruta: ${routeError.message}`)

    // 2. Add the stops (sequentially)
    const stops = orderIds.map((orderId, index) => ({
        route_id: route.id,
        order_id: orderId,
        position: index,
        status: 'pending'
    }))

    const { error: stopsError } = await supabase.from('delivery_stops').insert(stops)
    if (stopsError) throw new Error(`Error al crear paradas: ${stopsError.message}`)
}

export async function updateStopStatus(stopId: string, status: 'pending' | 'delivered'): Promise<void> {
    const supabase = createClient()

    // 1. Update the stop
    const { data: stop, error } = await supabase
        .from('delivery_stops')
        .update({
            status,
            completed_at: status === 'delivered' ? new Date().toISOString() : null
        })
        .eq('id', stopId)
        .select('order_id')
        .single()

    if (error) throw new Error(`Error al actualizar parada: ${error.message}`)

    // 2. If delivered, sync the order status
    if (status === 'delivered' && stop?.order_id) {
        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', stop.order_id)

        if (orderError) console.error('Error syncing order status:', orderError.message)
    }
}

export async function deleteRoute(routeId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('delivery_routes')
        .delete()
        .eq('id', routeId)

    if (error) throw new Error(`Error al eliminar ruta: ${error.message}`)
}

export async function getDrivers(): Promise<{ id: string; email: string }[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'repartidor')

    if (error) throw new Error(`Error al obtener repartidores: ${error.message}`)
    return data
}
