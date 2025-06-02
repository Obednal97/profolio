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

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
}

@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);
  
  // Circuit breaker configuration
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_RESET_TIMEOUT = 300000; // 5 minutes
  private readonly CIRCUIT_BREAKER_HALF_OPEN_TIMEOUT = 60000; // 1 minute
  private circuitBreaker: CircuitBreakerState = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    nextRetryTime: 0,
  };
  
  // Rate limiting configuration
  private readonly BASE_DELAY = 10000; // 10 seconds base delay
  private readonly MAX_DELAY = 300000; // 5 minutes max delay
  private readonly RATE_LIMIT_BACKOFF_MULTIPLIER = 2;
  private lastRequestTime = 0;
  private currentBackoffDelay = this.BASE_DELAY;
  
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

  private isCircuitBreakerOpen(): boolean {
    const now = Date.now();
    
    if (this.circuitBreaker.isOpen) {
      if (now >= this.circuitBreaker.nextRetryTime) {
        this.logger.log('🔄 Circuit breaker entering half-open state for testing');
        this.circuitBreaker.isOpen = false;
        return false;
      }
      return true;
    }
    
    return false;
  }

  private recordSuccess(): void {
    if (this.circuitBreaker.failureCount > 0) {
      this.logger.log('✅ Request successful - resetting circuit breaker');
      this.circuitBreaker.failureCount = 0;
      this.circuitBreaker.isOpen = false;
      this.currentBackoffDelay = this.BASE_DELAY; // Reset backoff on success
    }
  }

  private recordFailure(isRateLimit: boolean = false): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (isRateLimit) {
      // Immediate circuit breaker activation for rate limits
      this.logger.warn('🚨 Rate limit detected - immediately opening circuit breaker');
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.nextRetryTime = Date.now() + this.CIRCUIT_BREAKER_RESET_TIMEOUT;
      this.currentBackoffDelay = Math.min(this.currentBackoffDelay * this.RATE_LIMIT_BACKOFF_MULTIPLIER, this.MAX_DELAY);
    } else if (this.circuitBreaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.logger.warn(`🔌 Circuit breaker opened after ${this.circuitBreaker.failureCount} failures`);
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.nextRetryTime = Date.now() + this.CIRCUIT_BREAKER_RESET_TIMEOUT;
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.currentBackoffDelay) {
      const waitTime = this.currentBackoffDelay - timeSinceLastRequest;
      this.logger.debug(`⏱️ Rate limiting: waiting ${waitTime}ms (current backoff: ${this.currentBackoffDelay}ms)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(url: string, retries = 2): Promise<YahooQuoteResponse> {
    // Check circuit breaker first
    if (this.isCircuitBreakerOpen()) {
      const nextRetryIn = Math.max(0, this.circuitBreaker.nextRetryTime - Date.now());
      this.logger.warn(`🔌 Circuit breaker is open. Next retry in ${Math.round(nextRetryIn / 1000)}s`);
      throw new Error(`Circuit breaker is open. Service unavailable for ${Math.round(nextRetryIn / 1000)} seconds.`);
    }

    // Enforce rate limiting
    await this.enforceRateLimit();

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
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.status === 429) {
          this.logger.warn(`🚫 Rate limited on attempt ${attempt}/${retries} for ${url}`);
          this.recordFailure(true); // Mark as rate limit failure
          
          if (attempt < retries) {
            // Exponential backoff for rate limits
            const delay = Math.min(30000 * Math.pow(2, attempt - 1), 300000); // 30s, 60s, 120s, max 5min
            this.logger.debug(`Waiting ${delay}ms before retry due to rate limit`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Rate limited after ${retries} attempts. Service will be unavailable for 5 minutes.`);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.recordSuccess();
        return await response.json() as YahooQuoteResponse;
      } catch (error) {
        this.logger.warn(`Yahoo Finance request attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          this.recordFailure();
          throw error;
        }
        
        // Standard exponential backoff for other errors
        const delay = Math.min(10000 * Math.pow(2, attempt - 1), 60000); // 10s, 20s, 40s, max 1min
        this.logger.debug(`Waiting ${delay}ms before retry (standard backoff)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript requires it
    throw new Error('Unexpected end of makeRequest method');
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
    
    if (this.isCircuitBreakerOpen()) {
      this.logger.warn('🔌 Circuit breaker is open - skipping batch quote request');
      return results;
    }
    
    this.logger.log(`Fetching quotes for ${symbols.length} symbols with circuit breaker protection`);
    
    // Process symbols one by one with enhanced error handling
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
        
        // If circuit breaker opens during batch, stop processing
        if (this.isCircuitBreakerOpen()) {
          this.logger.warn('🔌 Circuit breaker opened during batch - stopping further requests');
          break;
        }
      }
      
      // Enhanced delay between requests in batch mode
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        const batchDelay = Math.max(this.currentBackoffDelay, 15000); // Minimum 15s between batch requests
        this.logger.debug(`Waiting ${batchDelay}ms before next batch request`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
    
    this.logger.log(`Completed batch: ${results.size}/${symbols.length} successful fetches`);
    return results;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Don't perform health check if circuit breaker is open
      if (this.isCircuitBreakerOpen()) {
        this.logger.warn('🔌 Circuit breaker is open - health check failed');
        return false;
      }

      // Test with a reliable symbol using reduced retries for health check
      const testPrice = await this.makeRequest('https://query1.finance.yahoo.com/v8/finance/chart/AAPL', 1);
      const result = testPrice?.chart?.result?.[0];
      const isHealthy = result?.meta?.regularMarketPrice > 0;
      
      if (isHealthy) {
        this.logger.log('✅ Yahoo Finance health check passed');
      } else {
        this.logger.warn('❌ Yahoo Finance health check failed - no valid data');
      }
      
      return isHealthy;
    } catch (error) {
      this.logger.error('❌ Yahoo Finance health check failed:', error);
      return false;
    }
  }

  // Get circuit breaker status for monitoring
  getCircuitBreakerStatus(): { isOpen: boolean; failureCount: number; nextRetryTime: number; currentBackoffDelay: number } {
    return {
      isOpen: this.circuitBreaker.isOpen,
      failureCount: this.circuitBreaker.failureCount,
      nextRetryTime: this.circuitBreaker.nextRetryTime,
      currentBackoffDelay: this.currentBackoffDelay,
    };
  }

  // Get popular symbols for testing connectivity
  async getPopularSymbols(): Promise<string[]> {
    return [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'
    ]; // Reduced to top 5 only to minimize API calls
  }
} 