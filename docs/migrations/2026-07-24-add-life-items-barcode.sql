-- Fix: column life_items.barcode does not exist (GET /api/items 500)
-- Safe to re-run.
ALTER TABLE life_items ADD COLUMN IF NOT EXISTS barcode TEXT;
