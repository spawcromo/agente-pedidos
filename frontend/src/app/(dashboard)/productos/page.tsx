'use client'

import { useEffect, useState, useCallback } from 'react'
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
    Power,
    Trash2,
    MoreHorizontal,
    Eye,
    EyeOff
} from "lucide-react"
import { ProductDialog } from '@/components/features/ProductDialog'
import {
    getProducts,
    deleteProduct,
    toggleProductActive,
} from '@/services/products'
import type { Product } from '@/types/database'
import { withRole } from '@/components/hoc/withRole'

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

function ProductosPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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
            toast.success(`Producto ${!product.active ? 'activado' : 'desactivado'}`)
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al actualizar estado')
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
                    <p className="text-muted-foreground">
                        Catálogo de productos y precios.
                    </p>
                </div>
                <Button onClick={openCreate} id="btn-nuevo-producto" className="w-full sm:w-auto gap-2">
                    <Plus className="w-4 h-4" /> Nuevo Producto
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-8">#</TableHead>
                                <TableHead className="min-w-[150px]">Producto</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead className="text-right">Minorista</TableHead>
                                <TableHead className="text-right">Mayorista</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                        No hay productos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow
                                        key={product.id}
                                        className={cn(
                                            "transition-colors",
                                            !product.active ? 'opacity-50 grayscale' : ''
                                        )}
                                    >
                                        <TableCell className="text-muted-foreground text-xs font-mono">
                                            {product.sort_order}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 h-5">
                                                {product.unit}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium text-amber-500">
                                            {ARS.format(product.price_retail)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium text-emerald-500">
                                            {ARS.format(product.price_wholesale)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={product.active ? 'default' : 'secondary'}
                                                className={product.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
                                            >
                                                {product.active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    id={`menu-producto-${product.id}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openEdit(product)} className="gap-2">
                                                        <Edit2 className="w-4 h-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleActive(product)} className="gap-2">
                                                        {product.active ? (
                                                            <><EyeOff className="w-4 h-4" /> Desactivar</>
                                                        ) : (
                                                            <><Eye className="w-4 h-4" /> Activar</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive font-medium gap-2"
                                                        onClick={() => handleDelete(product)}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Eliminar
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
