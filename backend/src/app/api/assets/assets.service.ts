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

  async create(createAssetDto: CreateAssetDto & { userId: string }) {
    // Validate monetary inputs
    const validations = this.validateMonetaryFields(createAssetDto);
    if (!validations.isValid) {
      throw new Error(`Invalid monetary input: ${validations.errors.join(', ')}`);
    }

    const { 
      userId,
      quantity, 
      current_value,
      valueOverride, 
      purchase_price, 
      initialAmount, 
      interestRate,
      purchase_date,
      vesting_start_date,
      vesting_end_date,
      ...data 
    } = createAssetDto;
    
    // Create the asset with precise conversions
    const asset = await this.prisma.asset.create({
      data: {
        userId: userId,
        ...data,
        quantity: quantity || 0,
        current_value: current_value ? MoneyUtils.toCents(current_value) : null,
        valueOverride: valueOverride ? MoneyUtils.toCents(valueOverride) : null,
        purchasePrice: purchase_price ? MoneyUtils.toCents(purchase_price) : null,
        initialAmount: initialAmount ? MoneyUtils.toCents(initialAmount) : null,
        interestRate: interestRate ? MoneyUtils.toBasisPoints(interestRate) : null,
        purchaseDate: purchase_date ? new Date(purchase_date) : null,
        vesting_start_date: vesting_start_date ? new Date(vesting_start_date) : null,
        vesting_end_date: vesting_end_date ? new Date(vesting_end_date) : null,
      },
      select: this.getAssetSelect(),
    });

    // Fetch initial price if it's a tradeable asset
    if (asset.symbol && (asset.type === 'STOCK' || asset.type === 'CRYPTO')) {
      this.updateAssetPrice(asset.id, userId, asset.symbol, asset.type as 'STOCK' | 'CRYPTO');
    }

    return await this.transformAsset(asset);
  }

  async findAllByUser(userId: string, type?: string) {
    const where: Prisma.AssetWhereInput = { userId };
    if (type) {
      where.type = type as 'STOCK' | 'CRYPTO' | 'PROPERTY' | 'BOND' | 'COMMODITY' | 'SAVINGS' | 'EQUITY' | 'OTHER';
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

    return await this.transformAsset(asset);
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, userId: string) {
    // Check ownership
    await this.findOne(id, userId);

    // Validate monetary inputs
    const validations = this.validateMonetaryFields(updateAssetDto);
    if (!validations.isValid) {
      throw new Error(`Invalid monetary input: ${validations.errors.join(', ')}`);
    }

    const { 
      quantity, 
      current_value,
      valueOverride, 
      purchase_price, 
      initialAmount, 
      interestRate,
      purchase_date,
      vesting_start_date,
      vesting_end_date,
      ...data 
    } = updateAssetDto;
    
    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        ...data,
        quantity: quantity !== undefined ? quantity : undefined,
        current_value: current_value !== undefined ? MoneyUtils.toCents(current_value) : undefined,
        valueOverride: valueOverride !== undefined ? MoneyUtils.toCents(valueOverride) : undefined,
        purchasePrice: purchase_price !== undefined ? MoneyUtils.toCents(purchase_price) : undefined,
        initialAmount: initialAmount !== undefined ? MoneyUtils.toCents(initialAmount) : undefined,
        interestRate: interestRate !== undefined ? MoneyUtils.toBasisPoints(interestRate) : undefined,
        purchaseDate: purchase_date !== undefined ? (purchase_date ? new Date(purchase_date) : null) : undefined,
        vesting_start_date: vesting_start_date !== undefined ? (vesting_start_date ? new Date(vesting_start_date) : null) : undefined,
        vesting_end_date: vesting_end_date !== undefined ? (vesting_end_date ? new Date(vesting_end_date) : null) : undefined,
      },
      select: this.getAssetSelect(),
    });

    return await this.transformAsset(updated);
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
        
        // Calculate and update current value based on quantity
        const asset = await this.prisma.asset.findUnique({
          where: { id: assetId },
          select: { quantity: true },
        });
        
        if (asset) {
          const currentValue = MoneyUtils.safeMultiply(
            Number(asset.quantity), 
            MoneyUtils.fromCents(priceData.price)
          );
          
          await this.prisma.asset.update({
            where: { id: assetId },
            data: { 
              current_value: MoneyUtils.toCents(currentValue),
              lastSyncedAt: new Date() 
            },
          });
        }
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
    
    const totalValue = MoneyUtils.safeAdd(...assets.map(asset => asset.current_value || 0));

    const assetsByType = assets.reduce((acc, asset) => {
      const type = asset.type;
      if (!acc[type]) acc[type] = { count: 0, value: 0, allocation: 0 };
      acc[type].count++;
      acc[type].value = MoneyUtils.safeAdd(acc[type].value, asset.current_value || 0);
      return acc;
    }, {} as Record<string, { count: number; value: number; allocation: number }>);

    // Calculate allocations with precision
    Object.keys(assetsByType).forEach(type => {
      assetsByType[type].allocation = totalValue > 0 ? 
        MoneyUtils.safeMultiply(MoneyUtils.safeDivide(assetsByType[type].value, totalValue), 100) : 0;
    });

    // Calculate total gains/losses with precision
    const totalInvested = MoneyUtils.safeAdd(...assets.map(asset => {
      if (asset.type === 'SAVINGS') {
        return asset.initialAmount || 0;
      }
      return MoneyUtils.safeMultiply(asset.purchase_price || 0, asset.quantity || 0);
    }));

    const gainLossData = MoneyUtils.calculateGainLoss(totalInvested, totalValue);

    // Find top performers
    const topPerformers = assets
      .filter(asset => asset.purchase_price && asset.current_value)
      .map(asset => {
        const invested = asset.type === 'SAVINGS' 
          ? asset.initialAmount || 0
          : MoneyUtils.safeMultiply(asset.purchase_price || 0, asset.quantity || 0);
        const assetGainLoss = MoneyUtils.calculateGainLoss(invested, asset.current_value || 0);
        
        return {
          ...asset,
          gainLoss: assetGainLoss.gain,
          gainLossPercent: assetGainLoss.percentage
        };
      })
      .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
      .slice(0, 5);

    return {
      totalValue,
      totalInvested,
      totalGainLoss: gainLossData.gain,
      percentageChange: gainLossData.percentage,
      assetsByType,
      assetCount: assets.length,
      topPerformers,
      lastUpdated: new Date(),
    };
  }

  async getAssetHistory(userId: string, days: number, assetId?: string) {
    // Implementation remains the same but with precise calculations
    return this.generateMockHistory(days, userId);
  }

  private generateMockHistory(days: number, userId: string) {
    const history = [];
    const endDate = new Date();
    const baseValue = 10000; // Starting portfolio value

    for (let i = 0; i <= days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - (days - i));
      
      // Generate realistic portfolio fluctuation using precise arithmetic
      const randomChange = MoneyUtils.safeMultiply(Math.random() - 0.5, 0.03); // ±1.5% daily change
      const trendChange = MoneyUtils.safeMultiply(Math.sin(MoneyUtils.safeDivide(i, days) * Math.PI * 2), 0.1); // Trend component
      const value = MoneyUtils.safeMultiply(baseValue, MoneyUtils.safeAdd(1, MoneyUtils.safeAdd(trendChange, randomChange)));
      
      history.push({
        date: date.toISOString().split('T')[0],
        totalValue: Math.round(value * 100) / 100,
      });
    }

    return history;
  }

  async calculateSavingsValue(asset: {
    type: string;
    initialAmount?: number | null;
    interestRate?: number | null;
    createdAt: Date;
    interestType?: string;
    paymentFrequency?: string;
  }): Promise<number> {
    if (asset.type !== 'SAVINGS') {
      return 0;
    }

    const principal = MoneyUtils.fromCents(asset.initialAmount || 0);
    const annualRate = MoneyUtils.fromBasisPoints(asset.interestRate || 0);
    const startDate = new Date(asset.createdAt);
    const currentDate = new Date();
    const timeElapsed = MoneyUtils.safeDivide(
      currentDate.getTime() - startDate.getTime(),
      1000 * 60 * 60 * 24 * 365.25
    ); // Years

    if (asset.interestType === 'SIMPLE') {
      return MoneyUtils.calculateSimpleInterest(principal, annualRate * 100, timeElapsed);
    } else {
      // Compound interest
      const frequency = asset.paymentFrequency === 'MONTHLY' ? 12 : 
                       asset.paymentFrequency === 'QUARTERLY' ? 4 : 1;
      return MoneyUtils.calculateCompoundInterest(principal, annualRate * 100, frequency, timeElapsed);
    }
  }

  private validateMonetaryFields(dto: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fieldsToValidate = ['current_value', 'valueOverride', 'purchase_price', 'initialAmount'];
    
    for (const field of fieldsToValidate) {
      if (dto[field] !== undefined && dto[field] !== null) {
        const validation = MoneyUtils.validateMonetaryInput(dto[field]);
        if (!validation.isValid) {
          errors.push(`${field}: ${validation.error}`);
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
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
      current_value: true,
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
      notes: true,
      vesting_start_date: true,
      vesting_end_date: true,
      vesting_schedule: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private async transformAsset(asset: {
    quantity?: number | bigint | Prisma.Decimal | null;
    current_value?: number | null;
    valueOverride?: number | null;
    purchasePrice?: number | null;
    initialAmount?: number | null;
    interestRate?: number | null;
    purchaseDate?: Date | null;
    [key: string]: unknown;
  }) {
    const transformed = {
      ...asset,
      quantity: Number(asset.quantity) || 0, // Convert Decimal to number
      current_value: asset.current_value ? MoneyUtils.fromCents(asset.current_value) : null,
      valueOverride: asset.valueOverride ? MoneyUtils.fromCents(asset.valueOverride) : null,
      purchase_price: asset.purchasePrice ? MoneyUtils.fromCents(asset.purchasePrice) : null,
      purchasePrice: undefined, // Remove old field name
      initialAmount: asset.initialAmount ? MoneyUtils.fromCents(asset.initialAmount) : null,
      interestRate: asset.interestRate ? MoneyUtils.fromBasisPoints(asset.interestRate) : null,
      purchase_date: asset.purchaseDate?.toISOString?.().split('T')[0] || null,
      purchaseDate: undefined, // Remove old field name
    };

    // Simplified current value calculation - just use what's stored
    if (!transformed.current_value && transformed.purchase_price && transformed.quantity) {
      // Fallback to purchase price * quantity
      transformed.current_value = MoneyUtils.safeMultiply(transformed.purchase_price, transformed.quantity);
    }

    return transformed;
  }
}