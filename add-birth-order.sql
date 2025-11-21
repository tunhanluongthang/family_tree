-- Add birth_order column to person table
-- Run this in Supabase SQL Editor

ALTER TABLE person ADD COLUMN birth_order INTEGER;

COMMENT ON COLUMN person.birth_order IS 'Birth order among siblings (1 = oldest, 2 = second, etc.). Optional field for manual ordering.';
