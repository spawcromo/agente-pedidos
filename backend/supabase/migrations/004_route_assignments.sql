-- Migration: 004_route_assignments
-- Add driver assignment to delivery routes

ALTER TABLE delivery_routes 
ADD COLUMN driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_delivery_routes_driver ON delivery_routes(driver_id);
