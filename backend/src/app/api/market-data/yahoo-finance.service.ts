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
  
  // Updated user agents based on GitHub issue #2125 - these are confirmed working
  private readonly userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:134.0) Gecko/20100101 Firefox/134.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
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
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com',
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        if (response.status === 429) {
          this.logger.warn(`Rate limited on attempt ${attempt}/${retries} for ${url}`);
          if (attempt < retries) {
            // Align with PriceSync minimum delay: 5s, 10s, 20s
            const delay = Math.min(5000 * Math.pow(2, attempt - 1), 20000);
            this.logger.debug(`Waiting ${delay}ms before retry due to rate limit (aligned with PriceSync)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Rate limited after ${retries} attempts`);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        this.logger.warn(`Yahoo Finance request attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Standard exponential backoff aligned with minimum 5s requirement
        const delay = Math.min(5000 * Math.pow(2, attempt - 1), 15000);
        this.logger.debug(`Waiting ${delay}ms before retry (standard backoff)`);
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
    
    this.logger.log(`Fetching quotes for ${symbols.length} symbols with 5-second delays (aligned with PriceSync)`);
    
    // Process symbols one by one with 5-second delays as aligned with PriceSync service
    for (const symbol of symbols) {
      try {
        const price = await this.getCurrentPrice(symbol);
        if (price) {
          results.set(symbol, price);
          this.logger.log(`✅ Successfully fetched ${symbol}: $${price.price}`);
        } else {
          this.logger.warn(`❌ No price data for ${symbol}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to fetch ${symbol}:`, error);
      }
      
      // 5-second delay between requests (aligned with PriceSync minimum)
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        this.logger.debug(`Waiting 5 seconds before next request (aligned with PriceSync)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    this.logger.log(`Completed batch: ${results.size}/${symbols.length} successful fetches`);
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