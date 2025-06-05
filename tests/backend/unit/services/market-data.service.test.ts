import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  MarketDataService,
  PriceData,
  HistoricalData,
} from "../../app/api/market-data/market-data.service";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../common/prisma.service";
import { ApiKeysService } from "../../app/api/api-keys/api-keys.service";

describe("MarketDataService", () => {
  let service: MarketDataService;
  let prismaService: PrismaService;
  let apiKeysService: ApiKeysService;

  const mockPrismaService = {
    symbol: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    priceHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $executeRaw: vi.fn(),
  };

  const mockApiKeysService = {
    findActiveByProvider: vi.fn(),
  };

  // Mock global fetch
  global.fetch = vi.fn();
  const mockFetch = vi.mocked(global.fetch);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    service = module.get<MarketDataService>(MarketDataService);
    prismaService = module.get<PrismaService>(PrismaService);
    apiKeysService = module.get<ApiKeysService>(ApiKeysService);

    vi.clearAllMocks();
  });

  describe("getCurrentPrice", () => {
    it("should get crypto price when asset type is CRYPTO", async () => {
      const mockPriceData: PriceData = {
        symbol: "BTC",
        price: 50000,
        timestamp: new Date(),
        source: "COINGECKO",
        currency: "USD",
      };

      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          btc: {
            usd: 50000,
            last_updated_at: Date.now() / 1000,
          },
        }),
      } as any);

      const result = await service.getCurrentPrice("user-1", "BTC", "CRYPTO");

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "BTC",
          price: 50000,
          source: "COINGECKO",
          currency: "USD",
        })
      );
    });

    it("should get stock price when asset type is STOCK", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          "Global Quote": {
            "05. price": "150.00",
          },
        }),
      } as any);

      const result = await service.getCurrentPrice("user-1", "AAPL", "STOCK");

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "AAPL",
          price: 150.0,
          source: "ALPHA_VANTAGE",
          currency: "USD",
        })
      );
    });

    it("should return null on error", async () => {
      mockApiKeysService.findActiveByProvider.mockRejectedValue(
        new Error("API error")
      );

      const result = await service.getCurrentPrice(
        "user-1",
        "INVALID",
        "STOCK"
      );

      expect(result).toBeNull();
    });
  });

  describe("getHistoricalData", () => {
    it("should get crypto historical data", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          prices: [
            [1640995200000, 47000],
            [1641081600000, 48000],
          ],
        }),
      } as any);

      const result = await service.getHistoricalData(
        "user-1",
        "BTC",
        "CRYPTO",
        30
      );

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "BTC",
          source: "COINGECKO",
          data: expect.arrayContaining([
            expect.objectContaining({
              timestamp: expect.any(Date),
              open: expect.any(Number),
              close: expect.any(Number),
            }),
          ]),
        })
      );
    });

    it("should get stock historical data", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          "Time Series (Daily)": {
            "2024-01-01": {
              "1. open": "150.00",
              "2. high": "155.00",
              "3. low": "149.00",
              "4. close": "152.00",
              "5. volume": "1000000",
            },
          },
        }),
      } as any);

      const result = await service.getHistoricalData(
        "user-1",
        "AAPL",
        "STOCK",
        30
      );

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "AAPL",
          source: "ALPHA_VANTAGE",
          data: expect.arrayContaining([
            expect.objectContaining({
              timestamp: expect.any(Date),
              open: 150.0,
              high: 155.0,
              low: 149.0,
              close: 152.0,
              volume: 1000000,
            }),
          ]),
        })
      );
    });
  });

  describe("storePriceData", () => {
    it("should store price data in database", async () => {
      const priceData: PriceData = {
        symbol: "AAPL",
        price: 150.0,
        timestamp: new Date(),
        source: "ALPHA_VANTAGE",
        currency: "USD",
      };

      await service.storePriceData("asset-1", priceData);

      expect(mockPrismaService.$executeRaw).toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      const priceData: PriceData = {
        symbol: "AAPL",
        price: 150.0,
        timestamp: new Date(),
        source: "ALPHA_VANTAGE",
        currency: "USD",
      };

      mockPrismaService.$executeRaw.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        service.storePriceData("asset-1", priceData)
      ).resolves.not.toThrow();
    });
  });

  describe("getCryptoPriceFromCoinGecko", () => {
    it("should fetch crypto price from CoinGecko", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          btc: {
            usd: 50000,
            last_updated_at: Date.now() / 1000,
          },
        }),
      } as any);

      const result = await service.getCryptoPriceFromCoinGecko("user-1", "BTC");

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "BTC",
          price: 50000,
          source: "COINGECKO",
        })
      );
    });
  });

  describe("getStockPriceFromAlphaVantage", () => {
    it("should fetch stock price from Alpha Vantage", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          "Global Quote": {
            "05. price": "150.00",
          },
        }),
      } as any);

      const result = await service.getStockPriceFromAlphaVantage(
        "user-1",
        "AAPL"
      );

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "AAPL",
          price: 150.0,
          source: "ALPHA_VANTAGE",
        })
      );
    });

    it("should return null when no API key available", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue(null);

      const result = await service.getStockPriceFromAlphaVantage(
        "user-1",
        "AAPL"
      );

      expect(result).toBeNull();
    });
  });

  describe("getStockPriceFromTwelveData", () => {
    it("should fetch stock price from Twelve Data", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          price: "150.00",
        }),
      } as any);

      const result = await service.getStockPriceFromTwelveData(
        "user-1",
        "AAPL"
      );

      expect(result).toEqual(
        expect.objectContaining({
          symbol: "AAPL",
          price: 150.0,
          source: "TWELVE_DATA",
        })
      );
    });

    it("should return null when no API key available", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue(null);

      const result = await service.getStockPriceFromTwelveData(
        "user-1",
        "AAPL"
      );

      expect(result).toBeNull();
    });
  });

  describe("getHistoricalPricesFromCoinGecko", () => {
    it("should fetch historical prices from CoinGecko", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          prices: [
            [1640995200000, 47000],
            [1641081600000, 48000],
          ],
        }),
      } as any);

      const result = await service.getHistoricalPricesFromCoinGecko(
        "user-1",
        "BTC",
        30
      );

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Date),
            open: expect.any(Number),
            close: expect.any(Number),
          }),
        ])
      );
    });
  });

  describe("getHistoricalPricesFromAlphaVantage", () => {
    it("should fetch historical prices from Alpha Vantage", async () => {
      mockApiKeysService.findActiveByProvider.mockResolvedValue("test-api-key");
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          "Time Series (Daily)": {
            "2024-01-01": {
              "1. open": "150.00",
              "2. high": "155.00",
              "3. low": "149.00",
              "4. close": "152.00",
              "5. volume": "1000000",
            },
          },
        }),
      } as any);

      const result = await service.getHistoricalPricesFromAlphaVantage(
        "user-1",
        "AAPL"
      );

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Date),
            open: 150.0,
            high: 155.0,
            low: 149.0,
            close: 152.0,
            volume: 1000000,
          }),
        ])
      );
    });
  });
});
