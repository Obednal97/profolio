import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '@/app/api/admin/users/users.module';
import { PrismaService } from '@/common/prisma.service';
import { SettingsModule } from '@/app/api/settings/settings.module';
import { AssetsModule } from '@/app/api/assets/assets.module';
import { ApiKeysModule } from '@/app/api/api-keys/api-keys.module';
import { MarketDataModule } from '@/app/api/market-data/market-data.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        SettingsModule, 
        UsersModule,
        AssetsModule,
        ApiKeysModule,
        MarketDataModule,
    ],
    providers: [PrismaService],
    exports: [PrismaService],
})
export class AppModule {}
