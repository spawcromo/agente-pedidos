import { createClient } from '@/lib/supabase/client'
import { OrderWithDetails } from './orders'

export interface EnhancedDashboardStats {
    // 1. RUTAS HOY
    rutas_hoy_total: number
    rutas_hoy_progreso: number
    rutas_hoy_completadas: number
    rutas_hoy_pendientes_iniciar: number
    entregas_pendientes_hoy: number

    // 2. REPARTIDORES HOY
    repartidores_totales: number
    repartidores_en_ruta: number
    repartidores_disponibles: number
    repartidores_pendientes_salir: number

    // 3. PEDIDOS PARA MAÑANA
    pedidos_manana_total: number
    pedidos_manana_confirmados: number
    pedidos_manana_pendientes: number
    pedidos_manana_rechazados: number
}

export type ProductionEstimate = Record<string, { quantity: number; unit: string }>

export interface PlanificacionStats {
    rutas_armadas: number
    pedidos_sin_ruta: number
    repartidores_asignados: number
    repartidores_libres: number
}

export async function getEnhancedDashboardStats(): Promise<{
    stats: EnhancedDashboardStats | null;
    production: ProductionEstimate;
    planificacion: PlanificacionStats;
}> {
    const supabase = createClient()

    // 1. Get the pre-calculated view stats
    const { data: statsData, error: statsError } = await supabase
        .from('v_dashboard_enhanced_stats')
        .select('*')
        .single()

    if (statsError) {
        console.error('Error fetching enhanced dashboard stats:', statsError)
    }

    // 2. Get tomorrow's active orders to calculate production estimates
    // We fetch confirmed and pending orders for tomorrow
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            order_items(
                quantity,
                product:products(name, unit)
            )
        `)
        .eq('delivery_date', tomorrow)
        .in('status', ['pending', 'confirmed'])

    if (ordersError) {
        console.error('Error fetching production orders:', ordersError)
    }

    // 3. Get pending routes that haven't started (draft status)
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate() - 1).padStart(2, '0')}` // Adjusting back to today
    const currentToday = new Date().toISOString().split('T')[0]

    const { count: pendingRoutesCount, error: pendingRoutesError } = await supabase
        .from('delivery_routes')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_date', currentToday)
        .eq('status', 'draft')

    if (pendingRoutesError) {
        console.error('Error fetching pending routes:', pendingRoutesError)
    }

    const production: ProductionEstimate = {}

    // Aggregate items
    if (ordersData) {
        ordersData.forEach((order: any) => {
            (order.order_items || []).forEach((item: any) => {
                if (item.product && item.product.name) {
                    const prodName = item.product.name
                    if (!production[prodName]) {
                        production[prodName] = { quantity: 0, unit: item.product.unit || 'u' }
                    }
                    production[prodName].quantity += Number(item.quantity) || 0
                }
            })
        })
    }

    const finalStats = statsData ? {
        ...statsData,
        rutas_hoy_pendientes_iniciar: pendingRoutesCount || 0
    } : null

    // 4. Planificacion de mañana
    const { data: tomorrowRoutes } = await supabase
        .from('delivery_routes')
        .select('id, driver_id')
        .eq('delivery_date', tomorrow)

    const rutas_armadas = tomorrowRoutes?.length || 0

    // Drivers assigned
    const assignedDriversSet = new Set(tomorrowRoutes?.map((r: any) => r.driver_id).filter(Boolean))
    const repartidores_asignados = assignedDriversSet.size

    // Total Drivers to calculate free drivers
    const { count: totalDrivers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'repartidor')

    const repartidores_libres = (totalDrivers || 0) - repartidores_asignados

    // To get 'pedidos sin ruta', we know total pending/confirmed orders for tomorrow (finalStats.pedidos_manana_confirmados + finalStats.pedidos_manana_pendientes)
    // We just subtract the ones already in stops for those routes... OR we fetch stops directly.
    let pedidosEnRuta = 0
    if (rutas_armadas > 0 && tomorrowRoutes) {
        const routeIds = tomorrowRoutes.map((r: any) => r.id)
        const { count: countEnRuta } = await supabase
            .from('delivery_stops')
            .select('*', { count: 'exact', head: true })
            .in('route_id', routeIds)
        pedidosEnRuta = countEnRuta || 0
    }

    const pedidos_sin_ruta = Math.max(0, (ordersData?.length || 0) - pedidosEnRuta)

    const planificacion: PlanificacionStats = {
        rutas_armadas,
        pedidos_sin_ruta,
        repartidores_asignados,
        repartidores_libres
    }

    return {
        stats: finalStats as EnhancedDashboardStats | null,
        production,
        planificacion
    }
}
