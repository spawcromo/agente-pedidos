import { createClient } from '@/lib/supabase/client'

export interface PriceList {
    id: string
    name: string
    created_at: string
}

export interface ProductPrice {
    id: string
    price_list_id: string
    product_id: string
    price: number
    product?: {
        name: string
        unit: string
    }
}

export async function getPriceLists(): Promise<PriceList[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('price_lists')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(`Error al obtener listas de precios: ${error.message}`)
    return data ?? []
}

export async function getPriceListWithPrices(priceListId: string): Promise<ProductPrice[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('product_prices')
        .select(`
            *,
            product:products(name, unit)
        `)
        .eq('price_list_id', priceListId)

    if (error) throw new Error(`Error al obtener precios de la lista: ${error.message}`)
    return data ?? []
}

export async function createPriceList(name: string, baseListId?: string, multiplier: number = 1) {
    const supabase = createClient()
    
    // 1. Create the list
    const { data: newList, error: createError } = await supabase
        .from('price_lists')
        .insert({ name })
        .select()
        .single()
        
    if (createError) throw new Error(`Error al crear lista: ${createError.message}`)
    
    // 2. If baseListId is provided, copy prices with multiplier
    if (baseListId) {
        const { data: basePrices, error: fetchError } = await supabase
            .from('product_prices')
            .select('product_id, price')
            .eq('price_list_id', baseListId)
            
        if (fetchError) throw new Error(`Error al copiar precios base: ${fetchError.message}`)
        
        const newPrices = (basePrices as any[]).map(bp => ({
            price_list_id: newList.id,
            product_id: bp.product_id,
            price: Number((bp.price * multiplier).toFixed(2))
        }))
        
        const { error: insertError } = await supabase
            .from('product_prices')
            .insert(newPrices)
            
        if (insertError) throw new Error(`Error al insertar nuevos precios: ${insertError.message}`)
    }
    
    return newList
}

export async function updateProductPrice(priceId: string, price: number) {
    const supabase = createClient()
    const { error } = await supabase
        .from('product_prices')
        .update({ price })
        .eq('id', priceId)
        
    if (error) throw new Error(`Error al actualizar precio: ${error.message}`)
}

export async function deletePriceList(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('price_lists')
        .delete()
        .eq('id', id)
        
    if (error) throw new Error(`Error al eliminar lista: ${error.message}`)
}
