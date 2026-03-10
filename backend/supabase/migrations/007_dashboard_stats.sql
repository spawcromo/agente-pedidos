-- Migration: 007_dashboard_stats
-- View for high-level dashboard metrics

DROP VIEW IF EXISTS v_dashboard_stats;

CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'confirmed') AS confirmed_orders,
  (SELECT COUNT(*) FROM clients WHERE client_type = 'retail') AS retail_clients,
  (SELECT COUNT(*) FROM clients WHERE client_type = 'wholesale') AS wholesale_clients,
  (SELECT COUNT(*) FROM products WHERE active = true) AS active_products,
  (SELECT COUNT(*) FROM profiles WHERE role = 'repartidor') AS active_drivers,
  (SELECT COUNT(DISTINCT driver_id) FROM delivery_routes WHERE delivery_date = CURRENT_DATE) AS drivers_with_routes_today,
  (SELECT COUNT(*) FROM delivery_routes WHERE delivery_date = CURRENT_DATE AND status = 'completed') AS completed_routes_today,
  (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) 
   FROM order_items oi 
   JOIN orders o ON o.id = oi.order_id 
   WHERE o.status IN ('confirmed', 'delivered') 
   AND o.delivery_date = CURRENT_DATE) AS revenue_today;
