'use client'

import { useEffect, useState } from 'react'
import { Plus, Tags, Trash2, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
    getPriceLists,
    getPriceListWithPrices,
    createPriceList,
    updateProductPrice,
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

function PreciosPage() {
    const [lists, setLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedList, setSelectedList] = useState<PriceList | null>(null)
    const [prices, setPrices] = useState<ProductPrice[]>([])
    const [saving, setSaving] = useState(false)

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
            setSelectedList(list)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

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

    async function handleUpdatePrice(priceId: string, newPrice: number, productId: string) {
        try {
            const result = await updateProductPrice(priceId, newPrice, selectedList?.id, productId)
            
            // If it was a temp ID, update it to the real ID from DB
            if (priceId.startsWith('temp-') && result) {
                setPrices(prev => prev.map(p => p.product_id === productId ? { ...p, id: result.id, price: newPrice } : p))
            } else {
                setPrices(prev => prev.map(p => p.id === priceId ? { ...p, price: newPrice } : p))
            }
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    if (loading && !lists.length) {
        return <div className="py-20 text-center animate-pulse text-muted-foreground">Cargando precios...</div>
    }

    if (selectedList) {
        return (
            <div className="space-y-6">
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedList(null)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{selectedList.name}</h1>
                        <p className="text-muted-foreground">Gestioná los precios individuales de esta lista.</p>
                    </div>
                </header>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="text-amber-500 font-bold">Producto</TableHead>
                                <TableHead className="w-32 text-center text-amber-500 font-bold">Unidad</TableHead>
                                <TableHead className="w-48 text-right text-amber-500 font-bold">Precio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                                        No hay productos con stock disponibles.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                prices.map((p) => (
                                    <TableRow key={p.id} className="hover:bg-amber-500/5 transition-colors">
                                        <TableCell className="font-medium text-white text-lg">{p.product?.name}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {p.product?.unit === 'kg' ? 'Kilogramo' : 'Unidad'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-lg font-bold text-amber-500">$</span>
                                                <Input
                                                    type="number"
                                                    value={p.price}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value)
                                                        if (!isNaN(val)) {
                                                          handleUpdatePrice(p.id, val, p.product_id)
                                                        }
                                                    }}
                                                    className="w-32 text-right h-10 bg-[#1A1510] border-[#2A1F16] text-lg font-bold"
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Listas de Precios</h1>
                    <p className="text-muted-foreground">Gestioná diferentes esquemas de precios para tus clientes.</p>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold gap-2" onClick={() => setCreateOpen(true)}>
                    <Plus className="w-4 h-4" /> Nueva Lista
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists.map((list) => (
                    <div 
                        key={list.id} 
                        className="bg-card border border-border rounded-xl p-6 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between h-48 relative overflow-hidden"
                        onClick={() => handleSelectList(list)}
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                             <Tags className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Tags className="text-amber-500 w-8 h-8" />
                                <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                            </div>
                            <h3 className="text-2xl font-bold text-white group-hover:text-amber-500 transition-colors">{list.name}</h3>
                            <p className="text-xs text-muted-foreground mt-2">Creada el {new Date(list.created_at).toLocaleDateString()}</p>
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
                        <DialogTitle className="text-xl text-amber-500">Nueva Lista de Precios</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-white text-xs uppercase font-bold tracking-wider">Nombre de la lista</Label>
                            <Input
                                placeholder="Ej: Mayorista 2026"
                                value={newListData.name}
                                onChange={(e) => setNewListData(f => ({ ...f, name: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16]"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-white text-xs uppercase font-bold tracking-wider">Copiar desde (opcional)</Label>
                            <Select value={newListData.baseListId} onValueChange={(v) => setNewListData(f => ({ ...f, baseListId: v || '' }))}>
                                <SelectTrigger className="bg-[#1A1510] border-[#2A1F16]">
                                    <SelectValue placeholder="Lista base..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ninguna (vacía)</SelectItem>
                                    {lists.map(l => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {newListData.baseListId && newListData.baseListId !== 'none' && (
                            <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                <Label className="text-amber-500 text-[10px] uppercase font-bold tracking-tighter">Coeficiente de multiplicación</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        value={newListData.multiplier}
                                        onChange={(e) => setNewListData(f => ({ ...f, multiplier: e.target.value }))}
                                        className="bg-[#1A1510] border-[#2A1F16] h-10 w-24 text-center font-bold"
                                    />
                                    <div className="flex-1 text-[11px] text-muted-foreground leading-tight">
                                        Todos los precios de la lista base se multiplicarán por este valor. <br/>
                                        <span className="text-white font-bold">1.20 = +20%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-8 shadow-lg shadow-amber-500/10"
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
