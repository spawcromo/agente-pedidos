import { createClient } from '@/lib/supabase/client'

export interface Repartidor {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    created_at: string;
    driver_status?: 'disponible' | 'enfermo' | 'vacaciones' | 'no_disponible';
    routes_hoy?: number;
    routes_manana?: number;
}

export async function getRepartidores(): Promise<Repartidor[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id, full_name, phone, email, created_at, driver_status,
            delivery_routes(id, delivery_date)
        `)
        .eq('role', 'repartidor')
        .order('full_name')

    if (error) throw error

    // Compute route counts
    const todayStr = new Date().toISOString().split('T')[0]
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const tomorrowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const mapped = (data as any[]).map(p => {
        const routes = Array.isArray(p.delivery_routes) ? p.delivery_routes : []
        const hoy = routes.filter((r: any) => r.delivery_date === todayStr).length
        const manana = routes.filter((r: any) => r.delivery_date === tomorrowStr).length
        return {
            ...p,
            routes_hoy: hoy,
            routes_manana: manana
        } as Repartidor
    })

    return mapped
}

export async function updateRepartidorStatus(id: string, status: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('profiles')
        .update({ driver_status: status })
        .eq('id', id)

    if (error) throw error
}
