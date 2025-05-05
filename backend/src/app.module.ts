import { Module } from '@nestjs/common';
import { UsersModule } from '@/app/api/admin/users/users.module';
import { PrismaService } from '@/common/prisma.service';
import { SettingsModule } from '@/app/api/settings/settings.module';


@Module({
    imports: [SettingsModule, UsersModule],
    providers: [PrismaService],
    exports: [PrismaService],
  })
export class AppModule {}
