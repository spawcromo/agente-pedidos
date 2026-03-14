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
    Clock,
    AlertTriangle,
    Eye,
    Check,
    Lock,
    PenTool,
    ListTodo,
    Users,
    XCircle,
    Ban
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getEnhancedDashboardStats, type EnhancedDashboardStats, type ProductionEstimate, type PlanificacionStats } from '@/services/dashboard'
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
    const { role, user, fullName, avatarUrl } = useUser()
    const [stats, setStats] = useState<EnhancedDashboardStats | null>(null)
    const [production, setProduction] = useState<ProductionEstimate>({})
    const [planificacion, setPlanificacion] = useState<PlanificacionStats>({ rutas_armadas: 0, pedidos_sin_ruta: 0, repartidores_asignados: 0, repartidores_libres: 0 })
    const [myRoutes, setMyRoutes] = useState<DeliveryRoute[]>([])
    const [loading, setLoading] = useState(true)
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        let isMounted = true
        async function load() {
            if (!role) return
            console.log(`📊 Dashboard: Fetching stats for ${role}...`)
            setLoading(true)
            try {
                if (role === 'admin') {
                    const { stats: s, production: p, planificacion: pl } = await getEnhancedDashboardStats()
                    if (isMounted) {
                        setStats(s)
                        setProduction(p)
                        setPlanificacion(pl)
                    }
                } else if (role === 'repartidor' && user) {
                    const routes = await getMyRoutes(user.id)
                    if (isMounted) setMyRoutes(routes)
                }
            } catch (err: any) {
                console.error('📊 Dashboard error:', err)
                toast.error(err.message)
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [role, user])

    if (loading && !stats && myRoutes.length === 0) {
        return (
            <div className="space-y-8 animate-pulse p-4">
                <div className="h-10 w-48 bg-muted rounded-md mb-2" />
                <div className="h-6 w-64 bg-muted rounded-md" />
                <div className="grid gap-6 md:grid-cols-3 mt-8">
                    <div className="h-32 bg-muted rounded-xl" />
                    <div className="h-32 bg-muted rounded-xl" />
                    <div className="h-32 bg-muted rounded-xl" />
                </div>
            </div>
        )
    }

    // --- VIEW: REPARTIDOR ---
    if (role === 'repartidor') {
        const totalStops = myRoutes.reduce((acc, r) => acc + r.stops.length, 0)
        const completedStops = myRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'delivered').length, 0)
        const pendingRoutes = myRoutes.filter(r => {
            if (r.status === 'completed') return false
            const allDone = r.stops.length > 0 && r.stops.every(s => s.status === 'delivered' || s.order.status === 'cancelled')
            return !allDone
        }).length

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {avatarUrl && !imgError ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={avatarUrl}
                                alt={fullName || "User Avatar"}
                                className="w-full h-full object-cover bg-muted"
                                onError={() => setImgError(true)}
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center text-amber-500 font-black text-2xl uppercase shadow-lg shadow-amber-500/10">
                            {fullName ? fullName.substring(0, 2) : 'A'}
                        </div>
                    )}

                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">¡Hola{fullName ? `, ${fullName.split(' ')[0]}` : ''}! 🚛</h1>
                        <p className="text-muted-foreground text-lg mt-1">
                            Aquí tienes un resumen de tus rutas asignadas para hoy.
                        </p>
                    </div>
                </div>

                {/* Repartidor Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-card/40 backdrop-blur-md border-border/50 border-t-4 border-t-amber-500 hover:border-amber-500/50 transition-all duration-300">
                        <CardHeader className="pt-5 pb-1 px-6">
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                                <Truck className="w-4 h-4 text-amber-500" /> Rutas Activas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-4xl font-black">{pendingRoutes}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Pendientes de completar</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md border-border/50 border-t-4 border-t-green-500 hover:border-green-500/50 transition-all duration-300">
                        <CardHeader className="pt-5 pb-1 px-6">
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Entregas Realizadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-4xl font-black">{myRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'delivered' || s.order.status === 'cancelled').length, 0)} / {totalStops}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Paradas terminadas hoy</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md border-border/50 border-t-4 border-t-blue-500 hover:border-blue-500/50 transition-all duration-300">
                        <CardHeader className="pt-5 pb-1 px-6">
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-500" /> Próxima Parada
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-xl font-black truncate text-blue-400">
                                {myRoutes.find(r => r.stops.some(s => s.status === 'pending'))
                                    ?.stops.find(s => s.status === 'pending')
                                    ?.order.client?.name || '¡Todo entregado!'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Punto de entrega más cercano</p>
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
                                    <Link key={route.id} href="/rutas">
                                        <Card className="group hover:border-amber-500/50 transition-all cursor-pointer bg-card/40 overflow-hidden relative">
                                            <div className="p-6 flex flex-col gap-5">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Ruta #{idx + 1}</p>
                                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                                            {route.stops.length} Paradas
                                                            {(route.status === 'completed' || route.stops.every(s => s.status === 'delivered' || s.order.status === 'cancelled')) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                        </h3>
                                                    </div>
                                                    <Badge variant="outline" className={cn(
                                                        (route.status === 'completed' || route.stops.every(s => s.status === 'delivered' || s.order.status === 'cancelled')) ? "border-green-500/20 text-green-400 bg-green-500/5" : "border-amber-500/20 text-amber-400 bg-amber-500/5"
                                                    )}>
                                                        {(route.status === 'completed' || route.stops.every(s => s.status === 'delivered' || s.order.status === 'cancelled')) ? 'Completado' : 'En progreso'}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Progreso de ruta</span>
                                                        <span className="font-bold">
                                                            {Math.round((route.stops.filter(s => s.status === 'delivered' || s.order.status === 'cancelled').length / route.stops.length) * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-500 transition-all duration-500"
                                                            style={{ width: `${(route.stops.filter(s => s.status === 'delivered' || s.order.status === 'cancelled').length / route.stops.length) * 100}%` }}
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
                    <CardHeader className="pt-6 px-6 pb-2">
                        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4 px-6 pb-6 text-sm">
                        <Link href="/rutas">
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


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                {avatarUrl && !imgError ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={avatarUrl}
                            alt={fullName || "User Avatar"}
                            className="w-full h-full object-cover bg-muted"
                            onError={() => setImgError(true)}
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center text-amber-500 font-black text-2xl uppercase shadow-lg shadow-amber-500/10">
                        {fullName ? fullName.substring(0, 2) : 'A'}
                    </div>
                )}

                <div>
                    <h1 className="text-4xl font-bold tracking-tight">¡Hola{fullName ? `, ${fullName.split(' ')[0]}` : ''}! 👋</h1>
                    <p className="text-muted-foreground text-lg mt-1">
                        Hoy ejecutás los repartos ya planificados y preparás los pedidos de mañana.
                    </p>
                </div>
            </div>

            {/* OPERACIÓN DE HOY */}
            <div className="bg-card/30 border border-border/30 rounded-xl p-6">
                <h2 className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-4">Operación de Hoy</h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                    <Card className="bg-[#1A261A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-emerald-50">Rutas de hoy</CardTitle>
                            <div className="bg-emerald-900/50 text-emerald-500 p-1.5 rounded-md"><MapPin className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-emerald-50">{stats.rutas_hoy_total}</div>
                                <span className="text-sm font-medium text-emerald-500/60">armadas</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#2D2110] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-amber-50">En progreso</CardTitle>
                            <div className="bg-amber-900/50 text-amber-500 p-1.5 rounded-md"><Truck className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-amber-50">{stats.rutas_hoy_progreso}</div>
                                <span className="text-sm font-medium text-amber-500/60">activas</span>
                            </div>
                        </CardContent>
                    </Card>


                    <Card className="bg-[#151D2A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-blue-50">Completadas</CardTitle>
                            <div className="bg-blue-900/50 text-blue-500 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-blue-50">{stats.rutas_hoy_completadas}</div>
                                <span className="text-sm font-medium text-blue-500/60">finalizadas</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#2D2110] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-amber-50">Pedidos pendientes</CardTitle>
                            <div className="bg-amber-900/50 text-amber-500 p-1.5 rounded-md"><Package className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-amber-50">{stats.entregas_pendientes_hoy}</div>
                                <span className="text-sm font-medium text-amber-500/60">pendientes</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1A1A1A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-zinc-50">Pedidos cancelados</CardTitle>
                            <div className="bg-zinc-800/80 text-zinc-400 p-1.5 rounded-md"><Ban className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-zinc-50">{stats.pedidos_hoy_cancelados}</div>
                                <span className="text-sm font-medium text-zinc-500/60">anulados</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ALERTAS DE REPARTO */}
            <div className="space-y-3">
                {stats.pedidos_hoy_cancelados > 0 && (
                    <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-sm font-medium text-red-200">
                            Hay <strong className="text-red-50 font-bold">{stats.pedidos_hoy_cancelados}</strong> pedidos cancelados hoy por el repartidor.
                        </span>
                    </div>
                )}
                {stats.entregas_pendientes_hoy > 0 && stats.rutas_hoy_progreso > 0 && (
                    <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <span className="text-sm font-medium text-amber-200">
                            <strong className="text-amber-50 font-bold">{stats.entregas_pendientes_hoy}</strong> pedidos pendientes de entrega en ruta iniciada
                        </span>
                    </div>
                )}
            </div>

            {/* RUTAS Y REPARTIDORES DETAILS */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-[#14100C] border-[#2A1F16] flex flex-col rounded-xl">
                    <CardHeader className="pt-4 px-5 pb-2">
                        <CardTitle className="text-sm font-bold text-amber-50">Rutas de hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-0 text-sm px-5 pb-4 pt-0">
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">Total armadas:</span>
                            </div>
                            <span className="font-bold text-white">{stats.rutas_hoy_total}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">En progreso:</span>
                            </div>
                            <span className="font-bold text-white">{stats.rutas_hoy_progreso}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">Completadas:</span>
                            </div>
                            <span className="font-bold text-white">{stats.rutas_hoy_completadas}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">Pendientes de iniciar:</span>
                            </div>
                            <span className="font-bold text-white">{stats.rutas_hoy_pendientes_iniciar}</span>
                        </div>
                        <div className="pt-4">
                            <Link href="/rutas">
                                <Button className="w-full bg-[#1A140F] hover:bg-[#2A1F16] border border-[#2A1F16] text-amber-500/90 font-medium h-9 text-xs transition-colors">Ver rutas</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#14100C] border-[#2A1F16] flex flex-col rounded-xl">
                    <CardHeader className="pt-4 px-5 pb-2">
                        <CardTitle className="text-sm font-bold text-emerald-50">Repartidores hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-0 text-sm px-5 pb-4 pt-0">
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-500/60" />
                                <span className="text-muted-foreground">Totales:</span>
                            </div>
                            <span className="font-bold text-white">{stats.repartidores_totales}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-emerald-500/60" />
                                <span className="text-muted-foreground">En ruta:</span>
                            </div>
                            <span className="font-bold text-white">{stats.repartidores_en_ruta}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
                                <span className="text-muted-foreground">Disponibles:</span>
                            </div>
                            <span className="font-bold text-white">{stats.repartidores_disponibles}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-500/60" />
                                <span className="text-muted-foreground">Pendientes de salir:</span>
                            </div>
                            <span className="font-bold text-white">{stats.repartidores_pendientes_salir}</span>
                        </div>
                        <div className="pt-4">
                            <Link href="/rutas">
                                <Button className="w-full bg-[#141A14] hover:bg-[#1A261A] border border-[#1A261A] text-emerald-500/90 font-medium h-9 text-xs transition-colors">Ver repartidores</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* PEDIDOS MAÑANA */}
            <div className="bg-card/30 border border-border/30 rounded-xl p-6 mt-8">
                <h2 className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-4">
                    PEDIDOS PARA MAÑANA
                </h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                    <Card className="bg-[#151D2A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-blue-50">Totales</CardTitle>
                            <div className="bg-blue-900/50 text-blue-500 p-1.5 rounded-md"><Calendar className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-blue-50">{stats.pedidos_manana_total}</div>
                                <span className="text-sm font-medium text-blue-500/60">generados</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1A261A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-emerald-50">Confirmados</CardTitle>
                            <div className="bg-emerald-900/50 text-emerald-500 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-emerald-50">{stats.pedidos_manana_confirmados}</div>
                                <span className="text-sm font-medium text-emerald-500/60">aprobados</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#2D2110] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-amber-50">Pendientes</CardTitle>
                            <div className="bg-amber-900/50 text-amber-500 p-1.5 rounded-md"><Clock className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-amber-50">{stats.pedidos_manana_pendientes}</div>
                                <span className="text-sm font-medium text-amber-500/60">en espera</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#261A30] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-purple-50">Asignados</CardTitle>
                            <div className="bg-purple-900/50 text-purple-500 p-1.5 rounded-md"><Truck className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-purple-50">{stats.pedidos_manana_asignados}</div>
                                <span className="text-sm font-medium text-purple-500/60">en ruta</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#311717] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-red-50">Rechazados</CardTitle>
                            <div className="bg-red-900/50 text-red-500 p-1.5 rounded-md"><XCircle className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-red-50">{stats.pedidos_manana_rechazados}</div>
                                <span className="text-sm font-medium text-red-500/60">denegados</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1A1A1A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pt-4 pb-2 px-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-zinc-50">Cancelados</CardTitle>
                            <div className="bg-zinc-800/80 text-zinc-400 p-1.5 rounded-md"><Ban className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="pb-4 px-6 z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-zinc-50">{stats.pedidos_manana_cancelados}</div>
                                <span className="text-sm font-medium text-zinc-500/60">anulados</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {(stats.pedidos_manana_pendientes > 0 || planificacion.pedidos_sin_ruta > 0) && (
                    <div className="mt-6 bg-red-950/20 border border-red-900/50 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-sm font-medium text-red-200">
                            Tenés pedidos sin confirmar o sin asignar a ruta.
                        </span>
                    </div>
                )}
            </div>

            {/* PLANIFICACION Y PRODUCCION MAÑANA */}
            <div className="grid gap-4 md:grid-cols-2 mt-8">
                <Card className="bg-[#14100C] border-[#2A1F16] flex flex-col rounded-xl">
                    <CardHeader className="pt-4 px-5 pb-2">
                        <CardTitle className="text-sm font-bold text-amber-50">Planificación de mañana</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-0 text-sm px-5 pb-4 pt-0">
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">Rutas armadas:</span>
                            </div>
                            <span className="font-bold text-white">{planificacion.rutas_armadas}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">Pedidos sin ruta:</span>
                            </div>
                            <span className="font-bold text-white">{planificacion.pedidos_sin_ruta}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">Repartidores asignados:</span>
                            </div>
                            <span className="font-bold text-white">{planificacion.repartidores_asignados}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-amber-500/60" />
                                <span className="text-muted-foreground">Repartidores libres:</span>
                            </div>
                            <span className="font-bold text-white">{planificacion.repartidores_libres}</span>
                        </div>
                        <div className="pt-4 mt-auto">
                            <Link href="/rutas">
                                <Button className="w-full bg-[#1A140F] hover:bg-[#2A1F16] border border-[#2A1F16] text-amber-500/90 font-medium h-9 text-xs transition-colors">Planificar</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#14100C] border-[#2A1F16] flex flex-col rounded-xl">
                    <CardHeader className="pt-4 px-5 pb-2">
                        <CardTitle className="text-sm font-bold text-emerald-50">Producción estimada</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-0 text-sm px-5 pb-4 pt-0">
                        {Object.entries(production).map(([name, prod], idx) => (
                            <div key={idx} className="flex justify-between items-center py-2.5 border-b border-[#2A1F16]">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-500/60" />
                                    <span className="text-muted-foreground">{name}:</span>
                                </div>
                                <span className="font-bold text-white">{prod.quantity} {prod.unit}</span>
                            </div>
                        ))}
                        {Object.entries(production).length === 0 && (
                            <div className="py-8 text-center text-muted-foreground text-xs">
                                No hay producción confirmada o pendiente.
                            </div>
                        )}
                        <div className="pt-4 mt-auto">
                            <Link href="/produccion">
                                <Button className="w-full bg-[#141A14] hover:bg-[#1A261A] border border-[#1A261A] text-emerald-500/90 font-medium h-9 text-xs transition-colors">Ver producción</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default withRole(DashboardPage, ['admin', 'repartidor'])
