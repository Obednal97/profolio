import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  UseGuards,
  Logger,
  Post,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { MarketDataService } from './market-data.service';
import { SymbolService } from './symbol.service';
import { SymbolPopulationService } from './symbol-population.service';
import { PrismaService } from '@/common/prisma.service';

@ApiTags('market-data')
@Controller('market-data')
@UseGuards(JwtAuthGuard)
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly symbolService: SymbolService,
    private readonly symbolPopulationService: SymbolPopulationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for financial symbols (stocks, crypto, ETFs)' })
  @ApiQuery({ name: 'q', description: 'Search query for symbol or company name' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  @ApiResponse({ status: 200, description: 'List of matching symbols' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchSymbols(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    try {
      if (!query || query.trim().length < 1) {
        return { symbols: [], message: 'Please enter a search term' };
      }

      this.logger.debug(`Searching symbols for: "${query}"`);
      
      // Search in our symbol database
      const symbols = await this.symbolService.searchSymbols(
        query, 
        limit ? Math.min(Number(limit), 50) : 10
      );

      // If no results found, suggest adding to queue
      if (symbols.length === 0) {
        const upperQuery = query.toUpperCase().trim();
        
        // Check if it looks like a valid symbol (3-5 characters, letters/numbers)
        if (/^[A-Z0-9]{1,5}(\.[A-Z]{1,2})?$/.test(upperQuery)) {
          await this.symbolService.queueSymbolForProcessing(upperQuery);
          return {
            symbols: [{
              symbol: upperQuery,
              name: `${upperQuery} (Queued for processing)`,
              type: 'STOCK',
              is_queued: true,
            }],
            message: `"${upperQuery}" has been added to our queue for processing. Check back later for updated data.`
          };
        }
        
        return { 
          symbols: [], 
          message: `No symbols found for "${query}". Try searching for ticker symbols like "AAPL" or company names.` 
        };
      }

      return { 
        symbols,
        count: symbols.length,
        message: symbols.length === 1 ? 'Found 1 symbol' : `Found ${symbols.length} symbols`
      };

    } catch (error) {
      this.logger.error(`Error searching symbols for "${query}":`, error);
      return { 
        symbols: [], 
        error: 'Search temporarily unavailable. Please try again later.' 
      };
    }
  }

  @Get('symbol')
  @ApiOperation({ summary: 'Get detailed information for a specific symbol' })
  @ApiQuery({ name: 'symbol', description: 'Symbol to get details for' })
  @ApiResponse({ status: 200, description: 'Symbol details' })
  async getSymbolDetails(@Query('symbol') symbol: string) {
    try {
      if (!symbol) {
        return { error: 'Symbol parameter is required' };
      }

      const symbolData = await this.symbolService.getOrQueueSymbol(symbol);
      
      if (!symbolData) {
        return { error: 'Symbol not found' };
      }

      return { symbol: symbolData };

    } catch (error) {
      this.logger.error(`Error getting symbol details for "${symbol}":`, error);
      return { error: 'Unable to fetch symbol details' };
    }
  }

  @Get('top-symbols')
  @ApiOperation({ summary: 'Get top symbols by asset type' })
  @ApiQuery({ name: 'type', description: 'Asset type (STOCK, CRYPTO, BOND)', required: false })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  async getTopSymbols(
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const assetType = type?.toUpperCase() as any || 'STOCK';
      const maxResults = limit ? Math.min(Number(limit), 50) : 20;

      const symbols = await this.symbolService.getTopSymbolsByType(assetType, maxResults);

      return {
        symbols,
        type: assetType,
        count: symbols.length,
      };

    } catch (error) {
      this.logger.error(`Error getting top symbols for type "${type}":`, error);
      return { symbols: [], error: 'Unable to fetch top symbols' };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check market data service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealthStatus() {
    try {
      const stats = await this.symbolService.getStatistics();
      
      return {
        status: 'OK',
        healthy: true,
        timestamp: new Date().toISOString(),
        database: {
          total_symbols: stats.totalSymbols,
          by_type: stats.symbolsByType,
          recently_updated: stats.recentlyUpdated,
          queue_count: stats.queuedCount,
        },
        services: {
          symbol_database: 'operational',
          search: 'operational',
          queue_processing: stats.queuedCount > 0 ? 'active' : 'idle',
        }
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'ERROR',
        healthy: false,
        timestamp: new Date().toISOString(),
        error: 'Database connectivity issues',
      };
    }
  }

  @Post('populate')
  @ApiOperation({ summary: 'Populate database with initial symbols (admin only)' })
  @ApiResponse({ status: 200, description: 'Population started' })
  async populateSymbols() {
    try {
      // In a real app, this would be protected by admin authentication
      this.symbolPopulationService.populateInitialSymbols();
      
      return {
        message: 'Symbol population started in background',
        status: 'initiated',
      };
    } catch (error) {
      this.logger.error('Error starting symbol population:', error);
      return {
        error: 'Failed to start symbol population',
        message: (error as Error).message,
      };
    }
  }

  @Post('update-prices')
  @ApiOperation({ summary: 'Update all symbol prices (admin only)' })
  @ApiResponse({ status: 200, description: 'Price update started' })
  async updatePrices() {
    try {
      // In a real app, this would be protected by admin authentication
      this.symbolPopulationService.updateAllSymbolPrices();
      
      return {
        message: 'Price update started in background',
        status: 'initiated',
      };
    } catch (error) {
      this.logger.error('Error starting price update:', error);
      return {
        error: 'Failed to start price update',
        message: (error as Error).message,
      };
    }
  }

  // Legacy endpoint compatibility
  @Get('current-price/:symbol')
  @ApiOperation({ summary: 'Get current price for a symbol (legacy compatibility)' })
  async getCurrentPrice(@Query('symbol') symbol: string) {
    try {
      const symbolData = await this.symbolService.getOrQueueSymbol(symbol);
      
      if (!symbolData || !symbolData.current_price) {
        return null;
      }

      return {
        symbol: symbolData.symbol,
        price: Math.round(symbolData.current_price * 100), // Convert to cents
        timestamp: new Date(),
        source: 'database',
      };

    } catch (error) {
      this.logger.error(`Error getting current price for "${symbol}":`, error);
      return null;
    }
  }

  @Get('cached-price/:symbol')
  @ApiOperation({ summary: 'Get cached price for a symbol (no live API calls)' })
  @ApiResponse({ status: 200, description: 'Cached price data for the symbol' })
  async getCachedPrice(@Param('symbol') symbol: string) {
    try {
      this.logger.debug(`Getting cached price for: "${symbol}"`);
      
      // Get cached price from Symbol table without triggering any live searches
      const cachedSymbol = await this.symbolService.findBySymbol(symbol.toUpperCase());
      
      if (cachedSymbol && cachedSymbol.current_price) {
        return {
          symbol: cachedSymbol.symbol,
          price: cachedSymbol.current_price / 100, // Convert from cents to dollars
          last_updated: cachedSymbol.last_updated,
          source: 'cached',
          message: 'Using cached price data'
        };
      }
      
      // Return null if no cached data available (don't trigger searches)
      return {
        symbol: symbol.toUpperCase(),
        price: null,
        message: 'No cached price available. Symbol will be updated in next scheduled sync.'
      };
      
    } catch (error) {
      this.logger.error(`Error getting cached price for "${symbol}":`, error);
      return {
        symbol: symbol.toUpperCase(),
        price: null,
        error: 'Failed to retrieve cached price data'
      };
    }
  }

  @Get('portfolio-history/:userId')
  async getPortfolioHistory(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    try {
      const daysToFetch = days ? parseInt(days) : 30;
      const portfolioHistory = await this.getPortfolioHistoricalData(userId, daysToFetch);
      
      return {
        status: 'OK',
        data: portfolioHistory,
      };
    } catch (error) {
      this.logger.error(`Failed to get portfolio history for user ${userId}:`, error);
      return {
        status: 'ERROR',
        error: 'Failed to fetch portfolio history',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getPortfolioHistoricalData(userId: string, days: number): Promise<any[]> {
    try {
      // Get user's assets with their symbols and purchase info
      const userAssets = await this.prisma.asset.findMany({
        where: { 
          userId,
          symbol: { not: null },
          type: { in: ['STOCK', 'CRYPTO'] },
          purchaseDate: { not: null }
        },
        select: {
          id: true,
          symbol: true,
          quantity: true,
          purchasePrice: true,
          purchaseDate: true,
          current_value: true
        }
      });

      if (userAssets.length === 0) {
        return [];
      }

      // Get price history for the last N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const priceHistory = await this.prisma.priceHistory.findMany({
        where: {
          assetId: { in: userAssets.map((a: any) => a.id) },
          timestamp: { gte: startDate },
          source: { in: ['YAHOO_FINANCE_HISTORICAL', 'YAHOO_FINANCE'] }
        },
        orderBy: { timestamp: 'asc' },
        select: {
          assetId: true,
          price: true,
          timestamp: true,
          symbol: true
        }
      });

      // Group price history by date
      const historicalData = new Map<string, Map<string, number>>();

      // Process price history
      priceHistory.forEach((price: any) => {
        const dateKey = price.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!historicalData.has(dateKey)) {
          historicalData.set(dateKey, new Map());
        }
        // Store price in dollars (convert from cents)
        historicalData.get(dateKey)!.set(price.assetId, price.price / 100);
      });

      // Calculate portfolio value for each date
      const portfolioValues: any[] = [];
      const sortedDates = Array.from(historicalData.keys()).sort();

      for (const date of sortedDates) {
        const dayPrices = historicalData.get(date)!;
        let totalValue = 0;

        userAssets.forEach((asset: any) => {
          // Only include asset if it was purchased before this date
          if (asset.purchaseDate && new Date(asset.purchaseDate) <= new Date(date)) {
            const assetPrice = dayPrices.get(asset.id);
            if (assetPrice && asset.quantity) {
              // Calculate value: quantity * price per unit
              const assetValue = parseFloat(asset.quantity.toString()) * assetPrice;
              totalValue += assetValue;
            }
          }
        });

        portfolioValues.push({
          date: date,
          total_value: Math.round(totalValue * 100), // Store in cents for consistency
          assets_count: userAssets.filter((a: any) => 
            a.purchaseDate && new Date(a.purchaseDate) <= new Date(date)
          ).length
        });
      }

      // If we don't have historical data, create a single point with current values
      if (portfolioValues.length === 0) {
        const currentValue = userAssets.reduce((sum: number, asset: any) => {
          return sum + (asset.current_value || 0);
        }, 0);

        portfolioValues.push({
          date: new Date().toISOString().split('T')[0],
          total_value: Math.round(currentValue * 100),
          assets_count: userAssets.length
        });
      }

      return portfolioValues;
    } catch (error) {
      this.logger.error('Failed to calculate portfolio historical data:', error);
      throw error;
    }
  }
} 