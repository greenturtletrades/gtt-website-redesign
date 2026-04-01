-- CreateTable
CREATE TABLE "StoredTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerAccountId" TEXT,
    "source" TEXT NOT NULL,
    "tradeIdentity" TEXT NOT NULL,
    "externalTradeId" TEXT,
    "symbol" TEXT,
    "side" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitTime" TIMESTAMP(3) NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "exitPrice" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "takeProfit" DOUBLE PRECISION NOT NULL,
    "mfe" DOUBLE PRECISION,
    "mae" DOUBLE PRECISION,
    "session" TEXT,
    "spread" DOUBLE PRECISION,
    "volatility" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "swap" DOUBLE PRECISION,
    "rawTrade" JSONB NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredTrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoredTrade_userId_tradeIdentity_key" ON "StoredTrade"("userId", "tradeIdentity");

-- CreateIndex
CREATE INDEX "StoredTrade_userId_exitTime_idx" ON "StoredTrade"("userId", "exitTime");

-- CreateIndex
CREATE INDEX "StoredTrade_brokerAccountId_exitTime_idx" ON "StoredTrade"("brokerAccountId", "exitTime");

-- AddForeignKey
ALTER TABLE "StoredTrade" ADD CONSTRAINT "StoredTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredTrade" ADD CONSTRAINT "StoredTrade_brokerAccountId_fkey" FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
