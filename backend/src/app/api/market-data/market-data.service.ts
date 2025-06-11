import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/common/prisma.service";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { ApiProvider } from "@prisma/client";

// Removed temporary type - now using proper Prisma-generated ApiProvider enum

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  source: string;
  currency?: string;
}

export interface HistoricalData {
  symbol: string;
  data: Array<{
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  source: string;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private prisma: PrismaService,
    private apiKeysService: ApiKeysService
  ) {}

  async getCurrentPrice(
    userId: string,
    symbol: string,
    assetType: "STOCK" | "CRYPTO"
  ): Promise<PriceData | null> {
    try {
      if (assetType === "CRYPTO") {
        return await this.getCryptoPrice(userId, symbol);
      } else {
        return await this.getStockPrice(userId, symbol);
      }
    } catch (error) {
      this.logger.error(`Failed to get current price for ${symbol}:`, error);
      return null;
    }
  }

  async getHistoricalData(
    userId: string,
    symbol: string,
    assetType: "STOCK" | "CRYPTO",
    days: number = 30
  ): Promise<HistoricalData | null> {
    try {
      if (assetType === "CRYPTO") {
        return await this.getCryptoHistoricalData(userId, symbol, days);
      } else {
        return await this.getStockHistoricalData(userId, symbol, days);
      }
    } catch (error) {
      this.logger.error(`Failed to get historical data for ${symbol}:`, error);
      return null;
    }
  }

  async storePriceData(assetId: string, priceData: PriceData): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "PriceHistory" (id, "assetId", symbol, price, timestamp, source)
        VALUES (gen_random_uuid(), ${assetId}, ${
        priceData.symbol
      }, ${Math.round(priceData.price * 100)}, ${priceData.timestamp}, ${
        priceData.source
      })
        ON CONFLICT ("assetId", timestamp, source) DO NOTHING
      `;
    } catch (error) {
      this.logger.error(
        `Failed to store price data for ${priceData.symbol}:`,
        error
      );
    }
  }

  private async getCryptoPrice(
    userId: string,
    symbol: string
  ): Promise<PriceData | null> {
    // Try CoinGecko first (free tier available)
    const coinGeckoKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "COINGECKO"
    );
    if (coinGeckoKey) {
      return await this.fetchCoinGeckoPrice(symbol, coinGeckoKey);
    }

    // Fallback to free CoinGecko API (rate limited)
    return await this.fetchCoinGeckoPrice(symbol);
  }

  private async getStockPrice(
    userId: string,
    symbol: string
  ): Promise<PriceData | null> {
    // Try Alpha Vantage first
    const alphaVantageKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "ALPHA_VANTAGE"
    );
    if (alphaVantageKey) {
      return await this.fetchAlphaVantagePrice(symbol, alphaVantageKey);
    }

    // Try Twelve Data
    const twelveDataKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "TWELVE_DATA"
    );
    if (twelveDataKey) {
      return await this.fetchTwelveDataPrice(symbol, twelveDataKey);
    }

    // Fallback to free Yahoo Finance (via web scraping)
    return await this.fetchYahooFinancePrice(symbol);
  }

  private async fetchCoinGeckoPrice(
    symbol: string,
    apiKey?: string
  ): Promise<PriceData | null> {
    try {
      const headers: any = {};
      if (apiKey) {
        headers["x-cg-demo-api-key"] = apiKey;
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_last_updated_at=true`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const coinData = data[symbol.toLowerCase()];

