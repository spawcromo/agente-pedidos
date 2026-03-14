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
    base_price: number
    price_wholesale: number
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
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        defaultValues: {
            name: '',
            unit: 'kg',
            base_price: 0,
            price_wholesale: 0,
            sort_order: 0,
            active: true,
        },
    })

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                unit: product.unit,
                base_price: product.base_price,
                price_wholesale: product.price_wholesale,
                sort_order: product.sort_order,
                active: product.active,
            })
        } else {
            reset({
                name: '',
                unit: 'kg',
                base_price: 0,
                price_wholesale: 0,
                sort_order: 0,
                active: true,
            })
        }
    }, [product, reset])

    async function onSubmit(data: ProductFormData) {
        try {
            const payload = {
                ...data,
                base_price: Number(data.base_price),
                price_wholesale: Number(data.price_wholesale),
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
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="unidad">Unidad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Precios */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="base_price">Precio de Lista (Base)</Label>
                            <Input
                                id="base_price"
                                type="number"
                                step="0.01"
                                min="0"
                                {...register('base_price', { required: 'Requerido', min: 0 })}
                            />
                            {errors.base_price && (
                                <p className="text-xs text-destructive">
                                    {errors.base_price.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="price_wholesale">Precio Mayorista</Label>
                            <Input
                                id="price_wholesale"
                                type="number"
                                step="0.01"
                                min="0"
                                {...register('price_wholesale', {
                                    required: 'Requerido',
                                    min: 0,
                                })}
                            />
                            {errors.price_wholesale && (
                                <p className="text-xs text-destructive">
                                    {errors.price_wholesale.message}
                                </p>
                            )}
                        </div>
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
