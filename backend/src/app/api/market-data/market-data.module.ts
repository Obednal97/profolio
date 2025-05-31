import { Module } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { YahooFinanceService } from './yahoo-finance.service';
import { PriceSyncService } from './price-sync.service';
import { PrismaService } from '@/common/prisma.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  providers: [
    MarketDataService,
    YahooFinanceService,
    PriceSyncService,
    PrismaService,
  ],
  exports: [
    MarketDataService,
    YahooFinanceService,
    PriceSyncService,
  ],
})
export class MarketDataModule {} 