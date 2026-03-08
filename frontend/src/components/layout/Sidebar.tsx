"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const NAV_ITEMS = [
    { href: "/pedidos", label: "Pedidos", icon: "📋" },
    { href: "/produccion", label: "Producción", icon: "📦" },
    { href: "/clientes", label: "Clientes", icon: "👥" },
    { href: "/productos", label: "Productos", icon: "🍗" },
    { href: "/reparto", label: "Reparto", icon: "🚚" },
    { href: "/estadisticas", label: "Estadísticas", icon: "📊" },
] as const

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    async function handleLogout() {
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        if (error) {
            toast.error("Error al cerrar sesión")
            return
        }
        router.push("/login")
        router.refresh()
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                <span className="text-2xl">🐔</span>
                <div>
                    <h1 className="text-sm font-bold leading-none">Avícola Baccaro</h1>
                    <p className="text-xs text-muted-foreground">Gestión de Pedidos</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="border-t border-border p-4 space-y-2">
                <button
                    id="btn-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    <span>🚪</span>
                    Cerrar sesión
                </button>
                <p className="text-xs text-muted-foreground px-3">v1.0 — Antigravity</p>
            </div>
        </aside>
    )
}
