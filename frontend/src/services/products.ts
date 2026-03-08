import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/database'

export async function getProducts(): Promise<Product[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw new Error(`Error al obtener productos: ${error.message}`)
    return data ?? []
}

export async function createProduct(
    payload: Omit<Product, 'id'>
): Promise<Product> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single()

    if (error) throw new Error(`Error al crear producto: ${error.message}`)
    return data
}

export async function updateProduct(
    id: string,
    payload: Partial<Omit<Product, 'id'>>
): Promise<Product> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(`Error al actualizar producto: ${error.message}`)
    return data
}

export async function deleteProduct(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(`Error al eliminar producto: ${error.message}`)
}

export async function toggleProductActive(
    id: string,
    active: boolean
): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('products')
        .update({ active })
        .eq('id', id)
    if (error) throw new Error(`Error al actualizar estado: ${error.message}`)
}
