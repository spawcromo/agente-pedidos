import { createClient } from '@/lib/supabase/client'

export interface DailySales {
  date: string
  total_orders: number
  total_revenue: number
}

export interface ProductAnalytics {
  product_id: string
  product_name: string
  pricing_type: 'fixed' | 'by_weight'
  total_quantity: number
  total_actual_weight: number
  total_revenue: number
}

export interface CustomerAnalytics {
  client_id: string
  client_name: string
  client_type: string
  total_orders: number
  total_revenue: number
  last_order_at: string
}

export interface OrderStatusAnalytics {
  status: string
  order_count: number
}

export interface BehavioralAnalytics {
  day_of_week: number
  hour_of_day: number
  total_orders: number
}

export async function getAnalyticsData() {
  const supabase = createClient()

  // Run in parallel
  const [
    salesRes,
    productsRes,
    customersRes, // Using existing v_client_ranking
    statusRes,
    behaviorRes
  ] = await Promise.all([
    supabase.from('v_analytics_sales_over_time').select('*').order('date', { ascending: true }).limit(30),
    supabase.from('v_analytics_products').select('*').order('total_revenue', { ascending: false }).limit(15),
    supabase.from('v_client_ranking').select('*').order('total_revenue', { ascending: false }).limit(10),
    supabase.from('v_analytics_order_status').select('*'),
    supabase.from('v_analytics_behavior').select('*')
  ])

  return {
    salesOverTime: salesRes.data as DailySales[] || [],
    products: productsRes.data as ProductAnalytics[] || [],
    customers: customersRes.data as CustomerAnalytics[] || [],
    orderStatus: statusRes.data as OrderStatusAnalytics[] || [],
    behavior: behaviorRes.data as BehavioralAnalytics[] || []
  }
}
