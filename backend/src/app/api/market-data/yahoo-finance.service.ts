import { Injectable, Logger } from '@nestjs/common';
import { PriceData, HistoricalData } from './market-data.service';

interface YahooQuoteResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        currency: string;
        symbol: string;
        exchangeTimezoneName: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
  };
}

@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);
  
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async makeRequest(url: string, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        this.logger.warn(`Yahoo Finance request attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async getCurrentPrice(symbol: string): Promise<PriceData | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const data: YahooQuoteResponse = await this.makeRequest(url);
      
      const result = data.chart?.result?.[0];
      if (!result?.meta?.regularMarketPrice) {
        this.logger.warn(`No price data found for symbol: ${symbol}`);
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        price: result.meta.regularMarketPrice,
        timestamp: new Date(),
        source: 'YAHOO_FINANCE',
        currency: result.meta.currency || 'USD',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch current price for ${symbol}:`, error);
      return null;
    }
  }

  async getHistoricalData(symbol: string, days: number): Promise<HistoricalData | null> {
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (days * 24 * 60 * 60);
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTime}&period2=${endTime}&interval=1d`;
      const data: YahooQuoteResponse = await this.makeRequest(url);
      
      const result = data.chart?.result?.[0];
      if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
        this.logger.warn(`No historical data found for symbol: ${symbol}`);
        return null;
      }

      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      
      const historicalData = timestamps.map((timestamp, index) => ({
        timestamp: new Date(timestamp * 1000),
        open: quote.open[index] || 0,
        high: quote.high[index] || 0,
        low: quote.low[index] || 0,
        close: quote.close[index] || 0,
        volume: quote.volume[index] || 0,
      })).filter(item => item.close > 0); // Filter out invalid data points

      return {
        symbol: symbol.toUpperCase(),
        data: historicalData,
        source: 'YAHOO_FINANCE',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch historical data for ${symbol}:`, error);
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    
    // Batch symbols to avoid overwhelming Yahoo Finance
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const promises = batch.map(async (symbol) => {
        const price = await this.getCurrentPrice(symbol);
        if (price) {
          results.set(symbol, price);
        }
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      });

      await Promise.allSettled(promises);
      
      // Larger delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      }
    }
    
    return results;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test with a reliable symbol
      const testPrice = await this.getCurrentPrice('AAPL');
      return testPrice !== null && testPrice.price > 0;
    } catch (error) {
      this.logger.error('Yahoo Finance health check failed:', error);
      return false;
    }
  }

  // Get popular symbols for testing connectivity
  async getPopularSymbols(): Promise<string[]> {
    return [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
      'BTC-USD', 'ETH-USD', 'SPY', 'QQQ', 'IWM', 'VTI', 'VOO'
    ];
  }
} 