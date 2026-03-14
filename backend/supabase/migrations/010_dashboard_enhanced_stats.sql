-- Update the dashboard stats view to consider 'cancelled' orders as finished stops
DROP VIEW IF EXISTS v_dashboard_enhanced_stats;

CREATE OR REPLACE VIEW v_dashboard_enhanced_stats AS
SELECT
  -- 1. RUTAS HOY
  (SELECT COUNT(*) FROM delivery_routes WHERE delivery_date = CURRENT_DATE) AS rutas_hoy_total,
  
  -- Rutas en progreso: la ruta está activa y todavía tiene paradas que NO están entregadas ni canceladas
  (SELECT COUNT(*) FROM delivery_routes dr WHERE delivery_date = CURRENT_DATE AND status = 'active'
   AND EXISTS (
     SELECT 1 FROM delivery_stops ds 
     JOIN orders o ON o.id = ds.order_id
     WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status <> 'cancelled'
   )) AS rutas_hoy_progreso,
   
  -- Rutas completadas: la ruta está marcada como completed O todas sus paradas están entregadas o canceladas
  (SELECT COUNT(*) FROM delivery_routes dr WHERE delivery_date = CURRENT_DATE AND (
    dr.status = 'completed' OR 
    NOT EXISTS (
      SELECT 1 FROM delivery_stops ds 
      JOIN orders o ON o.id = ds.order_id
      WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status <> 'cancelled'
    )
  ) AND EXISTS (SELECT 1 FROM delivery_stops WHERE route_id = dr.id)) AS rutas_hoy_completadas,
  
  (SELECT COUNT(*) FROM delivery_routes WHERE delivery_date = CURRENT_DATE AND status = 'draft') AS rutas_hoy_pendientes_iniciar,
  
  -- Entregas realmente pendientes: las que no están entregadas ni el pedido cancelado
  (SELECT COUNT(*) FROM delivery_stops ds 
   JOIN delivery_routes dr ON dr.id = ds.route_id 
   JOIN orders o ON o.id = ds.order_id
   WHERE dr.delivery_date = CURRENT_DATE AND ds.status = 'pending' AND o.status <> 'cancelled') AS entregas_pendientes_hoy,


  -- 2. REPARTIDORES HOY
  (SELECT COUNT(*) FROM profiles WHERE role = 'repartidor') AS repartidores_totales,
  
  (SELECT COUNT(DISTINCT driver_id) FROM delivery_routes dr WHERE delivery_date = CURRENT_DATE AND status = 'active' 
   AND EXISTS (
     SELECT 1 FROM delivery_stops ds 
     JOIN orders o ON o.id = ds.order_id
     WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status <> 'cancelled'
   )) AS repartidores_en_ruta,
   
  (SELECT COUNT(*) FROM profiles p WHERE role = 'repartidor' AND NOT EXISTS (
      SELECT 1 FROM delivery_routes dr WHERE dr.driver_id = p.id AND dr.delivery_date = CURRENT_DATE AND dr.status = 'active'
      AND EXISTS (
        SELECT 1 FROM delivery_stops ds 
        JOIN orders o ON o.id = ds.order_id
        WHERE ds.route_id = dr.id AND ds.status = 'pending' AND o.status <> 'cancelled'
      )
  )) AS repartidores_disponibles,
  
  (SELECT COUNT(DISTINCT driver_id) FROM delivery_routes WHERE delivery_date = CURRENT_DATE AND status = 'draft') AS repartidores_pendientes_salir,


  -- 3. PEDIDOS PARA MAÑANA
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day') AS pedidos_manana_total,
  
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day' AND status = 'confirmed') AS pedidos_manana_confirmados,
  
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day' AND status = 'pending') AS pedidos_manana_pendientes,
  
  (SELECT COUNT(*) FROM orders WHERE delivery_date = CURRENT_DATE + INTERVAL '1 day' AND status = 'rejected') AS pedidos_manana_rechazados;
