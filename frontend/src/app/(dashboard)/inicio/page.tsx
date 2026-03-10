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
    PenTool
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getEnhancedDashboardStats, type EnhancedDashboardStats, type ProductionEstimate } from '@/services/dashboard'
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
                    const { stats: s, production: p } = await getEnhancedDashboardStats()
                    if (isMounted) {
                        setStats(s)
                        setProduction(p)
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
            const allDelivered = r.stops.length > 0 && r.stops.every(s => s.status === 'delivered')
            return !allDelivered
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
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                                <Truck className="w-4 h-4 text-amber-500" /> Rutas Activas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">{pendingRoutes}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Pendientes de completar</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md border-border/50 border-t-4 border-t-green-500 hover:border-green-500/50 transition-all duration-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Entregas Realizadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black">{completedStops} / {totalStops}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Paradas completadas hoy</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-md border-border/50 border-t-4 border-t-blue-500 hover:border-blue-500/50 transition-all duration-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-500" /> Próxima Parada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
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
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-[#2D2110] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pb-2 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-amber-50">Rutas de hoy</CardTitle>
                            <div className="bg-amber-900/50 text-amber-500 p-1.5 rounded-md"><MapPin className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-amber-50">{stats.rutas_hoy_total}</div>
                                <span className="text-sm font-medium text-amber-500/60">armadas</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1A261A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pb-2 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-emerald-50">En progreso</CardTitle>
                            <div className="bg-emerald-900/50 text-emerald-500 p-1.5 rounded-md"><Truck className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-emerald-50">{stats.rutas_hoy_progreso}</div>
                                <span className="text-sm font-medium text-emerald-500/60">activas</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#151D2A] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pb-2 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-blue-50">Completadas</CardTitle>
                            <div className="bg-blue-900/50 text-blue-500 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-blue-50">{stats.rutas_hoy_completadas}</div>
                                <span className="text-sm font-medium text-blue-500/60">finalizadas</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#311717] border-0 shadow-none rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
                        <CardHeader className="pb-2 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-sm font-medium text-red-50">Entregas pendientes</CardTitle>
                            <div className="bg-red-900/50 text-red-500 p-1.5 rounded-md"><Package className="w-4 h-4" /></div>
                        </CardHeader>
                        <CardContent className="z-10 relative">
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-red-50">{stats.entregas_pendientes_hoy}</div>
                                <span className="text-sm font-medium text-red-500/60">pendientes</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ALERTAS DE REPARTO */}
            <div className="bg-[#14100C] border border-[#2A1F16] rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 flex items-center justify-between border-b border-[#2A1F16]">
                    <h2 className="text-xs uppercase tracking-widest font-black text-amber-500/90">Alertas de Reparto</h2>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground/30">ID.E 30 P08-20 BIRESOF0S</span>
                </div>
                <div className="divide-y divide-[#2A1F16]">
                    <div className="p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground"><strong className="text-amber-50 font-medium tracking-wide">1</strong> ruta lleva más de 30 min sin movimiento <span className="text-[10px] opacity-30">(Simulado)</span></span>
                    </div>
                    {stats.entregas_pendientes_hoy > 0 && stats.rutas_hoy_progreso > 0 && (
                        <div className="p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-muted-foreground"><strong className="text-amber-50 font-medium tracking-wide">{stats.entregas_pendientes_hoy}</strong> entregas siguen pendientes en rutas ya iniciadas</span>
                        </div>
                    )}
                    <div className="p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground"><strong className="text-amber-50 font-medium tracking-wide">1</strong> cliente reportó una demora en la entrega <span className="text-[10px] opacity-30">(Simulado)</span></span>
                    </div>
                </div>
            </div>

            {/* RUTAS Y REPARTIDORES DETAILS */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-card/30 border-border/30 flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold">Rutas de hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 text-sm text-muted-foreground">
                        <div className="flex justify-between items-center">
                            <span>Total armadas: {stats.rutas_hoy_total}</span>
                            <span className="font-mono text-foreground">{stats.rutas_hoy_total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>En progreso: {stats.rutas_hoy_progreso}</span>
                            <Truck className="w-4 h-4 text-emerald-500/70" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Completadas: {stats.rutas_hoy_completadas}</span>
                            <Lock className="w-4 h-4 text-amber-500/70" />
                        </div>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                        <Link href="/reparto">
                            <Button variant="outline" className="w-full bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400">Ver rutas</Button>
                        </Link>
                    </div>
                </Card>

                <Card className="bg-card/30 border-border/30 flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold">Repartidores hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 text-sm text-muted-foreground">
                        <div className="flex justify-between items-center">
                            <span>Totales: {stats.repartidores_totales}</span>
                            <Eye className="w-4 h-4 text-emerald-500/70" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>En ruta: {stats.repartidores_en_ruta}</span>
                            <PenTool className="w-4 h-4 text-emerald-500/70" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Pendientes: {stats.repartidores_pendientes_salir}</span>
                            <Check className="w-4 h-4 text-emerald-500/70" />
                        </div>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                        <Link href="/reparto">
                            <Button variant="outline" className="w-full bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400">Ver rutas</Button>
                        </Link>
                    </div>
                </Card>

                <Card className="bg-card/30 border-border/30 flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold">Repartidores hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 text-sm text-muted-foreground">
                        <div className="flex justify-between items-center">
                            <span>Totales: {stats.repartidores_totales}</span>
                            <span className="font-mono text-foreground">{stats.repartidores_en_ruta}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Disponibles: {stats.repartidores_disponibles}</span>
                            <Package className="w-4 h-4 text-red-400/70" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Pendientes de salir: {stats.repartidores_pendientes_salir}</span>
                            <Truck className="w-4 h-4 text-red-500/70" />
                        </div>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                        <Link href="/reparto">
                            <Button variant="outline" className="w-full bg-amber-500 border-amber-500 text-amber-950 hover:bg-amber-400 font-bold">Ver repartidores</Button>
                        </Link>
                    </div>
                </Card>

                <Card className="bg-card/30 border-border/30 flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold">Reparticiones hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 text-sm text-muted-foreground p-0">
                        {/* Dummy list to match mockup structure */}
                        <div className="px-6 py-2 border-b border-border/20 flex justify-between items-center">
                            <span>Reinicia: 4</span>
                            <ArrowRight className="w-3 h-3 opacity-50" />
                        </div>
                        <div className="px-6 py-2 border-b border-border/20 flex justify-between items-center">
                            <span>Sin info</span>
                            <ArrowRight className="w-3 h-3 opacity-50" />
                        </div>
                        <div className="px-6 py-2 flex justify-between items-center">
                            <span>Carga drops <Check className="w-3 h-3 inline ml-1 opacity-50" /></span>
                        </div>
                    </CardContent>
                    <div className="p-4 pt-4 mt-auto">
                        <Link href="/produccion">
                            <Button variant="outline" className="w-full bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400">Ver producción</Button>
                        </Link>
                    </div>
                </Card>
            </div>

            {/* PEDIDOS MAÑANA VS PRODUCCIÓN */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h2 className="text-xs uppercase tracking-widest font-black text-amber-500 flex items-center gap-2">
                        PEDIDOS PARA MAÑANA <TrendingUp className="w-3 h-3 text-amber-500" />
                    </h2>
                    <Card className="bg-card/30 border-border/30">
                        <div className="grid grid-cols-3 divide-x divide-border/20">
                            <div className="p-6">
                                <span className="text-amber-500 font-bold text-sm">Pedidos mañana</span>
                                <div className="text-4xl font-black mt-2 flex items-baseline gap-2 text-foreground">
                                    {stats.pedidos_manana_total}
                                </div>
                                <div className="text-xs text-muted-foreground mt-4 flex justify-between">
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-amber-500" /> Listos</span>
                                    <span>armados</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <span className="text-emerald-500 font-bold text-sm">Confirmados</span>
                                <div className="text-4xl font-black mt-2 text-foreground">{stats.pedidos_manana_confirmados}</div>
                                <div className="text-xs text-muted-foreground mt-4">por validar</div>
                            </div>
                            <div className="p-6 flex flex-col justify-between">
                                <ArrowRight className="w-4 h-4 text-muted-foreground self-end opacity-50" />
                                <div>
                                    <span className="text-sm text-muted-foreground">{stats.pedidos_manana_pendientes} pdts.</span>
                                    <div className="text-xs text-muted-foreground mt-4">descartados ({stats.pedidos_manana_rechazados})</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xs uppercase tracking-widest font-black text-muted-foreground">PRODUCCIÓN ESTIMADA</h2>
                    <Card className="bg-card/30 border-border/30">
                        <div className="grid grid-cols-2 divide-x divide-border/20">
                            <div className="flex flex-col">
                                {Object.entries(production).slice(0, 2).map(([name, data], idx) => (
                                    <div key={name} className={cn("p-6 flex justify-between items-center group cursor-pointer hover:bg-white/5 transition-colors", idx === 0 ? "border-b border-border/20" : "")}>
                                        <span className="text-sm text-muted-foreground">{name}: <span className="font-bold text-foreground">{data.quantity} {data.unit}</span></span>
                                        {idx === 0 ? <Eye className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" /> : <TrendingUp className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </div>
                                ))}
                                {Object.keys(production).length === 0 && (
                                    <div className="p-6 text-sm text-muted-foreground border-b border-border/20">Pollo entero: <span className="font-bold text-foreground">0 kg</span></div>
                                )}
                                {Object.keys(production).length <= 1 && (
                                    <div className="p-6 text-sm text-muted-foreground">Suprema: <span className="font-bold text-foreground">0 kg</span></div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                {Object.entries(production).slice(2, 4).map(([name, data], idx) => (
                                    <div key={name} className={cn("p-6 flex justify-between items-center group cursor-pointer hover:bg-white/5 transition-colors", idx === 0 ? "border-b border-border/20" : "")}>
                                        <span className="text-sm text-muted-foreground">{name}: <span className="font-bold text-foreground">{data.quantity} {data.unit}</span></span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                                {Object.keys(production).length <= 2 && (
                                    <div className="p-6 text-sm text-muted-foreground border-b border-border/20">Pata muslo: <span className="font-bold text-foreground">0 kg</span></div>
                                )}
                                {Object.keys(production).length <= 3 && (
                                    <div className="p-6 text-sm text-muted-foreground">Milanesas: <span className="font-bold text-foreground">0 kg</span></div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default withRole(DashboardPage, ['admin', 'repartidor'])
