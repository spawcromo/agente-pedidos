'use client'

import { useEffect, useState } from 'react'
import {
    ClipboardList,
    CheckCircle2,
    Users,
    Store,
    Truck,
    Package,
    TrendingUp,
    ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDashboardStats, type DashboardStats } from '@/services/stats'
import { toast } from 'sonner'
import Link from 'next/link'
import { withRole } from '@/components/hoc/withRole'

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
})

function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch((err) => toast.error(err.message))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground animate-pulse font-medium">Cargando dashboard...</div>
            </div>
        )
    }

    if (!stats) return null

    const cards = [
        {
            title: 'Pedidos Pendientes',
            value: stats.pending_orders,
            description: 'Esperando validación',
            icon: ClipboardList,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            href: '/pedidos?status=pending'
        },
        {
            title: 'Pedidos Confirmados',
            value: stats.confirmed_orders,
            description: 'Listos para producción',
            icon: CheckCircle2,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            href: '/pedidos?status=confirmed'
        },
        {
            title: 'Clientes Minoristas',
            value: stats.retail_clients,
            description: 'Consumidores finales',
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            href: '/clientes'
        },
        {
            title: 'Clientes Mayoristas',
            value: stats.wholesale_clients,
            description: 'Distribuidoras y locales',
            icon: Store,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            href: '/clientes'
        },
        {
            title: 'Productos Activos',
            value: stats.active_products,
            description: 'En catálogo actual',
            icon: Package,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            href: '/productos'
        },
        {
            title: 'Repartidores',
            value: stats.active_drivers,
            description: 'Equipo de logística',
            icon: Truck,
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10',
            href: '/reparto'
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">¡Hola! 👋</h1>
                <p className="text-muted-foreground text-lg mt-2">
                    Aquí tienes un resumen general de Avícola Baccaro para hoy.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, i) => (
                    <Link key={i} href={card.href}>
                        <Card className="relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm border-border/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </CardTitle>
                                <div className={`${card.bg} ${card.color} p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight">
                                    {card.value}
                                </div>
                                <CardDescription className="mt-1 flex items-center gap-1.5">
                                    {card.description}
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                                </CardDescription>
                            </CardContent>

                            {/* Subtle background decoration */}
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${card.bg} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                        </Card>
                    </Link>
                ))}
            </div>

            <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Ventas Confirmadas Hoy</CardTitle>
                        <CardDescription>Total acumulado de pedidos para entregar hoy</CardDescription>
                    </div>
                    <div className="ml-auto text-4xl font-black tracking-tighter text-amber-500">
                        {ARS.format(stats.revenue_today)}
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                        <CardDescription>Gestiones comunes del día a día</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/pedidos">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
                                <ClipboardList className="w-4 h-4" /> Gestionar Pedidos Nuevos
                            </Button>
                        </Link>
                        <Link href="/produccion">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">
                                <Package className="w-4 h-4" /> Ver Necesidades de Producción
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/30 flex flex-col justify-center items-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">¿Nuevo Pedido?</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px]">
                            Puedes cargar un pedido manual rápidamente desde el dashboard de pedidos.
                        </p>
                    </div>
                    <Link href="/pedidos">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                            Ir a Pedidos <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </Card>
            </div>
        </div>
    )
}

export default withRole(DashboardPage, ['admin', 'repartidor'])