      if (!coinData) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        price: coinData.usd,
        timestamp: new Date(coinData.last_updated_at * 1000),
        source: "COINGECKO",
        currency: "USD",
      };
    } catch (error) {
      this.logger.error(`CoinGecko API error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchAlphaVantagePrice(
    symbol: string,
    apiKey: string
  ): Promise<PriceData | null> {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      );

      const data = (await response.json()) as any;

      if (data["Error Message"] || data["Note"]) {
        throw new Error(
          `Alpha Vantage API error: ${data["Error Message"] || data["Note"]}`
        );
      }

      const quote = data["Global Quote"];
      if (!quote) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(quote["05. price"]),
        timestamp: new Date(),
        source: "ALPHA_VANTAGE",
        currency: "USD",
      };
    } catch (error) {
      this.logger.error(`Alpha Vantage API error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchTwelveDataPrice(
    symbol: string,
    apiKey: string
  ): Promise<PriceData | null> {
    try {
      const response = await fetch(
        `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`
      );

      const data = (await response.json()) as any;

      if (data.status === "error") {
        throw new Error(`Twelve Data API error: ${data.message}`);
      }

      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(data.price),
        timestamp: new Date(),
        source: "TWELVE_DATA",
        currency: "USD",
      };
    } catch (error) {
      this.logger.error(`Twelve Data API error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchYahooFinancePrice(
    symbol: string
  ): Promise<PriceData | null> {
    try {
      // This is a simplified implementation - in production you'd want a more robust scraper
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
      );

      const data = (await response.json()) as any;
      const result = data.chart?.result?.[0];

      if (!result) {
        return null;
      }

      const price = result.meta?.regularMarketPrice;
      if (!price) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        price: price,
        timestamp: new Date(),
        source: "YAHOO_FINANCE",
        currency: result.meta?.currency || "USD",
      };
    } catch (error) {
      this.logger.error(`Yahoo Finance API error for ${symbol}:`, error);
      return null;
    }
  }

  private async getCryptoHistoricalData(
    userId: string,
    symbol: string,
    days: number
  ): Promise<HistoricalData | null> {
    const coinGeckoKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "COINGECKO"
    );

    try {
      const headers: any = {};
      if (coinGeckoKey) {
        headers["x-cg-demo-api-key"] = coinGeckoKey;
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart?vs_currency=usd&days=${days}`,
        { headers }
      );

      const data = (await response.json()) as any;

      if (!data.prices) {
        return null;
      }

      const historicalData = data.prices.map((item: any) => ({
        timestamp: new Date(item[0]),
        open: item[1],
        high: item[1],
        low: item[1],
        close: item[1],
        volume: 0,
      }));

      return {
        symbol: symbol.toUpperCase(),
        data: historicalData,
        source: "COINGECKO",
      };
    } catch (error) {
      this.logger.error(
        `CoinGecko historical data error for ${symbol}:`,
        error
      );
      return null;
    }
  }

  private async getStockHistoricalData(
    userId: string,
    symbol: string,
    days: number
  ): Promise<HistoricalData | null> {
    const alphaVantageKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "ALPHA_VANTAGE"
    );

    if (!alphaVantageKey) {
      return null;
    }

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${alphaVantageKey}&outputsize=compact`
      );

      const data = (await response.json()) as any;
      const timeSeries = data["Time Series (Daily)"];

      if (!timeSeries) {
        return null;
      }

      const historicalData = Object.entries(timeSeries)
        .slice(0, days)
        .map(([date, prices]: [string, any]) => ({
          timestamp: new Date(date),
          open: parseFloat(prices["1. open"]),
          high: parseFloat(prices["2. high"]),
          low: parseFloat(prices["3. low"]),
          close: parseFloat(prices["4. close"]),
          volume: parseInt(prices["5. volume"]),
        }));

      return {
        symbol: symbol.toUpperCase(),
        data: historicalData,
        source: "ALPHA_VANTAGE",
      };
    } catch (error) {
      this.logger.error(
        `Alpha Vantage historical data error for ${symbol}:`,
        error
      );
      return null;
    }
  }

  async getCryptoPriceFromCoinGecko(
    userId: string,
    symbol: string
  ): Promise<any> {
    const coinGeckoKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "COINGECKO"
    );
    return await this.fetchCoinGeckoPrice(symbol, coinGeckoKey || undefined);
  }

  async getStockPriceFromAlphaVantage(
    userId: string,
    symbol: string
  ): Promise<any> {
    const alphaVantageKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "ALPHA_VANTAGE"
    );
    if (!alphaVantageKey) return null;
    return await this.fetchAlphaVantagePrice(symbol, alphaVantageKey);
  }

  async getStockPriceFromTwelveData(
    userId: string,
    symbol: string
  ): Promise<any> {
    const twelveDataKey = await this.apiKeysService.findActiveByProvider(
      userId,
      "TWELVE_DATA"
    );
    if (!twelveDataKey) return null;
    return await this.fetchTwelveDataPrice(symbol, twelveDataKey);
  }

  async getHistoricalPricesFromCoinGecko(
    userId: string,
    symbol: string,
    days: number = 30
  ): Promise<any[]> {
    const historicalData = await this.getCryptoHistoricalData(
      userId,
      symbol,
      days
    );
    return historicalData?.data || [];
  }

  async getHistoricalPricesFromAlphaVantage(
    userId: string,
    symbol: string
  ): Promise<any[]> {
    const historicalData = await this.getStockHistoricalData(
      userId,
      symbol,
      30
    );
    return historicalData?.data || [];
  }
}
