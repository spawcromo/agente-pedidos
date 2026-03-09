import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
    pending_orders: number
    confirmed_orders: number
    retail_clients: number
    wholesale_clients: number
    active_products: number
    active_drivers: number
    revenue_today: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('v_dashboard_stats')
        .select('*')
        .single()

    if (error) throw new Error(`Error al obtener estadísticas: ${error.message}`)
    return data as DashboardStats
}
