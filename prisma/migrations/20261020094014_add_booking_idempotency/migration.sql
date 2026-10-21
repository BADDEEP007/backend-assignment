/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `AvailabilitySlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AvailabilitySlot" ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_idempotencyKey_key" ON "AvailabilitySlot"("idempotencyKey");
