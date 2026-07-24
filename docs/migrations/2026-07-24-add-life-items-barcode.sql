-- life_items.barcode 幂等补齐
-- 状态: 已合入 docs/database-init.sql §23；本文件仅供旧实例单独执行。
-- Safe to re-run.
ALTER TABLE life_items ADD COLUMN IF NOT EXISTS barcode TEXT;
