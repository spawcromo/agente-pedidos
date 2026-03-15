'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    Contact,
    Search,
    MessageCircle,
    UserCircle2,
    Plus,
    Truck,
    Trash2,
    Edit2
} from "lucide-react"
import { getRepartidores, updateRepartidorStatus, Repartidor } from '@/services/repartidores'
import { createRepartidor, updateRepartidorStatusAction, deleteRepartidor, updateRepartidor } from '@/app/actions/repartidores'
import { withRole } from '@/components/hoc/withRole'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
    disponible: 'Disponible',
    enfermo: 'Enfermo',
    vacaciones: 'Vacaciones',
    no_disponible: 'No disponible'
}
const STATUS_COLORS: Record<string, string> = {
    disponible: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
    enfermo: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
    vacaciones: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
    no_disponible: 'text-red-500 border-red-500/20 bg-red-500/10'
}

function RepartidoresPage() {
    const [repartidores, setRepartidores] = useState<Repartidor[]>([])
    const [filtered, setFiltered] = useState<Repartidor[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    // Create Modal state
    const [createOpen, setCreateOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '' })

    // Edit Modal state
    const [editOpen, setEditOpen] = useState(false)
    const [repToEdit, setRepToEdit] = useState<Repartidor | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [editData, setEditData] = useState({ fullName: '', phone: '' })

    // Delete Modal state
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [repToDelete, setRepToDelete] = useState<Repartidor | null>(null)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getRepartidores()
            setRepartidores(data || [])
            setFiltered(data || [])
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar repartidores')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(
            repartidores.filter(
                (r) =>
                    r.full_name?.toLowerCase().includes(q) ||
                    r.phone?.includes(q) ||
                    r.email?.toLowerCase().includes(q)
            )
        )
    }, [search, repartidores])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Contact className="w-8 h-8 text-amber-500" />
                        Repartidores
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Directorio de repartidores activos.
                    </p>
                </div>
                <Button 
                    onClick={() => setCreateOpen(true)} 
                    className="w-full sm:w-auto h-10 px-6 gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Nuevo Repartidor
                </Button>
            </div>

            <div className="bg-[#14100C] border border-[#2A1F16] rounded-xl overflow-hidden shadow-2xl mt-6">
                <div className="p-4 border-b border-[#2A1F16] bg-[#1A1510] flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar repartidor..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 bg-[#14100C] border-[#2A1F16] text-white focus-visible:ring-amber-500 rounded-lg h-9"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative min-h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#2A1F16] hover:bg-transparent">
                                <TableHead className="text-amber-500/80 font-semibold w-[200px]">Nombre</TableHead>
                                <TableHead className="text-amber-500/80 font-semibold">Email</TableHead>
                                <TableHead className="text-amber-500/80 font-semibold">Rutas (Hoy / Mañana)</TableHead>
                                <TableHead className="text-amber-500/80 font-semibold">Estado</TableHead>
                                <TableHead className="text-amber-500/80 font-semibold w-[220px]">Hablar al WhatsApp</TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="border-[#2A1F16]">
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                                            Cargando repartidores...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow className="border-[#2A1F16]">
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Contact className="w-12 h-12 mb-4 text-[#2A1F16]" />
                                            No hay repartidores registrados.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((rep) => (
                                    <TableRow key={rep.id} className="border-[#2A1F16] hover:bg-[#1A1510]/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold relative overflow-hidden shrink-0">
                                                    <UserCircle2 className="w-6 h-6 absolute text-amber-500/50" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-white">{rep.full_name || 'Sin nombre'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground text-sm font-mono">{rep.email}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-row items-center gap-2">
                                                <Badge variant="outline" className="w-fit border-amber-500/20 text-amber-500 bg-amber-500/5 text-xs py-1 px-2.5 gap-1.5 font-bold">
                                                    <Truck className="w-3.5 h-3.5" /> Hoy: {rep.routes_hoy || 0}
                                                </Badge>
                                                <Badge variant="outline" className="w-fit border-blue-500/20 text-blue-400 bg-blue-500/5 text-xs py-1 px-2.5 gap-1.5 font-bold">
                                                    <Truck className="w-3.5 h-3.5" /> Mañana: {rep.routes_manana || 0}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={rep.driver_status || 'disponible'}
                                                onValueChange={async (val) => {
                                                    try {
                                                        await updateRepartidorStatusAction(rep.id, val as string)
                                                        toast.success('Estado actualizado')
                                                        load()
                                                    } catch (err: any) {
                                                        toast.error('Error al actualizar estado')
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={`h-8 w-[140px] text-xs font-semibold ${STATUS_COLORS[rep.driver_status || 'disponible']}`}>
                                                    <SelectValue>
                                                        {STATUS_LABELS[rep.driver_status || 'disponible']}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                                        <SelectItem key={key} value={key} className="text-xs font-semibold">
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {rep.phone ? (
                                                <a
                                                    href={`https://wa.me/${rep.phone?.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 group"
                                                >
                                                    <div className="h-8 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-500 font-bold hover:bg-emerald-500/20 transition-all active:scale-95">
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span>{rep.phone}</span>
                                                    </div>
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground/30 italic text-xs">Sin teléfono</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 h-8 w-8"
                                                    onClick={() => {
                                                        setRepToEdit(rep)
                                                        setEditData({ fullName: rep.full_name || '', phone: rep.phone || '' })
                                                        setEditOpen(true)
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                                                    onClick={() => {
                                                        setRepToDelete(rep)
                                                        setDeletePassword('')
                                                        setDeleteOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md bg-[#14100C] border-[#2A1F16]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-amber-500">Nuevo Repartidor</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Asegurate de tener la SUPABASE_SERVICE_ROLE_KEY cargada en Vercel/.env.local para poder crear cuentas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-white">Nombre Completo</Label>
                            <Input
                                placeholder="Ej: Juan Pérez"
                                value={formData.fullName}
                                onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Email</Label>
                            <Input
                                type="email"
                                placeholder="Ej: juan@baccaro.com"
                                value={formData.email}
                                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Teléfono (WhatsApp)</Label>
                            <Input
                                placeholder="Ej: 5491123456789"
                                value={formData.phone}
                                onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Contraseña</Label>
                            <Input
                                placeholder="Por defecto: Baccaro2026!"
                                value={formData.password}
                                onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button
                            className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                            disabled={createLoading || !formData.fullName || !formData.email}
                            onClick={async () => {
                                setCreateLoading(true)
                                try {
                                    await createRepartidor(formData)
                                    toast.success('Repartidor creado correctamente')
                                    setCreateOpen(false)
                                    setFormData({ fullName: '', email: '', phone: '', password: '' })
                                    load()
                                } catch (err: any) {
                                    toast.error(err.message)
                                } finally {
                                    setCreateLoading(false)
                                }
                            }}
                        >
                            {createLoading ? 'Creando...' : 'Crear Cuenta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Edit Repartidor Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md bg-[#14100C] border-[#2A1F16]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-amber-500">Editar Repartidor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-white">Nombre Completo</Label>
                            <Input
                                placeholder="Ej: Juan Pérez"
                                value={editData.fullName}
                                onChange={(e) => setEditData(f => ({ ...f, fullName: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Teléfono (WhatsApp)</Label>
                            <Input
                                placeholder="Ej: 5491123456789"
                                value={editData.phone}
                                onChange={(e) => setEditData(f => ({ ...f, phone: e.target.value }))}
                                className="bg-[#1A1510] border-[#2A1F16]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
                        <Button
                            className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold border-none rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                            disabled={editLoading || !editData.fullName}
                            onClick={async () => {
                                if (!repToEdit) return
                                setEditLoading(true)
                                try {
                                    await updateRepartidor(repToEdit.id, editData)
                                    toast.success('Repartidor actualizado')
                                    setEditOpen(false)
                                    load()
                                } catch (err: any) {
                                    toast.error(err.message)
                                } finally {
                                    setEditLoading(false)
                                }
                            }}
                        >
                            {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md bg-[#14100C] border-[#2A1F16]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-red-500 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" /> Eliminar Repartidor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Estás por eliminar a <strong className="text-white">{repToDelete?.full_name}</strong>. 
                            Esta acción es irreversible y borrará su acceso al sistema.
                        </p>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contraseña de seguridad</Label>
                            <Input
                                type="password"
                                placeholder="Ingresá 'borrar' para confirmar..."
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="bg-[#1A1510] border-[#2A1F16]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && deletePassword === 'borrar') {
                                        // trigger delete
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            disabled={deleteLoading || deletePassword !== 'borrar'}
                            onClick={async () => {
                                if (deletePassword !== 'borrar') return
                                setDeleteLoading(true)
                                try {
                                    if (repToDelete) {
                                        await deleteRepartidor(repToDelete.id)
                                        toast.success('Repartidor eliminado')
                                        setDeleteOpen(false)
                                        load()
                                    }
                                } catch (err: any) {
                                    toast.error(err.message)
                                } finally {
                                    setDeleteLoading(false)
                                }
                            }}
                        >
                            {deleteLoading ? 'Eliminando...' : 'Confirmar Eliminación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default withRole(RepartidoresPage, ['admin'])
