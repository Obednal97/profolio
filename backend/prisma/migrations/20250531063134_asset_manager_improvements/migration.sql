-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('SIMPLE', 'COMPOUND');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "ApiProvider" AS ENUM ('ALPHA_VANTAGE', 'TWELVE_DATA', 'POLYGON_IO', 'COINGECKO', 'COINMARKETCAP', 'BINANCE', 'TRADING212');

-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE 'SAVINGS';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "autoSync" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "initialAmount" INTEGER,
ADD COLUMN     "interestRate" INTEGER,
ADD COLUMN     "interestType" "InterestType",
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "maturityDate" TIMESTAMP(3),
ADD COLUMN     "paymentFrequency" "PaymentFrequency",
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "purchasePrice" INTEGER,
ADD COLUMN     "termLength" INTEGER;

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransaction" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "fees" INTEGER,
    "totalValue" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,

    CONSTRAINT "AssetTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "ApiProvider" NOT NULL,
    "keyName" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "rateLimitHit" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketDataJob" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" "ApiProvider" NOT NULL,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketDataJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_assetId_timestamp_idx" ON "PriceHistory"("assetId", "timestamp");

-- CreateIndex
CREATE INDEX "PriceHistory_symbol_timestamp_idx" ON "PriceHistory"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_assetId_timestamp_source_key" ON "PriceHistory"("assetId", "timestamp", "source");

-- CreateIndex
CREATE INDEX "AssetTransaction_assetId_date_idx" ON "AssetTransaction"("assetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_userId_provider_keyName_key" ON "ApiKey"("userId", "provider", "keyName");

-- CreateIndex
CREATE INDEX "MarketDataJob_nextRun_isActive_idx" ON "MarketDataJob"("nextRun", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDataJob_symbol_provider_key" ON "MarketDataJob"("symbol", "provider");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransaction" ADD CONSTRAINT "AssetTransaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
