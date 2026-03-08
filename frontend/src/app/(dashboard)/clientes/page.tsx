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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientDialog } from '@/components/features/ClientDialog'
import { getClients, deleteClientRecord } from '@/services/clients'
import type { Client } from '@/types/database'

const TYPE_LABEL: Record<string, string> = {
    retail: 'Minorista',
    wholesale: 'Mayorista',
}

export default function ClientesPage() {
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

    const retail = clients.filter((c) => c.client_type === 'retail').length
    const wholesale = clients.filter((c) => c.client_type === 'wholesale').length
    const withCoords = clients.filter((c) => c.lat && c.lng).length

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Datos de contacto, dirección, horarios y tipo de cada cliente.
                    </p>
                </div>
                <Button onClick={openCreate} id="btn-nuevo-cliente">
                    + Nuevo Cliente
                </Button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Clientes</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums">{clients.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Minoristas</p>
                    <p className="mt-1 text-3xl font-bold text-blue-400 tabular-nums">{retail}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mayoristas</p>
                    <p className="mt-1 text-3xl font-bold text-purple-400 tabular-nums">{wholesale}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ubicación</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-emerald-500 tabular-nums">{withCoords}</p>
                        <p className="text-xs text-muted-foreground font-medium">con coordenadas</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <Input
                    id="search-clientes"
                    placeholder="Buscar por nombre, teléfono o dirección..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Horario</TableHead>
                            <TableHead>Coords</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                    {search ? 'Sin resultados para la búsqueda.' : 'No hay clientes. Creá el primero.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <div>{client.name}</div>
                                        {client.notes && (
                                            <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                                                📝 {client.notes}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{client.phone}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                client.client_type === 'wholesale'
                                                    ? 'border-purple-500/30 text-purple-400'
                                                    : 'border-blue-500/30 text-blue-400'
                                            }
                                        >
                                            {TYPE_LABEL[client.client_type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm">
                                        {client.address || '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {client.opening_hours || '—'}
                                    </TableCell>
                                    <TableCell>
                                        {client.lat && client.lng ? (
                                            <Badge variant="outline" className="border-green-500/30 text-green-500 text-xs">
                                                ✓
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-destructive/30 text-destructive text-xs">
                                                ✗
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                id={`menu-cliente-${client.id}`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold hover:bg-accent hover:text-accent-foreground"
                                            >
                                                ···
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(client)}>
                                                    ✏️ Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        window.open(`https://wa.me/${client.phone.replace('+', '')}`, '_blank')
                                                    }
                                                >
                                                    💬 Abrir WhatsApp
                                                </DropdownMenuItem>
                                                {client.address && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            window.open(
                                                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`,
                                                                '_blank'
                                                            )
                                                        }
                                                    >
                                                        📍 Ver en Maps
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(client)}
                                                >
                                                    🗑️ Eliminar
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

            <ClientDialog
                open={dialogOpen}
                client={selectedClient}
                onClose={() => setDialogOpen(false)}
                onSaved={load}
            />
        </div>
    )
}
