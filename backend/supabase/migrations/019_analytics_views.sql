-- Migration: 019_analytics_views
-- Adds SQL views for the analytics dashboard

-- 1. Daily Sales Over Time
DROP VIEW IF EXISTS v_analytics_sales_over_time;

CREATE VIEW v_analytics_sales_over_time AS
WITH order_totals AS (
  SELECT
    o.id AS order_id,
    o.delivery_date,
    COALESCE(SUM(
      oi.quantity * (
        CASE 
          WHEN p.pricing_type = 'by_weight' THEN COALESCE(oi.actual_weight_kg, p.estimated_weight_kg, 1) * COALESCE(oi.price_per_kg, oi.unit_price / COALESCE(p.estimated_weight_kg, 1))
          ELSE oi.unit_price
        END
      )
    ), 0) AS revenue
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN products p ON p.id = oi.product_id
  WHERE o.status IN ('confirmed', 'preparing', 'delivered')
  GROUP BY o.id, o.delivery_date
)
SELECT
  delivery_date AS date,
  COUNT(order_id) AS total_orders,
  SUM(revenue) AS total_revenue
FROM order_totals
GROUP BY delivery_date
ORDER BY delivery_date DESC;

-- 2. Products Ranking
DROP VIEW IF EXISTS v_analytics_products;

CREATE VIEW v_analytics_products AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.pricing_type,
  SUM(oi.quantity) AS total_quantity,
  SUM(COALESCE(oi.actual_weight_kg, 0)) AS total_actual_weight,
  COALESCE(SUM(
    oi.quantity * (
      CASE 
        WHEN p.pricing_type = 'by_weight' THEN COALESCE(oi.actual_weight_kg, p.estimated_weight_kg, 1) * COALESCE(oi.price_per_kg, oi.unit_price / COALESCE(p.estimated_weight_kg, 1))
        ELSE oi.unit_price
      END
    )
  ), 0) AS total_revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status IN ('confirmed', 'preparing', 'delivered')
GROUP BY p.id, p.name, p.pricing_type
ORDER BY total_revenue DESC;

-- 3. Behavioral Data (Hours of day and day of week from creation time)
DROP VIEW IF EXISTS v_analytics_behavior;

CREATE VIEW v_analytics_behavior AS
SELECT
  EXTRACT(DOW FROM o.created_at) AS day_of_week,
  EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires') AS hour_of_day,
  COUNT(o.id) AS total_orders
FROM orders o
GROUP BY day_of_week, hour_of_day;

-- 4. Order Status Distribution (All time)
DROP VIEW IF EXISTS v_analytics_order_status;

CREATE VIEW v_analytics_order_status AS
SELECT
  status,
  COUNT(id) AS order_count
FROM orders
GROUP BY status;
