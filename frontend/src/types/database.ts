// Types matching Supabase schema from docs/architecture.md
export type OrderStatus = 'pending' | 'preparing' | 'confirmed' | 'rejected' | 'delivered' | 'cancelled'
export type OrderSource = 'whatsapp' | 'manual'
export type PricingType = 'fixed' | 'by_weight'
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
  notes: string | null
  created_at: string
  price_list_id: string | null
  price_list?: { name: string }
}

export interface PriceList {
  id: string
  name: string
  created_at: string
}

export interface ProductPrice {
  id: string
  price_list_id: string
  product_id: string
  price: number
  product?: Product
}

export interface Product {
  id: string
  name: string
  unit: string
  base_price?: number
  price_wholesale?: number
  active: boolean
  sort_order: number
  pricing_type: PricingType
  estimated_weight_kg: number | null
}

export interface Order {
  id: string
  client_id: string
  delivery_date: string
  status: OrderStatus
  notes: string | null
  cancel_reason: string | null
  source: OrderSource
  created_at: string
  updated_at: string
  delivery_time: string | null
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
  price_per_kg: number | null
  actual_weight_kg: number | null
  is_price_final: boolean
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
