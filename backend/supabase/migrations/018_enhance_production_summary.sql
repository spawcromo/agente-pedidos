-- Migration: 018_enhance_production_summary
-- Updates v_production_summary to include pricing_type and actual weight totals.
-- MUST DROP first because we are adding new columns (pricing_type, total_actual_weight)
-- and changing the client_breakdown structure.

DROP VIEW IF EXISTS v_production_summary;

CREATE VIEW v_production_summary AS
SELECT
  o.delivery_date,
  p.id AS product_id,
  p.name AS product_name,
  p.unit,
  p.pricing_type,
  SUM(oi.quantity) AS total_quantity,
  SUM(COALESCE(oi.actual_weight_kg, 0)) AS total_actual_weight,
  COUNT(DISTINCT o.id) AS order_count,
  jsonb_agg(
    jsonb_build_object(
      'client_name', c.name,
      'quantity', oi.quantity,
      'actual_weight', oi.actual_weight_kg,
      'is_final', oi.is_price_final
    ) ORDER BY oi.quantity DESC
  ) AS client_breakdown
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN clients c ON c.id = o.client_id
WHERE o.status IN ('confirmed', 'preparing')
GROUP BY o.delivery_date, p.id, p.name, p.unit, p.pricing_type
ORDER BY p.sort_order;
