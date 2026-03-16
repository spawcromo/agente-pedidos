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
        active: boolean
        pricing_type: string
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
    
    // 1. Get all products (even those without stock)
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, unit, active, pricing_type')
        .order('name', { ascending: true })

    if (prodError) throw new Error(`Error al obtener productos: ${prodError.message}`)

    // 2. Get prices for this list
    const { data: prices, error: priceError } = await supabase
        .from('product_prices')
        .select(`*`)
        .eq('price_list_id', priceListId)

    if (priceError) throw new Error(`Error al obtener precios: ${priceError.message}`)

    // 3. Merge: Every product must be in the list
    const priceMap = new Map<string, any>((prices ?? []).map((p: any) => [p.product_id, p]))
    
    return (products ?? []).map((prod: any) => {
        const existing = priceMap.get(prod.id)
        return {
            id: existing?.id ?? `temp-${prod.id}`, // temp ID if not in DB yet
            price_list_id: priceListId,
            product_id: prod.id,
            price: existing?.price ?? 0,
            product: {
                name: prod.name,
                unit: prod.unit,
                active: prod.active
            }
        }
    })
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

export async function updateProductPrice(priceId: string, price: number, priceListId?: string, productId?: string) {
    const supabase = createClient()
    
    if (priceId.startsWith('temp-')) {
        if (!priceListId || !productId) throw new Error("Faltan datos para crear nuevo precio")
        
        const { data, error } = await supabase
            .from('product_prices')
            .insert({ price_list_id: priceListId, product_id: productId, price })
            .select()
            .single()
            
        if (error) throw new Error(`Error al crear precio: ${error.message}`)
        return data
    } else {
        const { error } = await supabase
            .from('product_prices')
            .update({ price })
            .eq('id', priceId)
            
        if (error) throw new Error(`Error al actualizar precio: ${error.message}`)
    }
}

export async function bulkUpdateProductPrices(prices: { price_list_id: string; product_id: string; price: number }[]) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('product_prices')
        .upsert(prices, { onConflict: 'price_list_id, product_id' })
        .select()

    if (error) throw new Error(`Error al guardar precios: ${error.message}`)
    return data
}

export async function deletePriceList(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('price_lists')
        .delete()
        .eq('id', id)
        
    if (error) throw new Error(`Error al eliminar lista: ${error.message}`)
}
