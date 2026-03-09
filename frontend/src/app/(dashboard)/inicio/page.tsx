'use client'

import { useEffect, useState } from 'react'
import {
    ClipboardList,
    CheckCircle2,
    Truck,
    Package,
    TrendingUp,
    ArrowRight,
    MapPin,
    Calendar,
    CircleDashed,
    Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDashboardStats, type DashboardStats } from '@/services/stats'
import { getMyRoutes, type DeliveryRoute } from '@/services/logistics'
import { toast } from 'sonner'
import Link from 'next/link'
import { withRole } from '@/components/hoc/withRole'
import { useUser } from '@/contexts/UserContext'
import { cn } from '@/lib/utils'

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
})

function DashboardPage() {
    const { role, user } = useUser()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [myRoutes, setMyRoutes] = useState<DeliveryRoute[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                if (role === 'admin') {
                    const data = await getDashboardStats()
                    setStats(data)
                } else if (role === 'repartidor' && user) {
                    const routes = await getMyRoutes(user.id)
                    setMyRoutes(routes)
                }
            } catch (err: any) {
                toast.error(err.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [role, user])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground animate-pulse font-medium text-lg flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    Cargando dashboard...
                </div>
            </div>
        )
    }

    // --- VIEW: REPARTIDOR ---
    if (role === 'repartidor') {
        const totalStops = myRoutes.reduce((acc, r) => acc + r.stops.length, 0)
        const completedStops = myRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'delivered').length, 0)
        const pendingRoutes = myRoutes.filter(r => r.status !== 'completed').length

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold tracking-tight">¡Hola! 🚛</h1>
                    <p className="text-muted-foreground text-lg">
                        Aquí tienes un resumen de tus rutas asignadas para hoy.
                    </p>
                </div>

                {/* Repartidor Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-amber-500/30 transition-colors">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Truck className="w-4 h-4 text-amber-500" /> Rutas Activas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{pendingRoutes}</div>
                            <p className="text-xs text-muted-foreground mt-1">Pendientes de completar</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-green-500/30 transition-colors">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Entregas Realizadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{completedStops} / {totalStops}</div>
                            <p className="text-xs text-muted-foreground mt-1">Paradas completadas hoy</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-blue-500/30 transition-colors">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-500" /> Próxima Parada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold truncate">
                                {myRoutes.find(r => r.stops.some(s => s.status === 'pending'))
                                    ?.stops.find(s => s.status === 'pending')
                                    ?.order.client?.name || '¡Todo entregado!'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Punto de entrega más cercano</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Routes List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-amber-500" /> Detalle de Rutas
                    </h2>

                    {myRoutes.length === 0 ? (
                        <Card className="p-12 text-center bg-card/20 border-dashed border-border/50">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-muted/20 rounded-full">
                                    <Truck className="w-12 h-12 text-muted-foreground/30" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold">No tienes rutas para hoy</h3>
                                    <p className="text-muted-foreground">Avisa al administrador si crees que es un error.</p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {myRoutes.map((route, idx) => {
                                const progress = (route.stops.filter(s => s.status === 'delivered').length / route.stops.length) * 100
                                return (
                                    <Link key={route.id} href="/reparto">
                                        <Card className="group hover:border-amber-500/50 transition-all cursor-pointer bg-card/40 overflow-hidden relative">
                                            <div className="p-5 flex flex-col gap-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Ruta #{idx + 1}</p>
                                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                                            {route.stops.length} Paradas
                                                            {progress === 100 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                        </h3>
                                                    </div>
                                                    <Badge variant="outline" className={cn(
                                                        progress === 100 ? "border-green-500/20 text-green-400 bg-green-500/5" : "border-amber-500/20 text-amber-400 bg-amber-500/5"
                                                    )}>
                                                        {progress === 100 ? 'Completado' : 'En progreso'}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Progreso de ruta</span>
                                                        <span className="font-bold">{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-500 transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center text-sm font-bold text-amber-500 group-hover:gap-2 transition-all">
                                                    Ver detalles de ruta <ArrowRight className="w-4 h-4 ml-1" />
                                                </div>
                                            </div>
                                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity" />
                                        </Card>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Actions for Repartidor */}
                <Card className="bg-muted/10 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <Link href="/reparto">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold gap-2">
                                <Truck className="w-4 h-4" /> Ir a mis Paradas
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                            <Clock className="w-4 h-4" /> Recargar Datos
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- VIEW: ADMIN ---
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
