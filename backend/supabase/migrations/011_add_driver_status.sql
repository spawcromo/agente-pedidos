-- Migration: 011_add_driver_status

CREATE TYPE driver_status_type AS ENUM ('disponible', 'enfermo', 'vacaciones', 'no_disponible');

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS driver_status driver_status_type NOT NULL DEFAULT 'disponible';
