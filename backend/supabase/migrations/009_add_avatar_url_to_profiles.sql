-- Migration: 009_add_avatar_url_to_profiles
-- Adds an optional avatar_url column to profiles for user avatars

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
