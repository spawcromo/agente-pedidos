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
    Contact,
    Search,
    MessageCircle,
    UserCircle2
} from "lucide-react"
import { getRepartidores, Repartidor } from '@/services/repartidores'
import { withRole } from '@/components/hoc/withRole'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

function RepartidoresPage() {
    const [repartidores, setRepartidores] = useState<Repartidor[]>([])
    const [filtered, setFiltered] = useState<Repartidor[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

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
                                <TableHead className="text-amber-500/80 font-semibold w-[300px]">Nombre</TableHead>
                                <TableHead className="text-amber-500/80 font-semibold w-[200px]">Teléfono</TableHead>
                                <TableHead className="text-amber-500/80 font-semibold">Email</TableHead>
                                <TableHead className="text-amber-500/80 font-semibold text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="border-[#2A1F16]">
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                                            Cargando repartidores...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow className="border-[#2A1F16]">
                                    <TableCell colSpan={4} className="h-64 text-center">
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
                                            {rep.phone ? (
                                                <span className="text-muted-foreground">{rep.phone}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">No registrado</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {rep.email ? (
                                                <span className="text-muted-foreground">{rep.email}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">No registrado</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {rep.phone && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-emerald-500/80 hover:text-emerald-500 hover:bg-emerald-500/10"
                                                    onClick={() => window.open(`https://wa.me/${rep.phone?.replace(/\D/g, '')}`, '_blank')}
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}

export default withRole(RepartidoresPage, ['admin'])
