"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MarketDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma.service");
const api_keys_service_1 = require("../api-keys/api-keys.service");
let MarketDataService = MarketDataService_1 = class MarketDataService {
    constructor(prisma, apiKeysService) {
        this.prisma = prisma;
        this.apiKeysService = apiKeysService;
        this.logger = new common_1.Logger(MarketDataService_1.name);
    }
    async getCurrentPrice(userId, symbol, assetType) {
        try {
            if (assetType === 'CRYPTO') {
                return await this.getCryptoPrice(userId, symbol);
            }
            else {
                return await this.getStockPrice(userId, symbol);
            }
        }
        catch (error) {
            this.logger.error(`Failed to get current price for ${symbol}:`, error);
            return null;
        }
    }
    async getHistoricalData(userId, symbol, assetType, days = 30) {
        try {
            if (assetType === 'CRYPTO') {
                return await this.getCryptoHistoricalData(userId, symbol, days);
            }
            else {
                return await this.getStockHistoricalData(userId, symbol, days);
            }
        }
        catch (error) {
            this.logger.error(`Failed to get historical data for ${symbol}:`, error);
            return null;
        }
    }
    async storePriceData(assetId, priceData) {
        try {
            await this.prisma.$executeRaw `
        INSERT INTO "PriceHistory" (id, "assetId", symbol, price, timestamp, source)
        VALUES (gen_random_uuid(), ${assetId}, ${priceData.symbol}, ${Math.round(priceData.price * 100)}, ${priceData.timestamp}, ${priceData.source})
        ON CONFLICT ("assetId", timestamp, source) DO NOTHING
      `;
        }
        catch (error) {
            this.logger.error(`Failed to store price data for ${priceData.symbol}:`, error);
        }
    }
    async getCryptoPrice(userId, symbol) {
        // Try CoinGecko first (free tier available)
        const coinGeckoKey = await this.apiKeysService.getDecryptedKey(userId, 'COINGECKO');
        if (coinGeckoKey) {
            return await this.fetchCoinGeckoPrice(symbol, coinGeckoKey);
        }
        // Fallback to free CoinGecko API (rate limited)
        return await this.fetchCoinGeckoPrice(symbol);
    }
    async getStockPrice(userId, symbol) {
        // Try Alpha Vantage first
        const alphaVantageKey = await this.apiKeysService.getDecryptedKey(userId, 'ALPHA_VANTAGE');
        if (alphaVantageKey) {
            return await this.fetchAlphaVantagePrice(symbol, alphaVantageKey);
        }
        // Try Twelve Data
        const twelveDataKey = await this.apiKeysService.getDecryptedKey(userId, 'TWELVE_DATA');
        if (twelveDataKey) {
            return await this.fetchTwelveDataPrice(symbol, twelveDataKey);
        }
        // Fallback to free Yahoo Finance (via web scraping)
        return await this.fetchYahooFinancePrice(symbol);
    }
    async fetchCoinGeckoPrice(symbol, apiKey) {
        try {
            const headers = {};
            if (apiKey) {
                headers['x-cg-demo-api-key'] = apiKey;
            }
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_last_updated_at=true`, { headers });
            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }
            const data = await response.json();
            const coinData = data[symbol.toLowerCase()];
            if (!coinData) {
                return null;
            }
            return {
                symbol: symbol.toUpperCase(),
                price: coinData.usd,
                timestamp: new Date(coinData.last_updated_at * 1000),
                source: 'COINGECKO',
                currency: 'USD'
            };
        }
        catch (error) {
            this.logger.error(`CoinGecko API error for ${symbol}:`, error);
            return null;
        }
    }
    async fetchAlphaVantagePrice(symbol, apiKey) {
        try {
            const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
            const data = await response.json();
            if (data['Error Message'] || data['Note']) {
                throw new Error(`Alpha Vantage API error: ${data['Error Message'] || data['Note']}`);
            }
            const quote = data['Global Quote'];
            if (!quote) {
                return null;
            }
            return {
                symbol: symbol.toUpperCase(),
                price: parseFloat(quote['05. price']),
                timestamp: new Date(),
                source: 'ALPHA_VANTAGE',
                currency: 'USD'
            };
        }
        catch (error) {
            this.logger.error(`Alpha Vantage API error for ${symbol}:`, error);
            return null;
        }
    }
    async fetchTwelveDataPrice(symbol, apiKey) {
        try {
            const response = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`);
            const data = await response.json();
            if (data.status === 'error') {
                throw new Error(`Twelve Data API error: ${data.message}`);
            }
            return {
                symbol: symbol.toUpperCase(),
                price: parseFloat(data.price),
                timestamp: new Date(),
                source: 'TWELVE_DATA',
                currency: 'USD'
            };
        }
        catch (error) {
            this.logger.error(`Twelve Data API error for ${symbol}:`, error);
            return null;
        }
    }
    async fetchYahooFinancePrice(symbol) {
        var _a, _b, _c, _d;
        try {
            // This is a simplified implementation - in production you'd want a more robust scraper
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
            const data = await response.json();
            const result = (_b = (_a = data.chart) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[0];
            if (!result) {
                return null;
            }
            const price = (_c = result.meta) === null || _c === void 0 ? void 0 : _c.regularMarketPrice;
            if (!price) {
                return null;
            }
            return {
                symbol: symbol.toUpperCase(),
                price: price,
                timestamp: new Date(),
                source: 'YAHOO_FINANCE',
                currency: ((_d = result.meta) === null || _d === void 0 ? void 0 : _d.currency) || 'USD'
            };
        }
        catch (error) {
            this.logger.error(`Yahoo Finance API error for ${symbol}:`, error);
            return null;
        }
    }
    async getCryptoHistoricalData(userId, symbol, days) {
        const coinGeckoKey = await this.apiKeysService.getDecryptedKey(userId, 'COINGECKO');
        try {
            const headers = {};
            if (coinGeckoKey) {
                headers['x-cg-demo-api-key'] = coinGeckoKey;
            }
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart?vs_currency=usd&days=${days}`, { headers });
            const data = await response.json();
            if (!data.prices) {
                return null;
            }
            const historicalData = data.prices.map((item) => ({
                timestamp: new Date(item[0]),
                open: item[1],
                high: item[1],
                low: item[1],
                close: item[1],
                volume: 0
            }));
            return {
                symbol: symbol.toUpperCase(),
                data: historicalData,
                source: 'COINGECKO'
            };
        }
        catch (error) {
            this.logger.error(`CoinGecko historical data error for ${symbol}:`, error);
            return null;
        }
    }
    async getStockHistoricalData(userId, symbol, days) {
        const alphaVantageKey = await this.apiKeysService.getDecryptedKey(userId, 'ALPHA_VANTAGE');
        if (!alphaVantageKey) {
            return null;
        }
        try {
            const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${alphaVantageKey}&outputsize=compact`);
            const data = await response.json();
            const timeSeries = data['Time Series (Daily)'];
            if (!timeSeries) {
                return null;
            }
            const historicalData = Object.entries(timeSeries)
                .slice(0, days)
                .map(([date, prices]) => ({
                timestamp: new Date(date),
                open: parseFloat(prices['1. open']),
                high: parseFloat(prices['2. high']),
                low: parseFloat(prices['3. low']),
                close: parseFloat(prices['4. close']),
                volume: parseInt(prices['5. volume'])
            }));
            return {
                symbol: symbol.toUpperCase(),
                data: historicalData,
                source: 'ALPHA_VANTAGE'
            };
        }
        catch (error) {
            this.logger.error(`Alpha Vantage historical data error for ${symbol}:`, error);
            return null;
        }
    }
};
exports.MarketDataService = MarketDataService;
exports.MarketDataService = MarketDataService = MarketDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        api_keys_service_1.ApiKeysService])
], MarketDataService);
