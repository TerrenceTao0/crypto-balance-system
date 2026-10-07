/*
  Warnings:

  - You are about to drop the column `amountUsdc` on the `crypto_deposit` table. All the data in the column will be lost.
  - The `status` column on the `crypto_deposit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `amountUnits` to the `crypto_deposit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('pending', 'confirmed', 'swept', 'expired');

-- AlterTable
ALTER TABLE "crypto_deposit" DROP COLUMN "amountUsdc",
ADD COLUMN     "amountUnits" BIGINT NOT NULL,
ADD COLUMN     "blockNumber" BIGINT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "sweptAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "DepositStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "crypto_deposit_userId_idx" ON "crypto_deposit"("userId");

-- CreateIndex
CREATE INDEX "crypto_deposit_status_idx" ON "crypto_deposit"("status");

-- AddForeignKey
ALTER TABLE "crypto_deposit" ADD CONSTRAINT "crypto_deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
