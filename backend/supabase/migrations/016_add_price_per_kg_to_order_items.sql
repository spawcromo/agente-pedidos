-- Migration: 016_add_price_per_kg_to_order_items
-- Stores the price per kg at the time of order creation for by_weight items.
-- This ensures that weight updates use the original intended price even if
-- price lists or product estimated weights change later.

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10,2);

-- Update existing items by deriving price_per_kg from unit_price and estimated_weight_kg (if by_weight)
UPDATE order_items
SET price_per_kg = order_items.unit_price / products.estimated_weight_kg
FROM products
WHERE order_items.product_id = products.id
  AND products.pricing_type = 'by_weight'
  AND products.estimated_weight_kg > 0
  AND order_items.price_per_kg IS NULL;
