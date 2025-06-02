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
  circuitBreakerTriggered: boolean;
  skipCount: number;
}

interface PriceData {
  price: number;
}

interface CircuitBreakerStatus {
  isOpen: boolean;
  nextRetryTime: number;
}

@Injectable()
export class PriceSyncService {
  private readonly logger = new Logger(PriceSyncService.name);
  private isRunning = false;
  private lastSyncStats: PriceSyncStats | null = null;
  private startupCompleted = false;
  private lastSuccessfulSync: Date | null = null;

  // Conservative rate limiting settings
  private readonly MIN_DELAY = 15000; // 15 seconds minimum (increased from 5s)
  private readonly MAX_DELAY = 600000; // 10 minutes maximum (increased from 1 minute)
  private readonly BATCH_DELAY_MULTIPLIER = 3; // Batch delay = current delay * 3 (reduced from 6)
  
  // Time-based update filtering settings - more conservative
  private readonly MIN_UPDATE_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours (increased from 1 hour)
  private readonly MAX_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly STALE_UPDATE_THRESHOLD = 12 * 60 * 60 * 1000; // 12 hours

  // Greatly reduced popular symbols to minimize API calls
  private readonly popularSymbols = [
    // Only top 3 stocks
    'AAPL', 'GOOGL', 'MSFT'
  ];

  constructor(
    private prisma: PrismaService,
    private yahooFinanceService: YahooFinanceService,
    private marketDataService: MarketDataService,
  ) {
    // Longer startup delay to prevent immediate API calls
    setTimeout(() => {
      this.startupCompleted = true;
      this.logger.log('🕐 Price sync service ready - will start conservatively with reduced frequency');
    }, 30000); // 30 second delay (increased from 5s)
  }

