-- Agregar estado 'cancelled' a la enumeración de estados de orden si no existe
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Agregar columna para el motivo de cancelación
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
