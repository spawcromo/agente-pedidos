'use client'

import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function withRole(Component: React.ComponentType, allowedRoles: ('admin' | 'repartidor')[]) {
    return function ProtectedRoute(props: any) {
        const { role, loading } = useUser()
        const router = useRouter()

        useEffect(() => {
            if (!loading && (!role || !allowedRoles.includes(role))) {
                // Si no tiene permiso, lo mandamos a la única página que puede ver o al login
                if (role === 'repartidor') {
                    router.replace('/reparto')
                } else {
                    router.replace('/login')
                }
            }
        }, [role, loading, router])

        if (loading) {
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
