'use client'

import { useEffect, useState, useCallback } from 'react'
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
    Check
} from "lucide-react"
import { OrderStatusBadge } from '@/components/features/OrderStatusBadge'
import { OrderDialog } from '@/components/features/OrderDialog'
import {
    getOrders, updateOrderStatus, bulkUpdateOrderStatus, type OrderWithDetails,
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
    const [dateFilter, setDateFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all' | 'active'>('active')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const load = useCallback(async () => {
        if (!mounted) return
        try {
            setLoading(true)
            setSelected(new Set())
            const data = await getOrders({
                delivery_date: dateFilter || undefined,
                status: statusFilter === 'active'
                    ? ['pending', 'confirmed']
                    : (statusFilter !== 'all' ? statusFilter : undefined),
            })
            setOrders(data)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar pedidos')
        } finally {
            setLoading(false)
        }
    }, [dateFilter, statusFilter, mounted])

    useEffect(() => { load() }, [load])

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

    // Actions
    async function handleStatus(id: string, status: OrderStatus) {
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

    async function handleBulkStatus(status: OrderStatus) {
        if (selected.size === 0) return
        const statusLabels: Record<OrderStatus, string> = {
            pending: 'puestos en pendiente',
            confirmed: 'confirmados',
            delivered: 'marcados como entregados',
            rejected: 'rechazados'
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
                        onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all' | 'active')}
                    >
                        <SelectTrigger className="flex-1 sm:w-40" id="filter-estado">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Pendientes + Conf.</SelectItem>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="pending">Solo Pendientes</SelectItem>
                            <SelectItem value="confirmed">Solo Confirmados</SelectItem>
                            <SelectItem value="delivered">Solo Entregados</SelectItem>
                            <SelectItem value="rejected">Solo Rechazados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                            const d = new Date()
                            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                            setDateFilter(today)
                        }}
                    >
                        Hoy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                            const d = new Date()
                            d.setDate(d.getDate() + 1)
                            const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                            setDateFilter(tomorrow)
                        }}
                    >
                        Mañana
                    </Button>
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
                                <DropdownMenuItem onClick={() => handleBulkStatus('pending')} className="gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" /> Mover a Pendiente
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatus('confirmed')} className="gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirmar seleccionados
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkStatus('delivered')} className="gap-2">
                                    <Truck className="w-4 h-4 text-blue-500" /> Marcar como Entregados
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleBulkStatus('rejected')}
                                    className="text-destructive font-medium gap-2 focus:text-destructive"
                                >
                                    <XCircle className="w-4 h-4" /> Rechazar seleccionados
                                </DropdownMenuItem>
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
                                <TableHead className="min-w-[150px]">Cliente</TableHead>
                                <TableHead className="min-w-[200px]">Productos</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        No hay pedidos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className={cn(
                                            "transition-colors",
                                            selected.has(order.id) ? 'bg-amber-500/5' : ''
                                        )}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selected.has(order.id)}
                                                onCheckedChange={() => toggleOne(order.id)}
                                                id={`check-${order.id}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-foreground">{order.client?.name ?? '—'}</div>
                                            <div className="text-[11px] text-muted-foreground uppercase tracking-tight">
                                                {order.delivery_date.split('-').reverse().join('-')}
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
                                            <OrderStatusBadge status={order.status} />
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    id={`menu-pedido-${order.id}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openEdit(order)} className="gap-2">
                                                        <Edit2 className="w-4 h-4" /> Ver / Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {order.status !== 'confirmed' && (
                                                        <DropdownMenuItem onClick={() => handleStatus(order.id, 'confirmed')} className="gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirmar
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status !== 'rejected' && (
                                                        <DropdownMenuItem onClick={() => handleStatus(order.id, 'rejected')} className="gap-2 text-destructive">
                                                            <XCircle className="w-4 h-4" /> Rechazar
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status !== 'pending' && (
                                                        <DropdownMenuItem onClick={() => handleStatus(order.id, 'pending')} className="gap-2">
                                                            <Clock className="w-4 h-4 text-amber-500" /> Volver a Pendiente
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <OrderDialog
                open={dialogOpen}
                order={selectedOrder}
                onClose={() => setDialogOpen(false)}
                onSaved={load}
            />
        </div>
    )
}

export default withRole(PedidosPage, ['admin'])
