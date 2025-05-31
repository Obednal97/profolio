import { Module } from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { YahooFinanceService } from './yahoo-finance.service';
import { PriceSyncService } from './price-sync.service';
import { SymbolService } from './symbol.service';
import { SymbolPopulationService } from './symbol-population.service';
import { PrismaService } from '@/common/prisma.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    YahooFinanceService,
    PriceSyncService,
    SymbolService,
    SymbolPopulationService,
    PrismaService,
  ],
  exports: [
    MarketDataService,
    YahooFinanceService,
    PriceSyncService,
    SymbolService,
    SymbolPopulationService,
  ],
})
export class MarketDataModule {} 