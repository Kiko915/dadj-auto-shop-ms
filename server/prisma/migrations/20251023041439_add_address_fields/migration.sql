-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Philippines',
ADD COLUMN     "province" TEXT,
ADD COLUMN     "street" TEXT;
