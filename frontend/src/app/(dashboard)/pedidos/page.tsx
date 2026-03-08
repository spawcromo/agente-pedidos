'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { OrderStatusBadge } from '@/components/features/OrderStatusBadge'
import { OrderDialog } from '@/components/features/OrderDialog'
import {
    getOrders, updateOrderStatus, bulkUpdateOrderStatus, type OrderWithDetails,
} from '@/services/orders'
import type { OrderStatus } from '@/types/database'

const TODAY = new Date().toISOString().split('T')[0]
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
})

function orderTotal(order: OrderWithDetails): number {
    return (order.order_items ?? []).reduce(
        (sum, item) => sum + item.quantity * item.unit_price, 0
    )
}

export default function PedidosPage() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState(TOMORROW)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

    const load = useCallback(async () => {
        try {
            setLoading(true)
            setSelected(new Set())
            const data = await getOrders({
                delivery_date: dateFilter || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            })
            setOrders(data)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar pedidos')
        } finally {
            setLoading(false)
        }
    }, [dateFilter, statusFilter])

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
            toast.success(status === 'confirmed' ? '✅ Pedido confirmado' : '❌ Pedido rechazado')
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error')
        }
    }

    async function handleBulkConfirm() {
        if (selected.size === 0) return
        try {
            await bulkUpdateOrderStatus(Array.from(selected), 'confirmed')
            toast.success(`✅ ${selected.size} pedidos confirmados`)
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error')
        }
    }

    async function handleBulkReject() {
        if (selected.size === 0) return
        if (!confirm(`¿Rechazar ${selected.size} pedidos?`)) return
        try {
            await bulkUpdateOrderStatus(Array.from(selected), 'rejected')
            toast.success(`Pedidos rechazados`)
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

    const pending = orders.filter((o) => o.status === 'pending').length
    const confirmed = orders.filter((o) => o.status === 'confirmed').length
    const totalRevenue = orders
        .filter((o) => o.status === 'confirmed')
        .reduce((sum, o) => sum + orderTotal(o), 0)

    return (
        <div>
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

            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* ... existing stats cards are already responsive grid-cols-1 ... */}
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
                        onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}
                    >
                        <SelectTrigger className="flex-1 sm:w-40" id="filter-estado">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                            <SelectItem value="confirmed">Confirmados</SelectItem>
                            <SelectItem value="rejected">Rechazados</SelectItem>
                            <SelectItem value="delivered">Entregados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => { setDateFilter(TODAY) }}
                    >
                        Hoy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => { setDateFilter(TOMORROW) }}
                    >
                        Mañana
                    </Button>
                </div>

                {selected.size > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto sm:border-l sm:border-border sm:pl-3">
                        <span className="text-sm text-muted-foreground w-full sm:w-auto text-center">{selected.size} seleccionados</span>
                        <div className="flex gap-2 w-full">
                            <Button size="sm" onClick={handleBulkConfirm} id="btn-confirmar-masivo" className="flex-1">
                                ✅ Confirmar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={handleBulkReject} className="flex-1">
                                ❌ Rechazar
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                                            <div className="text-[11px] text-muted-foreground uppercase tracking-tight">{order.delivery_date}</div>
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
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold hover:bg-accent transition-colors"
                                                >
                                                    ···
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openEdit(order)}>
                                                        ✏️ Ver / Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {order.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleStatus(order.id, 'confirmed')}>
                                                                ✅ Confirmar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive font-medium"
                                                                onClick={() => handleStatus(order.id, 'rejected')}
                                                            >
                                                                ❌ Rechazar
                                                            </DropdownMenuItem>
                                                        </>
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
