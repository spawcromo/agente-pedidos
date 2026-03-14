"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"

import {
    ClipboardList,
    Package,
    Users,
    Shield,
    Truck,
    BarChart3,
    LogOut,
    Utensils,
    LayoutDashboard,
    Contact,
    Tags
} from "lucide-react"

const NAV_ITEMS = [
    { href: "/inicio", label: "Inicio", icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin', 'repartidor'] },
    { href: "/pedidos", label: "Pedidos", icon: <ClipboardList className="w-4 h-4" />, roles: ['admin'] },
    { href: "/produccion", label: "Producción", icon: <Package className="w-4 h-4" />, roles: ['admin'] },
    { href: "/clientes", label: "Clientes", icon: <Users className="w-4 h-4" />, roles: ['admin'] },
    { href: "/productos", label: "Productos", icon: <Utensils className="w-4 h-4" />, roles: ['admin'] },
    { href: "/precios", label: "Precios", icon: <Tags className="w-4 h-4" />, roles: ['admin'] },
    { href: "/repartidores", label: "Repartidores", icon: <Contact className="w-4 h-4" />, roles: ['admin'] },
    { href: "/rutas", label: "Rutas", icon: <Truck className="w-4 h-4" />, roles: ['admin', 'repartidor'] },
    { href: "/estadisticas", label: "Estadísticas", icon: <BarChart3 className="w-4 h-4" />, roles: ['admin'] },
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
                <div className="h-10 w-full bg-muted/10 animate-pulse rounded-lg" />
                <div className="flex-1 space-y-3 mt-8">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-10 w-full bg-muted/5 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center px-3 border-b border-[#2A2825]">
                <Link href="/inicio" className="relative h-12 w-full transition-opacity hover:opacity-80">
                    <Image
                        src="/logo-baccaro.svg"
                        alt="Avícola Baccaro"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 px-3 py-4">
                {filteredNavItems.map((item) => {
                    const isActive = item.href === "/inicio"
                        ? pathname === "/inicio"
                        : pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavItemClick}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                                isActive
                                    ? "text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-amber-glow"
                                    : "text-[#9CA3AF] hover:text-[#F9F7F4] hover:bg-[#252220] border border-transparent"
                            )}
                        >
                            <span className={cn(
                                "text-lg transition-transform duration-200",
                                isActive ? "scale-110" : "group-hover:scale-110 grayscale group-hover:grayscale-0"
                            )}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-[#2A2825] p-3 space-y-0.5">
                {user && (
                    <div className="px-3 py-2 mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1.5">
                            {role === 'admin' ? (
                                <><Shield className="w-3 h-3" /> Administrador</>
                            ) : (
                                <><Truck className="w-3 h-3" /> Repartidor</>
                            )}
                        </p>
                        <p className="text-xs text-foreground font-medium truncate">{user.email}</p>
                    </div>
                )}
                <button
                    id="btn-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#9CA3AF] hover:text-[#F9F7F4] hover:bg-[#252220] transition-all duration-200 border border-transparent"
                >
                    <LogOut className="w-4 h-4" />
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
