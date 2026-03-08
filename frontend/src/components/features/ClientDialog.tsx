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
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClientRecord, updateClientRecord, type ClientPayload } from '@/services/clients'
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
}

interface ClientDialogProps {
    open: boolean
    client: Client | null
    onClose: () => void
    onSaved: () => void
}

export function ClientDialog({ open, client, onClose, onSaved }: ClientDialogProps) {
    const isEditing = !!client

    const {
        register,
        handleSubmit,
        reset,
        setValue,
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
            })
        } else {
            reset({
                name: '', phone: '', address: '', lat: '', lng: '',
                opening_hours: '', client_type: 'retail', notes: '',
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

                    {/* Tipo de cliente */}
                    <div className="space-y-1.5">
                        <Label htmlFor="client_type">Tipo de cliente</Label>
                        <Select
                            defaultValue={client?.client_type ?? 'retail'}
                            onValueChange={(v) => setValue('client_type', v as 'retail' | 'wholesale')}
                        >
                            <SelectTrigger id="client_type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="retail">Minorista</SelectItem>
                                <SelectItem value="wholesale">Mayorista</SelectItem>
                            </SelectContent>
                        </Select>
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
