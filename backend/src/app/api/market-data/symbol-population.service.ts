import { Injectable, Logger } from '@nestjs/common';
import { SymbolService, SymbolData } from './symbol.service';
import { AssetType } from '@prisma/client';

@Injectable()
export class SymbolPopulationService {
  private readonly logger = new Logger(SymbolPopulationService.name);

  constructor(private symbolService: SymbolService) {}

  /**
   * Populate database with essential symbols
   */
  async populateInitialSymbols(): Promise<void> {
    this.logger.log('Starting initial symbol population...');

    try {
      // Add demo assets first
      await this.addDemoAssets();

      // Add top stocks
      await this.addTopStocks();

      // Add top crypto
      await this.addTopCrypto();

      // Add major ETFs
      await this.addMajorETFs();

      this.logger.log('Initial symbol population completed successfully');
    } catch (error) {
      this.logger.error('Error during initial symbol population:', error);
    }
  }

  /**
   * Add demo assets (from the dashboard examples)
   */
  private async addDemoAssets(): Promise<void> {
    const demoSymbols: SymbolData[] = [
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        type: 'STOCK',
        exchange: 'NYSE',
        sector: 'Financial Services',
        industry: 'Exchange Traded Fund',
        current_price: 545.21,
        previous_close: 543.80,
        day_change: 1.41,
        day_change_percent: 0.26,
        volume: 45123000,
        market_cap: 234500000000,
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'CRYPTO',
        exchange: 'CRYPTO',
        current_price: 67842.30,
        previous_close: 68950.12,
        day_change: -1107.82,
        day_change_percent: -1.61,
        volume: 28934567890,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'CRYPTO',
        exchange: 'CRYPTO',
        current_price: 3789.45,
        previous_close: 3825.67,
        day_change: -36.22,
        day_change_percent: -0.95,
        volume: 18567234123,
      },
    ];

