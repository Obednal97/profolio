-- CreateIndex
CREATE INDEX "ApiKey_userId_provider_isActive_idx" ON "ApiKey"("userId", "provider", "isActive");

-- CreateIndex
CREATE INDEX "ApiKey_provider_isActive_idx" ON "ApiKey"("provider", "isActive");

-- CreateIndex
CREATE INDEX "Asset_userId_type_idx" ON "Asset"("userId", "type");

-- CreateIndex
CREATE INDEX "Asset_symbol_type_idx" ON "Asset"("symbol", "type");

-- CreateIndex
CREATE INDEX "Asset_userId_symbol_idx" ON "Asset"("userId", "symbol");

-- CreateIndex
CREATE INDEX "Asset_lastSyncedAt_idx" ON "Asset"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "AssetTransaction_assetId_type_date_idx" ON "AssetTransaction"("assetId", "type", "date");

-- CreateIndex
CREATE INDEX "AssetTransaction_date_idx" ON "AssetTransaction"("date");

-- CreateIndex
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");

-- CreateIndex
CREATE INDEX "Expense_userId_category_idx" ON "Expense"("userId", "category");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Liability_userId_idx" ON "Liability"("userId");

-- CreateIndex
CREATE INDEX "Liability_dueDate_idx" ON "Liability"("dueDate");

-- CreateIndex
CREATE INDEX "MarketDataJob_provider_isActive_idx" ON "MarketDataJob"("provider", "isActive");

-- CreateIndex
CREATE INDEX "PriceHistory_timestamp_idx" ON "PriceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "PriceHistory_symbol_timestamp_source_idx" ON "PriceHistory"("symbol", "timestamp", "source");

-- CreateIndex
CREATE INDEX "PriceHistory_assetId_timestamp_price_idx" ON "PriceHistory"("assetId", "timestamp", "price");

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- CreateIndex
CREATE INDEX "Property_purchaseDate_idx" ON "Property"("purchaseDate");
