-- ============================================================
-- HEAL MIGRATION DRIFT: orders.priority
-- ============================================================
-- The `priority` column was added to the production database during
-- the v3.3.0 Order Priority feature, but no migration file was ever
-- committed for it. A fresh `supabase db reset` therefore produced a
-- schema WITHOUT this column, diverging from production.
--
-- This migration reconciles the two. `IF NOT EXISTS` makes it a no-op
-- in production (column already present) while restoring it on fresh
-- local databases.
--
-- Spec (matches production): 'normal' | 'urgent', default 'normal'.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('normal', 'urgent'));
