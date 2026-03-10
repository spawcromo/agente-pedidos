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

export async function getEnhancedDashboardStats(): Promise<{
    stats: EnhancedDashboardStats | null;
    production: ProductionEstimate;
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

    return {
        stats: finalStats as EnhancedDashboardStats | null,
        production
    }
}
