import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '@/app/api/admin/users/users.module';
import { PrismaService } from '@/common/prisma.service';
import { SettingsModule } from '@/app/api/settings/settings.module';
import { AssetsModule } from '@/app/api/assets/assets.module';
import { ApiKeysModule } from '@/app/api/api-keys/api-keys.module';
import { MarketDataModule } from '@/app/api/market-data/market-data.module';
import { AuthModule } from '@/app/api/auth/auth.module';
import { UpdatesModule } from './updates/updates.module';
import { NotificationsModule } from '@/app/api/notifications/notifications.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        AuthModule,
        SettingsModule, 
        UsersModule,
        AssetsModule,
        ApiKeysModule,
        MarketDataModule,
        UpdatesModule,
        NotificationsModule,
    ],
    providers: [PrismaService],
    exports: [PrismaService],
})
export class AppModule {}
