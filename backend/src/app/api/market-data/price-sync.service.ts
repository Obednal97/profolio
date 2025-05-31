import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma.service';
import { YahooFinanceService } from './yahoo-finance.service';
import { MarketDataService } from './market-data.service';

interface PriceSyncStats {
  totalSymbols: number;
  successfulUpdates: number;
  failedUpdates: number;
  popularSymbols: number;
  userSymbols: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errors: string[];
}

@Injectable()
export class PriceSyncService {
  private readonly logger = new Logger(PriceSyncService.name);
  private isRunning = false;
  private lastSyncStats: PriceSyncStats | null = null;

  // Popular symbols to preemptively scrape (most commonly traded)
  private readonly popularSymbols = [
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

  constructor(
    private prisma: PrismaService,
    private yahooFinanceService: YahooFinanceService,
    private marketDataService: MarketDataService,
  ) {}

  // Run every hour at minute 0
  @Cron(CronExpression.EVERY_HOUR)
  async syncAllPrices(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Price sync already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const stats: PriceSyncStats = {
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

    } catch (error) {
      this.logger.error('Price sync failed:', error);
      stats.errors.push((error as Error).message);
    } finally {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      this.lastSyncStats = stats;
      this.isRunning = false;

      this.logger.log(`Price sync completed: ${stats.successfulUpdates}/${stats.totalSymbols} successful, ${stats.failedUpdates} failed, ${Math.round(stats.duration! / 1000)}s`);
      
      if (stats.errors.length > 0) {
        this.logger.error(`Sync errors: ${stats.errors.join(', ')}`);
      }
    }
  }

  private async getPlatformSymbols(): Promise<string[]> {
    try {
      // Get all unique symbols from ALL users (including demo accounts)
      const result = await this.prisma.$queryRaw<Array<{ symbol: string }>>` 
        SELECT DISTINCT UPPER(symbol) as symbol
        FROM "Asset" 
        WHERE symbol IS NOT NULL 
        AND symbol != ''
        AND type IN ('STOCK', 'CRYPTO')
        ORDER BY symbol
      `;

      return result.map(row => row.symbol);
    } catch (error) {
      this.logger.error('Failed to get platform symbols:', error);
      return [];
    }
  }

  private combineSymbols(platformSymbols: string[], popularSymbols: string[]): string[] {
    const symbolSet = new Set<string>();
    
    // Add platform symbols (user-generated, highest priority)
    platformSymbols.forEach(symbol => symbolSet.add(symbol.toUpperCase()));
    
    // Add popular symbols (for preemptive caching)
    popularSymbols.forEach(symbol => symbolSet.add(symbol.toUpperCase()));
    
    return Array.from(symbolSet).sort();
  }

  private async processSymbolsWithStaging(symbols: string[], stats: PriceSyncStats): Promise<void> {
    // Intelligent staging based on symbol count
    const totalSymbols = symbols.length;
    let batchSize: number;
    let batchDelay: number;
    let requestDelay: number;

    if (totalSymbols <= 50) {
      // Small portfolio: be gentle
      batchSize = 5;
      batchDelay = 3000; // 3 seconds between batches
      requestDelay = 500; // 500ms between requests
    } else if (totalSymbols <= 150) {
      // Medium portfolio: moderate approach
      batchSize = 10;
      batchDelay = 2000; // 2 seconds between batches
      requestDelay = 300; // 300ms between requests
    } else {
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

  private async processBatch(symbols: string[], stats: PriceSyncStats, requestDelay: number): Promise<void> {
    for (const symbol of symbols) {
      try {
        const priceData = await this.yahooFinanceService.getCurrentPrice(symbol);
        
        if (priceData) {
          // Store price data for all matching assets
          await this.updatePlatformAssetsWithPrice(symbol, priceData);
          stats.successfulUpdates++;
        } else {
          stats.failedUpdates++;
          stats.errors.push(`No price data for ${symbol}`);
        }
      } catch (error) {
        stats.failedUpdates++;
        stats.errors.push(`${symbol}: ${(error as Error).message}`);
        this.logger.warn(`Failed to update price for ${symbol}:`, error);
      }
      
      // Add delay between individual requests
      await new Promise(resolve => setTimeout(resolve, requestDelay));
    }
  }

  private async updatePlatformAssetsWithPrice(symbol: string, priceData: any): Promise<void> {
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
        } catch (error) {
          this.logger.warn(`Failed to update asset ${asset.id}:`, error);
        }
      });

      await Promise.allSettled(updatePromises);
      
      // Also store a global price record for the symbol (for new users adding this symbol)
      await this.storeGlobalPriceRecord(symbol, priceData);
      
    } catch (error) {
      this.logger.error(`Failed to update platform assets for symbol ${symbol}:`, error);
      throw error;
    }
  }

  private async storeGlobalPriceRecord(symbol: string, priceData: any): Promise<void> {
    try {
      // Store a global price record using a special "system" asset ID
      const systemAssetId = `system-${symbol.toLowerCase()}`;
      
      await this.prisma.$executeRaw`
        INSERT INTO "PriceHistory" (id, "assetId", symbol, price, timestamp, source)
        VALUES (gen_random_uuid(), ${systemAssetId}, ${symbol}, ${Math.round(priceData.price * 100)}, ${priceData.timestamp}, ${priceData.source})
        ON CONFLICT ("assetId", timestamp, source) DO UPDATE SET price = EXCLUDED.price
      `;
    } catch (error) {
      // Don't throw here as this is supplementary data
      this.logger.debug(`Failed to store global price record for ${symbol}:`, error);
    }
  }

  // Get the latest price for a symbol (useful for new asset creation)
  async getLatestPrice(symbol: string): Promise<any> {
    try {
      const systemAssetId = `system-${symbol.toLowerCase()}`;
      
      const result = await this.prisma.$queryRaw<Array<{ price: number; timestamp: Date; source: string }>>` 
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
    } catch (error) {
      this.logger.error(`Failed to get latest price for ${symbol}:`, error);
      return null;
    }
  }

  // Manual sync for specific user (with immediate priority)
  async syncUserAssets(userId: string): Promise<PriceSyncStats> {
    const stats: PriceSyncStats = {
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
      const result = await this.prisma.$queryRaw<Array<{ symbol: string }>>` 
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
        } catch (error) {
          stats.failedUpdates++;
          stats.errors.push(`${symbol}: ${(error as Error).message}`);
        }
      }

      // Count failed symbols
      const failedSymbols = symbols.filter(symbol => !priceResults.has(symbol));
      stats.failedUpdates += failedSymbols.length;
      failedSymbols.forEach(symbol => {
        stats.errors.push(`${symbol}: No price data available`);
      });

    } catch (error) {
      this.logger.error(`Failed to sync assets for user ${userId}:`, error);
      stats.errors.push((error as Error).message);
    } finally {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
    }

    return stats;
  }

  private async updateUserAssetsWithPrice(userId: string, symbol: string, priceData: any): Promise<void> {
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
  getLastSyncStats(): PriceSyncStats | null {
    return this.lastSyncStats;
  }

  // Health check for the sync service
  async healthCheck(): Promise<{ healthy: boolean; lastSync?: Date; errors?: string[]; symbolCount?: number }> {
    const yahooHealthy = await this.yahooFinanceService.healthCheck();
    const platformSymbols = await this.getPlatformSymbols();
    
    return {
      healthy: yahooHealthy && !this.isRunning,
      lastSync: this.lastSyncStats?.startTime,
      errors: this.lastSyncStats?.errors || [],
      symbolCount: platformSymbols.length + this.popularSymbols.length
    };
  }

  // Clean up old price history (run daily at 2 AM)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldPriceHistory(): Promise<void> {
    try {
      this.logger.log('Starting price history cleanup');
      
      // Keep only 10 years of data as specified
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 10);

      const result = await this.prisma.$executeRaw`
        DELETE FROM "PriceHistory" 
        WHERE timestamp < ${cutoffDate}
      `;

      this.logger.log(`Cleaned up old price history: ${result} records deleted`);
    } catch (error) {
      this.logger.error('Failed to cleanup old price history:', error);
    }
  }

  // Get usage statistics for monitoring
  async getUsageStats(): Promise<any> {
    try {
      const platformSymbols = await this.getPlatformSymbols();
      const totalSymbols = this.combineSymbols(platformSymbols, this.popularSymbols);
      
      const priceHistoryCount = await this.prisma.$queryRaw<Array<{ count: bigint }>>` 
        SELECT COUNT(*) as count FROM "PriceHistory"
      `;

      const uniqueSymbolsInHistory = await this.prisma.$queryRaw<Array<{ count: bigint }>>` 
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
    } catch (error) {
      this.logger.error('Failed to get usage stats:', error);
      return null;
    }
  }
} 