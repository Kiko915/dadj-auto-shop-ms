/*
  Warnings:

  - You are about to drop the column `profile_picture` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "profile_picture",
ADD COLUMN     "customer_profile_picture" TEXT,
ALTER COLUMN "loyalty_status" SET DEFAULT 'Regular';
