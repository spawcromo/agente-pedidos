-- Migration: 011_add_driver_features

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status_type') THEN
        CREATE TYPE driver_status_type AS ENUM ('disponible', 'enfermo', 'vacaciones', 'no_disponible');
    END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS driver_status driver_status_type NOT NULL DEFAULT 'disponible',
  ADD COLUMN IF NOT EXISTS phone TEXT;
