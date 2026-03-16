-- Migration: 014_variable_weight_pricing
-- Adds support for products priced by weight (e.g. caja de pollo)
-- The final price is calculated as: actual_weight_kg × price_per_kg

-- ============================================================
-- PRODUCTS: Add pricing type and weight-related columns
-- ============================================================

-- pricing_type: 'fixed' = normal product, 'by_weight' = price depends on weight
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'fixed'
    CHECK (pricing_type IN ('fixed', 'by_weight'));

-- Price per kilogram (used when pricing_type = 'by_weight')
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(10,2) DEFAULT NULL;

-- Estimated weight to show approximate total to the customer
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS estimated_weight_kg NUMERIC(10,2) DEFAULT NULL;

-- ============================================================
-- ORDER ITEMS: Add weight tracking and price finalization
-- ============================================================

-- Actual weight in kg entered by admin when product is weighed
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS actual_weight_kg NUMERIC(10,2) DEFAULT NULL;

-- Whether the price has been finalized (for by_weight items)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS is_price_final BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_pricing_type ON products(pricing_type);
CREATE INDEX IF NOT EXISTS idx_order_items_price_final ON order_items(is_price_final) WHERE is_price_final = false;

-- ============================================================
-- COMMENT: Usage notes
-- ============================================================
-- For 'by_weight' products:
--   1. Product has pricing_type='by_weight', price_per_kg=3000, estimated_weight_kg=15
--   2. When customer orders, order_item gets:
--      - quantity=1, unit_price=(3000*15)=45000, is_price_final=false
--   3. Admin weighs the box: actual_weight_kg=14.5
--   4. System updates: unit_price=(3000*14.5)=43500, is_price_final=true
