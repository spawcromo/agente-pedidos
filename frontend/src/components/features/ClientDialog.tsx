'use client'

import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClientRecord, updateClientRecord, type ClientPayload } from '@/services/clients'
import { getPriceLists, type PriceList } from '@/services/prices'
import type { Client } from '@/types/database'

type FormData = {
    name: string
    phone: string
    address: string
    lat: string
    lng: string
    opening_hours: string
    client_type: 'retail' | 'wholesale'
    notes: string
    price_list_id: string
}

interface ClientDialogProps {
    open: boolean
    client: Client | null
    onClose: () => void
    onSaved: () => void
}

export function ClientDialog({ open, client, onClose, onSaved }: ClientDialogProps) {
    const isEditing = !!client
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [loadingLists, setLoadingLists] = useState(true)

    useEffect(() => {
        getPriceLists()
            .then(setPriceLists)
            .catch(err => {
                console.error(err)
                toast.error('Error al cargar listas de precios')
            })
            .finally(() => setLoadingLists(false))
    }, [])

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        defaultValues: {
            name: '',
            phone: '',
            address: '',
            lat: '',
            lng: '',
            opening_hours: '',
            client_type: 'retail',
            notes: '',
            price_list_id: ''
        },
    })

    useEffect(() => {
        if (client) {
            reset({
                name: client.name,
                phone: client.phone,
                address: client.address,
                lat: client.lat?.toString() ?? '',
                lng: client.lng?.toString() ?? '',
                opening_hours: client.opening_hours ?? '',
                client_type: client.client_type,
                notes: client.notes ?? '',
                price_list_id: client.price_list_id ?? ''
            })
        } else {
            reset({
                name: '', phone: '', address: '', lat: '', lng: '',
                opening_hours: '', client_type: 'retail', notes: '',
                price_list_id: ''
            })
        }
    }, [client, reset])

    async function onSubmit(data: FormData) {
        try {
            const payload: ClientPayload = {
                name: data.name.trim(),
                phone: data.phone.trim(),
                address: data.address.trim(),
                lat: data.lat ? parseFloat(data.lat) : null,
                lng: data.lng ? parseFloat(data.lng) : null,
                opening_hours: data.opening_hours.trim() || null,
                client_type: data.client_type,
                notes: data.notes.trim() || null,
                price_list_id: data.price_list_id.trim() || null,
            }

            if (isEditing) {
                await updateClientRecord(client.id, payload)
                toast.success('Cliente actualizado')
            } else {
                await createClientRecord(payload)
                toast.success('Cliente creado')
            }
            onSaved()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error inesperado')
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Nombre y Teléfono */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Carnicería Don Pedro"
                                {...register('name', { required: 'Requerido' })}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                            <Input
                                id="phone"
                                placeholder="+5492614001001"
                                {...register('phone', { required: 'Requerido' })}
                            />
                            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                        </div>
                    </div>

                    {/* Lista de Precios */}
                    <div className="space-y-1.5">
                        <Label htmlFor="price_list_id">Lista de Precios</Label>
                        {loadingLists ? (
                            <div className="h-10 w-full animate-pulse bg-muted/50 rounded-md border border-border flex items-center px-3 text-xs text-muted-foreground outline-none">
                                Cargando listas...
                            </div>
                        ) : (
                            <Select
                                value={watch('price_list_id') || undefined}
                                onValueChange={(v) => setValue('price_list_id', v || '')}
                            >
                                <SelectTrigger id="price_list_id" className="w-full">
                                    <SelectValue placeholder="Seleccionar lista de precios..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {priceLists.map(pl => (
                                        <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                                    ))}
                                    {priceLists.length === 0 && (
                                        <div className="p-2 text-xs text-center text-muted-foreground">
                                            No hay listas creadas
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Dirección */}
                    <div className="space-y-1.5">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            placeholder="Ej: San Martín 450, Ciudad, Mendoza"
                            {...register('address', { required: 'Requerido' })}
                        />
                        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                    </div>

                    {/* Coordenadas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="lat">Latitud</Label>
                            <Input
                                id="lat"
                                placeholder="-32.8895"
                                {...register('lat')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lng">Longitud</Label>
                            <Input
                                id="lng"
                                placeholder="-68.8458"
                                {...register('lng')}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-2">
                        Opcional. Necesario para optimización de rutas.
                    </p>

                    {/* Horario */}
                    <div className="space-y-1.5">
                        <Label htmlFor="opening_hours">Horario de apertura</Label>
                        <Input
                            id="opening_hours"
                            placeholder="Ej: 08:00-13:00, 17:00-21:00"
                            {...register('opening_hours')}
                        />
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Notas para el repartidor</Label>
                        <Textarea
                            id="notes"
                            placeholder="Ej: Tocar timbre del costado, entrar por depósito trasero..."
                            rows={2}
                            {...register('notes')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
