-- Migration: 017_add_preparing_status
-- Adds 'preparing' status to the order_status enum.
-- This represents orders that are confirmed but pending weight finalization.

-- We have to use this trick to add a value to an enum in PostgreSQL inside a transaction
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preparing' AFTER 'pending';
