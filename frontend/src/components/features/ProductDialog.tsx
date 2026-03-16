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
import type { Product, PricingType } from '@/types/database'

interface ProductFormData {
    name: string
    unit: string
    sort_order: number
    active: boolean
    pricing_type: PricingType
    estimated_weight_kg: string
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
            pricing_type: 'fixed',
            estimated_weight_kg: '',
        },
    })

    const pricingType = watch('pricing_type')

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                unit: product.unit,
                sort_order: product.sort_order,
                active: product.active,
                pricing_type: product.pricing_type || 'fixed',
                estimated_weight_kg: product.estimated_weight_kg?.toString() || '',
            })
        } else {
            reset({
                name: '',
                unit: 'kg',
                sort_order: 0,
                active: true,
                pricing_type: 'fixed',
                estimated_weight_kg: '',
            })
        }
    }, [product, reset])

    async function onSubmit(data: ProductFormData) {
        try {
            const payload: any = {
                name: data.name,
                unit: data.unit,
                sort_order: Number(data.sort_order),
                active: data.active,
                pricing_type: data.pricing_type,
                estimated_weight_kg: data.pricing_type === 'by_weight' && data.estimated_weight_kg ? parseFloat(data.estimated_weight_kg) : null,
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
                            value={watch('unit')}
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

                    {/* Tipo de Precio */}
                    <div className="space-y-1.5">
                        <Label>Tipo de Precio</Label>
                        <Select
                            value={pricingType}
                            onValueChange={(v) => setValue('pricing_type', v as PricingType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixed">Precio fijo</SelectItem>
                                <SelectItem value="by_weight">Precio por peso (⚖️ variable)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Campos de precio por peso */}
                    {pricingType === 'by_weight' && (
                        <div className="space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">⚖️ Configuración por peso</p>
                            <div className="space-y-1.5">
                                <Label htmlFor="estimated_weight_kg">Peso promedio por caja (kg)</Label>
                                <Input
                                    id="estimated_weight_kg"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="Ej: 15"
                                    {...register('estimated_weight_kg', {
                                        required: pricingType === 'by_weight' ? 'Requerido' : false
                                    })}
                                />
                                {errors.estimated_weight_kg && (
                                    <p className="text-xs text-destructive">{errors.estimated_weight_kg.message}</p>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Definí acá el <span className="text-amber-500 font-bold">peso promedio</span> de referencia. Al gestionar los pedidos, podrás ingresar el <span className="font-bold text-foreground">peso real de cada caja</span> para calcular el precio final exacto (Peso real × $/kg).
                            </p>
                        </div>
                    )}

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
