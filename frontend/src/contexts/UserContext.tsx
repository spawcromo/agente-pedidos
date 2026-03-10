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
        const start = Date.now()
        console.log(`🔍 [${start}] Refreshing session (isInitial: ${isInitial})...`)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.warn(`⚠️ [${start}] Auth getSession error:`, sessionError.message)
                setUser(null)
                setRole(null)
            } else {
                const currentUser = session?.user || null
                setUser(currentUser)

                if (currentUser) {
                    // Si ya tenemos sesión, liberamos el loading lo antes posible
                    // con un rol por defecto para que no se vea pantalla negra
                    if (!role) setRole('repartidor')
                    if (isInitial) setLoading(false)

                    // Luego buscamos el perfil real en segundo plano
                    await fetchProfile(currentUser.id)
                } else {
                    setRole(null)
                }
            }
        } catch (err: any) {
            console.error(`❌ [${start}] Fatal error in refreshProfile:`, err)
            setUser(null)
            setRole(null)
        } finally {
            console.log(`✅ [${start}] Session refresh finished in ${Date.now() - start}ms`)
            setLoading(false)
        }
    }

    // Re-verificar sesión en cada navegación (máximo cada 30 seg para no saturar)
    useEffect(() => {
        if (pathname === '/login' || !mounted) return
        const now = Date.now()
        // Evitamos doble llamado inicial
        if (now - lastChecked.current > 30000 && initStarted.current) {
            lastChecked.current = now
            refreshProfile()
        }
    }, [pathname, mounted])

    useEffect(() => {
        setMounted(true)

        // Inicialización única
        if (!initStarted.current) {
            initStarted.current = true
            lastChecked.current = Date.now()

            // Timeout de seguridad por si Supabase tarda demasiado (5 seg)
            const timeout = setTimeout(() => {
                console.warn('🚨 Auth initialization EMERGENCY TIMEOUT')
                setLoading(false)
                // Si llegamos aquí y hay usuario pero no rol, asignamos fallback
                if (user && !role) setRole('repartidor')
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
            console.log('📦 Supabase Auth Event:', event, !!session)

            try {
                if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION', 'USER_UPDATED'].includes(event)) {
                    if (session?.user) {
                        setUser(session.user)
                        // Aseguramos que el loading se vaya rápido
                        if (!role) setRole('repartidor')
                        setLoading(false)

                        // Buscamos perfil real
                        await fetchProfile(session.user.id)
                    } else if (event !== 'INITIAL_SESSION') {
                        setUser(null)
                        setRole(null)
                        setLoading(false)
                    }
                } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                    setUser(null)
                    setRole(null)
                    setLoading(false)
                }
            } catch (err) {
                console.error('Error in onAuthStateChange handler:', err)
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
            {/* Debug Sutil en la esquina inferior izquierda: [U/X][A/R/N][L/F] */}
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
