import { createClient } from '@/lib/supabase/client'
import { optimizeRoute } from './maps'
import { WAREHOUSE_ADDRESS } from '@/lib/constants'
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
    driver?: { id: string; email: string; full_name?: string | null }
    stops: RouteStop[]
}

export async function getRoutes(date?: string): Promise<DeliveryRoute[]> {
    const supabase = createClient()
    let query = supabase
        .from('delivery_routes')
        .select(`
            *,
            driver:profiles(id, email, full_name),
            stops:delivery_stops(
                *,
                order:orders(
                    *,
                    client:clients(id, name, phone, address),
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
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
        .from('delivery_routes')
        .select(`
            *,
            stops:delivery_stops(
                *,
                order:orders(
                    *,
                    client:clients(id, name, phone, address),
                    order_items(*, product:products(name, unit))
                )
            )
        `)
        .eq('driver_id', driverId)
        .gte('delivery_date', today) // Muestra rutas de hoy en adelante, estén completadas o no
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
            status: 'draft'
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
        .select('order_id, route_id')
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

    // 3. Sync the route status
    if (stop?.route_id) {
        const { data: allStops } = await supabase
            .from('delivery_stops')
            .select('status, order:orders(status)')
            .eq('route_id', stop.route_id)

        if (allStops) {
            const allDone = (allStops as any[]).every(s => 
                s.status === 'delivered' || s.order?.status === 'cancelled'
            )
            const routeStatus = allDone ? 'completed' : 'active'

            await supabase
                .from('delivery_routes')
                .update({ status: routeStatus })
                .eq('id', stop.route_id)
        }
    }
}

export async function removeStopAndCancelOrder(stopId: string, orderId: string, reason: string): Promise<void> {
    const supabase = createClient()

    // 1. Update order
    const updateData: any = { status: 'cancelled', cancel_reason: reason }
    const { error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

    if (orderError) throw new Error(`Error al cancelar pedido: ${orderError.message}`)

    // 2. We NO LONGER delete the stop record as per user request
    // This allows it to remain visible in the route list with a "CANCELADO" label

    // 3. Sync the route status
    // Fetch route_id first if not available
    const { data: routeInfo } = await supabase
        .from('delivery_stops')
        .select('route_id')
        .eq('id', stopId)
        .single()

    if (routeInfo?.route_id) {
        const { data: allStops } = await supabase
            .from('delivery_stops')
            .select('status, order:orders(status)')
            .eq('route_id', routeInfo.route_id)

        if (allStops) {
            const allDone = (allStops as any[]).every(s => 
                s.status === 'delivered' || (s.id === stopId ? true : s.order?.status === 'cancelled')
            )
            // Wait, if I just updated the order status above, s.order?.status should be 'cancelled' for the current stopId too
            const routeStatus = allDone ? 'completed' : 'active'

            await supabase
                .from('delivery_routes')
                .update({ status: routeStatus })
                .eq('id', routeInfo.route_id)
        }
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

export async function updateRouteStatus(routeId: string, status: 'draft' | 'active' | 'completed'): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('delivery_routes')
        .update({ status })
        .eq('id', routeId)

    if (error) throw new Error(`Error al actualizar estado de la ruta: ${error.message}`)
}

export async function getDrivers(): Promise<{ id: string; email: string; full_name?: string | null; driver_status?: string | null }[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, driver_status')
        .eq('role', 'repartidor')

    if (error) throw new Error(`Error al obtener repartidores: ${error.message}`)
    return data
}

export async function reorderRouteStops(routeId: string, stops: RouteStop[]): Promise<void> {
    const supabase = createClient()
    
    // 1. Get addresses
    const addresses = stops.map(s => s.order.client?.address || '')
    
    // 2. Clear out invalid addresses
    if (addresses.some(a => !a)) throw new Error('Algunos pedidos no tienen dirección válida')

    // 3. Optimize
    const optimizedIndices = await optimizeRoute(WAREHOUSE_ADDRESS, addresses)
    
    // 4. Update positions in DB
    const updates = optimizedIndices.map((originalIdx, newPos) => ({
        id: stops[originalIdx].id,
        position: newPos
    }))

    for (const update of updates) {
        await supabase
            .from('delivery_stops')
            .update({ position: update.position })
            .eq('id', update.id)
    }
}
