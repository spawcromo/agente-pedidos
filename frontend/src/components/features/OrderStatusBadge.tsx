const STATUS_CONFIG = {
    pending: {
        label: "Pendiente",
        className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    confirmed: {
        label: "Confirmado",
        className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    rejected: {
        label: "Rechazado",
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
    },
    delivered: {
        label: "Entregado",
        className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    assigned: {
        label: "Asignado a Ruta",
        className: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    }
} as const

type OrderStatus = keyof typeof STATUS_CONFIG

export function OrderStatusBadge({ status, isAssigned }: { status: OrderStatus | string, isAssigned?: boolean }) {
    let finalStatus = status as OrderStatus;
    if (status === 'confirmed' && isAssigned) {
        finalStatus = 'assigned';
    }
    const config = STATUS_CONFIG[finalStatus] ?? {
        label: finalStatus,
        className: "bg-[#252220] text-[#9CA3AF] border border-[#2A2825]",
    }

    return (
        <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.className}`}>
            {config.label}
        </span>
    )
}
