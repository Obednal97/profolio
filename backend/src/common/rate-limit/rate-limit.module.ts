import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';
import { BotDetectionService } from './bot-detection.service';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { CaptchaService } from './captcha.service';
import { RedisModule } from '@/common/redis/redis.module';

@Global()
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [
    RateLimitService,
    BotDetectionService,
    RateLimitMiddleware,
    CaptchaService,
  ],
  exports: [
    RateLimitService,
    BotDetectionService,
    RateLimitMiddleware,
    CaptchaService,
  ],
})
export class RateLimitModule {}