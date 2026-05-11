-- CreateTable
CREATE TABLE "EaEvent" (
    "id" TEXT NOT NULL,
    "brokerAccountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EaEvent_brokerAccountId_idx" ON "EaEvent"("brokerAccountId");

-- AddForeignKey
ALTER TABLE "EaEvent" ADD CONSTRAINT "EaEvent_brokerAccountId_fkey" FOREIGN KEY ("brokerAccountId") REFERENCES "BrokerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
