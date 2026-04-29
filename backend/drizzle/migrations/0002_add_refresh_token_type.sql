-- ALTER TYPE ADD VALUE cannot run inside a transaction block.
-- Drizzle-kit wraps migrations in transactions by default, so this value
-- must be applied outside via a direct psql command or a custom script.
-- The value has already been applied manually:
--   ALTER TYPE token_type ADD VALUE IF NOT EXISTS 'REFRESH';
--
-- This file is kept as documentation. If deploying to a fresh DB,
-- run the above statement manually BEFORE running drizzle-kit migrate,
-- or use the seed/init script.
SELECT 1; -- no-op placeholder so drizzle tracks this migration as applied
