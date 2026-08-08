import { Module } from '@nestjs/common';
import { RateLimitAdminController } from './rate-limit-admin.controller';
import { RateLimitModule } from '@/common/rate-limit/rate-limit.module';

@Module({
  imports: [RateLimitModule],
  controllers: [RateLimitAdminController],
})
export class RateLimitAdminModule {}
