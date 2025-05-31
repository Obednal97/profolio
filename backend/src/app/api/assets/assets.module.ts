import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { PrismaService } from '@/common/prisma.service';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [MarketDataModule],
  controllers: [AssetsController],
  providers: [AssetsService, PrismaService],
  exports: [AssetsService],
})
export class AssetsModule {}