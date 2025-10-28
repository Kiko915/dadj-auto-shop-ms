-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "profile_picture" TEXT,
ADD COLUMN     "total_vehicles" INTEGER NOT NULL DEFAULT 0;
