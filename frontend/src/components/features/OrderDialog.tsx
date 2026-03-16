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
import { updateOrderItems, updateOrderMetadata, type OrderWithDetails } from '@/services/orders'
import { getPriceListWithPrices, type ProductPrice } from '@/services/prices'
import { getProducts } from '@/services/products'
import { getClients } from '@/services/clients'
import { createOrder } from '@/services/orders'
import type { Product, Client } from '@/types/database'

type ItemRow = { product_id: string; quantity: string; unit_price: string }
type FormData = {
    client_id: string
    delivery_date: string
    delivery_time: string
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
    const [currentPrices, setCurrentPrices] = useState<ProductPrice[]>([])

    const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<FormData>({
            defaultValues: {
                client_id: '',
                delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                delivery_time: '09:00',
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

    // Fetch prices when client changes
    useEffect(() => {
        const client = clients.find(c => c.id === selectedClientId)
        if (client?.price_list_id) {
            getPriceListWithPrices(client.price_list_id)
                .then(setCurrentPrices)
                .catch(console.error)
        } else {
            setCurrentPrices([])
        }
    }, [selectedClientId, clients])

    useEffect(() => {
        if (order) {
            reset({
                client_id: order.client_id,
                delivery_date: order.delivery_date,
                delivery_time: order.delivery_time || '09:00',
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
                delivery_time: '09:00',
                notes: '',
                items: [{ product_id: '', quantity: '1', unit_price: '0' }],
            })
        }
    }, [order, reset])

    // Auto-fill unit_price when product is selected, based on client type
    function handleProductChange(index: number, productId: string) {
        setValue(`items.${index}.product_id`, productId)
        const product = products.find((p) => p.id === productId)
        const customPrice = currentPrices.find(p => p.product_id === productId)

        if (product?.pricing_type === 'by_weight') {
            // For by_weight: price list price IS the $/kg
            const pricePerKg = customPrice?.price ?? product.base_price ?? 0
            const estimatedPrice = pricePerKg * (product.estimated_weight_kg ?? 0)
            setValue(`items.${index}.unit_price`, estimatedPrice.toString())
        } else if (customPrice) {
            setValue(`items.${index}.unit_price`, customPrice.price.toString())
        } else if (product) {
            const price = product.base_price ?? 0
            setValue(`items.${index}.unit_price`, price.toString())
        }
    }

    async function onSubmit(data: FormData) {
        try {
            const rawItems = data.items
                .filter((i) => i.product_id)
                .map((i) => ({
                    product_id: i.product_id,
                    quantity: parseFloat(i.quantity),
                    unit_price: parseFloat(i.unit_price),
                }))

            if (rawItems.length === 0) {
                toast.error('Agregá al menos un producto')
                return
            }

            // Expand by_weight items: if quantity > 1, create N rows with quantity=1
            const expandedItems: (typeof rawItems[0] & { pricePerKg?: number })[] = []
            for (const item of rawItems) {
                const prod = products.find(p => p.id === item.product_id)
                const customPrice = currentPrices.find(p => p.product_id === item.product_id)
                const currentPricePerKg = customPrice?.price ?? prod?.base_price ?? 0

                if (prod?.pricing_type === 'by_weight' && item.quantity > 1) {
                    for (let i = 0; i < item.quantity; i++) {
                        expandedItems.push({ ...item, quantity: 1, pricePerKg: currentPricePerKg })
                    }
                } else if (prod?.pricing_type === 'by_weight') {
                    expandedItems.push({ ...item, pricePerKg: currentPricePerKg })
                } else {
                    expandedItems.push(item)
                }
            }

            // Tag by_weight items as not finalized
            const itemsWithMeta = expandedItems.map((i) => {
                const prod = products.find(p => p.id === i.product_id)
                return {
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    price_per_kg: i.pricePerKg || null,
                    is_price_final: prod?.pricing_type !== 'by_weight',
                    actual_weight_kg: null as number | null,
                }
            })

            if (isEditing && order) {
                await updateOrderItems(order.id, itemsWithMeta)
                await updateOrderMetadata(order.id, {
                    delivery_date: data.delivery_date,
                    delivery_time: data.delivery_time || null,
                    notes: data.notes.trim() || null,
                })
                toast.success('Pedido actualizado')
            } else {
                await createOrder({
                    client_id: data.client_id,
                    delivery_date: data.delivery_date,
                    delivery_time: data.delivery_time || null,
                    notes: data.notes.trim() || null,
                    source: 'manual',
                    items: itemsWithMeta,
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
                        {isEditing && (
                            <div className="flex items-center gap-2">
                                <OrderStatusBadge status={order.status} />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono border-l border-border pl-2 h-3 flex items-center">
                                    ID: {order.id.split('-')[0]}
                                </span>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Cliente y fecha */}
                    <div className="grid grid-cols-2 gap-4">
                        {!isEditing && (
                            <div className="space-y-1.5">
                                <Label>Cliente</Label>
                                <Select 
                                    value={selectedClientId} 
                                    onValueChange={(v) => setValue('client_id', v as string)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente...">
                                            {clients.find(c => c.id === selectedClientId)?.name}
                                        </SelectValue>
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
                        <div className="space-y-1.5">
                            <Label htmlFor="delivery_time">Hora de entrega</Label>
                            <Input
                                id="delivery_time"
                                type="time"
                                {...register('delivery_time')}
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
                                                <SelectValue placeholder="Producto...">
                                                    {products.find(p => p.id === watch(`items.${index}.product_id`))?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.filter((p) => p.active || p.id === watch(`items.${index}.product_id`)).map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({p.unit}){p.pricing_type === 'by_weight' ? ' ⚖️' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(() => {
                                            const prod = products.find(p => p.id === watch(`items.${index}.product_id`))
                                            if (prod?.pricing_type === 'by_weight') {
                                                return (
                                                    <p className="text-[10px] text-amber-500 mt-0.5 font-medium">
                                                        ⚖️ Precio estimado — se ajusta al pesar
                                                    </p>
                                                )
                                            }
                                            return null
                                        })()}
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            step={products.find(p => p.id === watch(`items.${index}.product_id`))?.unit === 'unidad' ? '1' : '0.1'}
                                            className="text-center"
                                            {...register(`items.${index}.quantity`, {
                                                validate: (value) => {
                                                    const prod = products.find(p => p.id === watch(`items.${index}.product_id`))
                                                    if (prod?.unit === 'unidad' && !Number.isInteger(Number(value))) {
                                                        return 'Para productos por unidad use números enteros'
                                                    }
                                                    return true
                                                }
                                            })}
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
