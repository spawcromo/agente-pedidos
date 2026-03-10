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
    const pathname = usePathname()
    const lastChecked = useRef<number>(0)
    const initStarted = useRef<boolean>(false)

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (!error && data) {
                setRole(data.role as UserRole)
            } else {
                if (error) console.error('Error in fetchProfile query:', error)
                setRole('repartidor') // Default fallback
            }
        } catch (err) {
            console.error('Fatal error in fetchProfile:', err)
            setRole('repartidor')
        }
    }

    const refreshProfile = async (isInitial: boolean = false) => {
        console.log(`🔍 Refreshing session (isInitial: ${isInitial})...`)
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
            console.log('✅ Session refreshed')
            if (isInitial) setLoading(false)
        }
    }

    // Re-verificar sesión en cada navegación (máximo cada 30 seg para no saturar)
    useEffect(() => {
        if (pathname === '/login' || !mounted) return
        const now = Date.now()
        if (now - lastChecked.current > 30000) {
            lastChecked.current = now
            refreshProfile()
        }
    }, [pathname, mounted])

    useEffect(() => {
        setMounted(true)

        // Inicialización única
        if (!initStarted.current) {
            initStarted.current = true

            // Timeout de seguridad por si Supabase tarda demasiado (5 seg)
            const timeout = setTimeout(() => {
                console.warn('⚠️ Auth initialization timeout reached')
                setLoading(false)
            }, 5000)

            refreshProfile(true).then(() => clearTimeout(timeout))
        }

        // Re-verificar sesión cuando la pestaña recupera el foco
        const handleFocus = () => {
            const now = Date.now()
            if (now - lastChecked.current > 60000) {
                lastChecked.current = now
                refreshProfile()
            }
        }
        window.addEventListener('focus', handleFocus)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            console.log('📦 Auth Event:', event)
            try {
                if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION', 'USER_UPDATED'].includes(event)) {
                    if (session?.user) {
                        setUser(session.user)
                        await fetchProfile(session.user.id)
                    }
                } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                    setUser(null)
                    setRole(null)
                }
            } catch (err) {
                console.error('Error in onAuthStateChange:', err)
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
        <UserContext.Provider value={{ user, role, loading, refreshProfile: () => refreshProfile() }}>
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
