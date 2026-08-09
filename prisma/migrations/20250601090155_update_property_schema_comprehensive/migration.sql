/*
  Warnings:

  - You are about to alter the column `amount` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `value` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "current_value" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "vesting_end_date" TIMESTAMP(3),
ADD COLUMN     "vesting_schedule" JSONB,
ADD COLUMN     "vesting_start_date" TIMESTAMP(3),
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,8);

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "value",
ADD COLUMN     "bathrooms" DECIMAL(3,1),
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currentValue" INTEGER,
ADD COLUMN     "hoa" INTEGER,
ADD COLUMN     "insurance" INTEGER,
ADD COLUMN     "lotSize" INTEGER,
ADD COLUMN     "maintenanceCosts" INTEGER,
ADD COLUMN     "monthlyPayment" INTEGER,
ADD COLUMN     "monthlyRent" INTEGER,
ADD COLUMN     "mortgageAmount" INTEGER,
ADD COLUMN     "mortgageProvider" TEXT,
ADD COLUMN     "mortgageRate" DECIMAL(5,2),
ADD COLUMN     "mortgageStartDate" TIMESTAMP(3),
ADD COLUMN     "mortgageTerm" INTEGER,
ADD COLUMN     "ownershipType" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "propertyTaxes" INTEGER,
ADD COLUMN     "propertyType" TEXT,
ADD COLUMN     "purchasePrice" INTEGER,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "rentalEndDate" TIMESTAMP(3),
ADD COLUMN     "rentalIncome" INTEGER,
ADD COLUMN     "rentalStartDate" TIMESTAMP(3),
ADD COLUMN     "securityDeposit" INTEGER,
ADD COLUMN     "squareFootage" INTEGER,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "yearBuilt" INTEGER,
ALTER COLUMN "purchaseDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Symbol" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "exchange" TEXT,
    "sector" TEXT,
    "industry" TEXT,
    "market_cap" BIGINT,
    "current_price" INTEGER,
    "previous_close" INTEGER,
    "day_change" INTEGER,
    "day_change_percent" DECIMAL(10,4),
    "volume" BIGINT,
    "avg_volume" BIGINT,
    "last_updated" TIMESTAMP(3),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "update_priority" INTEGER NOT NULL DEFAULT 1,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "last_error_at" TIMESTAMP(3),

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymbolQueue" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "requested_by" TEXT,
    "asset_type" "AssetType",
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "SymbolQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Symbol_symbol_key" ON "Symbol"("symbol");

-- CreateIndex
CREATE INDEX "Symbol_symbol_is_active_idx" ON "Symbol"("symbol", "is_active");

-- CreateIndex
CREATE INDEX "Symbol_type_is_active_idx" ON "Symbol"("type", "is_active");

-- CreateIndex
CREATE INDEX "Symbol_last_updated_update_priority_idx" ON "Symbol"("last_updated", "update_priority");

-- CreateIndex
CREATE INDEX "Symbol_update_priority_is_active_idx" ON "Symbol"("update_priority", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "SymbolQueue_symbol_key" ON "SymbolQueue"("symbol");

-- CreateIndex
CREATE INDEX "SymbolQueue_status_priority_idx" ON "SymbolQueue"("status", "priority");

-- CreateIndex
CREATE INDEX "SymbolQueue_created_at_idx" ON "SymbolQueue"("created_at");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "Symbol"("symbol") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "Symbol"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
