'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn, formatUnit } from '@/lib/utils'
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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
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
    CheckCircle2,
    X,
    XCircle
} from "lucide-react"
import { getOrders, type OrderWithDetails } from '@/services/orders'
import { useUser } from '@/contexts/UserContext'
import { createClient } from '@/lib/supabase/client'
import {
    getRoutes,
    getMyRoutes,
    getDrivers,
    createRoute,
    updateRouteStatus,
    updateStopStatus,
    deleteRoute,
    removeStopAndCancelOrder,
    type DeliveryRoute,
    type RouteStop
} from '@/services/logistics'
import { withRole } from '@/components/hoc/withRole'

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

function RutasPage() {
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
    const [drivers, setDrivers] = useState<{ id: string; email: string; full_name?: string | null; driver_status?: string | null }[]>([])
    const [selectedOrders, setSelectedOrders] = useState<string[]>([])
    const [selectedDriver, setSelectedDriver] = useState<string>('')

    // Repartidor state
    const [myRoutes, setMyRoutes] = useState<DeliveryRoute[]>([])
    const [activeRouteId, setActiveRouteId] = useState<string | null>(null)

    // Cancel state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [cancelData, setCancelData] = useState<{ stopId: string, orderId: string } | null>(null)
    const [cancelReason, setCancelReason] = useState('')

    // Delete Route state
    const [deleteRouteDialogOpen, setDeleteRouteDialogOpen] = useState(false)
    const [routeToDelete, setRouteToDelete] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        if (!role || !user || !date) {
            // Keep loading true until date and role are available
            return
        }
        setLoading(true)
        try {
            if (role === 'admin') {
                const [allOrders, allRoutes, allDrivers] = await Promise.all([
                    getOrders({ delivery_date: date, status: ['confirmed', 'preparing'] }),
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

    async function handleStartRoute(routeId: string) {
        try {
            await updateRouteStatus(routeId, 'active')
            toast.success('Ruta iniciada. ¡Buen viaje!')
            loadData()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    async function confirmDeleteRoute() {
        if (!routeToDelete) return
        try {
            await deleteRoute(routeToDelete)
            toast.success('Ruta eliminada')
            setDeleteRouteDialogOpen(false)
            setRouteToDelete(null)
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

    async function handleCancelSubmit() {
        if (!cancelData || !cancelReason.trim()) {
            toast.error('Debes indicar un motivo')
            return
        }
        try {
            await removeStopAndCancelOrder(cancelData.stopId, cancelData.orderId, cancelReason)
            toast.success('Pedido cancelado y removido de la ruta')
            setCancelDialogOpen(false)
            setCancelReason('')
            setCancelData(null)
            loadData()
        } catch (err: any) {
            toast.error(err.message)
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
                            <Badge variant="outline" className={cn(
                                "border-amber-500/20",
                                activeRoute.status === 'active' ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                            )}>
                                {activeRoute.status === 'active' ? 'EN PROGRESO' : 'PENDIENTE DE INICIO'}
                            </Badge>
                            <Badge variant="outline" className="text-muted-foreground border-border/50">
                                {activeRoute.stops.filter(s => s.status === 'delivered').length} / {activeRoute.stops.length} completadas
                            </Badge>
                        </div>

                        {activeRoute.status === 'draft' && (
                            <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-4 text-center">
                                <Truck className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white">¿Listo para salir?</h3>
                                    <p className="text-sm text-muted-foreground px-4">Al iniciar la ruta, el administrador podrá ver que ya estás en camino.</p>
                                </div>
                                <Button 
                                    onClick={() => handleStartRoute(activeRoute.id)}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-black h-14 text-lg uppercase tracking-tighter"
                                >
                                    Iniciar Ruta Ahora 🚛💨
                                </Button>
                            </div>
                        )}
                        {activeRoute.stops.sort((a, b) => a.position - b.position).map((stop, index) => (
                            <StopCard
                                key={stop.id}
                                stop={stop}
                                index={index}
                                isRouteActive={activeRoute.status === 'active'}
                                onDone={() => handleMarkStopDelivered(stop.id)}
                                onCancel={() => {
                                    setCancelData({ stopId: stop.id, orderId: stop.order_id })
                                    setCancelReason('')
                                    setCancelDialogOpen(true)
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Cancel Dialog */}
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-destructive">Cancelar Pedido de la Ruta</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Se eliminará este pedido de la hoja de ruta y pasará a estado Cancelado. Debes indicar un motivo:
                            </p>
                            <Input
                                placeholder="Ej: No me atendió nadie / Local cerrado..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Atrás</Button>
                            <Button onClick={handleCancelSubmit} variant="destructive" disabled={!cancelReason.trim()}>Confirmar Cancelación</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // --- VIEW: ADMIN ---
    return (
        <div className="space-y-8" suppressHydrationWarning>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Rutas</h1>
                    <p className="text-muted-foreground">Gestioná las rutas y asignaciones para la fecha seleccionada.</p>
                </div>
                <div className="flex items-center gap-2">
                    {(() => {
                        const d = new Date()
                        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        d.setDate(d.getDate() + 1)
                        const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        
                        return (
                            <>
                                <Button
                                    variant={date === today ? "default" : "outline"}
                                    className={cn(
                                        "flex-1 sm:flex-none font-bold !h-10 rounded-xl transition-all active:scale-95 border-border",
                                        date === today && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-none shadow-lg shadow-amber-500/10"
                                    )}
                                    onClick={() => setDate(today)}
                                >
                                    Hoy
                                </Button>
                                <Button
                                    variant={date === tomorrow ? "default" : "outline"}
                                    className={cn(
                                        "flex-1 sm:flex-none font-bold !h-10 rounded-xl transition-all active:scale-95 border-border",
                                        date === tomorrow && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-none shadow-lg shadow-amber-500/10"
                                    )}
                                    onClick={() => setDate(tomorrow)}
                                >
                                    Mañana
                                </Button>
                            </>
                        )
                    })()}
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40 !h-10 rounded-xl"
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
                            <SelectTrigger className="bg-background w-full h-10 rounded-xl">
                                <SelectValue placeholder="Elegir Repartidor...">
                                    {drivers.find(d => d.id === selectedDriver)?.full_name || drivers.find(d => d.id === selectedDriver)?.email}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="min-w-[240px]">
                                {drivers.length === 0 ? (
                                    <p className="p-2 text-xs text-muted-foreground text-center">Cargando repartidores...</p>
                                ) : drivers.filter(d => d.driver_status === 'disponible').length === 0 ? (
                                    <p className="p-2 text-xs text-destructive text-center font-bold">Sin repartidores disponibles</p>
                                ) : (
                                    drivers.filter(d => d.driver_status === 'disponible').map(d => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.full_name || d.email}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Button
                            className="w-full h-10 px-6 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95"
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
                                    <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chofer</p>
                                                <Badge className={cn(
                                                    "text-[10px] px-1.5 h-4 border-none",
                                                    route.status === 'active' ? "bg-amber-500 text-amber-950" : 
                                                    route.status === 'completed' ? "bg-emerald-500 text-white" : 
                                                    "bg-muted text-muted-foreground"
                                                )}>
                                                    {route.status === 'active' ? 'EN RUTA' : 
                                                     route.status === 'completed' ? 'FINALIZADA' : 'PENDIENTE'}
                                                </Badge>
                                            </div>
                                            <p className="font-bold text-amber-500 truncate">{route.driver?.full_name || route.driver?.email || 'Sin asignar'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="whitespace-nowrap">{route.stops.length} Paradas</Badge>
                                            {(route.status === 'draft' || route.status === 'completed') && (
                                                <button
                                                    onClick={() => {
                                                        setRouteToDelete(route.id)
                                                        setDeleteRouteDialogOpen(true)
                                                    }}
                                                    className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover/route:opacity-100"
                                                    title="Eliminar ruta"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 space-y-2">
                                        {(() => {
                                            const sortedStops = [...route.stops].sort((a, b) => a.position - b.position)
                                            const nextStop = sortedStops.find(s => s.status === 'pending')

                                            return sortedStops.map((stop, i) => {
                                                const isNext = stop.id === nextStop?.id
                                                const canCancel = route.status === 'draft' || (route.status === 'active' && !isNext)

                                                return (
                                                    <div key={stop.id} className="flex items-center gap-2 text-sm text-foreground/80">
                                                        <span className="text-[10px] text-muted-foreground w-4 text-center">{i + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className={cn("truncate block", stop.status === 'delivered' && "line-through opacity-50")}>
                                                                {stop.order.client?.name}
                                                            </span>
                                                            {stop.order.status === 'cancelled' && stop.order.cancel_reason && (
                                                                <span className="text-[10px] text-destructive/80 block italic truncate">
                                                                    Motivo: {stop.order.cancel_reason}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {stop.order.status === 'cancelled' ? (
                                                            <Badge variant="outline" className="ml-auto text-[9px] h-4 px-1 border-destructive/30 text-destructive bg-destructive/5 font-bold">CANCELADO</Badge>
                                                        ) : stop.status === 'delivered' ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                                                        ) : (
                                                            <div className="ml-auto flex items-center gap-2">
                                                                {isNext && route.status === 'active' && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-500/30 text-amber-500 bg-amber-500/5">SIGUIENTE</Badge>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        if (!canCancel) return
                                                                        setCancelData({ stopId: stop.id, orderId: stop.order_id })
                                                                        setCancelReason('')
                                                                        setCancelDialogOpen(true)
                                                                    }}
                                                                    disabled={!canCancel}
                                                                    className={cn(
                                                                        "text-muted-foreground transition-all",
                                                                        canCancel 
                                                                            ? "hover:text-destructive opacity-0 group-hover/route:opacity-100" 
                                                                            : "opacity-20 cursor-not-allowed"
                                                                    )}
                                                                    title={!canCancel ? "No se puede cancelar la próxima entrega" : "Cancelar pedido de la ruta"}
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        })()}
                                    </div>
                                    <div className="p-4 bg-muted/10 border-t border-border mt-auto">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Progreso</span>
                                            <span className="font-bold">
                                                {route.stops.filter(s => s.status === 'delivered' || s.order.status === 'cancelled').length} / {route.stops.length}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all rounded-full"
                                                style={{ width: `${(route.stops.filter(s => s.status === 'delivered' || s.order.status === 'cancelled').length / route.stops.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Cancelar Pedido de la Ruta</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Se eliminará este pedido de la hoja de ruta y pasará a estado Cancelado. Debes indicar un motivo:
                        </p>
                        <Input
                            placeholder="Ej: No me atendió nadie / Cancelado antes de salir..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Atrás</Button>
                        <Button onClick={handleCancelSubmit} variant="destructive" disabled={!cancelReason.trim()}>Confirmar Cancelación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteRouteDialogOpen} onOpenChange={setDeleteRouteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Eliminar Ruta</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            ¿Estás seguro que querés eliminar esta ruta? 
                            Los pedidos que estaban asignados aquí no se cancelarán, volverán a estar disponibles en la lista de seleccionables "Sin Asignar" para reasignarlos a otra ruta.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteRouteDialogOpen(false)}>Atrás</Button>
                        <Button onClick={confirmDeleteRoute} variant="destructive">Confirmar Eliminación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function StopCard({ stop, index, isRouteActive, onDone, onCancel }: { stop: RouteStop, index: number, isRouteActive: boolean, onDone: () => void, onCancel: () => void }) {
    const isDelivered = stop.status === 'delivered'
    const isCancelled = stop.order.status === 'cancelled'

    return (
        <div className={cn(
            "relative bg-card border border-border rounded-lg p-5 transition-all shadow-sm",
            (isDelivered || isCancelled) ? "opacity-60 grayscale" : "hover:border-amber-500/50"
        )}>
            <div className={cn(
                "absolute -left-3 top-5 h-8 w-8 rounded-lg flex items-center justify-center font-bold shadow-lg border-4 border-background",
                isCancelled ? "bg-muted text-muted-foreground" : "bg-amber-500 text-amber-950"
            )}>
                {index + 1}
            </div>

            <div className="pl-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">{stop.order.client?.name}</h3>
                            {isCancelled && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-tighter">CANCELADO</Badge>
                            )}
                        </div>
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
                    {isCancelled ? (
                        <div className="space-y-3 flex-1">
                            <div className="bg-red-500/10 text-red-500 py-3 rounded-lg text-center text-sm font-bold border border-red-500/20 flex items-center justify-center gap-2">
                                <XCircle className="w-4 h-4" /> PEDIDO CANCELADO
                            </div>
                            {stop.order.cancel_reason && (
                                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-xs">
                                    <p className="font-bold text-destructive uppercase mb-1">Motivo del Admin/Sistema:</p>
                                    <p className="text-foreground/80 italic">"{stop.order.cancel_reason}"</p>
                                </div>
                            )}
                        </div>
                    ) : !isDelivered ? (
                        <>
                            <button
                                onClick={onCancel}
                                className="w-12 bg-red-500/10 text-destructive py-3 rounded-lg text-center flex items-center justify-center border border-destructive/20 active:scale-95 transition-transform"
                                title="Cancelar Pedido"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onDone}
                                disabled={!isRouteActive}
                                className={cn(
                                    "flex-1 py-3 rounded-lg text-center text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 border shadow-lg",
                                    isRouteActive 
                                        ? "bg-amber-500 text-amber-950 border-amber-500/20 shadow-amber-500/10" 
                                        : "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Check className="w-4 h-4" /> Entregar
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 bg-emerald-500/10 text-emerald-500 py-3 rounded-lg text-center text-sm font-bold border border-emerald-500/20 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Entregado
                        </div>
                    )}
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

export default withRole(RutasPage, ['admin', 'repartidor'])
