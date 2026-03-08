'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    getOrders,
    updateOrderStatus,
    type OrderWithDetails,
} from '@/services/orders'

const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

export default function RepartoPage() {
    const [date, setDate] = useState(TOMORROW)
    const [orders, setOrders] = useState<OrderWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            setLoading(true)
            // Solo traemos confirmados y entregados para el reparto
            const data = await getOrders({
                delivery_date: date,
            })
            // Filtramos en cliente para asegurar solo lo que va a reparto
            setOrders(data.filter(o => o.status === 'confirmed' || o.status === 'delivered'))
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar reparto')
        } finally {
            setLoading(false)
        }
    }, [date])

    useEffect(() => { load() }, [load])

    async function handleMarkDelivered(id: string) {
        try {
            await updateOrderStatus(id, 'delivered')
            toast.success('Pedido marcado como entregado')
            load()
        } catch (err) {
            toast.error('Error al actualizar estado')
        }
    }

    const totalToCollect = orders
        .filter(o => o.status === 'confirmed')
        .reduce((sum, o) => sum + o.order_items.reduce((s, i) => s + (i.quantity * i.unit_price), 0), 0)

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hoja de Reparto</h1>
                    <p className="text-muted-foreground">
                        Pedidos confirmados para procesar la entrega.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="flex-1 sm:flex-none"
                    >
                        🖨️ Imprimir
                    </Button>
                </div>
            </div>

            {/* Date Filter & Stats */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full sm:w-44"
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => setDate(new Date().toISOString().split('T')[0])}
                        >
                            Hoy
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => setDate(TOMORROW)}
                        >
                            Mañana
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Entregas</p>
                        <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Por Cobrar</p>
                        <p className="text-2xl font-bold text-emerald-500 tabular-nums">{ARS.format(totalToCollect)}</p>
                    </div>
                    <div className="hidden sm:block bg-card border border-border rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pendientes</p>
                        <p className="text-2xl font-bold text-amber-500 tabular-nums">
                            {orders.filter(o => o.status === 'confirmed').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stops List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center text-muted-foreground">Cargando paradas...</div>
                ) : orders.length === 0 ? (
                    <div className="py-20 text-center bg-card border border-dashed border-border rounded-2xl">
                        <p className="text-4xl mb-4">🚚</p>
                        <p className="text-muted-foreground">No hay pedidos confirmados para esta fecha.</p>
                        <p className="text-xs text-muted-foreground mt-1">Confirmá pedidos desde la sección Pedidos.</p>
                    </div>
                ) : (
                    orders.map((order, index) => (
                        <div
                            key={order.id}
                            className={cn(
                                "group relative bg-card border border-border rounded-2xl p-5 transition-all shadow-sm",
                                order.status === 'delivered' ? 'opacity-60 bg-muted/20' : 'hover:border-amber-500/50'
                            )}
                        >
                            {/* Stop Number */}
                            <div className="absolute -left-3 top-5 h-8 w-8 bg-amber-500 text-amber-950 rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-background print:border-transparent">
                                {index + 1}
                            </div>

                            <div className="pl-6">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    {/* Client & Address */}
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-foreground">
                                                {order.client?.name}
                                            </h3>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {order.client?.client_type === 'wholesale' ? 'Mayorista' : 'Minorista'}
                                            </Badge>
                                        </div>
                                        <p className="text-amber-500 font-medium flex items-center gap-1">
                                            📍 {order.client?.address || 'Sin dirección cargada'}
                                        </p>
                                        <div className="flex gap-3 text-sm text-muted-foreground pt-1">
                                            <a href={`tel:${order.client?.phone}`} className="hover:text-foreground">
                                                📞 {order.client?.phone}
                                            </a>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.client?.address || '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-400 hover:underline"
                                            >
                                                Ver en Maps ↗
                                            </a>
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                        {order.status === 'delivered' ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-1 px-3">
                                                ✓ Entregado
                                            </Badge>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleMarkDelivered(order.id)}
                                                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold"
                                            >
                                                Marcar Entregado
                                            </Button>
                                        )}
                                        <p className="text-lg font-mono font-bold text-foreground sm:mt-2">
                                            {ARS.format(order.order_items.reduce((s, i) => s + (i.quantity * i.unit_price), 0))}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Summary */}
                                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-muted/30 px-3 py-1.5 rounded-lg">
                                            <span className="text-muted-foreground">{item.product?.name}</span>
                                            <span className="font-bold flex items-center gap-2">
                                                <span className="text-amber-500">{item.quantity}</span>
                                                <span className="text-[10px] uppercase text-muted-foreground">{item.product?.unit}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {order.notes && (
                                    <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs">
                                        <span className="font-bold text-amber-500 mr-2">NOTAS:</span>
                                        {order.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
