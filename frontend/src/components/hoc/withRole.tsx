'use client'

import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export function withRole(Component: React.ComponentType, allowedRoles: ('admin' | 'repartidor')[]) {
    return function ProtectedRoute(props: any) {
        const { role, loading } = useUser()
        const [mounted, setMounted] = useState(false)
        const router = useRouter()

        useEffect(() => {
            setMounted(true)
        }, [])

        useEffect(() => {
            if (mounted && !loading && (!role || !allowedRoles.includes(role))) {
                if (role === 'repartidor') {
                    router.replace('/reparto')
                } else {
                    router.replace('/login')
                }
            }
        }, [role, loading, router, mounted])

        if (!mounted || loading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin text-amber-500 text-4xl">🍗</div>
                </div>
            )
        }

        if (!role || !allowedRoles.includes(role)) {
            return null
        }

        return <Component {...props} />
    }
}
