'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createProduct, updateProduct } from '@/services/products'
import type { Product } from '@/types/database'

interface ProductFormData {
    name: string
    unit: string
    sort_order: number
    active: boolean
}

interface ProductDialogProps {
    open: boolean
    product: Product | null
    onClose: () => void
    onSaved: () => void
}

export function ProductDialog({
    open,
    product,
    onClose,
    onSaved,
}: ProductDialogProps) {
    const isEditing = !!product
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        defaultValues: {
            unit: 'kg',
            sort_order: 0,
            active: true,
        },
    })

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                unit: product.unit,
                sort_order: product.sort_order,
                active: product.active,
            })
        } else {
            reset({
                name: '',
                unit: 'kg',
                sort_order: 0,
                active: true,
            })
        }
    }, [product, reset])

    async function onSubmit(data: ProductFormData) {
        try {
            const payload = {
                ...data,
                sort_order: Number(data.sort_order),
            }
            if (isEditing) {
                await updateProduct(product.id, payload)
                toast.success('Producto actualizado')
            } else {
                await createProduct(payload)
                toast.success('Producto creado')
            }
            onSaved()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error inesperado')
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            placeholder="Ej: Pechuga"
                            {...register('name', { required: 'Requerido' })}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Unidad */}
                    <div className="space-y-1.5">
                        <Label htmlFor="unit">Unidad</Label>
                        <Select
                            defaultValue={product?.unit ?? 'kg'}
                            onValueChange={(v) => setValue('unit', v ?? 'kg')}
                        >
                            <SelectTrigger id="unit">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                                <SelectItem value="unidad">Unidad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Estado de Stock */}
                    <div className="space-y-1.5">
                        <Label htmlFor="active">Estado de Stock</Label>
                        <Select
                            value={watch('active') ? 'true' : 'false'}
                            onValueChange={(v) => setValue('active', v === 'true')}
                        >
                            <SelectTrigger id="active">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Con stock</SelectItem>
                                <SelectItem value="false">Sin stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Orden */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sort_order">Orden en el listado</Label>
                        <Input
                            id="sort_order"
                            type="number"
                            min="0"
                            {...register('sort_order')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Guardando...'
                                : isEditing
                                    ? 'Guardar cambios'
                                    : 'Crear producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
