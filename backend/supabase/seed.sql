-- Seed data for development
-- Run after 001_initial_schema.sql

-- ============================================================
-- PRODUCTS (catálogo típico de avícola)
-- ============================================================

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

-- ============================================================
-- CLIENTS (clientes de prueba en Gran Mendoza)
-- ============================================================

INSERT INTO clients (name, phone, address, lat, lng, opening_hours, client_type, notes) VALUES
  ('Carnicería Don Pedro',    '+5492614001001', 'San Martín 450, Ciudad, Mendoza',       -32.8895, -68.8458, '08:00-13:00, 17:00-21:00', 'retail',    'Tocar timbre del costado'),
  ('Supermercado El Ángel',   '+5492614001002', 'Av. Colón 1200, Godoy Cruz, Mendoza',   -32.9167, -68.8333, '08:00-21:00',              'wholesale', 'Entrada por depósito trasero'),
  ('Rotisería La Abuela',     '+5492614001003', 'Belgrano 890, Las Heras, Mendoza',      -32.8500, -68.8167, '09:00-14:00, 18:00-23:00', 'retail',    NULL),
  ('Distribuidora Mendocina', '+5492614001004', 'Ruta 40 km 3050, Luján, Mendoza',       -33.0333, -68.4833, '07:00-17:00',              'wholesale', 'Pedir factura A'),
  ('Pollería Central',        '+5492614001005', 'Av. San Martín 1500, Maipú, Mendoza',   -32.9833, -68.5000, '08:00-13:00, 16:30-20:30', 'retail',    'Llamar antes de llegar'),
  ('Restaurant Don Julio',    '+5492614001006', 'Emilio Civit 300, Ciudad, Mendoza',      -32.8930, -68.8400, '10:00-15:00',              'wholesale', 'Solo recibe por la mañana'),
  ('Almacén El Vecino',       '+5492614001007', 'Paso de los Andes 200, Dorrego, Guaymallén', -32.8833, -68.7833, '08:00-20:00',         'retail',    NULL),
  ('Granja Feliz',            '+5492614001008', 'Chile 450, San José, Guaymallén',       -32.9000, -68.7667, '07:30-12:30',              'retail',    'Los lunes no abre');

-- ============================================================
-- ORDERS (pedidos de prueba)
-- ============================================================

INSERT INTO orders (client_id, delivery_date, status, notes, source) VALUES
  ((SELECT id FROM clients WHERE phone = '+5492614001001'), CURRENT_DATE + 1, 'pending',   'Entregar antes de las 10am', 'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001002'), CURRENT_DATE + 1, 'pending',   NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001003'), CURRENT_DATE + 1, 'confirmed', 'Pedido urgente',             'manual'),
  ((SELECT id FROM clients WHERE phone = '+5492614001004'), CURRENT_DATE + 1, 'pending',   NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001005'), CURRENT_DATE + 2, 'pending',   NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001006'), CURRENT_DATE,     'delivered',  NULL,                         'manual'),
  ((SELECT id FROM clients WHERE phone = '+5492614001007'), CURRENT_DATE,     'confirmed', NULL,                         'whatsapp'),
  ((SELECT id FROM clients WHERE phone = '+5492614001001'), CURRENT_DATE - 1, 'delivered',  'Entregado a las 9:30',       'whatsapp');

-- ============================================================
-- ORDER ITEMS
-- ============================================================

-- Pedido 1: Carnicería Don Pedro
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 15, p.price_retail
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001001' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pata-Muslo';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 10, p.price_retail
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001001' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pechuga';

-- Pedido 2: Supermercado El Ángel
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 50, p.price_wholesale
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001002' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pollo Entero';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 20, p.price_wholesale
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001002' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Milanesa de Pollo';

-- Pedido 3: Rotisería La Abuela
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 8, p.price_retail
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001003' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Suprema';

-- Pedido 4: Distribuidora Mendocina
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 100, p.price_wholesale
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001004' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pollo Entero';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 30, p.price_wholesale
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001004' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pata-Muslo';

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, 25, p.price_wholesale
FROM orders o JOIN clients c ON o.client_id = c.id, products p
WHERE c.phone = '+5492614001004' AND o.delivery_date = CURRENT_DATE + 1 AND p.name = 'Pechuga';
