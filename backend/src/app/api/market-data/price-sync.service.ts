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
  currentDelay: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  delayAdjustments: Array<{ symbol: string; oldDelay: number; newDelay: number; reason: string }>;
}

@Injectable()
export class PriceSyncService {
  private readonly logger = new Logger(PriceSyncService.name);
  private isRunning = false;
  private lastSyncStats: PriceSyncStats | null = null;
  private startupCompleted = false;

  // Adaptive rate limiting settings
  private readonly MIN_DELAY = 5000; // 5 seconds minimum
  private readonly MAX_DELAY = 60000; // 60 seconds maximum
  private readonly BATCH_DELAY_MULTIPLIER = 6; // Batch delay = current delay * 6
  
  // Time-based update filtering settings
  private readonly MIN_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly MAX_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly STALE_UPDATE_THRESHOLD = 12 * 60 * 60 * 1000; // 12 hours - prioritize these

  // Reduced popular symbols to essential ones only
  private readonly popularSymbols = [
    // Major US Stocks (top 10 only)
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'V',
    
    // Major ETFs (top 5 only)
    'SPY', 'QQQ', 'VTI', 'VOO', 'VEA',
    
    // Major Crypto (top 5 only)
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD'
  ];

  constructor(
    private prisma: PrismaService,
    private yahooFinanceService: YahooFinanceService,
    private marketDataService: MarketDataService,
  ) {
    // Delay startup to prevent immediate API calls
    setTimeout(() => {
      this.startupCompleted = true;
      this.logger.log('Price sync service ready - will start on next scheduled hour');
    }, 5000); // 5 second delay
  }

  // Only run if startup is completed and we have actual user data
  @Cron(CronExpression.EVERY_HOUR)
  async syncAllPrices(): Promise<void> {
    if (!this.startupCompleted) {
      this.logger.log('Skipping price sync - startup not completed');
      return;
    }

    if (this.isRunning) {
      this.logger.warn('Price sync already running, skipping this cycle');
      return;
    }

    // Check if we have recent data already (within last 30 minutes)
    const hasRecentData = await this.hasRecentPriceData();
    if (hasRecentData) {
      this.logger.log('Recent price data found, skipping sync cycle');
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
      currentDelay: this.MIN_DELAY,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      delayAdjustments: [],
    };

    try {
      this.logger.log('Starting intelligent price synchronization');

      // Get unique symbols actually used on the platform
      const platformSymbols = await this.getPlatformSymbols();
      
      // Only sync popular symbols if we have less than 10 user symbols
      const shouldSyncPopular = platformSymbols.length < 10;
      const popularToSync = shouldSyncPopular ? this.popularSymbols.slice(0, 5) : []; // Max 5 popular
      
      // Combine with popular symbols (remove duplicates)
      const allSymbols = await this.combineSymbols(platformSymbols, popularToSync);
      
      stats.totalSymbols = allSymbols.length;
      stats.userSymbols = platformSymbols.length;
      stats.popularSymbols = popularToSync.length;

      if (allSymbols.length === 0) {
        this.logger.log('No symbols to update');
        return;
      }

      this.logger.log(`Found ${allSymbols.length} symbols to update (${platformSymbols.length} user symbols + ${popularToSync.length} popular symbols)`);

      // Check Yahoo Finance health before proceeding
      const isHealthy = await this.yahooFinanceService.healthCheck();
      if (!isHealthy) {
        throw new Error('Yahoo Finance health check failed');
      }

      // Process symbols with adaptive rate limiting
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
      
      // Log time-based filtering efficiency
      if (stats.totalSymbols === 0) {
        this.logger.log(`🕐 Time-based filtering: All symbols up-to-date (no updates needed)`);
      } else {
        this.logger.log(`🕐 Time-based filtering efficiency:`);
        this.logger.log(`   • Symbols processed: ${stats.totalSymbols} (only symbols >1h old)`);
        this.logger.log(`   • API calls saved: Skipped all symbols updated within last hour`);
        this.logger.log(`   • Next forced updates: Symbols approaching 24h threshold`);
      }
      
      // Log adaptive rate limiting summary
      this.logger.log(`🎯 Adaptive rate limiting summary:`);
      this.logger.log(`   Final delay: ${stats.currentDelay}ms (min: ${this.MIN_DELAY}ms, max: ${this.MAX_DELAY}ms)`);
      this.logger.log(`   Total delay adjustments: ${stats.delayAdjustments.length}`);
      
      if (stats.delayAdjustments.length > 0) {
        this.logger.log(`   Delay adjustment history:`);
        stats.delayAdjustments.forEach((adj, index) => {
          this.logger.log(`     ${index + 1}. ${adj.symbol}: ${adj.oldDelay}ms → ${adj.newDelay}ms (${adj.reason})`);
        });
      }
      
      if (stats.errors.length > 0) {
        this.logger.error(`Sync errors: ${stats.errors.join(', ')}`);
      }
    }
  }

