'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Tags, Trash2, ChevronRight, ArrowLeft, Save, X as CloseIcon, Filter } from 'lucide-react'
import { toast } from 'sonner'
import {
    getPriceLists,
    getPriceListWithPrices,
    createPriceList,
    bulkUpdateProductPrices,
    deletePriceList,
    type PriceList,
    type ProductPrice
} from '@/services/prices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { withRole } from '@/components/hoc/withRole'
import { cn } from '@/lib/utils'

function PreciosPage() {
    const [lists, setLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedList, setSelectedList] = useState<PriceList | null>(null)
    const [prices, setPrices] = useState<ProductPrice[]>([])
    const [editedPrices, setEditedPrices] = useState<Record<string, number>>({})
    const [saving, setSaving] = useState(false)
    const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')

    // Modal Create List
    const [createOpen, setCreateOpen] = useState(false)
    const [newListData, setNewListData] = useState({ name: '', baseListId: '', multiplier: '1.0' })

    useEffect(() => {
        loadLists()
    }, [])

    async function loadLists() {
        try {
            setLoading(true)
            const data = await getPriceLists()
            setLists(data)
            
            // Pre-select 'Lista Base' if it exists
            const baseList = data.find(l => l.name === 'Lista Base')
            if (baseList) {
                setNewListData(prev => ({ ...prev, baseListId: baseList.id }))
            }
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleSelectList(list: PriceList) {
        try {
            setLoading(true)
            const data = await getPriceListWithPrices(list.id)
            setPrices(data)
            setEditedPrices({})
            setSelectedList(list)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredPrices = useMemo(() => {
        if (stockFilter === 'all') return prices
        if (stockFilter === 'in_stock') return prices.filter(p => p.product?.active)
        return prices.filter(p => !p.product?.active)
    }, [prices, stockFilter])

    async function handleCreateList() {
        try {
            setSaving(true)
            await createPriceList(
                newListData.name,
                newListData.baseListId || undefined,
                parseFloat(newListData.multiplier)
            )
            toast.success('Lista de precios creada')
            setCreateOpen(false)
            setNewListData({ name: '', baseListId: '', multiplier: '1.0' })
            loadLists()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const hasChanges = Object.keys(editedPrices).length > 0

    async function handleSaveAll() {
        if (!selectedList) return
        try {
            setSaving(true)
            const payload = Object.entries(editedPrices).map(([productId, price]) => ({
                price_list_id: selectedList.id,
                product_id: productId,
                price
            }))
            
            await bulkUpdateProductPrices(payload)
            toast.success('Precios actualizados correctamente')
            
            // Reload to get actual IDs and sync
            const data = await getPriceListWithPrices(selectedList.id)
            setPrices(data)
            setEditedPrices({})
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    function handleCancel() {
        setEditedPrices({})
    }

    if (loading && !lists.length) {
        return <div className="py-20 text-center animate-pulse text-muted-foreground">Cargando precios...</div>
    }

    if (selectedList) {
        return (
            <div className="space-y-4 max-w-3xl">
                <header className="flex items-center justify-between gap-4 bg-card/50 p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedList(null)} className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">{selectedList.name}</h1>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Edición de precios</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
                            <SelectTrigger className="w-[140px] h-8 bg-[#1A1510] border-[#2A1F16] text-[10px] uppercase font-bold">
                                <Filter className="w-3 h-3 mr-2 opacity-50" />
                                <SelectValue placeholder="Stock..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#14100C] border-[#2A1F16]">
                                <SelectItem value="all" className="text-xs">Todos</SelectItem>
                                <SelectItem value="in_stock" className="text-xs">Con Stock</SelectItem>
                                <SelectItem value="out_of_stock" className="text-xs">Sin Stock</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasChanges && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleCancel}
                                    className="h-8 py-0 px-3 text-[10px] font-bold border-border/50 hover:bg-red-500/10 hover:text-red-500"
                                >
                                    <CloseIcon className="w-3 h-3 mr-1" /> Cancelar
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleSaveAll}
                                    disabled={saving}
                                    className="h-8 py-0 px-3 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-lg shadow-amber-500/10 border-none"
                                >
                                    <Save className="w-3 h-3 mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 border-b border-border hover:bg-muted/30 h-7">
                                <TableHead className="text-amber-500/80 font-bold text-[9px] uppercase tracking-wider h-7 py-0 px-4">Producto</TableHead>
                                <TableHead className="w-16 text-center text-amber-500/80 font-bold text-[9px] uppercase tracking-wider h-7 py-0">Unidad</TableHead>
                                <TableHead className="w-28 text-right text-amber-500/80 font-bold text-[9px] uppercase tracking-wider h-7 py-0 px-4">Precio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPrices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-xs">
                                        No hay productos que coincidan con el filtro.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPrices.map((p) => {
                                    const currentPrice = editedPrices[p.product_id] ?? p.price
                                    const isEdited = editedPrices[p.product_id] !== undefined
                                    
                                    return (
                                        <TableRow 
                                            key={p.id} 
                                            className={cn(
                                                "hover:bg-amber-500/[0.03] border-b border-border/40 group h-8 transition-colors",
                                                !p.product?.active && "opacity-40 grayscale-[0.5]"
                                            )}
                                        >
                                            <TableCell className="py-0.5 px-4 h-8">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-white/90">{p.product?.name}</span>
                                                    {!p.product?.active && (
                                                        <span className="text-[7px] uppercase bg-red-500/10 text-red-500 px-1 py-0 rounded border border-red-500/20 font-black tracking-tighter">
                                                            S-STOCK
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-0.5 h-8">
                                                <span className="text-[9px] text-muted-foreground uppercase font-black opacity-60">
                                                    {p.product?.unit === 'kg' ? 'Kg' : p.product?.unit === 'caja' ? 'Caja' : 'Ud'}
                                                </span>
                                                {p.product?.pricing_type === 'by_weight' && (
                                                    <span className="text-[8px] text-amber-500 font-black block leading-none">⚖️ $/kg</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-0.5 px-4 h-8">
                                                <div className="flex items-center justify-end gap-1.5 h-full">
                                                    <span className={cn(
                                                        "text-[10px] font-black",
                                                        isEdited ? 'text-amber-500 animate-pulse' : 'text-amber-500/40'
                                                    )}>$</span>
                                                    <Input
                                                        type="number"
                                                        value={currentPrice}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value)
                                                            if (!isNaN(val)) {
                                                                setEditedPrices(prev => ({ ...prev, [p.product_id]: val }))
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-20 text-right h-6 px-1.5 text-xs font-bold bg-[#1A1510] transition-all border-none focus-visible:ring-1 focus-visible:ring-amber-500/50",
                                                            isEdited 
                                                            ? 'text-amber-500 bg-amber-500/10' 
                                                            : 'text-white/80'
                                                        )}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                {hasChanges && (
                    <div className="flex justify-between items-center px-2">
                        <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-widest italic animate-pulse">
                            * CAMBIOS SIN GUARDAR
                        </p>
                        <p className="text-[9px] text-muted-foreground font-medium">
                            {Object.keys(editedPrices).length} productos modificados
                        </p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Listas de Precios</h1>
                    <p className="text-muted-foreground text-sm">Gestioná diferentes esquemas de precios para tus clientes.</p>
                </div>
                <Button 
                    className="w-full sm:w-auto h-10 px-6 gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95" 
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="w-4 h-4" /> Nueva Lista
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists.map((list) => (
                    <div 
                        key={list.id} 
                        className="bg-card border border-border rounded-xl p-5 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between h-40 relative overflow-hidden"
                        onClick={() => handleSelectList(list)}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                             <Tags className="w-20 h-20" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <Tags className="text-amber-500 w-7 h-7" />
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors">{list.name}</h3>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 opacity-60">
                                {new Date(list.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex justify-end relative z-10">
                             {list.name !== 'Lista Base' && (
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if(confirm(`¿Eliminar la lista "${list.name}"? Los clientes asignados quedarán sin lista.`)) {
                                            setLoading(true)
                                            deletePriceList(list.id).then(loadLists).catch(err => toast.error(err.message))
                                        }
                                    }}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                             )}
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md bg-[#14100C] border-[#2A1F16]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-amber-500 uppercase tracking-tighter">Nueva Lista de Precios</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-white text-[10px] uppercase font-black tracking-widest opacity-70">Nombre de la lista</Label>
                            <Input
                                placeholder="Ej: Mayorista 2026"
                                value={newListData.name}
                                onChange={(e) => setNewListData(f => ({ ...f, name: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16] h-10 font-bold"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-white text-[10px] uppercase font-black tracking-widest opacity-70">Origen de los precios</Label>
                            <div className="bg-[#1A1510] border border-[#2A1F16] h-10 px-3 flex items-center rounded-md">
                                <span className="text-amber-500 font-bold text-xs">LISTA BASE</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic mt-1">Se tomarán los precios actuales de la Lista Base.</p>
                        </div>

                        {newListData.baseListId && (
                            <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                <Label className="text-amber-500 text-[10px] uppercase font-black tracking-tighter">Coeficiente de multiplicación</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        value={newListData.multiplier}
                                        onChange={(e) => setNewListData(f => ({ ...f, multiplier: e.target.value }))}
                                        className="bg-[#1A1510] border-[#2A1F16] h-10 w-24 text-center font-bold text-amber-500"
                                    />
                                    <div className="flex-1 text-[10px] text-muted-foreground leading-tight font-medium">
                                        Todos los precios se multiplicarán. <br/>
                                        <span className="text-white font-black">1.10 = +10%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-[10px] font-bold">Cancelar</Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-8 shadow-lg shadow-amber-500/10 text-[10px]"
                            disabled={saving || !newListData.name}
                            onClick={handleCreateList}
                        >
                            {saving ? 'Creando...' : 'Crear Lista'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default withRole(PreciosPage, ['admin'])
