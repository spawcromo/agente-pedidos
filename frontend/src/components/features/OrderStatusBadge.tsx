import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types/database'

const STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; className: string }
> = {
    pending: {
        label: 'Pendiente',
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    confirmed: {
        label: 'Confirmado',
        className: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    rejected: {
        label: 'Rechazado',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    delivered: {
        label: 'Entregado',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const cfg = STATUS_CONFIG[status]
    return (
        <Badge variant="outline" className={cfg.className}>
            {cfg.label}
        </Badge>
    )
}
