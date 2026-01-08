/*
  Warnings:

  - You are about to drop the column `category` on the `UpdateItem` table. All the data in the column will be lost.
  - You are about to drop the column `senderDomain` on the `UpdateItem` table. All the data in the column will be lost.
  - You are about to drop the column `senderName` on the `UpdateItem` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `UpdateItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UpdateItem_userId_category_idx";

-- AlterTable
ALTER TABLE "UpdateItem" DROP COLUMN "category",
DROP COLUMN "senderDomain",
DROP COLUMN "senderName",
DROP COLUMN "summary";
