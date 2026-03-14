'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Users,
    Plus,
    Search,
    Edit2,
    MessageCircle,
    MapPin,
    Trash2,
    MoreHorizontal,
    FileText
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientDialog } from '@/components/features/ClientDialog'
import { getClients, deleteClientRecord } from '@/services/clients'
import type { Client } from '@/types/database'
import { withRole } from '@/components/hoc/withRole'



function ClientesPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [filtered, setFiltered] = useState<Client[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getClients()
            setClients(data)
            setFiltered(data)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar clientes')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        const q = search.toLowerCase()
        setFiltered(
            clients.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.phone.includes(q) ||
                    c.address.toLowerCase().includes(q)
            )
        )
    }, [search, clients])

    function openCreate() {
        setSelectedClient(null)
        setDialogOpen(true)
    }

    function openEdit(client: Client) {
        setSelectedClient(client)
        setDialogOpen(true)
    }

    async function handleDelete(client: Client) {
        if (!confirm(`¿Eliminar a "${client.name}"? Se perderá su historial de pedidos.`)) return
        try {
            await deleteClientRecord(client.id)
            toast.success('Cliente eliminado')
            load()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al eliminar')
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Datos de contacto, dirección, horarios y lista de precios de cada cliente.
                    </p>
                </div>
                <Button onClick={openCreate} id="btn-nuevo-cliente" className="w-full sm:w-auto gap-2">
                    <Plus className="w-4 h-4" /> Nuevo Cliente
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Input
                    id="search-clientes"
                    placeholder="Buscar por nombre, teléfono o dirección..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:max-w-sm h-11 sm:h-10"
                />
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-[150px] pl-6">Cliente</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Lista de Precios</TableHead>
                                <TableHead className="min-w-[200px]">Dirección</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                        {search ? 'Sin resultados.' : 'No hay clientes.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((client) => (
                                    <TableRow key={client.id} className="transition-colors">
                                        <TableCell className="font-semibold pl-6">
                                            <div className="text-amber-500 font-bold">{client.name}</div>
                                            {client.notes && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> {client.notes}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            <a
                                                href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-amber-500 hover:underline transition-colors flex items-center gap-1"
                                                title="Hablar por WhatsApp"
                                            >
                                                <MessageCircle className="w-3 h-3" /> {client.phone}
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            {client.price_list ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-500/20 text-amber-500 bg-amber-500/5 font-bold"
                                                >
                                                    {client.price_list.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Sin lista</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm">
                                            {client.address ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-amber-500 hover:underline transition-colors flex items-center gap-1"
                                                    title="Ver en Google Maps"
                                                >
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{client.address}</span>
                                                </a>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    id={`menu-cliente-${client.id}`}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openEdit(client)} className="gap-2">
                                                        <Edit2 className="w-4 h-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2"
                                                        onClick={() =>
                                                            window.open(`https://wa.me/${client.phone.replace('+', '')}`, '_blank')
                                                        }
                                                    >
                                                        <MessageCircle className="w-4 h-4" /> WhatsApp
                                                    </DropdownMenuItem>
                                                    {client.address && (
                                                        <DropdownMenuItem
                                                            className="gap-2"
                                                            onClick={() =>
                                                                window.open(
                                                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`,
                                                                    '_blank'
                                                                )
                                                            }
                                                        >
                                                            <MapPin className="w-4 h-4" /> Google Maps
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive font-medium gap-2"
                                                        onClick={() => handleDelete(client)}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <ClientDialog
                open={dialogOpen}
                client={selectedClient}
                onClose={() => setDialogOpen(false)}
                onSaved={load}
            />
        </div>
    )
}

export default withRole(ClientesPage, ['admin'])
