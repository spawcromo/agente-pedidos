'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Truck,
    MapPin,
    ExternalLink,
    Trash2,
    Check,
    RefreshCw,
    Clock,
    Package,
    LayoutDashboard,
    Search,
    User,
    ChevronRight,
    CircleDashed,
    CheckCircle2
} from "lucide-react"
import { getOrders, type OrderWithDetails } from '@/services/orders'
import { useUser } from '@/contexts/UserContext'
import { createClient } from '@/lib/supabase/client'
import {
    getRoutes,
    getMyRoutes,
    getDrivers,
    createRoute,
    updateStopStatus,
    deleteRoute,
    type DeliveryRoute,
    type RouteStop
} from '@/services/logistics'
import { withRole } from '@/components/hoc/withRole'

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

function RepartoPage() {
    const { role, user, loading: userLoading } = useUser()
    const [date, setDate] = useState('')
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    // Ensure we only render on client to avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
        const d = new Date()
        d.setDate(d.getDate() + 1) // Default to tomorrow
        const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        setDate(tomorrow)
    }, [])

    // Admin state
    const [unassignedOrders, setUnassignedOrders] = useState<OrderWithDetails[]>([])
    const [routes, setRoutes] = useState<DeliveryRoute[]>([])
    const [drivers, setDrivers] = useState<{ id: string; email: string; full_name?: string | null }[]>([])
    const [selectedOrders, setSelectedOrders] = useState<string[]>([])
    const [selectedDriver, setSelectedDriver] = useState<string>('')

    // Repartidor state
    const [myRoutes, setMyRoutes] = useState<DeliveryRoute[]>([])
    const [activeRouteId, setActiveRouteId] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        if (!role || !user || !date) {
            // Keep loading true until date and role are available
            return
        }
        setLoading(true)
        try {
            if (role === 'admin') {
                const [allOrders, allRoutes, allDrivers] = await Promise.all([
                    getOrders({ delivery_date: date, status: 'confirmed' }),
                    getRoutes(date),
                    getDrivers()
                ])

                // Pedidos que NO estan en ninguna ruta de ese dia
                const assignedOrderIds = new Set(
                    allRoutes.flatMap(route => route.stops.map(stop => stop.order_id))
                )
                setUnassignedOrders(allOrders.filter(o => !assignedOrderIds.has(o.id)))
                setRoutes(allRoutes)
                setDrivers(allDrivers)
            } else {
                const data = await getMyRoutes(user.id)
                setMyRoutes(data)
                if (data.length > 0 && !activeRouteId) {
                    setActiveRouteId(data[0].id)
                }
            }
        } catch (err) {
            toast.error('Error al cargar datos de logística')
        } finally {
            setLoading(false)
        }
    }, [role, user, date, activeRouteId])

    useEffect(() => { loadData() }, [loadData])

    // --- REALTIME UPDATES ---
    useEffect(() => {
        const supabase = createClient()

        // Listen to changes in stops (delivery progress) and routes (assignment changes)
        const channel = supabase
            .channel('logistics-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'delivery_stops' },
                () => { loadData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'delivery_routes' },
                () => { loadData() }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadData])

    async function handleCreateRoute() {
        if (!selectedDriver) { toast.error('Seleccioná un repartidor'); return }
        if (selectedOrders.length === 0) { toast.error('Seleccioná al menos un pedido'); return }

        try {
            await createRoute(date, selectedDriver, selectedOrders)
            toast.success('Ruta creada y asignada')
            setSelectedOrders([])
            loadData()
        } catch (err) {
            toast.error('Error al crear ruta')
        }
    }

    async function handleDeleteRoute(routeId: string) {
        if (!confirm('¿Eliminar esta ruta? Los pedidos volverán a estar disponibles.')) return
        try {
            await deleteRoute(routeId)
            toast.success('Ruta eliminada')
            loadData()
        } catch (err) {
            toast.error('Error al eliminar ruta')
        }
    }

    async function handleMarkStopDelivered(stopId: string) {
        try {
            await updateStopStatus(stopId, 'delivered')
            toast.success('Entrega registrada')
            loadData()
        } catch (err) {
            toast.error('Error al registrar entrega')
        }
    }

    if (!mounted || userLoading || loading || !date) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="animate-bounce text-4xl">🍗</div>
                <p>Cargando logística...</p>
            </div>
        )
    }

    // --- VIEW: REPARTIDOR ---
    if (role === 'repartidor') {
        const activeRoute = myRoutes.find(r => r.id === activeRouteId) || myRoutes[0]

        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <header className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Mis Rutas</h1>
                    <p className="text-muted-foreground capitalize">
                        {activeRoute
                            ? new Date(activeRoute.delivery_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
                            : 'Cargando...'}
                    </p>
                </header>

                {myRoutes.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {myRoutes.map((r, i) => (
                            <button
                                key={r.id}
                                onClick={() => setActiveRouteId(r.id)}
                                className={cn(
                                    "flex-none px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                                    activeRoute?.id === r.id
                                        ? "bg-amber-500 text-amber-950"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                Ruta #{i + 1} ({r.stops.length} paradas)
                            </button>
                        ))}
                    </div>
                )}

                {!activeRoute ? (
                    <div className="py-20 text-center bg-card border border-dashed border-border rounded-lg">
                        <div className="flex justify-center mb-4">
                            <RefreshCw className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-lg font-medium">No tenés rutas asignadas por ahora.</p>
                        <p className="text-sm text-muted-foreground">Descansá o avisale al admin.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                                {activeRoute.stops.filter(s => s.status === 'delivered').length} / {activeRoute.stops.length} completadas
                            </Badge>
                        </div>
                        {activeRoute.stops.sort((a, b) => a.position - b.position).map((stop, index) => (
                            <StopCard
                                key={stop.id}
                                stop={stop}
                                index={index}
                                onDone={() => handleMarkStopDelivered(stop.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // --- VIEW: ADMIN ---
    return (
        <div className="space-y-8" suppressHydrationWarning>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Logística y Reparto</h1>
                    <p className="text-muted-foreground">Gestioná las rutas y asignaciones para la fecha seleccionada.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel 1: Pedidos por asignar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Sin Asignar ({unassignedOrders.length})</h2>
                        {selectedOrders.length > 0 && (
                            <Badge className="bg-amber-500 text-amber-950">
                                {selectedOrders.length} seleccionados
                            </Badge>
                        )}
                    </div>

                    <div className="bg-card border border-border rounded-sm p-4 min-h-[400px]">
                        {unassignedOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500" />
                                <p className="text-sm">Todo asignado o sin pedidos confirmados.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {unassignedOrders.map(order => (
                                    <div
                                        key={order.id}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                            selectedOrders.includes(order.id) ? "border-amber-500 bg-amber-500/5" : "border-border hover:bg-muted/50"
                                        )}
                                        onClick={() => {
                                            setSelectedOrders(prev =>
                                                prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                                            )
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedOrders.includes(order.id)}
                                            onCheckedChange={() => { }} // Handle on click parent
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">{order.client?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{order.client?.address}</p>
                                            <p className="text-[10px] mt-1 text-amber-500 font-mono">
                                                {ARS.format(order.order_items.reduce((s, i) => s + (i.quantity * i.unit_price), 0))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create Route Tool */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-4 space-y-4">
                        <p className="text-sm font-bold text-amber-500">Crear Nueva Ruta</p>
                        <Select value={selectedDriver} onValueChange={(val) => setSelectedDriver(val ?? '')}>
                            <SelectTrigger className="bg-background w-full">
                                <SelectValue placeholder="Elegir Repartidor...">
                                    {drivers.find(d => d.id === selectedDriver)?.full_name || drivers.find(d => d.id === selectedDriver)?.email}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="min-w-[240px]">
                                {drivers.map(d => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.full_name || d.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold"
                            disabled={selectedOrders.length === 0 || !selectedDriver}
                            onClick={handleCreateRoute}
                        >
                            Armar Ruta →
                        </Button>
                    </div>
                </div>

                {/* Panel 2 & 3: Rutas existentes */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold">
                        Rutas del {mounted ? new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' }) : '...'} ({routes.length})
                    </h2>
                    {routes.length === 0 ? (
                        <div className="py-20 text-center bg-card border border-dashed border-border rounded-lg opacity-50">
                            <div className="flex justify-center mb-4">
                                <Truck className="w-12 h-12" />
                            </div>
                            No hay rutas armadas todavía.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {routes.map(route => (
                                <div key={route.id} className="bg-card border border-border rounded-sm overflow-hidden flex flex-col group/route">
                                    <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chofer</p>
                                            <p className="font-bold text-amber-500 truncate">{route.driver?.full_name || route.driver?.email || 'Sin asignar'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="whitespace-nowrap">{route.stops.length} Paradas</Badge>
                                            <button
                                                onClick={() => handleDeleteRoute(route.id)}
                                                className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover/route:opacity-100"
                                                title="Eliminar ruta"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 space-y-2">
                                        {route.stops.sort((a, b) => a.position - b.position).map((stop, i) => (
                                            <div key={stop.id} className="flex items-center gap-2 text-sm text-foreground/80">
                                                <span className="text-[10px] text-muted-foreground w-4 text-center">{i + 1}</span>
                                                <span className={cn("truncate", stop.status === 'delivered' && "line-through opacity-50")}>
                                                    {stop.order.client?.name}
                                                </span>
                                                {stop.status === 'delivered' && <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-muted/10 border-t border-border mt-auto">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Progreso</span>
                                            <span className="font-bold">
                                                {route.stops.filter(s => s.status === 'delivered').length} / {route.stops.length}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all rounded-full"
                                                style={{ width: `${(route.stops.filter(s => s.status === 'delivered').length / route.stops.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StopCard({ stop, index, onDone }: { stop: RouteStop, index: number, onDone: () => void }) {
    const isDelivered = stop.status === 'delivered'

    return (
        <div className={cn(
            "relative bg-card border border-border rounded-lg p-5 transition-all shadow-sm",
            isDelivered ? "opacity-60 grayscale" : "hover:border-amber-500/50"
        )}>
            <div className="absolute -left-3 top-5 h-8 w-8 bg-amber-500 text-amber-950 rounded-lg flex items-center justify-center font-bold shadow-lg border-4 border-background">
                {index + 1}
            </div>

            <div className="pl-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h3 className="text-xl font-bold">{stop.order.client?.name}</h3>
                        <p className="text-amber-400 font-medium text-sm flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" /> {stop.order.client?.address}
                        </p>
                    </div>
                    <p className="text-xl font-mono font-bold">
                        {ARS.format(stop.order.order_items.reduce((s, i) => s + (i.quantity * i.unit_price), 0))}
                    </p>
                </div>

                <div className="flex gap-2">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.order.client?.address || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-blue-500/10 text-blue-400 py-3 rounded-lg text-center text-sm font-bold border border-blue-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" /> Abrir GPS
                    </a>
                    {!isDelivered ? (
                        <button
                            onClick={onDone}
                            className="flex-1 bg-amber-500 text-amber-950 py-3 rounded-lg text-center text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Entregar
                        </button>
                    ) : (
                        <div className="flex-1 bg-emerald-500/10 text-emerald-500 py-3 rounded-lg text-center text-sm font-bold border border-emerald-500/20 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Entregado
                        </div>
                    )}
                    ...
                </div>

                <div className="pt-4 border-t border-border/50 grid grid-cols-1 gap-2">
                    {stop.order.order_items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs bg-muted/40 px-3 py-2 rounded-lg">
                            <span>{item.product?.name}</span>
                            <span className="font-bold">{item.quantity} {item.product?.unit}</span>
                        </div>
                    ))}
                </div>

                {stop.order.notes && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg text-xs flex gap-2">
                        <span className="font-bold text-amber-500">NOTAS:</span>
                        <span className="flex-1">{stop.order.notes}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default withRole(RepartoPage, ['admin', 'repartidor'])
