-- Migration: 002_views
-- Views for production summary and statistics

-- ============================================================
-- PRODUCTION SUMMARY VIEW
-- Totals by product for a given delivery_date
-- Usage: SELECT * FROM v_production_summary WHERE delivery_date = '2026-03-08'
-- ============================================================

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
WHERE o.status = 'confirmed'
GROUP BY o.delivery_date, p.id, p.name, p.unit
ORDER BY p.sort_order;

-- ============================================================
-- CLIENT RANKING VIEW
-- Top clients by total order value (last 30 days)
-- ============================================================

CREATE OR REPLACE VIEW v_client_ranking AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  c.client_type,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
  MAX(o.created_at) AS last_order_at
FROM clients c
LEFT JOIN orders o ON o.client_id = c.id AND o.status IN ('confirmed', 'delivered')
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.name, c.client_type
ORDER BY total_revenue DESC;

-- ============================================================
-- PRODUCT POPULARITY VIEW
-- Most ordered products
-- ============================================================

CREATE OR REPLACE VIEW v_product_popularity AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.unit,
  COALESCE(SUM(oi.quantity), 0) AS total_quantity,
  COUNT(DISTINCT o.id) AS times_ordered
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('confirmed', 'delivered')
WHERE p.active = true
GROUP BY p.id, p.name, p.unit
ORDER BY total_quantity DESC;

-- ============================================================
-- DAILY ORDER TREND VIEW
-- Orders per day for trend analysis
-- ============================================================

CREATE OR REPLACE VIEW v_daily_orders AS
SELECT
  DATE(created_at) AS order_date,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending
FROM orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;
