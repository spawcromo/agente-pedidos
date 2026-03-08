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
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
            await fetchProfile(user.id)
        } else {
            setRole(null)
        }
        setLoading(false)
    }

    useEffect(() => {
        refreshProfile()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user)
                await fetchProfile(session.user.id)
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