  private async hasRecentPriceData(): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - this.MIN_UPDATE_INTERVAL);
      
      // Check if we have any symbols that need updating based on our time-based rules
      const symbolsNeedingUpdate = await this.prisma.$queryRaw<Array<{ count: bigint }>>` 
        SELECT COUNT(*) as count
        FROM "Symbol" s
        WHERE s.symbol IS NOT NULL 
        AND s.symbol != ''
        AND s.type IN ('STOCK', 'CRYPTO')
        AND (
          s.last_updated IS NULL
          OR s.last_updated < ${oneHourAgo}
        )
        LIMIT 1
      `;

      const needsUpdate = Number(symbolsNeedingUpdate[0].count) > 0;
      
      if (!needsUpdate) {
        this.logger.log('🕐 Time-based filtering: All symbols updated within last hour, skipping sync');
      }
      
      return !needsUpdate; // Return true if we DON'T need updates (i.e., have recent data)
    } catch (error) {
      this.logger.debug('Error checking recent price data:', error);
      return false; // If error, assume we need to update
    }
  }

  private async getPlatformSymbols(): Promise<string[]> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - this.MIN_UPDATE_INTERVAL);
      const twelveHoursAgo = new Date(now.getTime() - this.STALE_UPDATE_THRESHOLD);
      const twentyFourHoursAgo = new Date(now.getTime() - this.MAX_UPDATE_INTERVAL);

      // Get symbols that need updates based on time-based filtering
      const result = await this.prisma.$queryRaw<Array<{ 
        symbol: string; 
        last_updated: Date | null; 
        current_price: number | null;
        hours_since_update: number | null;
      }>>` 
        SELECT 
          UPPER(s.symbol) as symbol,
          s.last_updated,
          s.current_price,
          CASE 
            WHEN s.last_updated IS NULL THEN NULL
            ELSE EXTRACT(EPOCH FROM (NOW() - s.last_updated)) / 3600
          END as hours_since_update
        FROM "Symbol" s
        WHERE s.symbol IS NOT NULL 
        AND s.symbol != ''
        AND s.type IN ('STOCK', 'CRYPTO')
        AND (
          -- Never updated (highest priority)
          s.last_updated IS NULL
          OR 
          -- Must update if older than 24 hours (forced update)
          s.last_updated < ${twentyFourHoursAgo}
          OR
          -- Can update if older than 1 hour (eligible for update)
          s.last_updated < ${oneHourAgo}
        )
        ORDER BY 
          -- Priority: Never updated first, then oldest updates, then by symbol name
          CASE WHEN s.last_updated IS NULL THEN 0 ELSE 1 END,
          s.last_updated ASC NULLS FIRST,
          s.symbol
        LIMIT 20
      `;

      // Log filtering results
      this.logger.log(`🕐 Time-based update filtering results:`);
      
      if (result.length === 0) {
        this.logger.log(`   ✅ All symbols up-to-date (updated within last hour)`);
        return [];
      }

      const neverUpdated = result.filter(r => r.last_updated === null);
      const forcedUpdates = result.filter(r => r.last_updated && r.hours_since_update! >= 24);
      const staleUpdates = result.filter(r => r.last_updated && r.hours_since_update! >= 12 && r.hours_since_update! < 24);
      const eligibleUpdates = result.filter(r => r.last_updated && r.hours_since_update! >= 1 && r.hours_since_update! < 12);

      this.logger.log(`   📊 Update categories:`);
      this.logger.log(`      • Never updated: ${neverUpdated.length} symbols`);
      this.logger.log(`      • Forced (>24h): ${forcedUpdates.length} symbols`);
      this.logger.log(`      • Stale (>12h): ${staleUpdates.length} symbols`);
      this.logger.log(`      • Eligible (>1h): ${eligibleUpdates.length} symbols`);

      if (neverUpdated.length > 0) {
        this.logger.log(`   🆕 Never updated: ${neverUpdated.map(s => s.symbol).join(', ')}`);
      }
      
      if (forcedUpdates.length > 0) {
        this.logger.log(`   🚨 Forced updates (>24h): ${forcedUpdates.map(s => `${s.symbol}(${Math.round(s.hours_since_update!)}h)`).join(', ')}`);
      }

      if (staleUpdates.length > 0) {
        this.logger.log(`   ⚠️  Stale updates (>12h): ${staleUpdates.map(s => `${s.symbol}(${Math.round(s.hours_since_update!)}h)`).join(', ')}`);
      }

      return result.map(row => row.symbol);
    } catch (error) {
      this.logger.error('Failed to get platform symbols with time filtering:', error);
      return [];
    }
  }

  private async combineSymbols(platformSymbols: string[], popularSymbols: string[]): Promise<string[]> {
    const symbolSet = new Set<string>();
    
    // Add platform symbols (user-generated, highest priority)
    platformSymbols.forEach(symbol => symbolSet.add(symbol.toUpperCase()));
    
    // Add popular symbols (for preemptive caching) only if we don't have many user symbols
    // and only if they also need time-based updates
    if (platformSymbols.length < 10) {
      try {
        const oneHourAgo = new Date(Date.now() - this.MIN_UPDATE_INTERVAL);
        
        // Filter popular symbols that need updates based on time-based rules
        const filteredPopularSymbols = await this.prisma.$queryRaw<Array<{ symbol: string }>>` 
          SELECT s.symbol
          FROM "Symbol" s
          WHERE UPPER(s.symbol) = ANY(${popularSymbols.map(s => s.toUpperCase())})
          AND s.type IN ('STOCK', 'CRYPTO')
          AND (
            s.last_updated IS NULL
            OR s.last_updated < ${oneHourAgo}
          )
          ORDER BY s.last_updated ASC NULLS FIRST
        `;
        
        const eligiblePopularSymbols = filteredPopularSymbols.map(row => row.symbol.toUpperCase());
        
        if (eligiblePopularSymbols.length < popularSymbols.length) {
          this.logger.log(`🕐 Popular symbols filter: ${eligiblePopularSymbols.length}/${popularSymbols.length} popular symbols need updates`);
        }
        
        eligiblePopularSymbols.forEach(symbol => symbolSet.add(symbol));
      } catch (error) {
        this.logger.warn('Failed to filter popular symbols by time, using all:', error);
        popularSymbols.forEach(symbol => symbolSet.add(symbol.toUpperCase()));
      }
    }
    
    return Array.from(symbolSet).sort().slice(0, 20); // Max 20 symbols per sync
  }

  private async processSymbolsWithStaging(symbols: string[], stats: PriceSyncStats): Promise<void> {
    // Adaptive rate limiting - starts at 5s, adjusts based on success/failure patterns
    const batchSize = 1; // Process only 1 symbol at a time for maximum reliability
    
    this.logger.log(`Processing ${symbols.length} symbols with adaptive rate limiting (starting at ${stats.currentDelay}ms)`);

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(symbols.length / batchSize);
      
      this.logger.log(`Processing batch ${batchNumber}/${totalBatches}: ${batch.join(', ')} (delay: ${stats.currentDelay}ms)`);
      
      await this.processBatch(batch, stats);
      
      // Adjust delay based on success/failure patterns
      this.adjustAdaptiveDelay(stats);
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < symbols.length) {
        const batchDelay = stats.currentDelay * this.BATCH_DELAY_MULTIPLIER;
        this.logger.log(`Waiting ${batchDelay}ms before next batch (adaptive rate limiting)...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
  }

  private adjustAdaptiveDelay(stats: PriceSyncStats): void {
    const oldDelay = stats.currentDelay;
    let newDelay = stats.currentDelay;
    let reason = '';

    // Double delay on failure (exponential backoff)
    if (stats.consecutiveFailures >= 1) {
      newDelay = Math.min(stats.currentDelay * 2, this.MAX_DELAY);
      reason = `${stats.consecutiveFailures} consecutive failure(s) - doubling delay`;
      stats.consecutiveFailures = 0; // Reset after adjustment
    }
    // Halve delay on two consecutive successes (gradual recovery)
    else if (stats.consecutiveSuccesses >= 2) {
      newDelay = Math.max(stats.currentDelay / 2, this.MIN_DELAY);
      reason = `${stats.consecutiveSuccesses} consecutive successes - halving delay`;
      stats.consecutiveSuccesses = 0; // Reset after adjustment
    }

    if (newDelay !== oldDelay) {
      stats.currentDelay = newDelay;
      this.logger.log(`🎯 Adaptive rate limiting: ${oldDelay}ms → ${newDelay}ms (${reason})`);
      
      // Track the adjustment
      stats.delayAdjustments.push({
        symbol: 'BATCH',
        oldDelay,
        newDelay,
        reason
      });
    }
  }

  private async processBatch(symbols: string[], stats: PriceSyncStats): Promise<void> {
    for (const symbol of symbols) {
      try {
        this.logger.log(`Fetching price and historical data for ${symbol} with ${stats.currentDelay}ms adaptive delay...`);
        
        // Fetch current price
        const priceData = await this.yahooFinanceService.getCurrentPrice(symbol);
        
        if (priceData) {
          // Store current price data for all matching assets
          await this.updatePlatformAssetsWithPrice(symbol, priceData);
          
          // Also fetch and store historical data (last 30 days for new symbols, 7 days for updates)
          try {
            const isNewSymbol = await this.isNewSymbol(symbol);
            const daysToFetch = isNewSymbol ? 30 : 7; // Get more data for new symbols
            
            this.logger.log(`Fetching ${daysToFetch} days of historical data for ${symbol}...`);
            const historicalData = await this.yahooFinanceService.getHistoricalData(symbol, daysToFetch);
            
            if (historicalData && historicalData.data.length > 0) {
              await this.storeHistoricalData(symbol, historicalData);
              this.logger.log(`✅ Stored ${historicalData.data.length} historical data points for ${symbol}`);
            }
          } catch (historicalError) {
            this.logger.warn(`Failed to fetch historical data for ${symbol}:`, historicalError);
            // Don't fail the whole operation if historical data fails
          }
          
          stats.successfulUpdates++;
          stats.consecutiveSuccesses++;
          stats.consecutiveFailures = 0;
          
          this.logger.log(`✅ Successfully updated ${symbol}: $${priceData.price} (${stats.consecutiveSuccesses} consecutive successes)`);
        } else {
          stats.failedUpdates++;
          stats.consecutiveFailures++;
          stats.consecutiveSuccesses = 0;
          stats.errors.push(`No price data for ${symbol}`);
          
          this.logger.warn(`❌ No price data for ${symbol} (${stats.consecutiveFailures} consecutive failures)`);
        }
      } catch (error) {
        stats.failedUpdates++;
        stats.consecutiveFailures++;
        stats.consecutiveSuccesses = 0;
        const errorMsg = (error as Error).message;
        stats.errors.push(`${symbol}: ${errorMsg}`);
        
        this.logger.error(`❌ Failed to update price for ${symbol}: ${errorMsg} (${stats.consecutiveFailures} consecutive failures)`);
        
        // If we get a rate limit error, immediately increase delay
        if (errorMsg.includes('429') || errorMsg.includes('Rate limited')) {
          const oldDelay = stats.currentDelay;
          stats.currentDelay = Math.min(stats.currentDelay * 2, this.MAX_DELAY);
          this.logger.warn(`🚨 Rate limit detected! Immediately doubling delay: ${oldDelay}ms → ${stats.currentDelay}ms`);
          
          stats.delayAdjustments.push({
            symbol,
            oldDelay,
            newDelay: stats.currentDelay,
            reason: 'Rate limit detected - immediate doubling'
          });
          
          // Add extra delay for this specific rate limit
          await new Promise(resolve => setTimeout(resolve, stats.currentDelay));
        }
      }
      
      // Add adaptive delay between individual requests
      if (symbol !== symbols[symbols.length - 1]) {
        this.logger.debug(`Waiting ${stats.currentDelay}ms before next request (adaptive delay)...`);
        await new Promise(resolve => setTimeout(resolve, stats.currentDelay));
      }
    }
  }

  private async isNewSymbol(symbol: string): Promise<boolean> {
    const existingSymbol = await this.prisma.symbol.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { last_updated: true }
    });
    
    return !existingSymbol || !existingSymbol.last_updated;
  }

  private async storeHistoricalData(symbol: string, historicalData: any): Promise<void> {
    try {
      // Get all assets with this symbol to store their individual price history
      const assets = await this.prisma.asset.findMany({
        where: { 
          symbol: {
            equals: symbol,
            mode: 'insensitive'
          },
          type: { in: ['STOCK', 'CRYPTO'] }
        },
        select: { id: true }
      });

      // Store historical data for each asset
      for (const asset of assets) {
        for (const dataPoint of historicalData.data) {
          try {
            await this.prisma.priceHistory.upsert({
              where: {
                assetId_timestamp_source: {
                  assetId: asset.id,
                  timestamp: dataPoint.timestamp,
                  source: 'YAHOO_FINANCE_HISTORICAL'
                }
              },
              update: {
                price: Math.round(dataPoint.close * 100), // Store closing price in cents
              },
              create: {
                assetId: asset.id,
                symbol: symbol.toUpperCase(),
                price: Math.round(dataPoint.close * 100),
                timestamp: dataPoint.timestamp,
                source: 'YAHOO_FINANCE_HISTORICAL'
              }
            });
          } catch (error) {
            // Log but don't fail for individual data points
            this.logger.debug(`Failed to store historical data point for ${symbol} at ${dataPoint.timestamp}:`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to store historical data for ${symbol}:`, error);
      throw error;
    }
  }

  private async updatePlatformAssetsWithPrice(symbol: string, priceData: any): Promise<void> {
    try {
      // Update the Symbol table with current price data
      await this.prisma.symbol.upsert({
        where: { symbol: symbol.toUpperCase() },
        update: {
          current_price: Math.round(priceData.price * 100), // Store in cents
          last_updated: new Date(),
          error_count: 0,
          last_error: null,
          last_error_at: null,
        },
        create: {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(), // Will be updated later with proper name
          type: 'STOCK', // Default, will be refined later
          current_price: Math.round(priceData.price * 100),
          last_updated: new Date(),
          is_active: true,
          update_priority: 1,
        }
      });

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
          // Store price history for this specific asset
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
      
    } catch (error) {
      this.logger.error(`Failed to update platform assets for symbol ${symbol}:`, error);
      throw error;
    }
  }

  // Get the latest price for a symbol (useful for new asset creation)
  async getLatestPrice(symbol: string): Promise<any> {
    try {
      // Get price from Symbol table
      const symbolData = await this.prisma.symbol.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { 
          current_price: true, 
          last_updated: true,
          symbol: true 
        }
      });

      if (symbolData && symbolData.current_price) {
        return {
          symbol: symbolData.symbol,
          price: symbolData.current_price / 100, // Convert from cents
          timestamp: symbolData.last_updated,
          source: 'SYMBOL_TABLE',
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
      currentDelay: this.MIN_DELAY, // Start with minimum delay for manual sync
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      delayAdjustments: [],
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

      this.logger.log(`Manual sync for user ${userId}: ${symbols.length} symbols with adaptive rate limiting`);

      // Use adaptive rate limiting for manual sync (user is waiting, but still need to respect limits)
      await this.processSymbolsWithStaging(symbols, stats);

    } catch (error) {
      this.logger.error(`Failed to sync assets for user ${userId}:`, error);
      stats.errors.push((error as Error).message);
    } finally {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      
      // Log manual sync results with adaptive rate limiting info
      this.logger.log(`Manual sync completed for user ${userId}: ${stats.successfulUpdates}/${stats.totalSymbols} successful, final delay: ${stats.currentDelay}ms`);
    }

    return stats;
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
      const totalSymbols = await this.combineSymbols(platformSymbols, this.popularSymbols);
      
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