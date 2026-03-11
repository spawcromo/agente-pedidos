import { createClient } from '@/lib/supabase/client'

export interface Repartidor {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    created_at: string;
}

export async function getRepartidores(): Promise<Repartidor[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'repartidor')
        .order('full_name')

    if (error) throw error
    return data as Repartidor[]
}
