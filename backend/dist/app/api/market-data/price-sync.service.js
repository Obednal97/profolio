"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PriceSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../common/prisma.service");
const yahoo_finance_service_1 = require("./yahoo-finance.service");
const market_data_service_1 = require("./market-data.service");
let PriceSyncService = PriceSyncService_1 = class PriceSyncService {
    constructor(prisma, yahooFinanceService, marketDataService) {
        this.prisma = prisma;
        this.yahooFinanceService = yahooFinanceService;
        this.marketDataService = marketDataService;
        this.logger = new common_1.Logger(PriceSyncService_1.name);
        this.isRunning = false;
        this.lastSyncStats = null;
        // Popular symbols to preemptively scrape (most commonly traded)
        this.popularSymbols = [
            // Major US Stocks
            'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
            'BABA', 'TSM', 'V', 'JPM', 'WMT', 'PG', 'UNH', 'HD', 'MA', 'BAC',
            'DIS', 'ADBE', 'CRM', 'NFLX', 'CMCSA', 'XOM', 'VZ', 'T', 'PFE', 'KO',
            // Major ETFs
            'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'VNQ', 'GLD',
            // Major Crypto (Yahoo Finance format)
            'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'SOL-USD',
            'DOGE-USD', 'DOT-USD', 'AVAX-USD', 'MATIC-USD',
            // Major International
            'ASML', 'SAP', 'NVO', 'RHHBY', 'TM', 'SONY', 'TSM', 'BABA', 'NIO',
            // Major Forex pairs (if Yahoo supports them)
            'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCAD=X', 'AUDUSD=X'
        ];
    }
    // Run every hour at minute 0
    async syncAllPrices() {
        if (this.isRunning) {
            this.logger.warn('Price sync already running, skipping this cycle');
            return;
        }
        this.isRunning = true;
        const stats = {
            totalSymbols: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            popularSymbols: 0,
            userSymbols: 0,
            startTime: new Date(),
            errors: [],
        };
        try {
            this.logger.log('Starting intelligent price synchronization');
            // Get unique symbols actually used on the platform
            const platformSymbols = await this.getPlatformSymbols();
            // Combine with popular symbols (remove duplicates)
            const allSymbols = this.combineSymbols(platformSymbols, this.popularSymbols);
            stats.totalSymbols = allSymbols.length;
            stats.userSymbols = platformSymbols.length;
            stats.popularSymbols = this.popularSymbols.length;
            if (allSymbols.length === 0) {
                this.logger.log('No symbols to update');
                return;
            }
            this.logger.log(`Found ${allSymbols.length} symbols to update (${platformSymbols.length} user symbols + ${this.popularSymbols.length} popular symbols)`);
            // Check Yahoo Finance health before proceeding
            const isHealthy = await this.yahooFinanceService.healthCheck();
            if (!isHealthy) {
                throw new Error('Yahoo Finance health check failed');
            }
            // Process symbols with intelligent staging to prevent rate limiting
            await this.processSymbolsWithStaging(allSymbols, stats);
        }
        catch (error) {
            this.logger.error('Price sync failed:', error);
            stats.errors.push(error.message);
        }
        finally {
            stats.endTime = new Date();
            stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
            this.lastSyncStats = stats;
            this.isRunning = false;
            this.logger.log(`Price sync completed: ${stats.successfulUpdates}/${stats.totalSymbols} successful, ${stats.failedUpdates} failed, ${Math.round(stats.duration / 1000)}s`);
            if (stats.errors.length > 0) {
                this.logger.error(`Sync errors: ${stats.errors.join(', ')}`);
            }
        }
    }
    async getPlatformSymbols() {
        try {
            // Get all unique symbols from ALL users (including demo accounts)
            const result = await this.prisma.$queryRaw ` 
        SELECT DISTINCT UPPER(symbol) as symbol
        FROM "Asset" 
        WHERE symbol IS NOT NULL 
        AND symbol != ''
        AND type IN ('STOCK', 'CRYPTO')
        ORDER BY symbol
      `;
            return result.map(row => row.symbol);
        }
        catch (error) {
            this.logger.error('Failed to get platform symbols:', error);
            return [];
        }
    }
    combineSymbols(platformSymbols, popularSymbols) {
        const symbolSet = new Set();
        // Add platform symbols (user-generated, highest priority)
        platformSymbols.forEach(symbol => symbolSet.add(symbol.toUpperCase()));
        // Add popular symbols (for preemptive caching)
        popularSymbols.forEach(symbol => symbolSet.add(symbol.toUpperCase()));
        return Array.from(symbolSet).sort();
    }
    async processSymbolsWithStaging(symbols, stats) {
        // Intelligent staging based on symbol count
        const totalSymbols = symbols.length;
        let batchSize;
        let batchDelay;
        let requestDelay;
        if (totalSymbols <= 50) {
            // Small portfolio: be gentle
            batchSize = 5;
            batchDelay = 3000; // 3 seconds between batches
            requestDelay = 500; // 500ms between requests
        }
        else if (totalSymbols <= 150) {
            // Medium portfolio: moderate approach
            batchSize = 10;
            batchDelay = 2000; // 2 seconds between batches
            requestDelay = 300; // 300ms between requests
        }
        else {
            // Large portfolio: more aggressive but still respectful
            batchSize = 15;
            batchDelay = 1500; // 1.5 seconds between batches
            requestDelay = 200; // 200ms between requests
        }
        this.logger.log(`Processing ${totalSymbols} symbols with batch size ${batchSize}, ${batchDelay}ms batch delay, ${requestDelay}ms request delay`);
        for (let i = 0; i < symbols.length; i += batchSize) {
            const batch = symbols.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(symbols.length / batchSize);
            this.logger.debug(`Processing batch ${batchNumber}/${totalBatches}: ${batch.join(', ')}`);
            await this.processBatch(batch, stats, requestDelay);
            // Add delay between batches (except for the last batch)
            if (i + batchSize < symbols.length) {
                await new Promise(resolve => setTimeout(resolve, batchDelay));
            }
        }
    }
    async processBatch(symbols, stats, requestDelay) {
        for (const symbol of symbols) {
            try {
                const priceData = await this.yahooFinanceService.getCurrentPrice(symbol);
                if (priceData) {
                    // Store price data for all matching assets
                    await this.updatePlatformAssetsWithPrice(symbol, priceData);
                    stats.successfulUpdates++;
                }
                else {
                    stats.failedUpdates++;
                    stats.errors.push(`No price data for ${symbol}`);
                }
            }
            catch (error) {
                stats.failedUpdates++;
                stats.errors.push(`${symbol}: ${error.message}`);
                this.logger.warn(`Failed to update price for ${symbol}:`, error);
            }
            // Add delay between individual requests
            await new Promise(resolve => setTimeout(resolve, requestDelay));
        }
    }
    async updatePlatformAssetsWithPrice(symbol, priceData) {
        try {
            // Get all assets across ALL users with this symbol
            const assets = await this.prisma.asset.findMany({
                where: {
                    symbol: {
                        equals: symbol,
                        mode: 'insensitive' // Case insensitive matching
                    },
                    type: { in: ['STOCK', 'CRYPTO'] }
                },
                select: { id: true, userId: true }
            });
            // Update each asset's price history and sync timestamp
            const updatePromises = assets.map(async (asset) => {
                try {
                    // Store price history
                    await this.marketDataService.storePriceData(asset.id, priceData);
                    // Update last synced timestamp
                    await this.prisma.asset.update({
                        where: { id: asset.id },
                        data: { lastSyncedAt: new Date() }
                    });
                }
                catch (error) {
                    this.logger.warn(`Failed to update asset ${asset.id}:`, error);
                }
            });
            await Promise.allSettled(updatePromises);
            // Also store a global price record for the symbol (for new users adding this symbol)
            await this.storeGlobalPriceRecord(symbol, priceData);
        }
        catch (error) {
            this.logger.error(`Failed to update platform assets for symbol ${symbol}:`, error);
            throw error;
        }
    }
    async storeGlobalPriceRecord(symbol, priceData) {
        try {
            // Store a global price record using a special "system" asset ID
            const systemAssetId = `system-${symbol.toLowerCase()}`;
            await this.prisma.$executeRaw `
        INSERT INTO "PriceHistory" (id, "assetId", symbol, price, timestamp, source)
        VALUES (gen_random_uuid(), ${systemAssetId}, ${symbol}, ${Math.round(priceData.price * 100)}, ${priceData.timestamp}, ${priceData.source})
        ON CONFLICT ("assetId", timestamp, source) DO UPDATE SET price = EXCLUDED.price
      `;
        }
        catch (error) {
            // Don't throw here as this is supplementary data
            this.logger.debug(`Failed to store global price record for ${symbol}:`, error);
        }
    }
    // Get the latest price for a symbol (useful for new asset creation)
    async getLatestPrice(symbol) {
        try {
            const systemAssetId = `system-${symbol.toLowerCase()}`;
            const result = await this.prisma.$queryRaw ` 
        SELECT price, timestamp, source
        FROM "PriceHistory" 
        WHERE "assetId" = ${systemAssetId}
        ORDER BY timestamp DESC 
        LIMIT 1
      `;
            if (result.length > 0) {
                return {
                    symbol: symbol.toUpperCase(),
                    price: result[0].price / 100, // Convert from cents
                    timestamp: result[0].timestamp,
                    source: result[0].source,
                };
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get latest price for ${symbol}:`, error);
            return null;
        }
    }
    // Manual sync for specific user (with immediate priority)
    async syncUserAssets(userId) {
        const stats = {
            totalSymbols: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            popularSymbols: 0,
            userSymbols: 0,
            startTime: new Date(),
            errors: [],
        };
        try {
            // Get user's symbols
            const result = await this.prisma.$queryRaw ` 
        SELECT DISTINCT UPPER(symbol) as symbol
        FROM "Asset" 
        WHERE "userId" = ${userId}
        AND symbol IS NOT NULL 
        AND symbol != ''
        AND type IN ('STOCK', 'CRYPTO')
        ORDER BY symbol
      `;
            const symbols = result.map(row => row.symbol);
            stats.totalSymbols = symbols.length;
            stats.userSymbols = symbols.length;
            if (symbols.length === 0) {
                return stats;
            }
            this.logger.log(`Manual sync for user ${userId}: ${symbols.length} symbols`);
            // Use faster processing for manual sync (user is waiting)
            const priceResults = await this.yahooFinanceService.getMultipleQuotes(symbols);
            // Update each symbol
            for (const [symbol, priceData] of priceResults) {
                try {
                    await this.updateUserAssetsWithPrice(userId, symbol, priceData);
                    stats.successfulUpdates++;
                }
                catch (error) {
                    stats.failedUpdates++;
                    stats.errors.push(`${symbol}: ${error.message}`);
                }
            }
            // Count failed symbols
            const failedSymbols = symbols.filter(symbol => !priceResults.has(symbol));
            stats.failedUpdates += failedSymbols.length;
            failedSymbols.forEach(symbol => {
                stats.errors.push(`${symbol}: No price data available`);
            });
        }
        catch (error) {
            this.logger.error(`Failed to sync assets for user ${userId}:`, error);
            stats.errors.push(error.message);
        }
        finally {
            stats.endTime = new Date();
            stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
        }
        return stats;
    }
    async updateUserAssetsWithPrice(userId, symbol, priceData) {
        const assets = await this.prisma.asset.findMany({
            where: {
                userId: userId,
                symbol: {
                    equals: symbol,
                    mode: 'insensitive'
                },
                type: { in: ['STOCK', 'CRYPTO'] }
            },
            select: { id: true }
        });
        const updatePromises = assets.map(async (asset) => {
            await this.marketDataService.storePriceData(asset.id, priceData);
            await this.prisma.asset.update({
                where: { id: asset.id },
                data: { lastSyncedAt: new Date() }
            });
        });
        await Promise.allSettled(updatePromises);
    }
    // Get stats about the last sync
    getLastSyncStats() {
        return this.lastSyncStats;
    }
    // Health check for the sync service
    async healthCheck() {
        var _a, _b;
        const yahooHealthy = await this.yahooFinanceService.healthCheck();
        const platformSymbols = await this.getPlatformSymbols();
        return {
            healthy: yahooHealthy && !this.isRunning,
            lastSync: (_a = this.lastSyncStats) === null || _a === void 0 ? void 0 : _a.startTime,
            errors: ((_b = this.lastSyncStats) === null || _b === void 0 ? void 0 : _b.errors) || [],
            symbolCount: platformSymbols.length + this.popularSymbols.length
        };
    }
    // Clean up old price history (run daily at 2 AM)
    async cleanupOldPriceHistory() {
        try {
            this.logger.log('Starting price history cleanup');
            // Keep only 10 years of data as specified
            const cutoffDate = new Date();
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 10);
            const result = await this.prisma.$executeRaw `
        DELETE FROM "PriceHistory" 
        WHERE timestamp < ${cutoffDate}
      `;
            this.logger.log(`Cleaned up old price history: ${result} records deleted`);
        }
        catch (error) {
            this.logger.error('Failed to cleanup old price history:', error);
        }
    }
    // Get usage statistics for monitoring
    async getUsageStats() {
        try {
            const platformSymbols = await this.getPlatformSymbols();
            const totalSymbols = this.combineSymbols(platformSymbols, this.popularSymbols);
            const priceHistoryCount = await this.prisma.$queryRaw ` 
        SELECT COUNT(*) as count FROM "PriceHistory"
      `;
            const uniqueSymbolsInHistory = await this.prisma.$queryRaw ` 
        SELECT COUNT(DISTINCT symbol) as count FROM "PriceHistory"
      `;
            return {
                platformSymbols: platformSymbols.length,
                popularSymbols: this.popularSymbols.length,
                totalSymbolsTracked: totalSymbols.length,
                totalPriceRecords: Number(priceHistoryCount[0].count),
                uniqueSymbolsWithHistory: Number(uniqueSymbolsInHistory[0].count),
                estimatedHourlyUpdates: totalSymbols.length,
                estimatedYearlyRecords: totalSymbols.length * 24 * 365, // 24 hours * 365 days
            };
        }
        catch (error) {
            this.logger.error('Failed to get usage stats:', error);
            return null;
        }
    }
};
exports.PriceSyncService = PriceSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PriceSyncService.prototype, "syncAllPrices", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PriceSyncService.prototype, "cleanupOldPriceHistory", null);
exports.PriceSyncService = PriceSyncService = PriceSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        yahoo_finance_service_1.YahooFinanceService,
        market_data_service_1.MarketDataService])
], PriceSyncService);