    for (const symbol of demoSymbols) {
      try {
        await this.symbolService.upsertSymbol(symbol);
        this.logger.debug(`Added demo symbol: ${symbol.symbol}`);
      } catch (error) {
        this.logger.error(`Error adding demo symbol ${symbol.symbol}:`, error);
      }
    }
  }

  /**
   * Add top 30 stocks by market cap
   */
  private async addTopStocks(): Promise<void> {
    const topStocks: SymbolData[] = [
      // FAANG + Major Tech
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software' },
      { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Internet Services' },
      { symbol: 'GOOG', name: 'Alphabet Inc. Class C', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Internet Services' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'STOCK', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Internet Retail' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'STOCK', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Internet Services' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
      
      // Financial
      { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Insurance' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banks' },
      { symbol: 'V', name: 'Visa Inc.', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Credit Services' },
      { symbol: 'MA', name: 'Mastercard Incorporated', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Credit Services' },
      
      // Healthcare & Pharma
      { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'STOCK', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
      { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', type: 'STOCK', exchange: 'NYSE', sector: 'Healthcare', industry: 'Healthcare Plans' },
      { symbol: 'PFE', name: 'Pfizer Inc.', type: 'STOCK', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
      
      // Consumer & Retail
      { symbol: 'PG', name: 'The Procter & Gamble Company', type: 'STOCK', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Household Products' },
      { symbol: 'HD', name: 'The Home Depot, Inc.', type: 'STOCK', exchange: 'NYSE', sector: 'Consumer Cyclical', industry: 'Home Improvement Retail' },
      { symbol: 'WMT', name: 'Walmart Inc.', type: 'STOCK', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Discount Stores' },
      
      // Communication & Media
      { symbol: 'DIS', name: 'The Walt Disney Company', type: 'STOCK', exchange: 'NYSE', sector: 'Communication Services', industry: 'Entertainment' },
      { symbol: 'NFLX', name: 'Netflix, Inc.', type: 'STOCK', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Entertainment' },
      
      // Industrial & Energy
      { symbol: 'XOM', name: 'Exxon Mobil Corporation', type: 'STOCK', exchange: 'NYSE', sector: 'Energy', industry: 'Oil & Gas Integrated' },
      { symbol: 'CVX', name: 'Chevron Corporation', type: 'STOCK', exchange: 'NYSE', sector: 'Energy', industry: 'Oil & Gas Integrated' },
      { symbol: 'CRM', name: 'Salesforce, Inc.', type: 'STOCK', exchange: 'NYSE', sector: 'Technology', industry: 'Software' },
      
      // Additional Tech
      { symbol: 'ORCL', name: 'Oracle Corporation', type: 'STOCK', exchange: 'NYSE', sector: 'Technology', industry: 'Software' },
      { symbol: 'ADBE', name: 'Adobe Inc.', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software' },
      { symbol: 'INTC', name: 'Intel Corporation', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
      { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
      
      // Banking
      { symbol: 'BAC', name: 'Bank of America Corporation', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banks' },
      { symbol: 'WFC', name: 'Wells Fargo & Company', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banks' },
      { symbol: 'GS', name: 'The Goldman Sachs Group, Inc.', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Capital Markets' },
    ];

    for (const stock of topStocks) {
      try {
        await this.symbolService.upsertSymbol(stock);
        this.logger.debug(`Added top stock: ${stock.symbol}`);
      } catch (error) {
        this.logger.error(`Error adding stock ${stock.symbol}:`, error);
      }
    }
  }

  /**
   * Add top cryptocurrencies
   */
  private async addTopCrypto(): Promise<void> {
    const topCrypto: SymbolData[] = [
      { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'BNB', name: 'Binance Coin', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'XRP', name: 'XRP', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'ADA', name: 'Cardano', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'DOGE', name: 'Dogecoin', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'MATIC', name: 'Polygon', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'SOL', name: 'Solana', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'DOT', name: 'Polkadot', type: 'CRYPTO', exchange: 'CRYPTO' },
      { symbol: 'AVAX', name: 'Avalanche', type: 'CRYPTO', exchange: 'CRYPTO' },
    ];

    for (const crypto of topCrypto) {
      try {
        await this.symbolService.upsertSymbol(crypto);
        this.logger.debug(`Added crypto: ${crypto.symbol}`);
      } catch (error) {
        this.logger.error(`Error adding crypto ${crypto.symbol}:`, error);
      }
    }
  }

  /**
   * Add major ETFs
   */
  private async addMajorETFs(): Promise<void> {
    const majorETFs: SymbolData[] = [
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'STOCK', exchange: 'NASDAQ', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
      { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
      { symbol: 'EFA', name: 'iShares MSCI EAFE ETF', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
      { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'STOCK', exchange: 'NYSE', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
      { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'BOND', exchange: 'NASDAQ', sector: 'Financial Services', industry: 'Exchange Traded Fund' },
    ];

    for (const etf of majorETFs) {
      try {
        await this.symbolService.upsertSymbol(etf);
        this.logger.debug(`Added ETF: ${etf.symbol}`);
      } catch (error) {
        this.logger.error(`Error adding ETF ${etf.symbol}:`, error);
      }
    }
  }

  /**
   * Update all symbols with current prices (would call Yahoo Finance)
   */
  async updateAllSymbolPrices(): Promise<void> {
    this.logger.log('Starting price update for all symbols...');
    
    try {
      const symbols = await this.symbolService.getSymbolsForUpdate(100);
      
      for (const symbol of symbols) {
        try {
          // Here you would call Yahoo Finance API
          // For now, we'll generate mock price data
          const mockPrice = this.generateMockPrice();
          
          const symbolData: SymbolData = {
            symbol: symbol,
            name: `${symbol} Inc.`,
            type: 'STOCK',
            current_price: mockPrice.current,
            previous_close: mockPrice.previous,
            day_change: mockPrice.change,
            day_change_percent: mockPrice.changePercent,
            volume: Math.floor(Math.random() * 10000000),
          };

          await this.symbolService.upsertSymbol(symbolData);
          this.logger.debug(`Updated price for ${symbol}`);
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          this.logger.error(`Error updating price for ${symbol}:`, error);
          await this.symbolService.recordSymbolError(symbol, (error as Error).message);
        }
      }
      
      this.logger.log(`Price update completed for ${symbols.length} symbols`);
    } catch (error) {
      this.logger.error('Error during price update:', error);
    }
  }

  /**
   * Generate mock price data for development
   */
  private generateMockPrice(): {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  } {
    const basePrice = 50 + Math.random() * 200; // Random price between $50-$250
    const changePercent = (Math.random() - 0.5) * 0.1; // ±5% change
    const previous = basePrice;
    const current = previous * (1 + changePercent);
    const change = current - previous;

    return {
      current: Math.round(current * 100) / 100,
      previous: Math.round(previous * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 10000) / 100, // Convert to percentage
    };
  }
} 