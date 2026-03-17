'use client'

import { useEffect, useState } from 'react'
import { withRole } from '@/components/hoc/withRole'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { 
    getAnalyticsData, 
    DailySales, 
    ProductAnalytics, 
    CustomerAnalytics, 
    OrderStatusAnalytics, 
    BehavioralAnalytics 
} from '@/services/analytics'
import { formatCurrency } from '@/lib/utils'
import { 
    TrendingUp, Package, Users, ShoppingCart, 
    Clock, Calendar as CalendarIcon, ArrowUpRight 
} from 'lucide-react'

// UI Colors matching the app's aesthetic
const COLORS = {
    orange: '#f97316',
    amber: '#f59e0b',
    emerald: '#10b981',
    red: '#ef4444',
    blue: '#3b82f6',
    muted: '#52525B', // zinc-600
    background: '#14100C',
    card: '#1A140F',
    border: '#2A1F16'
}

type Tab = 'overview' | 'products' | 'customers' | 'orders'

function KPICard({ title, value, subtitle, icon: Icon, colorClass = "text-amber-500", bgClass = "bg-amber-500/10" }: any) {
    return (
        <div className="bg-[#1A140F] border border-[#2A1F16] rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${bgClass} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
            <div className="flex justify-between items-start relative z-10">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className={`${bgClass} ${colorClass} p-2 rounded-lg`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-2xl font-black text-white">{value}</h3>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
        </div>
    )
}

function CustomTooltip({ active, payload, label, formatter }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1A140F] border border-[#2A1F16] p-3 rounded-lg shadow-xl">
                <p className="text-sm font-bold text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-bold text-white">
                            {formatter ? formatter(entry.value) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

function EstadisticasPage() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{
        salesOverTime: DailySales[]
        products: ProductAnalytics[]
        customers: CustomerAnalytics[]
        orderStatus: OrderStatusAnalytics[]
        behavior: BehavioralAnalytics[]
    }>({
        salesOverTime: [],
        products: [],
        customers: [],
        orderStatus: [],
        behavior: []
    })

    useEffect(() => {
        async function load() {
            try {
                const res = await getAnalyticsData()
                setData(res)
            } catch (err) {
                console.error("Error loading analytics:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="animate-spin text-amber-500">
                    <BarChart className="w-10 h-10" />
                </div>
                <p>Calculando estadísticas...</p>
            </div>
        )
    }

    // Aggregations for KPIs
    const totalRevenue = data.salesOverTime.reduce((acc, curr) => acc + curr.total_revenue, 0)
    const totalOrders = data.salesOverTime.reduce((acc, curr) => acc + curr.total_orders, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const activeCustomers = data.customers.length
    const totalProductsSold = data.products.reduce((acc, p) => acc + (p.pricing_type === 'by_weight' ? p.total_actual_weight || p.total_quantity : p.total_quantity), 0)

    // Chart Data Preparation
    const salesChartData = [...data.salesOverTime].reverse().map(d => ({
        ...d,
        date: new Date(d.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    }))

    const productRankingData = [...data.products].map(p => ({
        name: p.product_name,
        revenue: p.total_revenue,
        quantity: p.total_quantity,
        label: p.pricing_type === 'by_weight' ? 'Bultos' : 'Unid'
    })).slice(0, 8)

    // Status Pie Chart
    const STATUS_COLORS: Record<string, string> = {
        'pending': COLORS.muted,
        'preparing': COLORS.orange,
        'confirmed': COLORS.amber,
        'delivered': COLORS.emerald,
        'rejected': COLORS.red,
        'cancelled': COLORS.red
    }
    const STATUS_LABELS: Record<string, string> = {
        'pending': 'Pendiente',
        'preparing': 'En Preparación',
        'confirmed': 'Confirmado',
        'delivered': 'Entregado',
        'rejected': 'Rechazado',
        'cancelled': 'Cancelado'
    }
    const statusData = data.orderStatus.map(s => ({
        name: STATUS_LABELS[s.status] || s.status,
        value: s.order_count,
        rawStatus: s.status
    })).filter(s => s.value > 0).sort((a,b) => b.value - a.value)

    const tabs = [
        { id: 'overview', label: 'Ventas y Resumen', icon: TrendingUp },
        { id: 'products', label: 'Productos', icon: Package },
        { id: 'customers', label: 'Clientes', icon: Users },
        { id: 'orders', label: 'Pedidos y Comportamiento', icon: ShoppingCart },
    ] as const

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Inteligencia de Negocio</h1>
                <p className="text-muted-foreground">
                    Análisis en tiempo real de ventas, inventario y rendimiento.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-none">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                            activeTab === tab.id 
                            ? "bg-amber-500 text-amber-950 border-amber-500 shadow-lg shadow-amber-500/20" 
                            : "bg-[#1A140F] text-muted-foreground border-[#2A1F16] hover:bg-[#2A1F16] hover:text-white"
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard 
                            title="Ingresos Totales (30d)" 
                            value={formatCurrency(totalRevenue)} 
                            icon={TrendingUp} 
                            colorClass="text-emerald-500"
                            bgClass="bg-emerald-500/10"
                        />
                        <KPICard 
                            title="Total Pedidos" 
                            value={totalOrders.toString()} 
                            icon={ShoppingCart} 
                            colorClass="text-amber-500"
                            bgClass="bg-amber-500/10"
                        />
                        <KPICard 
                            title="Ticket Promedio" 
                            value={formatCurrency(avgOrderValue)} 
                            icon={ArrowUpRight} 
                            colorClass="text-blue-500"
                            bgClass="bg-blue-500/10"
                        />
                        <KPICard 
                            title="Clientes Activos" 
                            value={activeCustomers.toString()} 
                            icon={Users} 
                            colorClass="text-orange-500"
                            bgClass="bg-orange-500/10"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-[#1A140F] border border-[#2A1F16] p-6 rounded-xl">
                            <h3 className="text-sm font-bold text-white mb-6">Ingresos Diarios (Últimos 30 días)</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                                        <XAxis dataKey="date" 
                                            stroke={COLORS.muted} 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke={COLORS.muted} 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(val) => `$${val/1000}k`}
                                            dx={-10}
                                        />
                                        <Tooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} cursor={{ fill: '#2A1F16', opacity: 0.4 }} />
                                        <Bar dataKey="total_revenue" name="Ingresos" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#1A140F] border border-[#2A1F16] p-6 rounded-xl">
                            <h3 className="text-sm font-bold text-white mb-6">Volumen de Pedidos por Día</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                                        <XAxis dataKey="date" 
                                            stroke={COLORS.muted} 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke={COLORS.muted} 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            dx={-10}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="total_orders" name="Pedidos" stroke={COLORS.amber} strokeWidth={3} dot={{ r: 4, fill: COLORS.background, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PRODUCTS */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard 
                            title="Total Productos Vendidos" 
                            value={totalProductsSold.toFixed(0)} 
                            subtitle="Volumen (Uds/Kg)"
                            icon={Package} 
                            colorClass="text-emerald-500"
                            bgClass="bg-emerald-500/10"
                        />
                        <KPICard 
                            title="Producto Estrella" 
                            value={productRankingData[0]?.name || '-'} 
                            subtitle={formatCurrency(productRankingData[0]?.revenue || 0)}
                            icon={TrendingUp} 
                            colorClass="text-amber-500"
                            bgClass="bg-amber-500/10"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-[#1A140F] border border-[#2A1F16] p-6 rounded-xl">
                            <h3 className="text-sm font-bold text-white mb-6">Top Productos por Ingresos</h3>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productRankingData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.border} />
                                        <XAxis type="number" stroke={COLORS.muted} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                                        <YAxis dataKey="name" type="category" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} width={120} />
                                        <Tooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} cursor={{ fill: '#2A1F16', opacity: 0.4 }} />
                                        <Bar dataKey="revenue" name="Ingresos" fill={COLORS.amber} radius={[0, 4, 4, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#1A140F] border border-[#2A1F16] p-6 rounded-xl overflow-hidden flex flex-col">
                            <h3 className="text-sm font-bold text-white mb-4">Volumen de Ventas</h3>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {data.products.map((p, i) => (
                                    <div key={p.product_id} className="flex flex-col gap-1 p-3 rounded-lg bg-[#221A14] border border-[#2A1F16]">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-white truncate pr-2">{i+1}. {p.product_name}</span>
                                            <span className="text-xs font-black text-amber-500 whitespace-nowrap">
                                                {p.total_quantity} {p.pricing_type === 'by_weight' ? 'Bultos' : 'Uds'}
                                            </span>
                                        </div>
                                        {p.pricing_type === 'by_weight' && p.total_actual_weight > 0 && (
                                            <span className="text-[10px] text-emerald-500 font-medium">Vol: {p.total_actual_weight} kg</span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground">{formatCurrency(p.total_revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: CUSTOMERS */}
            {activeTab === 'customers' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    <div className="bg-[#1A140F] border border-[#2A1F16] p-6 rounded-xl">
                        <h3 className="text-sm font-bold text-white mb-6">Top Clientes por Facturación</h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.customers.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.border} />
                                    <XAxis type="number" stroke={COLORS.muted} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                                    <YAxis dataKey="client_name" type="category" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} width={140} />
                                    <Tooltip content={<CustomTooltip formatter={(val: number) => formatCurrency(val)} />} cursor={{ fill: '#2A1F16', opacity: 0.4 }} />
                                    <Bar dataKey="total_revenue" name="Facturado" fill={COLORS.emerald} radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ORDERS & BEHAVIOR */}
            {activeTab === 'orders' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Status Pie */}
                        <div className="bg-[#1A140F] border border-[#2A1F16] p-6 rounded-xl flex flex-col items-center">
                            <h3 className="text-sm font-bold text-white mb-4 w-full">Distribución de Estados</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.rawStatus] || COLORS.muted} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1A140F', borderColor: '#2A1F16', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-3 mt-4">
                                {statusData.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#221A14] border border-[#2A1F16] text-xs">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.rawStatus] || COLORS.muted }} />
                                        <span className="text-muted-foreground">{s.name}</span>
                                        <span className="font-bold text-white ml-1">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order by Hour Behavioral Matrix */}
                        <div className="bg-[#1A140F] border border-[#2A1F16] p-6 rounded-xl">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" /> Pedidos por Hora
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={Array.from({length: 24}).map((_, i) => {
                                            const match = data.behavior.find(b => b.hour_of_day === i)
                                            return { hour: `${i}:00`, count: match ? match.total_orders : 0 }
                                        })}
                                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                                        <XAxis dataKey="hour" stroke={COLORS.muted} fontSize={10} tickLine={false} axisLine={false} interval={2} />
                                        <YAxis stroke={COLORS.muted} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2A1F16', opacity: 0.4 }} />
                                        <Bar dataKey="count" name="Pedidos" fill={COLORS.orange} radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default withRole(EstadisticasPage, ['admin'])
