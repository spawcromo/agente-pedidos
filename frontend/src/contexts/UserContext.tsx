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
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)
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

            if (!error && data) {
                const dbRole = data.role as UserRole
                console.log(`👤 Profile found: ${dbRole}`)
                setRole(dbRole)
                setCachedRole(dbRole)
                return dbRole
            } else {
                console.warn('👤 Profile query error, using fallback')
                setRole('repartidor')
                setCachedRole('repartidor')
                return 'repartidor'
            }
        } catch (err) {
            console.error('👤 Fatal fetchProfile error:', err)
            setRole('repartidor')
            setCachedRole('repartidor')
            return 'repartidor'
        }
    }

    const refreshProfile = async () => {
        console.log('🔍 Manual session refresh...')
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            setUser(session.user)
            await fetchAndSetRole(session.user.id)
        } else {
            setUser(null)
            setRole(null)
            setCachedRole(null)
        }
    }

    useEffect(() => {
        setMounted(true)

        // ═══════════════════════════════════════════
        // PASO 1: Hidratación instantánea desde cache
        // ═══════════════════════════════════════════
        const initSession = async () => {
            console.log('🚀 Init: Checking session...')
            try {
                const { data: { session } } = await supabase.auth.getSession()
                console.log('🚀 Init: Session found:', !!session)

                if (session?.user) {
                    setUser(session.user)

                    // 1. USAR ROL CACHEADO para desbloquear la UI inmediatamente
                    const cached = getCachedRole()
                    if (cached) {
                        console.log(`🚀 Init: Using CACHED role: ${cached}`)
                        setRole(cached)
                        setLoading(false) // ← UI se desbloquea AHORA
                    }

                    // 2. Verificar rol real en la DB (actualiza si cambió)
                    const realRole = await fetchAndSetRole(session.user.id)

                    // Si no había cache, ahora es la primera vez que liberamos
                    if (!cached) {
                        console.log('🚀 Init: First load, role from DB:', realRole)
                        setLoading(false)
                    } else if (cached !== realRole) {
                        console.log(`🚀 Init: Role CHANGED from cache (${cached}) to DB (${realRole})`)
                    }
                } else {
                    console.log('🚀 Init: No session, clearing state')
                    setUser(null)
                    setRole(null)
                    setCachedRole(null)
                    setLoading(false)
                }
            } catch (err) {
                console.error('🚀 Init: Error:', err)
                setLoading(false)
            }
            initDone.current = true
        }

        initSession()

        // ═══════════════════════════════════════════
        // PASO 2: Escuchar cambios posteriores
        // ═══════════════════════════════════════════
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            console.log(`📦 Auth Event: ${event}, Session: ${!!session}`)

            // Ignoramos INITIAL_SESSION porque ya lo manejamos arriba
            if (event === 'INITIAL_SESSION') return

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (session?.user) {
                    setUser(session.user)
                    // Solo buscamos el perfil si la inicialización ya terminó
                    // para no duplicar llamadas
                    if (initDone.current) {
                        await fetchAndSetRole(session.user.id)
                    }
                    setLoading(false)
                }
            } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                setUser(null)
                setRole(null)
                setCachedRole(null)
                setLoading(false)
            }
        })

        // ═══════════════════════════════════════════
        // PASO 3: Timeout de emergencia (último recurso)
        // ═══════════════════════════════════════════
        const emergencyTimeout = setTimeout(() => {
            if (loading) {
                console.warn('🚨 Emergency timeout: forcing loading=false')
                setLoading(false)
            }
        }, 8000)

        // ═══════════════════════════════════════════
        // PASO 4: Re-check en foco de ventana
        // ═══════════════════════════════════════════
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
        <UserContext.Provider value={{ user, role, loading, refreshProfile }}>
            {children}
            {/* Debug: [U/X][A/R/N][L/F] */}
            <div className="fixed bottom-1 left-1 z-[9999] opacity-[0.15] hover:opacity-100 transition-opacity bg-black text-[8px] px-1 rounded-sm text-white font-mono pointer-events-none">
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
