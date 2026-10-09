-- CreateTable
CREATE TABLE "deposit_transfer" (
    "id" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "amountUnits" BIGINT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deposit_transfer_depositId_idx" ON "deposit_transfer"("depositId");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_transfer_txHash_logIndex_key" ON "deposit_transfer"("txHash", "logIndex");

-- AddForeignKey
ALTER TABLE "deposit_transfer" ADD CONSTRAINT "deposit_transfer_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "crypto_deposit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

