-- Migration: 017_add_preparing_status
-- Adds 'preparing' status to the order_status enum and updates views to include it.

-- 1. Add 'preparing' to order_status enum
-- We use this check because ADD VALUE cannot run inside a transaction normally, 
-- but Supabase migrations manage this.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preparing' AFTER 'pending';

-- 2. Update Production Summary View
-- Must include 'preparing' orders as they are ready for production
CREATE OR REPLACE VIEW v_production_summary AS
SELECT
  o.delivery_date,
  p.id AS product_id,
  p.name AS product_name,
  p.unit,
  SUM(oi.quantity) AS total_quantity,
  COUNT(DISTINCT o.id) AS order_count,
  jsonb_agg(
    jsonb_build_object(
      'client_name', c.name,
      'quantity', oi.quantity
    ) ORDER BY oi.quantity DESC
  ) AS client_breakdown
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN clients c ON c.id = o.client_id
WHERE o.status IN ('confirmed', 'preparing')
GROUP BY o.delivery_date, p.id, p.name, p.unit
ORDER BY p.sort_order;

-- 3. Update Client Ranking View
CREATE OR REPLACE VIEW v_client_ranking AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  c.client_type,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(oi.quantity * (CASE 
    WHEN p.pricing_type = 'by_weight' THEN COALESCE(oi.actual_weight_kg, p.estimated_weight_kg) * COALESCE(oi.price_per_kg, oi.unit_price / COALESCE(p.estimated_weight_kg, 1))
    ELSE oi.unit_price
  END)), 0) AS total_revenue,
  MAX(o.created_at) AS last_order_at
FROM clients c
LEFT JOIN orders o ON o.client_id = c.id AND o.status IN ('confirmed', 'preparing', 'delivered')
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
GROUP BY c.id, c.name, c.client_type
ORDER BY total_revenue DESC;

-- 4. Update Product Popularity View
CREATE OR REPLACE VIEW v_product_popularity AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.unit,
  COALESCE(SUM(oi.quantity), 0) AS total_quantity,
  COUNT(DISTINCT o.id) AS times_ordered
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('confirmed', 'preparing', 'delivered')
WHERE p.active = true
GROUP BY p.id, p.name, p.unit
ORDER BY total_quantity DESC;

-- 5. Update Daily Order Trend View
CREATE OR REPLACE VIEW v_daily_orders AS
SELECT
  DATE(created_at) AS order_date,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'preparing') AS preparing,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
FROM orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- 6. Update Dashboard Enhanced Stats
CREATE OR REPLACE VIEW v_dashboard_enhanced_stats AS
SELECT
  -- 1. RUTAS HOY
  (SELECT COUNT(*) FROM delivery_routes WHERE delivery_date = CURRENT_DATE) AS rutas_hoy_total,
  
  -- Rutas en progreso
  (SELECT COUNT(*) FROM delivery_routes dr WHERE delivery_date = CURRENT_DATE AND status = 'active'
   AND EXISTS (
     SELECT 1 FROM delivery_stops ds 
     JOIN orders o ON o.id = ds.order_id
     WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status NOT IN ('cancelled', 'rejected')
   )) AS rutas_hoy_progreso,
   
  -- Rutas completadas
  (SELECT COUNT(*) FROM delivery_routes dr WHERE delivery_date = CURRENT_DATE AND (
    dr.status = 'completed' OR 
    NOT EXISTS (
      SELECT 1 FROM delivery_stops ds 
      JOIN orders o ON o.id = ds.order_id
      WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status NOT IN ('cancelled', 'rejected')
    )
  ) AND EXISTS (SELECT 1 FROM delivery_stops WHERE route_id = dr.id)) AS rutas_hoy_completadas,
  
  (SELECT COUNT(*) FROM delivery_routes WHERE delivery_date = CURRENT_DATE AND status = 'draft') AS rutas_hoy_pendientes_iniciar,
  
  -- Entregas realmente pendientes
  (SELECT COUNT(*) FROM delivery_stops ds 
   JOIN delivery_routes dr ON dr.id = ds.route_id 
   JOIN orders o ON o.id = ds.order_id
   WHERE dr.delivery_date = CURRENT_DATE AND ds.status = 'pending' AND o.status NOT IN ('cancelled', 'rejected')) AS entregas_pendientes_hoy,


  -- 2. REPARTIDORES HOY
  (SELECT COUNT(*) FROM profiles WHERE role = 'repartidor') AS repartidores_totales,
  
  (SELECT COUNT(DISTINCT driver_id) FROM delivery_routes dr WHERE delivery_date = CURRENT_DATE AND status = 'active' 
   AND EXISTS (
     SELECT 1 FROM delivery_stops ds 
     JOIN orders o ON o.id = ds.order_id
     WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status NOT IN ('cancelled', 'rejected')
   )) AS repartidores_en_ruta,
    
  (SELECT COUNT(*) FROM profiles p WHERE role = 'repartidor' AND NOT EXISTS (
      SELECT 1 FROM delivery_routes dr WHERE dr.driver_id = p.id AND dr.delivery_date = CURRENT_DATE AND dr.status = 'active'
      AND EXISTS (
        SELECT 1 FROM delivery_stops ds 
        JOIN orders o ON o.id = ds.order_id
        WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status NOT IN ('cancelled', 'rejected')
      )
  )) AS repartidores_disponibles,
  
  (SELECT COUNT(DISTINCT driver_id) FROM delivery_routes WHERE delivery_date = CURRENT_DATE AND status = 'draft') AS repartidores_pendientes_salir,


  -- 3. PEDIDOS PARA MAÑANA
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day' AND status NOT IN ('cancelled', 'rejected')) AS pedidos_manana_total,
  
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day' AND status IN ('confirmed', 'preparing')) AS pedidos_manana_confirmados,
  
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day' AND status = 'pending') AS pedidos_manana_pendientes,
  
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day' AND status = 'rejected') AS pedidos_manana_rechazados;
