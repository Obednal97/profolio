import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { UsersModule } from "@/app/api/admin/users/users.module";
import { PrismaService } from "@/common/prisma.service";
import { SettingsModule } from "@/app/api/settings/settings.module";
import { AssetsModule } from "@/app/api/assets/assets.module";
import { ApiKeysModule } from "@/app/api/api-keys/api-keys.module";
import { MarketDataModule } from "@/app/api/market-data/market-data.module";
import { AuthModule } from "@/app/api/auth/auth.module";
import { UpdatesModule } from "./updates/updates.module";
import { NotificationsModule } from "@/app/api/notifications/notifications.module";
import { PropertiesModule } from "@/app/api/properties/properties.module";
import { ExpensesModule } from "@/app/api/expenses/expenses.module";
import { RbacModule } from "@/common/rbac/rbac.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RbacModule,
    AuthModule,
    SettingsModule,
    UsersModule,
    AssetsModule,
    ApiKeysModule,
    MarketDataModule,
    UpdatesModule,
    NotificationsModule,
    PropertiesModule,
    ExpensesModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
