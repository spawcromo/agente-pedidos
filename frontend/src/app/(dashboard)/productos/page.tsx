'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Plus,
    Edit2,
    Trash2,
    MoreHorizontal,
    Eye,
    EyeOff,
    Filter
} from "lucide-react"
import { ProductDialog } from '@/components/features/ProductDialog'
import {
    getProducts,
    deleteProduct,
    toggleProductActive,
} from '@/services/products'
import type { Product } from '@/types/database'
import { withRole } from '@/components/hoc/withRole'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

function ProductosPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')

    const load = useCallback(async () => {
        try {
            setLoading(true)
            setProducts(await getProducts())
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar productos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const filteredProducts = useMemo(() => {
        if (stockFilter === 'all') return products
        if (stockFilter === 'in_stock') return products.filter(p => p.active)
        return products.filter(p => !p.active)
    }, [products, stockFilter])

    function openCreate() {
        setSelectedProduct(null)
        setDialogOpen(true)
    }

    function openEdit(product: Product) {
        setSelectedProduct(product)
        setDialogOpen(true)
    }

    async function handleDelete(product: Product) {
        if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return
        try {
            await deleteProduct(product.id)
            toast.success('Producto eliminado')
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al eliminar')
        }
    }

    async function handleToggleActive(product: Product) {
        try {
            await toggleProductActive(product.id, !product.active)
            toast.success(`Stock actualizado: ${!product.active ? 'Con stock' : 'Sin stock'}`)
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al actualizar estado')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
                    <p className="text-muted-foreground text-sm">
                        Catálogo de productos y disponibilidad de stock.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                        <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
                            <SelectTrigger className="w-[180px] h-9 bg-card">
                                <Filter className="w-4 h-4 mr-2 opacity-50" />
                                <SelectValue placeholder="Filtrar por stock" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los productos</SelectItem>
                                <SelectItem value="in_stock">Con stock</SelectItem>
                                <SelectItem value="out_of_stock">Sin stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        onClick={openCreate} 
                        id="btn-nuevo-producto" 
                        className="w-full sm:w-auto h-10 px-6 gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border">
                                <TableHead className="py-2 h-9 text-[10px] uppercase font-bold tracking-wider text-amber-500/80">Producto</TableHead>
                                <TableHead className="py-2 h-9 text-[10px] uppercase font-bold tracking-wider text-amber-500/80">Unidad</TableHead>
                                <TableHead className="py-2 h-9 text-[10px] uppercase font-bold tracking-wider text-amber-500/80">Estado de Stock</TableHead>
                                <TableHead className="py-2 h-9 w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-20 text-center text-muted-foreground animate-pulse">
                                        Cargando catálogo...
                                    </TableCell>
                                </TableRow>
                            ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-20 text-center text-muted-foreground italic">
                                        {products.length === 0 ? 'No hay productos registrados.' : 'No hay productos que coincidan con el filtro.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <TableRow
                                        key={product.id}
                                        className={cn(
                                            "transition-colors border-b border-border/50 h-10 hover:bg-amber-500/[0.02]",
                                            !product.active ? 'opacity-50 grayscale' : ''
                                        )}
                                    >
                                        <TableCell className="py-1 font-medium text-white/90">
                                            {product.name}
                                        </TableCell>
                                        <TableCell className="py-1">
                                            <span className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground">
                                                {product.unit === 'kg' ? 'Kilogramo' : 'Unidad'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-1">
                                            <Badge
                                                variant={product.active ? 'default' : 'secondary'}
                                                className={cn(
                                                    "text-[10px] uppercase font-bold px-1.5 h-5",
                                                    product.active 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                )}
                                            >
                                                {product.active ? 'Con stock' : 'Sin stock'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-1 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    id={`menu-producto-${product.id}`}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white/5 transition-colors text-muted-foreground"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 bg-[#14100C] border-[#2A1F16]">
                                                    <DropdownMenuItem onClick={() => openEdit(product)} className="gap-2 text-xs">
                                                        <Edit2 className="w-3.5 h-3.5" /> Editar Producto
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleActive(product)} className="gap-2 text-xs">
                                                        {product.active ? (
                                                            <><EyeOff className="w-3.5 h-3.5" /> Marcar sin stock</>
                                                        ) : (
                                                            <><Eye className="w-3.5 h-3.5" /> Marcar con stock</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-[#2A1F16]" />
                                                    <DropdownMenuItem
                                                        className="text-red-400 focus:text-red-400 focus:bg-red-400/10 text-xs font-medium gap-2"
                                                        onClick={() => handleDelete(product)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                                    </DropdownMenuItem>
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

            {/* Dialog */}
            <ProductDialog
                open={dialogOpen}
                product={selectedProduct}
                onClose={() => setDialogOpen(false)}
                onSaved={load}
            />
        </div>
    )
}

export default withRole(ProductosPage, ['admin'])
