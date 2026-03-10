'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'

type UserRole = 'admin' | 'repartidor' | null

interface UserContextType {
    user: User | null
    role: UserRole
    loading: boolean
    refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const supabase = createClient()

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        if (!error && data) {
            setRole(data.role as UserRole)
        } else {
            console.error('Error fetching profile:', error)
            setRole('repartidor') // Default fallback
        }
    }

    const refreshProfile = async () => {
        try {
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
            if (userError) throw userError

            setUser(currentUser)
            if (currentUser) {
                await fetchProfile(currentUser.id)
            } else {
                setRole(null)
            }
        } catch (err: any) {
            if (err?.name !== 'AuthSessionMissingError' && err?.message !== 'Auth session missing!') {
                console.error('Error in refreshProfile:', err)
            }
            setUser(null)
            setRole(null)
        } finally {
            setLoading(false)
        }
    }

    const pathname = usePathname()
    const lastChecked = useRef<number>(0)

    // Re-verificar sesión en cada navegación (máximo cada 30 seg para no saturar)
    useEffect(() => {
        const now = Date.now()
        if (now - lastChecked.current > 30000 && pathname !== '/login') {
            lastChecked.current = now
            refreshProfile()
        }
    }, [pathname])

    useEffect(() => {
        setMounted(true)
        refreshProfile()

        // Re-verificar sesión cuando la pestaña recupera el foco
        const handleFocus = () => {
            const now = Date.now()
            if (now - lastChecked.current > 60000) { // Solo si pasó 1 min
                lastChecked.current = now
                refreshProfile()
            }
        }
        window.addEventListener('focus', handleFocus)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            try {
                if (session?.user) {
                    setUser(session.user)
                    // Solo buscamos perfil si realmente hay sesión
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single()

                    if (!error && data) {
                        setRole(data.role as UserRole)
                    } else if (!role) {
                        setRole('repartidor')
                    }
                } else {
                    // Si no hay sesión, limpiamos siempre para evitar "stuck" states
                    setUser(null)
                    setRole(null)
                }
            } catch (err) {
                console.error('Error in onAuthStateChange:', err)
                setUser(null)
                setRole(null)
            } finally {
                setLoading(false)
            }
        })

        return () => {
            subscription.unsubscribe()
            window.removeEventListener('focus', handleFocus)
        }
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <UserContext.Provider value={{ user, role, loading, refreshProfile }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
