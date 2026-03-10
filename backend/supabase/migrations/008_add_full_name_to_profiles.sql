-- Migration: 008_add_full_name_to_profiles
-- Add full_name field to profiles table

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update existing profiles to have a placeholder if needed, 
-- but normally email is enough as fallback.
