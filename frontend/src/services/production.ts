import { createClient } from '@/lib/supabase/client'

export interface ProductionSummaryRow {
    delivery_date: string
    product_id: string
    product_name: string
    unit: string
    pricing_type: 'fixed' | 'by_weight'
    total_quantity: number
    total_actual_weight: number
    order_count: number
    client_breakdown: { 
        client_name: string; 
        quantity: number; 
        actual_weight?: number; 
        is_final?: boolean 
    }[]
}

export async function getProductionSummary(
    date: string
): Promise<ProductionSummaryRow[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('v_production_summary')
        .select('*')
        .eq('delivery_date', date)

    if (error) throw new Error(`Error al obtener resumen: ${error.message}`)
    return data ?? []
}
