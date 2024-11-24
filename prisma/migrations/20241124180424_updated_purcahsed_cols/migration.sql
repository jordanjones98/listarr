/*
  Warnings:

  - You are about to drop the column `purchased` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "purchased",
ADD COLUMN     "purchasedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wantedQuantity" INTEGER NOT NULL DEFAULT 1;
