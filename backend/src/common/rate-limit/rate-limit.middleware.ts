import { Injectable, NestMiddleware, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from './rate-limit.service';
import { BotDetectionService } from './bot-detection.service';
import { ConfigService } from '@nestjs/config';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly botDetectionService: BotDetectionService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    // Skip rate limiting if disabled
    if (!this.configService.get<boolean>('RATE_LIMIT_ENABLED', true)) {
      return next();
    }

    const startTime = Date.now();

    try {
      // Extract request information
      const identifier = this.getIdentifier(req);
      const identifierType = req.user?.id ? 'user' : 'ip';
      const endpoint = this.normalizeEndpoint(req.path);
      const method = req.method;
      const userAgent = req.get('User-Agent');
      const headers = this.sanitizeHeaders(req.headers);

      // Perform bot detection first
      const botDetection = await this.botDetectionService.analyzeRequest({
        identifier,
        identifierType,
        userAgent,
        headers,
        endpoint,
        method,
        timestamp: Date.now(),
      });

      // Block immediately if high bot score
      if (botDetection.shouldBlock) {
        this.logger.warn(`Blocking request from ${identifier} - Bot score: ${botDetection.score}`);
        this.setRateLimitHeaders(res, {
          allowed: false,
          limit: 0,
          remaining: 0,
          resetTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          blocked: true,
          retryAfter: 3600,
          reason: `Bot detected (score: ${botDetection.score})`,
        });
        throw new HttpException(
          `Access blocked: Automated behavior detected`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check rate limit
      const result = await this.rateLimitService.checkRateLimit({
        identifier,
        identifierType,
        endpoint,
        method,
        userAgent,
        headers,
      });

      // Set rate limit headers
      this.setRateLimitHeaders(res, result);

      // Add bot detection headers if suspicious
      if (botDetection.score > 50) {
        res.set('X-Bot-Detection-Score', botDetection.score.toString());
        res.set('X-Bot-Detection-Type', botDetection.detectionType);
      }

      // Block if rate limit exceeded
      if (!result.allowed) {
        this.logger.warn(
          `Rate limit exceeded for ${identifier} on ${method} ${endpoint} - ${result.reason}`,
        );

        const errorMessage = result.reason || 'Rate limit exceeded';
        const status = result.requiresCaptcha ? 
          HttpStatus.PRECONDITION_REQUIRED : // 428 - CAPTCHA required
          HttpStatus.TOO_MANY_REQUESTS;

        throw new HttpException(
          {
            message: errorMessage,
            statusCode: status,
            retryAfter: result.retryAfter,
            requiresCaptcha: result.requiresCaptcha,
          },
          status,
        );
      }

      // Log slow rate limit checks
      const duration = Date.now() - startTime;
      if (duration > 50) {
        this.logger.warn(`Rate limit check took ${duration}ms for ${identifier}:${endpoint}`);
      }

      next();

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Log error but don't block request
      this.logger.error('Rate limit middleware error:', error);
      next();
    }
  }

  private getIdentifier(req: RequestWithUser): string {
    // Use user ID if authenticated, otherwise use IP
    if (req.user?.id) {
      return req.user.id;
    }

    // Extract IP address, handling proxies
    const forwarded = req.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = req.get('X-Real-IP');
    if (realIp) {
      return realIp;
    }

    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private normalizeEndpoint(path: string): string {
    // Remove query parameters
    const cleanPath = path.split('?')[0];
    
    // Replace dynamic segments with placeholders
    return cleanPath
      .replace(/\/[a-f0-9-]{36}/g, '/:id') // UUID segments
      .replace(/\/\d+/g, '/:id') // Numeric segments
      .replace(/\/[a-zA-Z0-9-_]{20,}/g, '/:token') // Long alphanumeric segments (tokens)
      .toLowerCase();
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    // Only include safe headers for logging/analysis
    const safeHeaders = [
      'accept',
      'accept-language',
      'accept-encoding',
      'connection',
      'content-type',
      'cache-control',
      'user-agent',
      'referer',
      'origin',
      'host',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (safeHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
        sanitized[key.toLowerCase()] = value.substring(0, 500); // Limit header value length
      }
    }

    return sanitized;
  }

  private setRateLimitHeaders(res: Response, result: {
    allowed?: boolean;
    limit?: number;
    remaining?: number;
    resetTime?: Date;
    retryAfter?: number;
    blocked?: boolean;
    blockedUntil?: Date;
    requiresCaptcha?: boolean;
    reason?: string;
  }): void {
    if (result.limit !== undefined) {
      res.set('X-RateLimit-Limit', result.limit.toString());
    }
    
    if (result.remaining !== undefined) {
      res.set('X-RateLimit-Remaining', result.remaining.toString());
    }
    
    if (result.resetTime) {
      res.set('X-RateLimit-Reset', Math.floor(result.resetTime.getTime() / 1000).toString());
    }
    
    if (result.retryAfter) {
      res.set('Retry-After', result.retryAfter.toString());
    }

    if (result.blocked) {
      res.set('X-RateLimit-Blocked', 'true');
      if (result.blockedUntil) {
        res.set('X-RateLimit-Blocked-Until', result.blockedUntil.toISOString());
      }
    }

    if (result.requiresCaptcha) {
      res.set('X-Requires-Captcha', 'true');
    }
  }
}