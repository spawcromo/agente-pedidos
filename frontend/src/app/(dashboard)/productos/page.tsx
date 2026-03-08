'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
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
import { ProductDialog } from '@/components/features/ProductDialog'
import {
    getProducts,
    deleteProduct,
    toggleProductActive,
} from '@/services/products'
import type { Product } from '@/types/database'

const ARS = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

export default function ProductosPage() {
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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
                    <p className="text-muted-foreground">
                        Catálogo de productos con precios para minoristas y mayoristas.
                    </p>
                </div>
                <Button onClick={openCreate} id="btn-nuevo-producto">
                    + Nuevo Producto
                </Button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total productos</p>
                    <p className="text-3xl font-bold">{products.length}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Activos</p>
                    <p className="text-3xl font-bold text-green-500">
                        {products.filter((p) => p.active).length}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Inactivos</p>
                    <p className="text-3xl font-bold text-muted-foreground">
                        {products.filter((p) => !p.active).length}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Producto</TableHead>
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
                                    No hay productos. Creá el primero.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    className={!product.active ? 'opacity-50' : ''}
                                >
                                    <TableCell className="text-muted-foreground text-sm">
                                        {product.sort_order}
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.unit}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {ARS.format(product.price_retail)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {ARS.format(product.price_wholesale)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={product.active ? 'default' : 'secondary'}
                                            className={product.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                                        >
                                            {product.active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                id={`menu-producto-${product.id}`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold hover:bg-accent hover:text-accent-foreground"
                                            >
                                                ···
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(product)}>
                                                    ✏️ Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                                                    {product.active ? '🔕 Desactivar' : '✅ Activar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(product)}
                                                >
                                                    🗑️ Eliminar
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
