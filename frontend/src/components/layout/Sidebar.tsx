"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"

const NAV_ITEMS = [
    { href: "/pedidos", label: "Pedidos", icon: "📋", roles: ['admin'] },
    { href: "/produccion", label: "Producción", icon: "📦", roles: ['admin'] },
    { href: "/clientes", label: "Clientes", icon: "👥", roles: ['admin'] },
    { href: "/productos", label: "Productos", icon: "🍗", roles: ['admin'] },
    { href: "/reparto", label: "Reparto", icon: "🚚", roles: ['admin', 'repartidor'] },
    { href: "/estadisticas", label: "Estadísticas", icon: "📊", roles: ['admin'] },
] as const

export function SidebarContent({ onNavItemClick }: { onNavItemClick?: () => void }) {
    const pathname = usePathname()
    const router = useRouter()
    const { role, user, loading } = useUser()

    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    async function handleLogout() {
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        if (error) { toast.error("Error al cerrar sesión"); return }
        router.push("/login")
        router.refresh()
    }

    const filteredNavItems = NAV_ITEMS.filter(item =>
        !role || (item.roles as readonly string[]).includes(role)
    )

    if (!mounted || loading) {
        return (
            <div className="flex h-full flex-col p-5 space-y-4 pt-10">
                <div className="h-10 w-full bg-muted/10 animate-pulse rounded-full" />
                <div className="flex-1 space-y-3 mt-8">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-11 w-full bg-muted/5 animate-pulse rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-24 items-center px-8 border-b border-[#2A2825]">
                <div className="relative w-full h-10">
                    <Image
                        src="/logo-baccaro.png"
                        alt="Avícola Baccaro"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 px-3 py-4">
                {filteredNavItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavItemClick}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                                isActive
                                    ? "text-amber-400 bg-amber-500/10 shadow-[inset_2px_0_0_#FBBF24]"
                                    : "text-[#9CA3AF] hover:text-[#F9F7F4] hover:bg-[#252220]"
                            )}
                        >
                            <span className={cn(
                                "text-base transition-transform duration-150",
                                isActive ? "scale-110" : "group-hover:scale-105"
                            )}>
                                {item.icon}
                            </span>
                            {item.label}
                            {isActive && (
                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-[#2A2825] p-3 space-y-0.5">
                {user && (
                    <div className="px-3 py-2 mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {role === 'admin' ? '🛡️ Administrador' : '🚚 Repartidor'}
                        </p>
                        <p className="text-xs text-foreground font-medium truncate">{user.email}</p>
                    </div>
                )}
                <button
                    id="btn-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#9CA3AF] hover:text-[#F9F7F4] hover:bg-[#252220] transition-all duration-150"
                >
                    <span className="text-base">🚪</span>
                    Cerrar sesión
                </button>
                <p className="text-[10px] text-[#4B5563] px-3 pt-1">
                    Avícola Baccaro © {mounted ? new Date().getFullYear() : '2026'}
                </p>
            </div>
        </div>
    )
}

export function Sidebar() {
    return (
        <aside
            className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col lg:flex"
            style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
        >
            <SidebarContent />
        </aside>
    )
}
