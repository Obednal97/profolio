import { Module } from '@nestjs/common';
import { RateLimitAdminController } from './rate-limit-admin.controller';
import { RateLimitModule } from '@/common/rate-limit/rate-limit.module';
import { PrismaService } from '@/common/prisma.service';

@Module({
  imports: [RateLimitModule],
  controllers: [RateLimitAdminController],
  providers: [PrismaService],
})
export class RateLimitAdminModule {}