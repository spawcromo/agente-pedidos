-- Migration: 013_rename_product_price
-- Rename price_retail to base_price for clarity in the new price list system

ALTER TABLE products RENAME COLUMN price_retail TO base_price;
-- We keep price_wholesale for legacy/compatibility or just remove it. 
-- For now, let's just keep it to avoid breaking other parts until we are sure.
