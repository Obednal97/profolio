import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { MoneyUtils } from '@/common/utils/money.utils';
import { AssetType, Symbol } from '@prisma/client';

export interface SymbolData {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
  sector?: string;
  industry?: string;
  current_price?: number; // In dollars
  previous_close?: number; // In dollars
  day_change?: number; // In dollars
  day_change_percent?: number;
  volume?: number;
  market_cap?: number; // In dollars
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  current_price?: number;
  day_change_percent?: number;
  is_queued?: boolean;
}

@Injectable()
export class SymbolService {
  private readonly logger = new Logger(SymbolService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Search symbols in database (main search function)
   */
  async searchSymbols(query: string, limit: number = 10): Promise<SymbolSearchResult[]> {
    try {
      const symbols = await this.prisma.symbol.findMany({
        where: {
          OR: [
            { symbol: { contains: query.toUpperCase() } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: [
          { symbol: 'asc' },
        ],
      });

      return symbols.map(symbol => ({
        symbol: symbol.symbol,
        name: symbol.name || symbol.symbol,
        type: symbol.type,
        current_price: symbol.current_price || undefined,
        day_change_percent: symbol.day_change_percent ? Number(symbol.day_change_percent) : undefined,
      }));
    } catch (error) {
      this.logger.error('Error searching symbols:', error);
      return [];
    }
  }

  /**
   * Get or queue a symbol (for asset creation)
   */
  async getOrQueueSymbol(symbol: string, userId?: string, guessedType?: AssetType): Promise<SymbolSearchResult | null> {
    try {
      const symbolUpper = symbol.toUpperCase().trim();
      
      // First try to find in our database
      const existingSymbol = await this.prisma.symbol.findUnique({
        where: { symbol: symbolUpper },
        select: {
          symbol: true,
          name: true,
          type: true,
          current_price: true,
          day_change_percent: true,
        },
      });

      if (existingSymbol) {
        return {
          symbol: existingSymbol.symbol,
          name: existingSymbol.name,
          type: existingSymbol.type,
          current_price: existingSymbol.current_price ? MoneyUtils.fromCents(existingSymbol.current_price) : undefined,
          day_change_percent: existingSymbol.day_change_percent ? Number(existingSymbol.day_change_percent) : undefined,
          is_queued: false,
        };
      }

      // If not found, add to queue for processing
      await this.queueSymbolForProcessing(symbolUpper, userId, guessedType);
      
      return {
        symbol: symbolUpper,
        name: `${symbolUpper} (Processing...)`,
        type: guessedType || 'STOCK',
        is_queued: true,
      };

    } catch (error) {
      this.logger.error(`Error getting or queuing symbol "${symbol}":`, error);
      return null;
    }
  }

  /**
   * Add symbol to processing queue
   */
  async queueSymbolForProcessing(symbol: string, userId?: string, assetType?: AssetType): Promise<void> {
    try {
      await this.prisma.symbolQueue.upsert({
        where: { symbol },
        update: {
          priority: userId ? 1 : 2, // Higher priority for user requests
          requested_by: userId,
        },
        create: {
          symbol,
          requested_by: userId,
          asset_type: assetType,
          priority: userId ? 1 : 2,
        },
      });

      this.logger.log(`Queued symbol ${symbol} for processing`);
    } catch (error) {
      this.logger.error(`Error queuing symbol ${symbol}:`, error);
    }
  }

  /**
   * Add or update symbol in database
   */
  async upsertSymbol(symbolData: SymbolData): Promise<void> {
    try {
      const data = {
        symbol: symbolData.symbol.toUpperCase(),
        name: symbolData.name,
        type: symbolData.type,
        exchange: symbolData.exchange,
        sector: symbolData.sector,
        industry: symbolData.industry,
        current_price: symbolData.current_price ? MoneyUtils.toCents(symbolData.current_price) : null,
        previous_close: symbolData.previous_close ? MoneyUtils.toCents(symbolData.previous_close) : null,
        day_change: symbolData.day_change ? MoneyUtils.toCents(symbolData.day_change) : null,
        day_change_percent: symbolData.day_change_percent || null,
        volume: symbolData.volume ? BigInt(symbolData.volume) : null,
        market_cap: symbolData.market_cap ? BigInt(MoneyUtils.toCents(symbolData.market_cap)) : null,
        last_updated: new Date(),
        error_count: 0,
        last_error: null,
        last_error_at: null,
      };

      await this.prisma.symbol.upsert({
        where: { symbol: data.symbol },
        update: data,
        create: data,
      });

      this.logger.debug(`Updated symbol ${symbolData.symbol}`);
    } catch (error) {
      this.logger.error(`Error upserting symbol ${symbolData.symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get symbols that need price updates
   */
  async getSymbolsForUpdate(limit: number = 50): Promise<string[]> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const symbols = await this.prisma.symbol.findMany({
        where: {
          AND: [
            { is_active: true },
            {
              OR: [
                { last_updated: null },
                { last_updated: { lt: oneDayAgo } },
              ],
            },
          ],
        },
        select: { symbol: true },
        orderBy: [
          { update_priority: 'asc' },
          { last_updated: 'asc' },
        ],
        take: limit,
      });

      return symbols.map(s => s.symbol);
    } catch (error) {
      this.logger.error('Error getting symbols for update:', error);
      return [];
    }
  }

  /**
   * Record error for symbol
   */
  async recordSymbolError(symbol: string, error: string): Promise<void> {
    try {
      await this.prisma.symbol.update({
        where: { symbol },
        data: {
          error_count: { increment: 1 },
          last_error: error,
          last_error_at: new Date(),
          // Reduce priority if too many errors
          update_priority: {
            increment: 1, // Lower priority (higher number)
          },
        },
      });
    } catch (updateError) {
      this.logger.error(`Error recording error for symbol ${symbol}:`, updateError);
    }
  }

  /**
   * Get top symbols by type for dashboard
   */
  async getTopSymbolsByType(type: AssetType, limit: number = 10): Promise<SymbolSearchResult[]> {
    try {
      const symbols = await this.prisma.symbol.findMany({
        where: {
          type,
          is_active: true,
          current_price: { not: null },
        },
        select: {
          symbol: true,
          name: true,
          type: true,
          current_price: true,
          day_change_percent: true,
          market_cap: true,
        },
        orderBy: [
          { market_cap: 'desc' },
          { volume: 'desc' },
        ],
        take: limit,
      });

      return symbols.map(symbol => ({
        symbol: symbol.symbol,
        name: symbol.name,
        type: symbol.type,
        current_price: symbol.current_price ? MoneyUtils.fromCents(symbol.current_price) : undefined,
        day_change_percent: symbol.day_change_percent ? Number(symbol.day_change_percent) : undefined,
        is_queued: false,
      }));
    } catch (error) {
      this.logger.error(`Error getting top symbols for type ${type}:`, error);
      return [];
    }
  }

  /**
   * Process queued symbols (called by cron job)
   */
  async processQueuedSymbols(limit: number = 5): Promise<void> {
    try {
      const queuedSymbols = await this.prisma.symbolQueue.findMany({
        where: {
          status: 'PENDING',
          attempts: { lt: 3 }, // Max 3 attempts
        },
        orderBy: [
          { priority: 'asc' },
          { created_at: 'asc' },
        ],
        take: limit,
      });

      for (const queued of queuedSymbols) {
        await this.processQueuedSymbol(queued.symbol, queued.asset_type || undefined);
      }
    } catch (error) {
      this.logger.error('Error processing queued symbols:', error);
    }
  }

  /**
   * Process individual queued symbol
   */
  private async processQueuedSymbol(symbol: string, assetType?: AssetType): Promise<void> {
    try {
      // Update queue status
      await this.prisma.symbolQueue.update({
        where: { symbol },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
          last_attempt: new Date(),
        },
      });

      // Here you would call Yahoo Finance or other data provider
      // For now, create a placeholder entry
      const symbolData: SymbolData = {
        symbol: symbol,
        name: `${symbol} Inc.`, // Placeholder name
        type: assetType || 'STOCK',
        exchange: 'UNKNOWN',
      };

      await this.upsertSymbol(symbolData);

      // Mark as completed
      await this.prisma.symbolQueue.update({
        where: { symbol },
        data: {
          status: 'COMPLETED',
          processed_at: new Date(),
        },
      });

      this.logger.log(`Successfully processed queued symbol: ${symbol}`);
    } catch (error) {
      this.logger.error(`Error processing queued symbol ${symbol}:`, error);
      
      // Mark as failed
      await this.prisma.symbolQueue.update({
        where: { symbol },
        data: {
          status: 'FAILED',
          error_message: (error as Error).message,
        },
      });
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    totalSymbols: number;
    symbolsByType: Record<string, number>;
    recentlyUpdated: number;
    queuedCount: number;
  }> {
    try {
      const totalSymbols = await this.prisma.symbol.count({
        where: { is_active: true },
      });

      const symbolsByType = await this.prisma.symbol.groupBy({
        by: ['type'],
        where: { is_active: true },
        _count: { symbol: true },
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentlyUpdated = await this.prisma.symbol.count({
        where: {
          is_active: true,
          last_updated: { gte: oneDayAgo },
        },
      });

      const queuedCount = await this.prisma.symbolQueue.count({
        where: { status: 'PENDING' },
      });

      return {
        totalSymbols,
        symbolsByType: symbolsByType.reduce((acc, item) => {
          acc[item.type] = item._count.symbol;
          return acc;
        }, {} as Record<string, number>),
        recentlyUpdated,
        queuedCount,
      };
    } catch (error) {
      this.logger.error('Error getting statistics:', error);
      return {
        totalSymbols: 0,
        symbolsByType: {},
        recentlyUpdated: 0,
        queuedCount: 0,
      };
    }
  }

  async findBySymbol(symbol: string): Promise<Symbol | null> {
    try {
      return await this.prisma.symbol.findFirst({
        where: {
          symbol: symbol.toUpperCase(),
        },
      });
    } catch (error) {
      this.logger.error(`Error finding symbol ${symbol}:`, error);
      return null;
    }
  }
} 