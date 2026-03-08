-- Migration: 005_remove_route_uniqueness
-- The previous schema had a UNIQUE constraint on delivery_date in delivery_routes.
-- We remove it to allow multiple routes (for different drivers or shifts) on the same day.

ALTER TABLE delivery_routes DROP CONSTRAINT IF EXISTS delivery_routes_delivery_date_key;
