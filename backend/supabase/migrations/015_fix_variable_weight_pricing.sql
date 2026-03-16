-- Migration: 015_fix_variable_weight_pricing
-- Corrects the pricing model: price_per_kg lives in product_prices (price lists),
-- NOT in the products table. estimated_weight_kg stays as a product attribute.

-- Remove price_per_kg from products (it belongs in price lists)
ALTER TABLE products DROP COLUMN IF EXISTS price_per_kg;

-- estimated_weight_kg stays — it's a product attribute (avg box weight)
-- pricing_type stays — it's a product attribute (fixed vs by_weight)

-- USAGE:
-- Product: Caja de Pollo, unit='caja', pricing_type='by_weight', estimated_weight_kg=15
-- Price List: Caja de Pollo → $3000 (this IS the $/kg)
-- Order: client orders 3 cajas → 3 order_items rows, each quantity=1
-- Admin weighs each box individually → unit_price = price_per_kg × actual_weight_kg
