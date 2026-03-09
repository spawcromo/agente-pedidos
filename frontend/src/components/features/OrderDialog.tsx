'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { OrderStatusBadge } from '@/components/features/OrderStatusBadge'
import { updateOrderItems, updateOrderNotes, type OrderWithDetails } from '@/services/orders'
import { getProducts } from '@/services/products'
import { getClients } from '@/services/clients'
import { createOrder } from '@/services/orders'
import type { Product, Client } from '@/types/database'

type ItemRow = { product_id: string; quantity: string; unit_price: string }
type FormData = {
    client_id: string
    delivery_date: string
    notes: string
    items: ItemRow[]
}

interface OrderDialogProps {
    open: boolean
    order: OrderWithDetails | null  // null = new order
    onClose: () => void
    onSaved: () => void
}

export function OrderDialog({ open, order, onClose, onSaved }: OrderDialogProps) {
    const isEditing = !!order
    const [products, setProducts] = useState<Product[]>([])
    const [clients, setClients] = useState<Client[]>([])

    const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<FormData>({
            defaultValues: {
                client_id: '',
                delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                notes: '',
                items: [{ product_id: '', quantity: '1', unit_price: '0' }],
            },
        })

    const { fields, append, remove } = useFieldArray({ control, name: 'items' })
    const selectedClientId = watch('client_id')

    useEffect(() => {
        getProducts().then(setProducts).catch(console.error)
        getClients().then(setClients).catch(console.error)
    }, [])

    useEffect(() => {
        if (order) {
            reset({
                client_id: order.client_id,
                delivery_date: order.delivery_date,
                notes: order.notes ?? '',
                items: order.order_items?.map((oi) => ({
                    product_id: oi.product_id,
                    quantity: oi.quantity.toString(),
                    unit_price: oi.unit_price.toString(),
                })) ?? [],
            })
        } else {
            reset({
                client_id: '',
                delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                notes: '',
                items: [{ product_id: '', quantity: '1', unit_price: '0' }],
            })
        }
    }, [order, reset])

    // Auto-fill unit_price when product is selected, based on client type
    function handleProductChange(index: number, productId: string) {
        setValue(`items.${index}.product_id`, productId)
        const product = products.find((p) => p.id === productId)
        const client = clients.find((c) => c.id === selectedClientId)
        if (product && client) {
            const price = client.client_type === 'wholesale' ? product.price_wholesale : product.price_retail
            setValue(`items.${index}.unit_price`, price.toString())
        }
    }

    async function onSubmit(data: FormData) {
        try {
            const items = data.items
                .filter((i) => i.product_id)
                .map((i) => ({
                    product_id: i.product_id,
                    quantity: parseFloat(i.quantity),
                    unit_price: parseFloat(i.unit_price),
                }))

            if (items.length === 0) {
                toast.error('Agregá al menos un producto')
                return
            }

            if (isEditing) {
                await updateOrderItems(order.id, items)
                await updateOrderNotes(order.id, data.notes.trim() || null)
                toast.success('Pedido actualizado')
            } else {
                await createOrder({
                    client_id: data.client_id,
                    delivery_date: data.delivery_date,
                    notes: data.notes.trim() || null,
                    source: 'manual',
                    items,
                })
                toast.success('Pedido creado')
            }
            onSaved()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error inesperado')
        }
    }

    const title = isEditing
        ? `Editar Pedido — ${order.client?.name}`
        : 'Nuevo Pedido Manual'

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle>{title}</DialogTitle>
                        {isEditing && <OrderStatusBadge status={order.status} />}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Cliente y fecha */}
                    <div className="grid grid-cols-2 gap-4">
                        {!isEditing && (
                            <div className="space-y-1.5">
                                <Label>Cliente</Label>
                                <Select onValueChange={(v) => setValue('client_id', v as string)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label htmlFor="delivery_date">Fecha de entrega</Label>
                            <Input
                                id="delivery_date"
                                type="date"
                                {...register('delivery_date', { required: true })}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Productos</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ product_id: '', quantity: '1', unit_price: '0' })}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" /> Agregar producto
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                                <span className="col-span-5">Producto</span>
                                <span className="col-span-3 text-center">Cantidad</span>
                                <span className="col-span-3 text-center">Precio unit.</span>
                                <span className="col-span-1" />
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-5">
                                        <Select
                                            value={watch(`items.${index}.product_id`)}
                                            onValueChange={(v) => handleProductChange(index, v as string)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Producto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.filter((p) => p.active).map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({p.unit})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            className="text-center"
                                            {...register(`items.${index}.quantity`)}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="text-center"
                                            {...register(`items.${index}.unit_price`)}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Notas del pedido</Label>
                        <Textarea
                            id="notes"
                            placeholder="Instrucciones especiales de entrega..."
                            rows={2}
                            {...register('notes')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear pedido'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