  // Reduced frequency: every 6 hours instead of hourly (much more conservative)
  @Cron('0 0 */6 * * *', {
    name: 'price-sync',
    timeZone: 'UTC'
  })
  async syncAllPrices(): Promise<void> {
    if (!this.startupCompleted) {
      this.logger.log('⏸️ Price sync service not ready - skipping scheduled run');
      return;
    }

    if (this.isRunning) {
      this.logger.warn('⏸️ Price sync already running - skipping');
      return;
    }

    // Check if we've had a recent successful sync (last 3 hours)
    if (this.lastSuccessfulSync && (Date.now() - this.lastSuccessfulSync.getTime()) < (3 * 60 * 60 * 1000)) {
      this.logger.log('⏸️ Recent successful sync found - skipping to prevent over-syncing');
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
      circuitBreakerTriggered: false,
      skipCount: 0,
    };

    try {
      this.logger.log('🚀 Starting conservative price synchronization');

      // Check circuit breaker status first
      const cbStatus = this.yahooFinanceService.getCircuitBreakerStatus();
      if (cbStatus.isOpen) {
        const nextRetryIn = Math.max(0, cbStatus.nextRetryTime - Date.now());
        this.logger.warn(`🔌 Circuit breaker is open - skipping sync. Next retry in ${Math.round(nextRetryIn / 1000)}s`);
        stats.circuitBreakerTriggered = true;
        stats.errors.push(`Circuit breaker open - service unavailable for ${Math.round(nextRetryIn / 1000)}s`);
        return;
      }

      // Get unique symbols actually used on the platform (with conservative filtering)
      const platformSymbols = await this.getPlatformSymbolsConservative();
      
      // Only sync popular symbols if we have very few user symbols (less than 5)
      const shouldSyncPopular = platformSymbols.length < 5;
      const popularToSync = shouldSyncPopular ? this.popularSymbols.slice(0, 2) : []; // Max 2 popular symbols
      
      // Combine with popular symbols (remove duplicates)
      const allSymbols = await this.combineSymbols(platformSymbols, popularToSync);
      
      stats.totalSymbols = allSymbols.length;
      stats.userSymbols = platformSymbols.length;
      stats.popularSymbols = popularToSync.length;

      if (allSymbols.length === 0) {
        this.logger.log('ℹ️ No symbols to update');
        this.lastSuccessfulSync = new Date();
        return;
      }

      // Limit maximum symbols per sync to prevent overwhelming the API
      const maxSymbolsPerSync = 5;
      if (allSymbols.length > maxSymbolsPerSync) {
        this.logger.log(`⚠️ Too many symbols (${allSymbols.length}). Limiting to ${maxSymbolsPerSync} per sync.`);
        allSymbols.splice(maxSymbolsPerSync);
        stats.totalSymbols = allSymbols.length;
      }

      this.logger.log(`📊 Conservative sync: ${allSymbols.length} symbols (${platformSymbols.length} user + ${popularToSync.length} popular), max delay: ${stats.currentDelay}ms`);

      // Conservative health check with single request
      const isHealthy = await this.yahooFinanceService.healthCheck();
      if (!isHealthy) {
        this.logger.warn('❌ Yahoo Finance health check failed - aborting sync');
        stats.errors.push('Yahoo Finance health check failed');
        return;
      }

      // Process symbols with very conservative rate limiting
      await this.processSymbolsConservatively(allSymbols, stats);

      // Mark as successful if we had at least some successes
      if (stats.successfulUpdates > 0) {
        this.lastSuccessfulSync = new Date();
        this.logger.log(`✅ Sync completed successfully with ${stats.successfulUpdates} updates`);
      }

    } catch (error) {
      this.logger.error('❌ Price sync failed:', error);
      stats.errors.push((error as Error).message);
    } finally {
      this.isRunning = false;
      stats.endTime = new Date();
      stats.duration = Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000);
      this.lastSyncStats = stats;

      // Enhanced logging
      this.logSyncSummary(stats);
    }
  }

  private async getPlatformSymbolsConservative(): Promise<string[]> {
    // Get symbols that haven't been updated recently (last 4 hours instead of 1 hour)
    const cutoffTime = new Date(Date.now() - this.MIN_UPDATE_INTERVAL);
    
    const symbols = await this.prisma.asset.findMany({
      where: {
        symbol: { not: null },
        OR: [
          { lastSyncedAt: null },
          { lastSyncedAt: { lt: cutoffTime } }
        ]
      },
      select: { symbol: true },
      distinct: ['symbol'],
      take: 10, // Limit to 10 symbols maximum
    });

    const platformSymbols = symbols
      .map(asset => asset.symbol)
      .filter((symbol): symbol is string => symbol !== null);

    this.logger.log(`🎯 Conservative filter: ${platformSymbols.length} symbols need updates (>4h old)`);
    return platformSymbols;
  }

  private async combineSymbols(platformSymbols: string[], popularSymbols: string[]): Promise<string[]> {
    // Remove duplicates and prioritize user symbols
    const symbolSet = new Set(platformSymbols);
    
    // Add popular symbols only if not already present
    for (const popular of popularSymbols) {
      if (!symbolSet.has(popular)) {
        symbolSet.add(popular);
      }
    }
    
    const combined = Array.from(symbolSet);
    this.logger.log(`🔗 Combined symbols: ${combined.length} total (${platformSymbols.length} user, ${popularSymbols.filter(p => !platformSymbols.includes(p)).length} additional popular)`);
    
    return combined;
  }

  private async processSymbolsConservatively(symbols: string[], stats: PriceSyncStats): Promise<void> {
    this.logger.log(`🐌 Processing ${symbols.length} symbols with VERY conservative rate limiting`);

    // Process symbols one by one with large delays
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      // Check circuit breaker before each symbol
      const cbStatus = this.yahooFinanceService.getCircuitBreakerStatus();
      if (cbStatus.isOpen) {
        this.logger.warn(`🔌 Circuit breaker opened during sync - stopping at symbol ${i + 1}/${symbols.length}`);
        stats.circuitBreakerTriggered = true;
        stats.skipCount = symbols.length - i;
        break;
      }
      
      this.logger.log(`📡 Processing symbol ${i + 1}/${symbols.length}: ${symbol} (conservative mode)`);
      
      try {
        // Only fetch current price (skip historical data to reduce API calls)
        const priceData = await this.yahooFinanceService.getCurrentPrice(symbol);
        
        if (priceData) {
          await this.updatePlatformAssetsWithPrice(symbol, priceData);
          
          stats.successfulUpdates++;
          stats.consecutiveSuccesses++;
          stats.consecutiveFailures = 0;
          
          this.logger.log(`✅ Conservative update: ${symbol} = $${priceData.price}`);
        } else {
          stats.failedUpdates++;
          stats.consecutiveFailures++;
          stats.consecutiveSuccesses = 0;
          stats.errors.push(`No price data for ${symbol}`);
          
          this.logger.warn(`❌ No data: ${symbol}`);
        }
      } catch (error) {
        stats.failedUpdates++;
        stats.consecutiveFailures++;
        stats.consecutiveSuccesses = 0;
        const errorMsg = (error as Error).message;
        stats.errors.push(`${symbol}: ${errorMsg}`);
        
        this.logger.error(`❌ Error: ${symbol} - ${errorMsg}`);
        
        // If circuit breaker related, stop immediately
        if (errorMsg.includes('Circuit breaker') || errorMsg.includes('Rate limited')) {
          this.logger.warn('🛑 Stopping sync due to circuit breaker/rate limit');
          stats.circuitBreakerTriggered = true;
          stats.skipCount = symbols.length - i - 1;
          break;
        }
      }
      
      // Very large delay between symbols (minimum 30 seconds, up to 10 minutes)
      if (i < symbols.length - 1) {
        const conservativeDelay = Math.max(30000, stats.currentDelay); // Minimum 30s
        this.logger.log(`⏳ Conservative delay: ${conservativeDelay}ms before next symbol...`);
        await new Promise(resolve => setTimeout(resolve, conservativeDelay));
        
        // Increase delay if we're having consecutive failures
        if (stats.consecutiveFailures >= 2) {
          stats.currentDelay = Math.min(stats.currentDelay * 2, this.MAX_DELAY);
          this.logger.log(`📈 Increasing delay to ${stats.currentDelay}ms due to failures`);
        }
      }
    }
  }

  private async updatePlatformAssetsWithPrice(symbol: string, priceData: PriceData): Promise<void> {
    try {
      // Update all assets with this symbol
      const updateResult = await this.prisma.asset.updateMany({
        where: { symbol: symbol },
        data: {
          current_value: priceData.price,
          lastSyncedAt: new Date(),
        },
      });

      this.logger.debug(`💾 Updated ${updateResult.count} assets for symbol ${symbol}`);
    } catch (error) {
      this.logger.error(`Database update failed for ${symbol}:`, error);
      throw error;
    }
  }

  private logSyncSummary(stats: PriceSyncStats): void {
    this.logger.log(`\n📊 Conservative Price Sync Summary:`);
    this.logger.log(`   ⏱️  Duration: ${stats.duration}s`);
    this.logger.log(`   📈 Success: ${stats.successfulUpdates}/${stats.totalSymbols}`);
    this.logger.log(`   ❌ Failed: ${stats.failedUpdates}`);
    this.logger.log(`   ⏸️  Skipped: ${stats.skipCount}`);
    this.logger.log(`   🔌 Circuit Breaker: ${stats.circuitBreakerTriggered ? 'TRIGGERED' : 'OK'}`);
    this.logger.log(`   ⚡ Final Delay: ${stats.currentDelay}ms`);
    
    if (stats.errors.length > 0) {
      this.logger.warn(`   🚨 Errors: ${stats.errors.slice(0, 3).join(', ')}${stats.errors.length > 3 ? '...' : ''}`);
    }
    
    // Log next sync time
    const nextSyncIn = 6 * 60 * 60 * 1000; // 6 hours
    const nextSync = new Date(Date.now() + nextSyncIn);
    this.logger.log(`   ⏰ Next sync: ${nextSync.toISOString()} (in 6 hours)`);
    
    if (stats.successfulUpdates > 0) {
      this.logger.log(`   ✅ Sync considered SUCCESSFUL`);
    } else {
      this.logger.warn(`   ⚠️  Sync had NO SUCCESSFUL updates`);
    }
  }

  // Manual sync trigger (for testing or admin use)
  async triggerManualSync(): Promise<PriceSyncStats | null> {
    if (this.isRunning) {
      this.logger.warn('Manual sync requested but service is already running');
      return null;
    }
    
    this.logger.log('🔧 Manual sync triggered');
    await this.syncAllPrices();
    return this.lastSyncStats;
  }

  // Health check for the sync service
  async healthCheck(): Promise<{ 
    healthy: boolean; 
    lastSync?: Date; 
    errors?: string[]; 
    symbolCount?: number; 
    circuitBreakerStatus?: CircuitBreakerStatus 
  }> {
    const yahooHealthy = await this.yahooFinanceService.healthCheck();
    const platformSymbols = await this.getPlatformSymbolsConservative();
    const cbStatus = this.yahooFinanceService.getCircuitBreakerStatus();
    
    return {
      healthy: yahooHealthy && !this.isRunning && !cbStatus.isOpen,
      lastSync: this.lastSuccessfulSync || undefined,
      errors: this.lastSyncStats?.errors || [],
      symbolCount: platformSymbols.length + this.popularSymbols.length,
      circuitBreakerStatus: cbStatus,
    };
  }

  // Get service statistics
  getServiceStats(): { 
    isRunning: boolean; 
    lastSync: PriceSyncStats | null; 
    lastSuccessfulSync: Date | null;
    nextScheduledSync: Date;
  } {
    // Next sync is every 6 hours
    const nextSync = new Date();
    nextSync.setHours(nextSync.getHours() + 6 - (nextSync.getHours() % 6), 0, 0, 0);
    
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSyncStats,
      lastSuccessfulSync: this.lastSuccessfulSync,
      nextScheduledSync: nextSync,
    };
  }
} 