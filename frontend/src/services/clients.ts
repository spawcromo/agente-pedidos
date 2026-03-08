import { createClient } from '@/lib/supabase/client'
import type { Client, ClientType } from '@/types/database'

export async function getClients(): Promise<Client[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(`Error al obtener clientes: ${error.message}`)
    return data ?? []
}

export async function getClientByPhone(phone: string): Promise<Client | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('phone', phone)
        .maybeSingle()

    if (error) throw new Error(`Error al buscar cliente: ${error.message}`)
    return data
}

export interface ClientPayload {
    name: string
    phone: string
    address: string
    lat: number | null
    lng: number | null
    opening_hours: string | null
    client_type: ClientType
    notes: string | null
}

export async function createClientRecord(payload: ClientPayload): Promise<Client> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single()

    if (error) throw new Error(`Error al crear cliente: ${error.message}`)
    return data
}

export async function updateClientRecord(
    id: string,
    payload: Partial<ClientPayload>
): Promise<Client> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(`Error al actualizar cliente: ${error.message}`)
    return data
}

export async function deleteClientRecord(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw new Error(`Error al eliminar cliente: ${error.message}`)
}
