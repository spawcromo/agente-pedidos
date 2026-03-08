'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError) throw userError

            setUser(user)
            if (user) {
                await fetchProfile(user.id)
            } else {
                setRole(null)
            }
        } catch (err: any) {
            // Don't log "Auth session missing" as an error, it's normal if not logged in
            if (err?.name !== 'AuthSessionMissingError' && err?.message !== 'Auth session missing!') {
                console.error('Error in refreshProfile:', err)
            }
            setUser(null)
            setRole(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshProfile()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user)
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single()

                    if (!error && data) {
                        setRole(data.role as UserRole)
                    } else {
                        setRole('repartidor')
                    }
                } catch (err) {
                    setRole('repartidor')
                }
            } else {
                setUser(null)
                setRole(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

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
