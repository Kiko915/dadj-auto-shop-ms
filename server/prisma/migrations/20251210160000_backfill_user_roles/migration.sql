-- Backfill existing users with role 'user' to 'staff'
UPDATE "users" SET "role" = 'staff' WHERE "role" = 'user';

-- Ensure default is set to 'staff' (redundant if schema matched, but good for safety)
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'staff';
