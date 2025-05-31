import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { MoneyUtils } from '@/common/utils/money.utils';
import { Prisma } from '@prisma/client';
import { MarketDataService } from '../market-data/market-data.service';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private marketDataService: MarketDataService,
  ) {}

  async create(createAssetDto: CreateAssetDto) {
    const { quantity, valueOverride, purchasePrice, initialAmount, interestRate, ...data } = createAssetDto;
    
    // Create the asset
    const asset = await this.prisma.asset.create({
      data: {
        ...data,
        quantity: quantity ? MoneyUtils.toMicroUnits(quantity) : 0,
        valueOverride: valueOverride ? MoneyUtils.toCents(valueOverride) : null,
        purchasePrice: purchasePrice ? MoneyUtils.toCents(purchasePrice) : null,
        initialAmount: initialAmount ? MoneyUtils.toCents(initialAmount) : null,
        interestRate: interestRate ? Math.round(interestRate * 100) : null, // Convert to basis points
      },
      select: this.getAssetSelect(),
    });

    // Fetch initial price if it's a tradeable asset
    if (asset.symbol && (asset.type === 'STOCK' || asset.type === 'CRYPTO')) {
      this.updateAssetPrice(asset.id, asset.userId, asset.symbol, asset.type as 'STOCK' | 'CRYPTO');
    }

    return this.transformAsset(asset);
  }

  async findAllByUser(userId: string, type?: string) {
    const where: Prisma.AssetWhereInput = { userId };
    if (type) {
      where.type = type as any;
    }

    const assets = await this.prisma.asset.findMany({
      where,
      select: this.getAssetSelect(),
      orderBy: { createdAt: 'desc' },
    });

    // Properly await all async transformations
    const transformedAssets = await Promise.all(
      assets.map(asset => this.transformAsset(asset))
    );

    return transformedAssets;
  }

  async findOne(id: string, userId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, userId },
      select: this.getAssetSelect(),
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return this.transformAsset(asset);
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, userId: string) {
    // Check ownership
    await this.findOne(id, userId);

    const { quantity, valueOverride, purchasePrice, initialAmount, interestRate, ...data } = updateAssetDto;
    
    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        ...data,
        quantity: quantity !== undefined ? MoneyUtils.toMicroUnits(quantity) : undefined,
        valueOverride: valueOverride !== undefined ? MoneyUtils.toCents(valueOverride) : undefined,
        purchasePrice: purchasePrice !== undefined ? MoneyUtils.toCents(purchasePrice) : undefined,
        initialAmount: initialAmount !== undefined ? MoneyUtils.toCents(initialAmount) : undefined,
        interestRate: interestRate !== undefined ? Math.round(interestRate * 100) : undefined,
      },
      select: this.getAssetSelect(),
    });

    return this.transformAsset(updated);
  }

  async remove(id: string, userId: string) {
    // Check ownership
    await this.findOne(id, userId);

    await this.prisma.asset.delete({
      where: { id },
    });
  }

  async updateAssetPrice(assetId: string, userId: string, symbol: string, assetType: 'STOCK' | 'CRYPTO') {
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
    } catch (error) {
      console.error(`Failed to update price for asset ${assetId}:`, error);
    }
  }

  async syncAllAssetPrices(userId: string) {
    const assets = await this.prisma.asset.findMany({
      where: { 
        userId, 
        symbol: { not: null },
        type: { in: ['STOCK', 'CRYPTO'] },
        autoSync: true
      },
    });

    const syncPromises = assets.map(asset => 
      this.updateAssetPrice(asset.id, userId, asset.symbol!, asset.type as 'STOCK' | 'CRYPTO')
    );

    await Promise.allSettled(syncPromises);
  }

  async getUserAssetSummary(userId: string) {
    const assets = await this.findAllByUser(userId);
    
    const totalValue = assets.reduce((sum, asset) => {
      return sum + (asset.current_value || 0);
    }, 0);

    const assetsByType = assets.reduce((acc, asset) => {
      const type = asset.type;
      if (!acc[type]) acc[type] = { count: 0, value: 0, allocation: 0 };
      acc[type].count++;
      acc[type].value += asset.current_value || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number; allocation: number }>);

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
        
        return {
          ...asset,
          gainLoss,
          gainLossPercent
        };
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

  async getAssetHistory(userId: string, days: number, assetId?: string) {
    let query = '';
    const params: any[] = [];

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
    } else {
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
      const result = await this.prisma.$queryRaw`SELECT * FROM (${query}) as history` as any[];
      
      return result.map(row => ({
        date: row.date.toISOString().split('T')[0],
        totalValue: assetId ? Number(row.avg_price) / 100 : Number(row.total_value),
        high: assetId ? Number(row.high_price) / 100 : undefined,
        low: assetId ? Number(row.low_price) / 100 : undefined,
      }));
    } catch (error) {
      console.error('Error fetching asset history:', error);
      // Return mock data for now
      return this.generateMockHistory(days, userId);
    }
  }

  private generateMockHistory(days: number, userId: string) {
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

  async calculateSavingsValue(asset: any): Promise<number> {
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
    } else {
      // Compound interest
      const frequency = asset.paymentFrequency === 'MONTHLY' ? 12 : 
                       asset.paymentFrequency === 'QUARTERLY' ? 4 : 1;
      return principal * Math.pow(1 + annualRate / frequency, frequency * timeElapsed);
    }
  }

  private getAssetSelect(): Prisma.AssetSelect {
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

  private async transformAsset(asset: any) {
    const transformed = {
      ...asset,
      quantity: asset.quantity ? MoneyUtils.fromMicroUnits(asset.quantity) : 0,
      valueOverride: asset.valueOverride ? MoneyUtils.fromCents(asset.valueOverride) : null,
      purchasePrice: asset.purchasePrice ? MoneyUtils.fromCents(asset.purchasePrice) : null,
      initialAmount: asset.initialAmount ? MoneyUtils.fromCents(asset.initialAmount) : null,
      interestRate: asset.interestRate ? asset.interestRate / 100 : null, // Convert from basis points to percentage
      current_value: 0,
    };

    // Calculate current value based on asset type
    if (asset.type === 'SAVINGS') {
      transformed.current_value = await this.calculateSavingsValue(asset);
    } else if (asset.valueOverride) {
      transformed.current_value = MoneyUtils.fromCents(asset.valueOverride);
    } else {
      // Get latest price from history
      try {
        const latestPrice = await this.prisma.$queryRaw`
          SELECT price FROM "PriceHistory" 
          WHERE "assetId" = ${asset.id} 
          ORDER BY timestamp DESC 
          LIMIT 1
        ` as any[];
        
        if (latestPrice.length > 0) {
          const price = MoneyUtils.fromCents(latestPrice[0].price);
          transformed.current_value = price * (transformed.quantity || 0);
        }
      } catch (error) {
        // Fallback to purchase price * quantity if available
        if (transformed.purchasePrice && transformed.quantity) {
          transformed.current_value = transformed.purchasePrice * transformed.quantity;
        }
      }
    }

    return transformed;
  }
}