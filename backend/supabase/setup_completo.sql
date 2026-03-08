-- =====================================================
-- AVÍCOLA BACCARO — Setup completo
-- Correr en: Supabase Dashboard > SQL Editor > New query
-- =====================================================

-- 1. TIPOS
CREATE TYPE client_type AS ENUM ('retail', 'wholesale');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'rejected', 'delivered');
CREATE TYPE order_source AS ENUM ('whatsapp', 'manual');
CREATE TYPE route_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE stop_status AS ENUM ('pending', 'delivered');

-- 2. TABLAS
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  opening_hours TEXT,
  client_type client_type NOT NULL DEFAULT 'retail',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_retail NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_wholesale NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  delivery_date DATE NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  source order_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE delivery_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_date DATE UNIQUE NOT NULL,
  route_data JSONB,
  status route_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE delivery_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 0,
  status stop_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ
);

-- 3. ÍNDICES
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_delivery_stops_route ON delivery_stops(route_id);

-- 4. TRIGGER updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. ROW LEVEL SECURITY
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON delivery_routes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access" ON delivery_stops
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. VISTAS
CREATE OR REPLACE VIEW v_production_summary AS
SELECT
  o.delivery_date,
  p.id AS product_id,
  p.name AS product_name,
  p.unit,
  SUM(oi.quantity) AS total_quantity,
  COUNT(DISTINCT o.id) AS order_count
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'confirmed'
GROUP BY o.delivery_date, p.id, p.name, p.unit
ORDER BY p.sort_order;

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

-- 7. SEED DATA (productos y clientes de prueba)
INSERT INTO products (name, unit, price_retail, price_wholesale, active, sort_order) VALUES
  ('Pollo Entero',      'kg',     2500, 2200, true, 1),
  ('Pechuga',           'kg',     3800, 3400, true, 2),
  ('Pata-Muslo',        'kg',     2800, 2500, true, 3),
  ('Suprema',           'kg',     4200, 3800, true, 4),
  ('Alitas',            'kg',     2200, 1900, true, 5),
  ('Muslos',            'kg',     2600, 2300, true, 6),
  ('Patas',             'kg',     2000, 1700, true, 7),
  ('Menudos',           'kg',     1200, 1000, true, 8),
  ('Milanesa de Pollo', 'kg',     4500, 4000, true, 9),
  ('Hamburguesa',       'unidad', 800,  650,  true, 10),
  ('Nuggets',           'kg',     4000, 3500, true, 11),
  ('Hígado',            'kg',     1500, 1200, true, 12),
  ('Pollo Trozado',     'kg',     2700, 2400, true, 13),
  ('Pechuga Rellena',   'unidad', 3500, 3100, true, 14);

INSERT INTO clients (name, phone, address, lat, lng, opening_hours, client_type, notes) VALUES
  ('Carnicería Don Pedro',    '+5492614001001', 'San Martín 450, Ciudad, Mendoza',            -32.8895, -68.8458, '08:00-13:00, 17:00-21:00', 'retail',    'Tocar timbre del costado'),
  ('Supermercado El Ángel',   '+5492614001002', 'Av. Colón 1200, Godoy Cruz, Mendoza',        -32.9167, -68.8333, '08:00-21:00',              'wholesale', 'Entrada por depósito trasero'),
  ('Rotisería La Abuela',     '+5492614001003', 'Belgrano 890, Las Heras, Mendoza',           -32.8500, -68.8167, '09:00-14:00, 18:00-23:00', 'retail',    NULL),
  ('Distribuidora Mendocina', '+5492614001004', 'Ruta 40 km 3050, Luján, Mendoza',            -33.0333, -68.4833, '07:00-17:00',              'wholesale', 'Pedir factura A'),
  ('Pollería Central',        '+5492614001005', 'Av. San Martín 1500, Maipú, Mendoza',        -32.9833, -68.5000, '08:00-13:00, 16:30-20:30', 'retail',    'Llamar antes de llegar'),
  ('Restaurant Don Julio',    '+5492614001006', 'Emilio Civit 300, Ciudad, Mendoza',          -32.8930, -68.8400, '10:00-15:00',              'wholesale', 'Solo recibe por la mañana'),
  ('Almacén El Vecino',       '+5492614001007', 'Paso de los Andes 200, Dorrego, Guaymallén', -32.8833, -68.7833, '08:00-20:00',              'retail',    NULL),
  ('Granja Feliz',            '+5492614001008', 'Chile 450, San José, Guaymallén',            -32.9000, -68.7667, '07:30-12:30',              'retail',    'Los lunes no abre');

-- Pedidos de prueba
INSERT INTO orders (client_id, delivery_date, status, notes, source) VALUES
  ((SELECT id FROM clients WHERE phone = '+5492614001001'), CURRENT_DATE + 1, 'pending',   'Entregar antes de las 10am', 'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001002'), CURRENT_DATE + 1, 'pending',   NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001003'), CURRENT_DATE + 1, 'confirmed', 'Pedido urgente',             'manual'),
  ((SELECT id FROM clients WHERE phone = '+5492614001004'), CURRENT_DATE + 1, 'pending',   NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001005'), CURRENT_DATE + 2, 'pending',   NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001006'), CURRENT_DATE,     'delivered', NULL,                         'manual'),
  ((SELECT id FROM clients WHERE phone = '+5492614001007'), CURRENT_DATE,     'confirmed', NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001001'), CURRENT_DATE - 1, 'delivered', 'Entregado a las 9:30',       'whatsapp');

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 15, p.price_retail FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001001' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pata-Muslo';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 10, p.price_retail FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001001' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pechuga';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 50, p.price_wholesale FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001002' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pollo Entero';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 20, p.price_wholesale FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001002' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Milanesa de Pollo';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 8, p.price_retail FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001003' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Suprema';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 100, p.price_wholesale FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001004' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pollo Entero';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 30, p.price_wholesale FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001004' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pata-Muslo';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 25, p.price_wholesale FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001004' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pechuga';
