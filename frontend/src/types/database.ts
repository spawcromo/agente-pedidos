// Types matching Supabase schema from docs/architecture.md

export type ClientType = 'retail' | 'wholesale'
export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'delivered'
export type OrderSource = 'whatsapp' | 'manual'
export type RouteStatus = 'draft' | 'active' | 'completed'
export type StopStatus = 'pending' | 'delivered'

export interface Client {
  id: string
  name: string
  phone: string
  address: string
  lat: number | null
  lng: number | null
  opening_hours: string | null
  client_type: ClientType
  notes: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  unit: string
  price_retail: number
  price_wholesale: number
  active: boolean
  sort_order: number
}

export interface Order {
  id: string
  client_id: string
  delivery_date: string
  status: OrderStatus
  notes: string | null
  source: OrderSource
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  // Joined
  product?: Product
}

export interface DeliveryRoute {
  id: string
  delivery_date: string
  route_data: Record<string, unknown> | null
  status: RouteStatus
  created_at: string
  // Joined
  delivery_stops?: DeliveryStop[]
}

export interface DeliveryStop {
  id: string
  route_id: string
  order_id: string
  position: number
  status: StopStatus
  completed_at: string | null
  // Joined
  order?: Order
}
