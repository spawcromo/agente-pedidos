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
    const fetchingProfile = useRef<string | null>(null)

    const fetchRole = async (userId: string) => {
        if (fetchingProfile.current === userId) return
        fetchingProfile.current = userId
        console.log(`👤 Fetching profile for ${userId}...`)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (!error && data) {
                console.log(`👤 Profile found: ${data.role}`)
                setRole(data.role as UserRole)
            } else {
                console.warn('👤 Profile not found, using fallback: repartidor')
                setRole('repartidor')
            }
        } catch (err) {
            console.error('👤 Error fetching profile:', err)
            setRole('repartidor')
        } finally {
            fetchingProfile.current = null
        }
    }

    const refreshProfile = async () => {
        console.log('🔍 Manual session refresh...')
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            setUser(session.user)
            await fetchRole(session.user.id)
        } else {
            setUser(null)
            setRole(null)
        }
    }

    useEffect(() => {
        setMounted(true)

        // Verificamos si estamos en /login
        const isLogin = window.location.pathname === '/login'

        // 1. ESCUCHA DE EVENTOS (Single Source of Truth)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            console.log(`📦 Event: ${event}, Session: ${!!session}`)

            const currentUser = session?.user || null
            setUser(currentUser)

            if (currentUser) {
                // Si hay usuario pero no rol, ponemos fallback inmediato para no trabar el render
                setRole(prev => prev || 'repartidor')

                // Buscamos el rol real
                await fetchRole(currentUser.id)
            } else {
                setRole(null)
            }

            // En el evento inicial o tras un login, quitamos el loading
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                setLoading(false)
            }
        })

        // 2. TIMEOUT DE EMERGENCIA
        const emergencyTimeout = setTimeout(() => {
            if (loading) {
                console.warn('🚨 Auth emergency timeout triggered')
                setLoading(false)
            }
        }, 6000)

        // 3. REFRESH EN FOCO / NAVEGACION
        const handleFocus = () => {
            const now = Date.now()
            if (now - lastChecked.current > 60000) {
                lastChecked.current = now
                refreshProfile()
            }
        }
        window.addEventListener('focus', handleFocus)

        return () => {
            subscription.unsubscribe()
            window.removeEventListener('focus', handleFocus)
            clearTimeout(emergencyTimeout)
        }
    }, [supabase, loading]) // Re-run if loading stays true too long? No, [supabase] is fine.

    // Monitor de navegación (opcional si onAuthStateChange es confiable)
    useEffect(() => {
        if (pathname !== '/login' && mounted && !initStarted.current) {
            initStarted.current = true
            // Esto solo corre una vez al montar la app
        }
    }, [pathname, mounted])

    if (!mounted) return null

    return (
        <UserContext.Provider value={{ user, role, loading, refreshProfile }}>
            {children}
            {/* Debug Monitor */}
            <div className="fixed bottom-1 left-1 z-[9999] opacity-[0.2] hover:opacity-100 transition-opacity bg-black text-[8px] px-1 rounded-sm text-white font-mono pointer-events-none">
                {user ? 'U' : 'X'}{role === 'admin' ? 'A' : role === 'repartidor' ? 'R' : 'N'}{loading ? 'L' : 'F'}
            </div>
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
