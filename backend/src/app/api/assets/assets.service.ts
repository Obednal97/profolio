import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { MoneyUtils } from '@/common/utils/money.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(createAssetDto: CreateAssetDto) {
    const { quantity, valueOverride, ...data } = createAssetDto;
    
    return this.prisma.asset.create({
      data: {
        ...data,
        quantity: quantity ? MoneyUtils.toMicroUnits(quantity) : 0,
        valueOverride: valueOverride ? MoneyUtils.toCents(valueOverride) : null,
      },
      select: this.getAssetSelect(),
    });
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

    return assets.map(this.transformAsset);
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

    const { quantity, valueOverride, ...data } = updateAssetDto;
    
    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        ...data,
        quantity: quantity !== undefined ? MoneyUtils.toMicroUnits(quantity) : undefined,
        valueOverride: valueOverride !== undefined ? MoneyUtils.toCents(valueOverride) : undefined,
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

  async getUserAssetSummary(userId: string) {
    const assets = await this.findAllByUser(userId);
    
    const totalValue = assets.reduce((sum, asset) => {
      return sum + (asset.current_value || 0);
    }, 0);

    const assetsByType = assets.reduce((acc, asset) => {
      const type = asset.type;
      if (!acc[type]) acc[type] = 0;
      acc[type] += asset.current_value || 0;
      return acc;
    }, {} as Record<string, number>);

    // Calculate percentage change (mock data for now)
    const percentageChange = 5.2; // This should be calculated from historical data

    return {
      totalValue,
      assetsByType,
      percentageChange,
      assetCount: assets.length,
    };
  }

  async getAssetHistory(userId: string, days: number) {
    // This is a simplified version. In production, you'd want to:
    // 1. Store historical price data
    // 2. Calculate daily portfolio values
    // 3. Cache the results
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Mock historical data generation
    const history = [];
    const currentValue = (await this.getUserAssetSummary(userId)).totalValue;
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simple random walk for demo
      const randomChange = (Math.random() - 0.5) * 0.02;
      const value = currentValue * (1 + randomChange * (days - i) / days);
      
      history.push({
        date: date.toISOString().split('T')[0],
        totalValue: Math.round(value * 100) / 100,
      });
    }

    return history;
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
      createdAt: true,
      updatedAt: true,
    };
  }

  private transformAsset(asset: any) {
    return {
      ...asset,
      quantity: asset.quantity ? MoneyUtils.fromMicroUnits(asset.quantity) : 0,
      valueOverride: asset.valueOverride ? MoneyUtils.fromCents(asset.valueOverride) : null,
      // Calculate current_value based on external data or valueOverride
      current_value: asset.valueOverride ? MoneyUtils.fromCents(asset.valueOverride) : 0,
    };
  }
}