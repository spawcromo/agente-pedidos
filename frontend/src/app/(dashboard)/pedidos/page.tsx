'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">
                        Gestioná, confirmá y organizá los pedidos del día.
                    </p>
                </div>
                <Button onClick={openCreate} id="btn-nuevo-pedido">
                    + Nuevo Pedido
                </Button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-400">{pending}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Confirmados</p>
                    <p className="text-3xl font-bold text-green-500">{confirmed}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total confirmado</p>
                    <p className="text-2xl font-bold">{ARS.format(totalRevenue)}</p>
                </div>
            </div>

            {/* Filters + Bulk actions */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                <Input
                    id="filter-fecha"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                />
                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}
                >
                    <SelectTrigger className="w-40" id="filter-estado">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="confirmed">Confirmados</SelectItem>
                        <SelectItem value="rejected">Rechazados</SelectItem>
                        <SelectItem value="delivered">Entregados</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setDateFilter(TODAY) }}
                    >
                        Hoy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setDateFilter(TOMORROW) }}
                    >
                        Mañana
                    </Button>
                </div>

                {selected.size > 0 && (
                    <div className="flex items-center gap-2 border-l border-border pl-3">
                        <span className="text-sm text-muted-foreground">{selected.size} seleccionados</span>
                        <Button size="sm" onClick={handleBulkConfirm} id="btn-confirmar-masivo">
                            ✅ Confirmar todos
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                            ❌ Rechazar todos
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={toggleAll}
                                    id="select-all"
                                />
                            </TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Productos</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Entrega</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Origen</TableHead>
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
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                    No hay pedidos para los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className={selected.has(order.id) ? 'bg-accent/30' : ''}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selected.has(order.id)}
                                            onCheckedChange={() => toggleOne(order.id)}
                                            id={`check-${order.id}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{order.client?.name ?? '—'}</div>
                                        {order.notes && (
                                            <div className="text-xs text-muted-foreground mt-0.5 max-w-[160px] truncate">
                                                📝 {order.notes}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            {(order.order_items ?? []).slice(0, 3).map((item) => (
                                                <div key={item.id} className="text-sm">
                                                    {item.quantity} {item.product?.unit} {item.product?.name}
                                                </div>
                                            ))}
                                            {(order.order_items?.length ?? 0) > 3 && (
                                                <div className="text-xs text-muted-foreground">
                                                    +{(order.order_items?.length ?? 0) - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {ARS.format(orderTotal(order))}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {order.delivery_date}
                                    </TableCell>
                                    <TableCell>
                                        <OrderStatusBadge status={order.status} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {order.source === 'whatsapp' ? '💬' : '✏️'} {order.source}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                id={`menu-pedido-${order.id}`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold hover:bg-accent hover:text-accent-foreground"
                                            >
                                                ···
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
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
                                                            className="text-destructive"
                                                            onClick={() => handleStatus(order.id, 'rejected')}
                                                        >
                                                            ❌ Rechazar
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <DropdownMenuItem onClick={() => handleStatus(order.id, 'delivered')}>
                                                        📦 Marcar entregado
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

            <OrderDialog
                open={dialogOpen}
                order={selectedOrder}
                onClose={() => setDialogOpen(false)}
                onSaved={load}
            />
        </div>
    )
}
