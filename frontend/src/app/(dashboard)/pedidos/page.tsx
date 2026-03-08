export default function PedidosPage() {
    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">
                        Gestiona los pedidos del día. Confirma, rechaza o edita antes de armar el reparto.
                    </p>
                </div>
            </div>
            <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
                Próximamente — US-06, US-07, US-08
            </div>
        </div>
    )
}
