'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getProductionSummary, type ProductionSummaryRow } from '@/services/production'

const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0]

export default function ProduccionPage() {
    const [date, setDate] = useState(TOMORROW)
    const [rows, setRows] = useState<ProductionSummaryRow[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            setLoading(true)
            setRows(await getProductionSummary(date))
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar')
        } finally {
            setLoading(false)
        }
    }, [date])

    useEffect(() => { load() }, [load])

    const totalItems = rows.reduce((s, r) => s + r.order_count, 0)

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Producción</h1>
                    <p className="text-muted-foreground">
                        Totales a preparar según pedidos confirmados.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        const text = rows
                            .map((r) => `${r.product_name}: ${r.total_quantity} ${r.unit}`)
                            .join('\n')
                        navigator.clipboard.writeText(text)
                        toast.success('Copiado al portapapeles')
                    }}
                    id="btn-copiar-resumen"
                    className="w-full sm:w-auto"
                >
                    📋 Copiar resumen
                </Button>
            </div>

            {/* Date filter */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex gap-2 w-full sm:w-auto">
                    <Input
                        id="fecha-produccion"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 sm:w-44"
                    />
                </div>
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
                {!loading && rows.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                        {rows.length} productos · {totalItems} pedidos
                    </span>
                )}
            </div>

            {/* Summary table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-[150px]">Producto</TableHead>
                                <TableHead className="text-center">Unidad</TableHead>
                                <TableHead className="text-right text-lg font-bold">
                                    Total
                                </TableHead>
                                <TableHead className="text-right whitespace-nowrap">Cant. Pedidos</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-16 text-center">
                                        <div className="text-4xl mb-3">📦</div>
                                        <div className="text-muted-foreground">
                                            Sin pedidos para el <span className="font-medium text-foreground">{date}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow key={row.product_id} className="hover:bg-muted/30">
                                        <TableCell className="font-semibold text-base">{row.product_name}</TableCell>
                                        <TableCell className="text-center text-muted-foreground uppercase text-xs">{row.unit}</TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-2xl font-bold tabular-nums text-amber-500">
                                                {row.total_quantity}
                                            </span>{' '}
                                            <span className="text-sm text-muted-foreground">{row.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {row.order_count}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Bottom copy hint */}
            {rows.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                    Tip: usá &quot;Copiar resumen&quot; para pegar la lista en WhatsApp o papel.
                </p>
            )}
        </div>
    )
}
