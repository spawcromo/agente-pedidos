'use server'

import { createClient } from '@supabase/supabase-js'

export async function createRepartidor(data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
}) {
    // Requires Service Role Key to manage users directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('El sistema no tiene configurada la SUPABASE_SERVICE_ROLE_KEY. Configurala en .env.local')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    // Create auth user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password || 'Baccaro2026!',
        email_confirm: true,
        user_metadata: {
            full_name: data.fullName
        }
    })

    if (createError) {
        throw new Error(createError.message)
    }

    const userId = userData.user.id

    // Check if profile exists (from triggers), to update phone and role.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: data.fullName,
            phone: data.phone,
            role: 'repartidor'
        })
        .eq('id', userId)

    if (profileError) {
        // Fallback: insert if not triggered magically
        await supabaseAdmin.from('profiles').insert({
            id: userId,
            full_name: data.fullName,
            email: data.email,
            phone: data.phone,
            role: 'repartidor'
        })
    }

    return { success: true, userId }
}

export async function updateRepartidorStatusAction(id: string, status: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Configuración incompleta')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ driver_status: status })
        .eq('id', id)

    if (error) throw new Error(error.message)

    return { success: true }
}
