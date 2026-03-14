'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    ClipboardList,
    Search,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    Edit2,
    Calendar,
    Filter,
    Clock,
    Truck,
    Check,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    AlertCircle,
    Trash2,
    Ban
} from "lucide-react"
import { OrderStatusBadge } from '@/components/features/OrderStatusBadge'
import { OrderDialog } from '@/components/features/OrderDialog'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    getOrders, updateOrderStatus, bulkUpdateOrderStatus, bulkUpdateOrderDate, deleteOrder, type OrderWithDetails,
} from '@/services/orders'
import type { OrderStatus } from '@/types/database'
import { withRole } from '@/components/hoc/withRole'

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
})

function orderTotal(order: OrderWithDetails): number {
    return (order.order_items ?? []).reduce(
        (sum, item) => sum + item.quantity * item.unit_price, 0
    )
}

function PedidosPage() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    
    // Default to tomorrow's date
    const [dateFilter, setDateFilter] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
    
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all' | 'active' | 'assigned'>('active')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
    const [sortConfig, setSortConfig] = useState<{ field: string, direction: 'asc' | 'desc' }>({
        field: 'created_at',
        direction: 'desc'
    })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [bulkDateOpen, setBulkDateOpen] = useState(false)
    const [bulkNewDate, setBulkNewDate] = useState('')

    // Cancel state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
    const [cancelReason, setCancelReason] = useState('')

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
    const [deletePassword, setDeletePassword] = useState('')

    useEffect(() => {
        setMounted(true)
    }, [])

    const load = useCallback(async () => {
        if (!mounted) return
        try {
            setLoading(true)
            setSelected(new Set())
            setCurrentPage(1)
            const data = await getOrders({
                delivery_date: dateFilter || undefined,
                status: statusFilter === 'active' || statusFilter === 'assigned'
                    ? ['pending', 'confirmed']
                    : (statusFilter !== 'all' ? statusFilter : undefined),
            })

            // Client-side filtering for "Assigned" logic
            let filteredData = data
            if (statusFilter === 'active') {
                // Return only those NOT assigned to a route
                filteredData = data.filter(o => !o.delivery_stops || o.delivery_stops.length === 0)
            } else if (statusFilter === 'assigned') {
                // Return only those assigned to a route
                filteredData = data.filter(o => o.delivery_stops && o.delivery_stops.length > 0)
            }

            setOrders(filteredData)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar pedidos')
        } finally {
            setLoading(false)
        }
    }, [dateFilter, statusFilter, mounted])

    useEffect(() => { load() }, [load])

    const sortedOrders = useMemo(() => {
        const items = [...orders]
        items.sort((a, b) => {
            let valA: any = ''
            let valB: any = ''

            switch (sortConfig.field) {
                case 'created_at':
                    valA = new Date(a.created_at).getTime()
                    valB = new Date(b.created_at).getTime()
                    break
                case 'delivery':
                    valA = new Date(`${a.delivery_date}T${a.delivery_time || '00:00'}`).getTime()
                    valB = new Date(`${b.delivery_date}T${b.delivery_time || '00:00'}`).getTime()
                    break
                case 'client':
                    valA = (a.client?.name || '').toLowerCase()
                    valB = (b.client?.name || '').toLowerCase()
                    break
                case 'total':
                    valA = orderTotal(a)
                    valB = orderTotal(b)
                    break
                case 'status':
                    valA = a.status
                    valB = b.status
                    break
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
        return items
    }, [orders, sortConfig])

    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return sortedOrders.slice(startIndex, startIndex + itemsPerPage)
    }, [sortedOrders, currentPage])

    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)

    function handleSort(field: string) {
        setSortConfig((prev) => ({
            field,
            direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    function SortIcon({ field }: { field: string }) {
        if (sortConfig.field !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 text-amber-500" />
            : <ArrowDown className="w-3 h-3 text-amber-500" />
    }

    // Selection
    const allIds = orders.map((o) => o.id)
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
    function toggleAll() {
        setSelected(allSelected ? new Set() : new Set(allIds))
    }
    function toggleOne(id: string) {
        const next = new Set(selected)
        next.has(id) ? next.delete(id) : next.add(id)
        setSelected(next)
    }

    const selectedOrdersData = orders.filter(o => selected.has(o.id))
    const isBulkAssigned = selectedOrdersData.some(o => o.status === 'confirmed' && (o.delivery_stops?.length ?? 0) > 0)
    const isBulkDelivered = selectedOrdersData.some(o => o.status === 'delivered')
    const hasCancelled = selectedOrdersData.some(o => o.status === 'cancelled')

    // Validations based on rules:
    // Asignados: Solo pueden cancelarse.
    // Delivered: Terminal, no moves.
    // Cancelados: Solo pueden volver a pendiente, ni fecha.
    const canBulkPending = !isBulkAssigned && !isBulkDelivered
    const canBulkConfirm = !isBulkAssigned && !isBulkDelivered && !hasCancelled
    const canBulkReject = !isBulkAssigned && !isBulkDelivered && !hasCancelled
    const canBulkDate = !isBulkDelivered && !isBulkAssigned && !hasCancelled

    // Actions
    async function handleStatus(id: string, status: OrderStatus) {
        if (status === 'cancelled') {
            setOrderToCancel(id)
            setCancelReason('')
            setCancelDialogOpen(true)
            return
        }
        try {
            await updateOrderStatus(id, status)
            const labels: Record<string, string> = {
                confirmed: 'confirmado',
                rejected: 'rechazado',
                pending: 'vuelto a pendiente',
                delivered: 'marcado como entregado'
            }
            toast.success(`Pedido ${labels[status] || status}`)
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error')
        }
    }

    async function handleCancelSubmit() {
        if (!orderToCancel || !cancelReason.trim()) {
            toast.error('Debes indicar un motivo de cancelación')
            return
        }
        try {
            await updateOrderStatus(orderToCancel, 'cancelled', cancelReason)
            toast.success('Pedido cancelado')
            setCancelDialogOpen(false)
            setCancelReason('')
            setOrderToCancel(null)
            load()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    async function handleDeleteSubmit() {
        if (deletePassword !== 'borrar') {
            toast.error('Contraseña incorrecta')
            return
        }
        if (!orderToDelete) return
        try {
            await deleteOrder(orderToDelete)
            toast.success('Pedido eliminado permanentemente')
            setDeleteDialogOpen(false)
            setDeletePassword('')
            setOrderToDelete(null)
            load()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    async function handleBulkStatus(status: OrderStatus) {
        if (selected.size === 0) return
        const statusLabels: Record<OrderStatus, string> = {
            pending: 'puestos en pendiente',
            confirmed: 'confirmados',
            delivered: 'marcados como entregados',
            rejected: 'rechazados',
            cancelled: 'cancelados'
        }

        if (status === 'rejected' && !confirm(`¿Rechazar ${selected.size} pedidos?`)) return

        try {
            await bulkUpdateOrderStatus(Array.from(selected), status)
            toast.success(`${selected.size} pedidos ${statusLabels[status]}`)
            setSelected(new Set())
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error')
        }
    }

    async function handleBulkDate() {
        if (selected.size === 0 || !bulkNewDate) return
        try {
            await bulkUpdateOrderDate(Array.from(selected), bulkNewDate)
            toast.success(`Fechas de ${selected.size} pedidos actualizadas`)
            setBulkDateOpen(false)
            setSelected(new Set())
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cambiar fecha')
        }
    }

    function openEdit(order: OrderWithDetails) {
        setSelectedOrder(order)
        setDialogOpen(true)
    }

    function openCreate() {
        setSelectedOrder(null)
        setDialogOpen(true)
    }

    if (!mounted) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="animate-spin text-amber-500">
                    <ClipboardList className="w-10 h-10" />
                </div>
                <p>Cargando pedidos...</p>
            </div>
        )
    }

    return (
        <div suppressHydrationWarning>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">
                        Gestioná, confirmá y organizá los pedidos del día.
                    </p>
                </div>
                <Button onClick={openCreate} id="btn-nuevo-pedido" className="w-full sm:w-auto">
                    + Nuevo Pedido
                </Button>
            </div>

            {/* Filters + Bulk actions */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
                <div className="flex gap-2 w-full sm:w-auto">
                    <Input
                        id="filter-fecha"
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="flex-1 sm:w-40"
                    />
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all' | 'active' | 'assigned')}
                    >
                        <SelectTrigger className="w-fit min-w-[200px]" id="filter-estado">
                            <SelectValue placeholder="Pendientes + Conf.">
                                {{
                                    'active': 'Pendientes + Confirmados',
                                    'assigned': 'Solo Asignados a Ruta',
                                    'all': 'Todos los estados',
                                    'pending': 'Solo Pendientes',
                                    'confirmed': 'Solo Confirmados',
                                    'delivered': 'Solo Entregados',
                                    'rejected': 'Solo Rechazados',
                                    'cancelled': 'Solo Cancelados',
                                }[statusFilter]}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Pendientes + Confirmados</SelectItem>
                            <SelectItem value="assigned">Solo Asignados a Ruta</SelectItem>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="pending">Solo Pendientes</SelectItem>
                            <SelectItem value="confirmed">Solo Confirmados</SelectItem>
                            <SelectItem value="delivered">Solo Entregados</SelectItem>
                            <SelectItem value="rejected">Solo Rechazados</SelectItem>
                            <SelectItem value="cancelled">Solo Cancelados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {(() => {
                        const d = new Date()
                        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        d.setDate(d.getDate() + 1)
                        const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        
                        return (
                            <>
                                <Button
                                    variant={dateFilter === today ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "flex-1 sm:flex-none font-bold",
                                        dateFilter === today && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-none"
                                    )}
                                    onClick={() => setDateFilter(today)}
                                >
                                    Hoy
                                </Button>
                                <Button
                                    variant={dateFilter === tomorrow ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "flex-1 sm:flex-none font-bold",
                                        dateFilter === tomorrow && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-none"
                                    )}
                                    onClick={() => setDateFilter(tomorrow)}
                                >
                                    Mañana
                                </Button>
                            </>
                        )
                    })()}
                </div>

                {selected.size > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto sm:border-l sm:border-border sm:pl-3">
                        <span className="text-sm text-muted-foreground w-full sm:w-auto text-center">{selected.size} seleccionados</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger className={cn(
                                buttonVariants({ size: 'sm' }),
                                "w-full sm:w-auto gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none cursor-pointer"
                            )}>
                                <CheckCircle2 className="w-4 h-4" /> Acciones masivas
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setBulkDateOpen(true)} disabled={!canBulkDate} className="gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" /> Cambiar Fecha
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatus('pending')} disabled={!canBulkPending} className="gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" /> Mover a Pendiente
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatus('confirmed')} disabled={!canBulkConfirm} className="gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirmar seleccionados
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatus('delivered')} disabled={!canBulkConfirm} className="gap-2">
                                    <Truck className="w-4 h-4 text-blue-500" /> Marcar como Entregados
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleBulkStatus('rejected')}
                                    disabled={!canBulkReject}
                                    className="text-destructive font-medium gap-2 focus:text-destructive focus:bg-destructive/10"
                                >
                                    <XCircle className="w-4 h-4" /> Rechazar seleccionados
                                </DropdownMenuItem>

                                {isBulkAssigned && (
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground bg-muted/30 mt-2">
                                        Hay pedidos asignados a ruta. Para modificarlos, deben cancelarse primero.
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={toggleAll}
                                        id="select-all"
                                    />
                                </TableHead>
                                <TableHead
                                    className="whitespace-nowrap cursor-pointer hover:text-foreground transition-colors group select-none pl-6"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center gap-1">
                                        Pedido <SortIcon field="created_at" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="whitespace-nowrap cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => handleSort('delivery')}
                                >
                                    <div className="flex items-center gap-1">
                                        Entrega <SortIcon field="delivery" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="min-w-[150px] cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => handleSort('client')}
                                >
                                    <div className="flex items-center gap-1">
                                        Cliente <SortIcon field="client" />
                                    </div>
                                </TableHead>
                                <TableHead className="min-w-[200px]">Productos</TableHead>
                                <TableHead
                                    className="text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => handleSort('total')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Total <SortIcon field="total" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Estado <SortIcon field="status" />
                                    </div>
                                </TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : paginatedOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                        No hay pedidos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className={cn(
                                            "transition-colors",
                                            selected.has(order.id) ? 'bg-amber-500/5' : ''
                                        )}
                                    >
                                        <TableCell className="pl-6">
                                            <Checkbox
                                                checked={selected.has(order.id)}
                                                onCheckedChange={() => toggleOne(order.id)}
                                                id={`check-${order.id}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-foreground">
                                                {(() => {
                                                    const d = new Date(order.created_at)
                                                    const day = String(d.getDate()).padStart(2, '0')
                                                    const month = String(d.getMonth() + 1).padStart(2, '0')
                                                    return `${day}/${month}`
                                                })()}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-amber-500">
                                                    {order.delivery_date.split('-').slice(1, 3).reverse().join('/')}
                                                </div>
                                                {(() => {
                                                    const d = new Date()
                                                    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                                                    const isAssigned = order.status === 'confirmed' && (order.delivery_stops?.length ?? 0) > 0;
                                                    
                                                    // Caso: Entrega Hoy
                                                    if (order.delivery_date === today) {
                                                        if (isAssigned) {
                                                            return (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 cursor-help" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Asignado a ruta para hoy</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )
                                                        }
                                                        return (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>¿Hoy se puede entregar?</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    }

                                                    // Caso: Fecha Pasada y no finalizado
                                                    if (order.delivery_date < today && !['delivered', 'cancelled', 'rejected'].includes(order.status)) {
                                                        return (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right">
                                                                    <p>Fecha pasada: ¿Se entregó?</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    }
                                                    
                                                    return null
                                                })()}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 opacity-70" /> {order.delivery_time ? order.delivery_time.slice(0, 5) : '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-foreground">{order.client?.name ?? '—'}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase opacity-70">
                                                {order.source}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                {(order.order_items ?? []).map((item) => (
                                                    <div key={item.id} className="text-sm">
                                                        <span className="font-medium text-amber-500">{item.quantity}</span> {item.product?.unit} {item.product?.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {ARS.format(orderTotal(order))}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <OrderStatusBadge status={order.status} isAssigned={order.status === 'confirmed' && (order.delivery_stops?.length ?? 0) > 0} />
                                                {order.status === 'cancelled' && order.cancel_reason && (
                                                    <span
                                                        className="text-[10px] text-muted-foreground max-w-[130px] leading-tight line-clamp-2"
                                                        title={order.cancel_reason}
                                                    >
                                                        {order.cancel_reason}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    id={`menu-pedido-${order.id}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    {/* Primary Actions */}
                                                    {order.status !== 'cancelled' && (
                                                        <DropdownMenuItem onClick={() => openEdit(order)} className="gap-2">
                                                            <Edit2 className="w-4 h-4" /> Ver / Editar
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    {/* Status Transitions */}
                                                    {(() => {
                                                        const isAssigned = order.status === 'confirmed' && (order.delivery_stops?.length ?? 0) > 0;
                                                        return (
                                                            <>
                                                                {!isAssigned && order.status !== 'confirmed' && order.status !== 'cancelled' && (
                                                                    <DropdownMenuItem onClick={() => handleStatus(order.id, 'confirmed')} className="gap-2">
                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirmar
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {!isAssigned && order.status !== 'rejected' && order.status !== 'cancelled' && (
                                                                    <DropdownMenuItem onClick={() => handleStatus(order.id, 'rejected')} className="gap-2 text-destructive">
                                                                        <XCircle className="w-4 h-4" /> Rechazar
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {!isAssigned && order.status !== 'pending' && order.status !== 'cancelled' && (
                                                                    <DropdownMenuItem onClick={() => handleStatus(order.id, 'pending')} className="gap-2">
                                                                        <Clock className="w-4 h-4 text-amber-500" /> Volver a Pendiente
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {/* Only assigned orders can be cancelled (which removes them from the route) */}
                                                                {isAssigned && order.status !== 'cancelled' && (
                                                                    <DropdownMenuItem onClick={() => handleStatus(order.id, 'cancelled')} className="gap-2 text-destructive">
                                                                        <Ban className="w-4 h-4" /> Cancelar Pedido
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {/* Revert cancelled */}
                                                                {order.status === 'cancelled' && (
                                                                    <DropdownMenuItem onClick={() => handleStatus(order.id, 'pending')} className="gap-2">
                                                                        <Clock className="w-4 h-4 text-amber-500" /> Revertir a Pendiente
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuSeparator />

                                                                {/* Destructive Actions */}
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setOrderToDelete(order.id)
                                                                        setDeletePassword('')
                                                                        setDeleteDialogOpen(true)
                                                                    }}
                                                                    className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                >
                                                                    <Trash2 className="w-4 h-4 shrink-0" />
                                                                    <span>Eliminar Definitivamente</span>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )
                                                    })()}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedOrders.length)} de {sortedOrders.length}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                Anterior
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <OrderDialog
                open={dialogOpen}
                order={selectedOrder}
                onClose={() => setDialogOpen(false)}
                onSaved={load}
            />

            <Dialog open={bulkDateOpen} onOpenChange={setBulkDateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mover pedidos de fecha</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Nueva fecha de entrega para los {selected.size} pedidos:</label>
                        <Input
                            type="date"
                            value={bulkNewDate}
                            onChange={(e) => setBulkNewDate(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkDateOpen(false)}>Atrás</Button>
                        <Button onClick={handleBulkDate} disabled={!bulkNewDate}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Cancelar Pedido</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Al cancelar un pedido se removerá de cualquier ruta en la que esté asignado. Debes indicar un motivo de cancelación:
                        </p>
                        <Input
                            placeholder="Ej: El cliente no lo quería..."
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
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="w-5 h-5" /> Eliminar Pedido Permanentemente
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Esta acción <strong className="text-foreground">no se puede deshacer</strong>. Se borrará el pedido de la base de datos completamente.
                        </p>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contraseña de seguridad</label>
                            <Input
                                type="password"
                                placeholder="Ingresá la contraseña para borrar..."
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleDeleteSubmit()
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleDeleteSubmit}
                            variant="destructive"
                            disabled={!deletePassword}
                        >
                            Confirmar Eliminación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default withRole(PedidosPage, ['admin'])
