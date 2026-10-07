/*
  Warnings:

  - You are about to drop the column `balance` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "balance",
ADD COLUMN     "balanceUnits" BIGINT NOT NULL DEFAULT 0;
