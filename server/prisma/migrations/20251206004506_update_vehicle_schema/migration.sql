-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "color" VARCHAR(50),
ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_file_id" TEXT;

-- Custom Migration: Change vehicle_type from ENUM to TEXT
-- 1. Create new column
ALTER TABLE "vehicles" ADD COLUMN "vehicle_type_new" TEXT;

-- 2. Copy and cast data (if any exists)
UPDATE "vehicles" SET "vehicle_type_new" = CAST("vehicle_type" AS TEXT);

-- 3. Drop old column
ALTER TABLE "vehicles" DROP COLUMN "vehicle_type";

-- 4. Rename new column
ALTER TABLE "vehicles" RENAME COLUMN "vehicle_type_new" TO "vehicle_type";

-- 5. Drop Enum type
DROP TYPE "VehicleType";
