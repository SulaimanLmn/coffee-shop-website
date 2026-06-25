/*
  Warnings:

  - You are about to drop the column `origin` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `roastLevel` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "origin",
DROP COLUMN "roastLevel",
ALTER COLUMN "category" SET DEFAULT 'hot-coffee';
