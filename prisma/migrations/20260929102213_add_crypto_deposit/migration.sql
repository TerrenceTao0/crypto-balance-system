-- CreateTable
CREATE TABLE "crypto_deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "amountUsdc" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "txHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crypto_deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "lastBlock" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "deposit_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_address_key" ON "crypto_deposit"("address");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_index_key" ON "crypto_deposit"("index");

