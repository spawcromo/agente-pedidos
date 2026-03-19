'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
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

import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { MapPicker } from '@/components/ui/map-picker'

type FormData = {
    name: string
    phone: string
    address: string
    lat: string
    lng: string
    opening_hours: string
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
        control,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        defaultValues: {
            name: '',
            phone: '',
            address: '',
            lat: '',
            lng: '',
            opening_hours: '',
            notes: '',
            price_list_id: ''
        },
    })

    const lat = watch('lat')
    const lng = watch('lng')

    useEffect(() => {
        if (client) {
            reset({
                name: client.name,
                phone: client.phone,
                address: client.address,
                lat: client.lat?.toString() ?? '',
                lng: client.lng?.toString() ?? '',
                opening_hours: client.opening_hours ?? '',
                notes: client.notes ?? '',
                price_list_id: client.price_list_id ?? ''
            })
        } else {
            reset({
                name: '', phone: '', address: '', lat: '', lng: '',
                opening_hours: '', notes: '',
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
            <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-y-auto p-0 border-none bg-card shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-amber-500 shadow-[0_4px_10px_rgba(245,158,11,0.3)]" />
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-6 pb-4">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nombre</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ej: Carnicería Don Pedro"
                                        className="h-10 rounded-xl bg-muted/30 focus:bg-background transition-all"
                                        {...register('name', { required: 'Requerido' })}
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Teléfono (WhatsApp)</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+5492614001001"
                                        className="h-10 rounded-xl bg-muted/30 focus:bg-background transition-all"
                                        {...register('phone', { required: 'Requerido' })}
                                    />
                                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Lista de Precios</Label>
                                    {loadingLists ? (
                                        <div className="h-10 w-full animate-pulse bg-muted/30 rounded-xl border border-border flex items-center px-3" />
                                    ) : (
                                        <Controller
                                            name="price_list_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value || ""}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="h-10 rounded-xl bg-muted/30 focus:bg-background transition-all">
                                                        <SelectValue placeholder="Seleccionar lista...">
                                                            {priceLists.find(pl => pl.id === field.value)?.name}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border">
                                                        {priceLists.map(pl => (
                                                            <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="opening_hours" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Horario</Label>
                                    <Input
                                        id="opening_hours"
                                        placeholder="Ej: 08:00-13:00"
                                        className="h-10 rounded-xl bg-muted/30 focus:bg-background transition-all"
                                        {...register('opening_hours')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Dirección Inteligente</Label>
                                <AddressAutocomplete
                                    value={watch('address')}
                                    placeholder="Escribí para buscar dirección o negocio..."
                                    onChange={(addr, lat, lng) => {
                                        setValue('address', addr)
                                        setValue('lat', lat.toString())
                                        setValue('lng', lng.toString())
                                    }}
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex justify-between items-center">
                                    Ubicación en Mapa
                                    {lat && <span className="text-[10px] text-muted-foreground font-mono">OK: {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}</span>}
                                </Label>
                                <MapPicker
                                    lat={lat ? parseFloat(lat) : 0}
                                    lng={lng ? parseFloat(lng) : 0}
                                    onChange={(newLat, newLng) => {
                                        setValue('lat', newLat.toString())
                                        setValue('lng', newLng.toString())
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Notas para el repartidor</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Ej: Tocar timbre..."
                                    rows={2}
                                    className="rounded-xl bg-muted/30 focus:bg-background transition-all resize-none"
                                    {...register('notes')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 pt-2 bg-muted/20 border-t border-border/50">
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" className="rounded-xl h-11 px-6 hover:bg-muted/50" onClick={onClose}>Cancelar</Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="rounded-xl h-11 px-8 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shadow-lg shadow-amber-500/20"
                            >
                                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
