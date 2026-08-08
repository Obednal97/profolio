import {
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PriceSyncService } from './price-sync.service';

/**
 * HTTP entry point for scheduled price syncing.
 *
 * The @Cron decorator on PriceSyncService relies on a process that stays
 * alive between runs. That holds for Docker and self-hosted installs but not
 * for serverless, where nothing is running between requests - so on Vercel the
 * schedule would simply never fire. Vercel Cron calls this endpoint instead
 * (see vercel.json), and both paths converge on the same syncAllPrices().
 *
 * Deliberately outside the JwtAuthGuard-protected controllers: the caller is
 * the platform, not a user. It is protected by CRON_SECRET instead, which
 * Vercel sends as a bearer token. If CRON_SECRET is unset the endpoint refuses
 * to run rather than defaulting to open.
 */
@Controller('cron')
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(private readonly priceSyncService: PriceSyncService) {}

  @Get('sync-prices')
  async syncPrices(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
      this.logger.error('CRON_SECRET is not set; refusing to run price sync');
      throw new HttpException(
        'Cron is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (authorization !== `Bearer ${secret}`) {
      this.logger.warn('Rejected price sync request with invalid cron secret');
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    this.logger.log('Cron-triggered price sync starting');
    await this.priceSyncService.syncAllPrices();

    return { success: true, ranAt: new Date().toISOString() };
  }
}
