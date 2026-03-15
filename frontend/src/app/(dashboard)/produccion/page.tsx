'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Copy, ClipboardList } from "lucide-react"
import { getProductionSummary, type ProductionSummaryRow } from '@/services/production'
import { withRole } from '@/components/hoc/withRole'
import { cn } from '@/lib/utils'

function ProduccionPage() {
    const [date, setDate] = useState('')
    const [rows, setRows] = useState<ProductionSummaryRow[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        setDate(tomorrow)
        setMounted(true)
    }, [])

    const load = useCallback(async () => {
        if (!mounted || !date) return
        try {
            setLoading(true)
            setRows(await getProductionSummary(date))
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar')
        } finally {
            setLoading(false)
        }
    }, [date, mounted])

    useEffect(() => { load() }, [load])

    const totalItems = rows.reduce((s, r) => s + r.order_count, 0)

    if (!mounted || !date) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="animate-spin text-amber-500">
                    <Package className="w-10 h-10" />
                </div>
                <p>Cargando producción...</p>
            </div>
        )
    }

    return (
        <div suppressHydrationWarning>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Producción por día</h1>
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
                    className="w-full sm:w-auto gap-2"
                >
                    <Copy className="w-4 h-4" /> Copiar resumen
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
                    {(() => {
                        const d = new Date()
                        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        const isToday = date === today

                        d.setDate(d.getDate() + 1)
                        const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        const isTomorrow = date === tomorrow

                        return (
                            <>
                                <Button
                                    variant={isToday ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "flex-1 sm:flex-none",
                                        isToday && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-amber-500 font-bold"
                                    )}
                                    onClick={() => setDate(today)}
                                >
                                    Hoy
                                </Button>
                                <Button
                                    variant={isTomorrow ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "flex-1 sm:flex-none",
                                        isTomorrow && "bg-amber-500 hover:bg-amber-600 text-amber-950 border-amber-500 font-bold"
                                    )}
                                    onClick={() => setDate(tomorrow)}
                                >
                                    Mañana
                                </Button>
                            </>
                        )
                    })()}
                </div>
                {!loading && rows.length > 0 && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 py-1.5 px-3 rounded-full text-xs font-bold gap-2 ml-auto">
                        <Package className="w-3.5 h-3.5" /> {rows.length} Productos · <ClipboardList className="w-3.5 h-3.5" /> {totalItems} Pedidos
                    </Badge>
                )}
            </div>

            {/* Production Content - Card Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-card/20 border border-dashed border-border rounded-xl">
                    <div className="animate-spin text-amber-500">
                        <Package className="w-8 h-8" />
                    </div>
                    <p className="font-medium">Cargando datos de producción...</p>
                </div>
            ) : rows.length === 0 ? (
                <div className="py-20 text-center bg-card/20 border border-dashed border-border rounded-xl">
                    <div className="flex justify-center mb-4">
                        <Package className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-xl font-bold text-muted-foreground">Sin pedidos para el {date}</h3>
                    <p className="text-sm text-muted-foreground/60 mt-1">Cuando se confirmen pedidos para esta fecha, aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rows.map((row) => (
                        <div 
                            key={row.product_id}
                            className="bg-card border border-border/50 hover:border-amber-500/30 transition-all rounded-xl p-5 group relative overflow-hidden"
                        >
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold leading-tight group-hover:text-amber-500 transition-colors">
                                            {row.product_name}
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 opacity-60 uppercase">
                                            {row.unit}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1">
                                        <ClipboardList className="w-3 h-3" /> {row.order_count} Pedidos
                                    </p>
                                </div>

                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-4xl font-black text-amber-500 tabular-nums">
                                        {row.total_quantity}
                                    </span>
                                    <span className="text-sm font-bold text-muted-foreground uppercase">
                                        {row.unit}
                                    </span>
                                </div>
                            </div>
                            {/* Accent decorative element */}
                            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom copy hint */}
            {rows.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                    Tip: usá &quot;Copiar resumen&quot; para pegar la lista en WhatsApp o papel.
                </p>
            )}
        </div>
    )
}

export default withRole(ProduccionPage, ['admin'])
