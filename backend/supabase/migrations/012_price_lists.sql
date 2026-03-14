-- Migration: 012_price_lists
-- Redefine product pricing with multiple price lists and client assignment

-- 1. Create Price Lists table
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add price_list_id to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL;

-- 3. Create Product Prices table (materialized prices per list)
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE(price_list_id, product_id)
);

-- 4. Initialize "Lista Base" if no price lists exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM price_lists) THEN
        INSERT INTO price_lists (name) VALUES ('Lista Base');
        
        -- Migrate existing retail prices to the base list
        INSERT INTO product_prices (price_list_id, product_id, price)
        SELECT (SELECT id FROM price_lists WHERE name = 'Lista Base' LIMIT 1), id, price_retail
        FROM products;
        
        -- Assign all clients to the base list
        UPDATE clients SET price_list_id = (SELECT id FROM price_lists WHERE name = 'Lista Base' LIMIT 1);
    END IF;
END $$;

-- 5. RLS Policies
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- Note: We assume the existing "Authenticated users full access" pattern
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users full access' AND tablename = 'price_lists') THEN
        CREATE POLICY "Authenticated users full access" ON price_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users full access' AND tablename = 'product_prices') THEN
        CREATE POLICY "Authenticated users full access" ON product_prices FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
