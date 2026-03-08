-- =====================================================
-- AVÍCOLA BACCARO — Datos de Prueba (Pedidos y Repartidores)
-- =====================================================

-- 1. CREAR REPARTIDORES DE PRUEBA
-- Nota: Para que aparezcan en la lista, primero deben existir en auth.users.
-- Como no puedo crear usuarios de auth directamente por SQL de forma segura sin triggers,
-- vamos a insertar perfiles ficticios vinculados a IDs aleatorios para que los veas en la lista.
-- IMPORTANTE: Estos usuarios no podran loguearse a menos que los crees en Supabase Auth > Users.

INSERT INTO public.profiles (id, email, role)
VALUES 
  (gen_random_uuid(), 'repartidor.pedro@baccaro.com', 'repartidor'),
  (gen_random_uuid(), 'repartidor.juan@baccaro.com', 'repartidor'),
  (gen_random_uuid(), 'repartidor.mario@baccaro.com', 'repartidor')
ON CONFLICT (id) DO NOTHING;

-- 2. CARGAR MÁS PEDIDOS CONFIRMADOS PARA MAÑANA (2026-03-09)
-- Usamos la fecha de mañana segun tu pantalla (09/03/2026)

DO $$ 
DECLARE 
    client_rec RECORD;
    new_order_id UUID;
    prod_pollo_id UUID;
    prod_milanesa_id UUID;
    prod_suprema_id UUID;
BEGIN
    -- Obtener IDs de productos para el test
    SELECT id INTO prod_pollo_id FROM products WHERE name = 'Pollo Entero' LIMIT 1;
    SELECT id INTO prod_milanesa_id FROM products WHERE name = 'Milanesa de Pollo' LIMIT 1;
    SELECT id INTO prod_suprema_id FROM products WHERE name = 'Suprema' LIMIT 1;

    -- Iterar por algunos clientes y crearles pedidos para mañana
    FOR client_rec IN (SELECT id, name FROM clients LIMIT 5) LOOP
        
        -- Crear el pedido
        INSERT INTO orders (client_id, delivery_date, status, source, notes)
        VALUES (client_rec.id, '2026-03-09', 'confirmed', 'manual', 'Pedido de prueba para logística - ' || client_rec.name)
        RETURNING id INTO new_order_id;

        -- Agregar items al pedido
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES 
            (new_order_id, prod_pollo_id, floor(random() * 20 + 5), 2200),
            (new_order_id, prod_milanesa_id, floor(random() * 10 + 2), 4000);
            
        RAISE NOTICE 'Pedido creado para %', client_rec.name;
    END LOOP;
END $$;
