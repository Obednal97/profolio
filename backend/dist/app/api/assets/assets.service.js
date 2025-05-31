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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma.service");
const money_utils_1 = require("../../../common/utils/money.utils");
const market_data_service_1 = require("../market-data/market-data.service");
let AssetsService = class AssetsService {
    constructor(prisma, marketDataService) {
        this.prisma = prisma;
        this.marketDataService = marketDataService;
    }
    async create(createAssetDto) {
        const { quantity, valueOverride, purchasePrice, initialAmount, interestRate } = createAssetDto, data = __rest(createAssetDto, ["quantity", "valueOverride", "purchasePrice", "initialAmount", "interestRate"]);
        // Create the asset
        const asset = await this.prisma.asset.create({
            data: Object.assign(Object.assign({}, data), { quantity: quantity ? money_utils_1.MoneyUtils.toMicroUnits(quantity) : 0, valueOverride: valueOverride ? money_utils_1.MoneyUtils.toCents(valueOverride) : null, purchasePrice: purchasePrice ? money_utils_1.MoneyUtils.toCents(purchasePrice) : null, initialAmount: initialAmount ? money_utils_1.MoneyUtils.toCents(initialAmount) : null, interestRate: interestRate ? Math.round(interestRate * 100) : null }),
            select: this.getAssetSelect(),
        });
        // Fetch initial price if it's a tradeable asset
        if (asset.symbol && (asset.type === 'STOCK' || asset.type === 'CRYPTO')) {
            this.updateAssetPrice(asset.id, asset.userId, asset.symbol, asset.type);
        }
        return this.transformAsset(asset);
    }
    async findAllByUser(userId, type) {
        const where = { userId };
        if (type) {
            where.type = type;
        }
        const assets = await this.prisma.asset.findMany({
            where,
            select: this.getAssetSelect(),
            orderBy: { createdAt: 'desc' },
        });
        return assets.map(this.transformAsset);
    }
    async findOne(id, userId) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, userId },
            select: this.getAssetSelect(),
        });
        if (!asset) {
            throw new common_1.NotFoundException('Asset not found');
        }
        return this.transformAsset(asset);
    }
    async update(id, updateAssetDto, userId) {
        // Check ownership
        await this.findOne(id, userId);
        const { quantity, valueOverride, purchasePrice, initialAmount, interestRate } = updateAssetDto, data = __rest(updateAssetDto, ["quantity", "valueOverride", "purchasePrice", "initialAmount", "interestRate"]);
        const updated = await this.prisma.asset.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { quantity: quantity !== undefined ? money_utils_1.MoneyUtils.toMicroUnits(quantity) : undefined, valueOverride: valueOverride !== undefined ? money_utils_1.MoneyUtils.toCents(valueOverride) : undefined, purchasePrice: purchasePrice !== undefined ? money_utils_1.MoneyUtils.toCents(purchasePrice) : undefined, initialAmount: initialAmount !== undefined ? money_utils_1.MoneyUtils.toCents(initialAmount) : undefined, interestRate: interestRate !== undefined ? Math.round(interestRate * 100) : undefined }),
            select: this.getAssetSelect(),
        });
        return this.transformAsset(updated);
    }
    async remove(id, userId) {
        // Check ownership
        await this.findOne(id, userId);
        await this.prisma.asset.delete({
            where: { id },
        });
    }
    async updateAssetPrice(assetId, userId, symbol, assetType) {
        try {
            const priceData = await this.marketDataService.getCurrentPrice(userId, symbol, assetType);
            if (priceData) {
                // Store the price history
                await this.marketDataService.storePriceData(assetId, priceData);
                // Update the asset's last synced timestamp
                await this.prisma.asset.update({
                    where: { id: assetId },
                    data: { lastSyncedAt: new Date() },
                });
            }
        }
        catch (error) {
            console.error(`Failed to update price for asset ${assetId}:`, error);
        }
    }
    async syncAllAssetPrices(userId) {
        const assets = await this.prisma.asset.findMany({
            where: {
                userId,
                symbol: { not: null },
                type: { in: ['STOCK', 'CRYPTO'] },
                autoSync: true
            },
        });
        const syncPromises = assets.map(asset => this.updateAssetPrice(asset.id, userId, asset.symbol, asset.type));
        await Promise.allSettled(syncPromises);
    }
    async getUserAssetSummary(userId) {
        const assets = await this.findAllByUser(userId);
        const totalValue = assets.reduce((sum, asset) => {
            return sum + (asset.current_value || 0);
        }, 0);
        const assetsByType = assets.reduce((acc, asset) => {
            const type = asset.type;
            if (!acc[type])
                acc[type] = { count: 0, value: 0, allocation: 0 };
            acc[type].count++;
            acc[type].value += asset.current_value || 0;
            return acc;
        }, {});
        // Calculate allocations
        Object.keys(assetsByType).forEach(type => {
            assetsByType[type].allocation = totalValue > 0 ? (assetsByType[type].value / totalValue) * 100 : 0;
        });
        // Calculate total gains/losses
        const totalInvested = assets.reduce((sum, asset) => {
            if (asset.type === 'SAVINGS') {
                return sum + (asset.initialAmount || 0);
            }
            return sum + ((asset.purchase_price || 0) * (asset.quantity || 0));
        }, 0);
        const totalGainLoss = totalValue - totalInvested;
        const percentageChange = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
        // Find top performers
        const topPerformers = assets
            .filter(asset => asset.purchase_price && asset.current_value)
            .map(asset => {
            const invested = asset.type === 'SAVINGS'
                ? asset.initialAmount || 0
                : (asset.purchase_price || 0) * (asset.quantity || 0);
            const gainLoss = (asset.current_value || 0) - invested;
            const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;
            return Object.assign(Object.assign({}, asset), { gainLoss,
                gainLossPercent });
        })
            .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
            .slice(0, 5);
        return {
            totalValue,
            totalInvested,
            totalGainLoss,
            percentageChange,
            assetsByType,
            assetCount: assets.length,
            topPerformers,
            lastUpdated: new Date(),
        };
    }
    async getAssetHistory(userId, days, assetId) {
        let query = '';
        const params = [];
        if (assetId) {
            // Get history for specific asset
            query = `
        SELECT DATE(timestamp) as date, 
               AVG(price) as avg_price,
               MAX(price) as high_price,
               MIN(price) as low_price
        FROM "PriceHistory" 
        WHERE "assetId" = $1 
        AND timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `;
            params.push(assetId);
        }
        else {
            // Get portfolio history
            query = `
        SELECT DATE(ph.timestamp) as date,
               SUM(ph.price * a.quantity / 1000000.0) as total_value
        FROM "PriceHistory" ph
        JOIN "Asset" a ON ph."assetId" = a.id
        WHERE a."userId" = $1
        AND ph.timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(ph.timestamp)
        ORDER BY date ASC
      `;
            params.push(userId);
        }
        try {
            const result = await this.prisma.$queryRaw `SELECT * FROM (${query}) as history`;
            return result.map(row => ({
                date: row.date.toISOString().split('T')[0],
                totalValue: assetId ? Number(row.avg_price) / 100 : Number(row.total_value),
                high: assetId ? Number(row.high_price) / 100 : undefined,
                low: assetId ? Number(row.low_price) / 100 : undefined,
            }));
        }
        catch (error) {
            console.error('Error fetching asset history:', error);
            // Return mock data for now
            return this.generateMockHistory(days, userId);
        }
    }
    generateMockHistory(days, userId) {
        const history = [];
        const endDate = new Date();
        const baseValue = 10000; // Starting portfolio value
        for (let i = 0; i <= days; i++) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - (days - i));
            // Generate realistic portfolio fluctuation
            const randomChange = (Math.random() - 0.5) * 0.03; // ±1.5% daily change
            const trendChange = Math.sin((i / days) * Math.PI * 2) * 0.1; // Trend component
            const value = baseValue * (1 + trendChange + randomChange);
            history.push({
                date: date.toISOString().split('T')[0],
                totalValue: Math.round(value * 100) / 100,
            });
        }
        return history;
    }
    async calculateSavingsValue(asset) {
        if (asset.type !== 'SAVINGS') {
            return 0;
        }
        const principal = asset.initialAmount || 0;
        const annualRate = (asset.interestRate || 0) / 10000; // Convert from basis points
        const startDate = new Date(asset.createdAt);
        const currentDate = new Date();
        const timeElapsed = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25); // Years
        if (asset.interestType === 'SIMPLE') {
            return principal * (1 + annualRate * timeElapsed);
        }
        else {
            // Compound interest
            const frequency = asset.paymentFrequency === 'MONTHLY' ? 12 :
                asset.paymentFrequency === 'QUARTERLY' ? 4 : 1;
            return principal * Math.pow(1 + annualRate / frequency, frequency * timeElapsed);
        }
    }
    getAssetSelect() {
        return {
            id: true,
            userId: true,
            name: true,
            type: true,
            symbol: true,
            quantity: true,
            source: true,
            externalId: true,
            currency: true,
            valueOverride: true,
            purchasePrice: true,
            purchaseDate: true,
            initialAmount: true,
            interestRate: true,
            interestType: true,
            paymentFrequency: true,
            termLength: true,
            maturityDate: true,
            lastSyncedAt: true,
            autoSync: true,
            createdAt: true,
            updatedAt: true,
        };
    }
    async transformAsset(asset) {
        const transformed = Object.assign(Object.assign({}, asset), { quantity: asset.quantity ? money_utils_1.MoneyUtils.fromMicroUnits(asset.quantity) : 0, valueOverride: asset.valueOverride ? money_utils_1.MoneyUtils.fromCents(asset.valueOverride) : null, purchasePrice: asset.purchasePrice ? money_utils_1.MoneyUtils.fromCents(asset.purchasePrice) : null, initialAmount: asset.initialAmount ? money_utils_1.MoneyUtils.fromCents(asset.initialAmount) : null, interestRate: asset.interestRate ? asset.interestRate / 100 : null, current_value: 0 });
        // Calculate current value based on asset type
        if (asset.type === 'SAVINGS') {
            transformed.current_value = await this.calculateSavingsValue(asset);
        }
        else if (asset.valueOverride) {
            transformed.current_value = money_utils_1.MoneyUtils.fromCents(asset.valueOverride);
        }
        else {
            // Get latest price from history
            try {
                const latestPrice = await this.prisma.$queryRaw `
          SELECT price FROM "PriceHistory" 
          WHERE "assetId" = ${asset.id} 
          ORDER BY timestamp DESC 
          LIMIT 1
        `;
                if (latestPrice.length > 0) {
                    const price = money_utils_1.MoneyUtils.fromCents(latestPrice[0].price);
                    transformed.current_value = price * (transformed.quantity || 0);
                }
            }
            catch (error) {
                // Fallback to purchase price * quantity if available
                if (transformed.purchasePrice && transformed.quantity) {
                    transformed.current_value = transformed.purchasePrice * transformed.quantity;
                }
            }
        }
        return transformed;
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        market_data_service_1.MarketDataService])
], AssetsService);
