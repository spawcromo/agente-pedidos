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

// --- Helpers para cachear el rol en localStorage ---
const ROLE_CACHE_KEY = 'baccaro_cached_role'

function getCachedRole(): UserRole {
    try {
        const cached = localStorage.getItem(ROLE_CACHE_KEY)
        if (cached === 'admin' || cached === 'repartidor') return cached
        return null
    } catch {
        return null
    }
}

function setCachedRole(role: UserRole) {
    try {
        if (role) localStorage.setItem(ROLE_CACHE_KEY, role)
        else localStorage.removeItem(ROLE_CACHE_KEY)
    } catch { /* localStorage no disponible */ }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<{
        user: User | null
        role: UserRole
        loading: boolean
    }>({
        user: null,
        role: getCachedRole(), // Empezamos con el cache si existe
        loading: true
    })
    const [mounted, setMounted] = useState(false)
    const supabase = createClient()
    const pathname = usePathname()
    const lastChecked = useRef<number>(0)
    const initDone = useRef<boolean>(false)

    // Busca el rol en la DB y lo cachea
    const fetchAndSetRole = async (userId: string): Promise<UserRole> => {
        console.log(`👤 Fetching profile for ${userId}...`)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            const dbRole = (!error && data) ? (data.role as UserRole) : 'repartidor'
            console.log(`👤 Profile result: ${dbRole}`)

            setCachedRole(dbRole)
            setState(s => ({ ...s, role: dbRole, loading: false }))
            return dbRole
        } catch (err) {
            console.error('👤 Fatal fetchProfile error:', err)
            setState(s => ({ ...s, role: 'repartidor', loading: false }))
            return 'repartidor'
        }
    }

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            await fetchAndSetRole(session.user.id)
        } else {
            setCachedRole(null)
            setState({ user: null, role: null, loading: false })
        }
    }

    useEffect(() => {
        setMounted(true)

        const initSession = async () => {
            console.log('🚀 Init: Checking session...')
            try {
                const { data: { session } } = await supabase.auth.getSession()
                console.log('🚀 Init: Session found:', !!session)

                if (session?.user) {
                    const cached = getCachedRole()
                    setState(s => ({
                        user: session.user,
                        role: cached || s.role,
                        loading: false // Si hay user, ya podemos intentar mostrar algo
                    }))
                    await fetchAndSetRole(session.user.id)
                } else {
                    console.log('🚀 Init: No session found')
                    setState({ user: null, role: null, loading: false })
                    setCachedRole(null)
                }
            } catch (err) {
                console.error('🚀 Init: Error:', err)
                setState(s => ({ ...s, loading: false }))
            }
            initDone.current = true
        }

        initSession()

        // ═══════════════════════════════════════════
        // PASO 2: Escuchar cambios posteriores
        // ═══════════════════════════════════════════
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            console.log(`📦 Auth Event: ${event}, Session: ${!!session}`)

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    setState(s => ({ ...s, user: session.user }))
                    if (initDone.current) {
                        await fetchAndSetRole(session.user.id)
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setState({ user: null, role: null, loading: false })
                setCachedRole(null)
            }
        })

        // ═══════════════════════════════════════════
        // PASO 3: Timeout de emergencia 
        // ═══════════════════════════════════════════
        const emergencyTimeout = setTimeout(() => {
            setState(s => {
                if (s.loading) {
                    console.warn('🚨 Emergency timeout fired')
                    return { ...s, loading: false }
                }
                return s
            })
        }, 6000)

        // ═══════════════════════════════════════════
        // PASO 4: Re-check suave en foco de ventana
        // ═══════════════════════════════════════════
        const handleFocus = async () => {
            const now = Date.now()
            if (now - lastChecked.current > 600000) { // 10 min
                lastChecked.current = now
                console.log('🔍 Window focus: background check')
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setState(s => ({ ...s, user: session.user }))
                } else {
                    setState({ user: null, role: null, loading: false })
                }
            }
        }
        window.addEventListener('focus', handleFocus)

        return () => {
            subscription.unsubscribe()
            window.removeEventListener('focus', handleFocus)
            clearTimeout(emergencyTimeout)
        }
    }, [])

    // Re-verificar sesión en cada navegación
    useEffect(() => {
        if (pathname === '/login' || !mounted || !initDone.current) return
        const now = Date.now()
        if (now - lastChecked.current > 30000) {
            lastChecked.current = now
            refreshProfile()
        }
    }, [pathname, mounted])

    if (!mounted) return null

    return (
        <UserContext.Provider value={{ ...state, refreshProfile }}>
            {children}
            {/* Debug: [U/X][A/R/N][L/F] */}
            <div className="fixed bottom-1 left-1 z-[9999] opacity-[0.15] hover:opacity-100 transition-opacity bg-black text-[8px] px-1 rounded-sm text-white font-mono pointer-events-none">
                {state.user ? 'U' : 'X'}{state.role === 'admin' ? 'A' : state.role === 'repartidor' ? 'R' : 'N'}{state.loading ? 'L' : 'F'}
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
