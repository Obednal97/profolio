import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/common/redis/redis.service';
import { PrismaService } from '@/common/prisma.service';
import {
  RateLimitOptions,
  RateLimitResult,
  RateLimitRule,
  RateLimitConfig,
  ProgressiveLockoutInfo,
  DEFAULT_RATE_LIMITS
} from './rate-limit.types';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private config: RateLimitConfig;
  private rulesCache = new Map<string, RateLimitRule>();
  private lastRulesCacheUpdate = 0;
  private readonly RULES_CACHE_TTL = 60000; // 1 minute

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      enabled: this.configService.get<boolean>('RATE_LIMIT_ENABLED', true),
      globalLimits: {
        maxRequestsPerMinute: this.configService.get<number>('RATE_LIMIT_MAX_PER_MINUTE', 1000),
        maxRequestsPerHour: this.configService.get<number>('RATE_LIMIT_MAX_PER_HOUR', 10000),
      },
      endpointLimits: DEFAULT_RATE_LIMITS,
      botDetection: {
        enabled: this.configService.get<boolean>('BOT_DETECTION_ENABLED', true),
        threshold: this.configService.get<number>('BOT_DETECTION_THRESHOLD', 75),
      },
      captcha: {
        enabled: this.configService.get<boolean>('CAPTCHA_ENABLED', true),
        threshold: this.configService.get<number>('CAPTCHA_THRESHOLD', 0.8),
      },
      progressiveLockout: {
        enabled: this.configService.get<boolean>('PROGRESSIVE_LOCKOUT_ENABLED', true),
        multiplier: this.configService.get<number>('PROGRESSIVE_LOCKOUT_MULTIPLIER', 2),
        maxLockoutMs: this.configService.get<number>('PROGRESSIVE_LOCKOUT_MAX_MS', 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    };

    this.logger.log(`Rate limiting initialized - Enabled: ${this.config.enabled}`);
  }

  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const startTime = Date.now();

    try {
      // If rate limiting is disabled, allow all requests
      if (!this.config.enabled) {
        return this.createAllowedResult(0, 0, new Date());
      }

      // Check if identifier is in skip lists
      if (await this.shouldSkipRateLimit(options)) {
        return this.createAllowedResult(0, 0, new Date());
      }

      // Check for existing block
      const existingBlock = await this.checkExistingBlock(options);
      if (existingBlock.blocked) {
        await this.logRateLimitEvent(options, 0, true, existingBlock.blockedUntil);
        return existingBlock;
      }

      // Get rate limit rule for this endpoint
      const rule = await this.getRateLimitRule(options.endpoint, options.method);
      if (!rule) {
        return this.createAllowedResult(0, 0, new Date());
      }

      // Check current attempt count
      const attempts = await this.getAttemptCount(options, rule.windowMs);
      const remaining = Math.max(0, rule.maxAttempts - attempts);

      // Calculate reset time
      const resetTime = new Date(Date.now() + rule.windowMs);

      // Check if limit exceeded
      if (attempts >= rule.maxAttempts) {
        const blockDuration = await this.calculateBlockDuration(options, rule);
        const blockedUntil = new Date(Date.now() + blockDuration);

        await this.blockIdentifier(options, blockedUntil);
        await this.logRateLimitEvent(options, attempts + 1, true, blockedUntil);

        return {
          allowed: false,
          limit: rule.maxAttempts,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil(blockDuration / 1000),
          blocked: true,
          blockedUntil,
          reason: 'Rate limit exceeded',
        };
      }

      // Check if CAPTCHA should be required
      const requiresCaptcha = this.config.captcha.enabled && 
        (attempts / rule.maxAttempts) >= this.config.captcha.threshold;

      // Record this attempt
      await this.recordAttempt(options, rule.windowMs);
      await this.logRateLimitEvent(options, attempts + 1, false);

      const result: RateLimitResult = {
        allowed: true,
        limit: rule.maxAttempts,
        remaining: remaining - 1, // Subtract 1 for current request
        resetTime,
        blocked: false,
        requiresCaptcha,
      };

      // Log performance
      const duration = Date.now() - startTime;
      if (duration > 10) {
        this.logger.warn(`Rate limit check took ${duration}ms for ${options.identifier}:${options.endpoint}`);
      }

      return result;

    } catch (error) {
      this.logger.error(`Error checking rate limit for ${options.identifier}:${options.endpoint}:`, error);
      // Fail open - allow request if there's an error
      return this.createAllowedResult(0, 0, new Date());
    }
  }

  private async shouldSkipRateLimit(options: RateLimitOptions): Promise<boolean> {
    const rule = await this.getRateLimitRule(options.endpoint, options.method);
    if (!rule) return false;

    if (options.identifierType === 'ip') {
      return rule.skipIps.includes(options.identifier);
    }
    
    if (options.identifierType === 'user') {
      return rule.skipUserIds.includes(options.identifier);
    }

    return false;
  }

  private async checkExistingBlock(options: RateLimitOptions): Promise<RateLimitResult> {
    const blockKey = this.redis.generateLockoutKey(options.identifier);
    const blockData = await this.redis.get(blockKey);

    if (blockData) {
      try {
        const parsed = JSON.parse(blockData);
        if (!parsed || typeof parsed !== 'object' || !parsed.blockedUntil) {
          throw new Error('Invalid block data structure');
        }
        const { blockedUntil, reason } = parsed;
        const blockedUntilDate = new Date(blockedUntil);

        if (blockedUntilDate > new Date()) {
          return {
            allowed: false,
            limit: 0,
            remaining: 0,
            resetTime: blockedUntilDate,
            retryAfter: Math.ceil((blockedUntilDate.getTime() - Date.now()) / 1000),
            blocked: true,
            blockedUntil: blockedUntilDate,
            reason,
          };
        } else {
          // Block has expired, remove it
          await this.redis.del(blockKey);
        }
      } catch (error) {
        this.logger.warn(`Invalid block data for ${options.identifier}, removing`);
        await this.redis.del(blockKey);
      }
    }

    return {
      allowed: true,
      limit: 0,
      remaining: 0,
      resetTime: new Date(),
      blocked: false,
    };
  }

  private async getRateLimitRule(endpoint: string, method: string): Promise<RateLimitRule | null> {
    await this.refreshRulesCache();

    // Try exact match first
    const exactKey = `${method}:${endpoint}`;
    if (this.rulesCache.has(exactKey)) {
      return this.rulesCache.get(exactKey)!;
    }

    // Try endpoint-only match
    if (this.rulesCache.has(endpoint)) {
      return this.rulesCache.get(endpoint)!;
    }

    // Try method-only match
    if (this.rulesCache.has(`${method}:`)) {
      return this.rulesCache.get(`${method}:`)!;
    }

    // Use default limits if available
    if (DEFAULT_RATE_LIMITS[exactKey] || DEFAULT_RATE_LIMITS[endpoint]) {
      const defaultLimit = DEFAULT_RATE_LIMITS[exactKey] || DEFAULT_RATE_LIMITS[endpoint];
      return {
        id: 'default',
        endpoint,
        method,
        maxAttempts: defaultLimit.maxAttempts,
        windowMs: defaultLimit.windowMs,
        blockDurationMs: defaultLimit.blockDurationMs,
        skipIps: [],
        skipUserIds: [],
        isActive: true,
      };
    }

    return null;
  }

  private async refreshRulesCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRulesCacheUpdate < this.RULES_CACHE_TTL) {
      return;
    }

    try {
      const rules = await this.prisma.rateLimitRule.findMany({
        where: { isActive: true },
      });

      this.rulesCache.clear();
      for (const rule of rules) {
        const key = rule.endpoint ? 
          (rule.method ? `${rule.method}:${rule.endpoint}` : rule.endpoint) :
          (rule.method ? `${rule.method}:` : 'global');
        
        this.rulesCache.set(key, rule);
      }

      this.lastRulesCacheUpdate = now;
      this.logger.debug(`Refreshed rate limit rules cache with ${rules.length} rules`);
    } catch (error) {
      this.logger.error('Failed to refresh rate limit rules cache:', error);
    }
  }

  private async getAttemptCount(options: RateLimitOptions, windowMs: number): Promise<number> {
    const key = this.redis.generateRateLimitKey(options.identifier, options.endpoint);
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  private async recordAttempt(options: RateLimitOptions, windowMs: number): Promise<void> {
    const key = this.redis.generateRateLimitKey(options.identifier, options.endpoint);
    const ttlSeconds = Math.ceil(windowMs / 1000);
    await this.redis.increment(key, ttlSeconds);
  }

  private async calculateBlockDuration(options: RateLimitOptions, rule: RateLimitRule): Promise<number> {
    if (!this.config.progressiveLockout.enabled) {
      return rule.blockDurationMs;
    }

    const lockoutInfo = await this.getProgressiveLockoutInfo(options.identifier);
    const newDuration = Math.min(
      rule.blockDurationMs * Math.pow(this.config.progressiveLockout.multiplier, lockoutInfo.lockoutLevel),
      this.config.progressiveLockout.maxLockoutMs
    );

    // Update lockout level
    await this.updateProgressiveLockoutLevel(options.identifier, lockoutInfo.lockoutLevel + 1);

    return newDuration;
  }

  private async getProgressiveLockoutInfo(identifier: string): Promise<ProgressiveLockoutInfo> {
    const key = `progressive_lockout:${identifier}`;
    const data = await this.redis.get(key);
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (!parsed || typeof parsed !== 'object' || typeof parsed.level !== 'number' || typeof parsed.lastLockout !== 'number') {
          throw new Error('Invalid progressive lockout data structure');
        }
        const { level, lastLockout } = parsed;
        const timeSinceLastLockout = Date.now() - lastLockout;
        
        // Reset level if enough time has passed (24 hours)
        if (timeSinceLastLockout > 24 * 60 * 60 * 1000) {
          return { lockoutLevel: 0, lockoutDurationMs: 0, nextLockoutMs: 0 };
        }
        
        return {
          lockoutLevel: level,
          lockoutDurationMs: 0,
          nextLockoutMs: 0,
        };
      } catch (error) {
        this.logger.warn(`Invalid progressive lockout data for ${identifier}, resetting`);
        await this.redis.del(key);
      }
    }

    return { lockoutLevel: 0, lockoutDurationMs: 0, nextLockoutMs: 0 };
  }

  private async updateProgressiveLockoutLevel(identifier: string, level: number): Promise<void> {
    const key = `progressive_lockout:${identifier}`;
    const data = {
      level,
      lastLockout: Date.now(),
    };
    
    // Store for 7 days
    await this.redis.set(key, JSON.stringify(data), 7 * 24 * 60 * 60);
  }

  private async blockIdentifier(options: RateLimitOptions, blockedUntil: Date): Promise<void> {
    const blockKey = this.redis.generateLockoutKey(options.identifier);
    const blockData = {
      identifier: options.identifier,
      blockedUntil: blockedUntil.toISOString(),
      attempts: await this.getAttemptCount(options, 60 * 60 * 1000), // Get attempts in last hour
      reason: 'Rate limit exceeded',
      endpoint: options.endpoint,
      method: options.method,
    };

    const ttlSeconds = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
    await this.redis.set(blockKey, JSON.stringify(blockData), ttlSeconds);
  }

  private async logRateLimitEvent(
    options: RateLimitOptions,
    attempts: number,
    blocked: boolean,
    blockedUntil?: Date,
  ): Promise<void> {
    try {
      await this.prisma.rateLimitEvent.create({
        data: {
          identifier: options.identifier,
          identifierType: options.identifierType,
          endpoint: options.endpoint,
          method: options.method,
          attempts,
          blocked,
          blockedUntil,
          userAgent: options.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log rate limit event:', error);
    }
  }

  private createAllowedResult(limit: number, remaining: number, resetTime: Date): RateLimitResult {
    return {
      allowed: true,
      limit,
      remaining,
      resetTime,
      blocked: false,
    };
  }

  // Admin methods
  async unlockIdentifier(identifier: string): Promise<boolean> {
    try {
      const blockKey = this.redis.generateLockoutKey(identifier);
      await this.redis.del(blockKey);
      
      // Also clear progressive lockout
      const progressiveKey = `progressive_lockout:${identifier}`;
      await this.redis.del(progressiveKey);
      
      this.logger.log(`Manually unlocked identifier: ${identifier}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unlock identifier ${identifier}:`, error);
      return false;
    }
  }

  async getIdentifierStatus(identifier: string): Promise<{
    blocked: boolean;
    blockData: Record<string, unknown> | null;
    progressiveData: Record<string, unknown> | null;
  }> {
    const blockKey = this.redis.generateLockoutKey(identifier);
    const blockData = await this.redis.get(blockKey);
    
    const progressiveKey = `progressive_lockout:${identifier}`;
    const progressiveData = await this.redis.get(progressiveKey);
    
    let parsedBlockData = null;
    let parsedProgressiveData = null;
    
    if (blockData) {
      try {
        parsedBlockData = JSON.parse(blockData);
      } catch (error) {
        this.logger.warn(`Invalid block data for ${identifier}`);
      }
    }
    
    if (progressiveData) {
      try {
        parsedProgressiveData = JSON.parse(progressiveData);
      } catch (error) {
        this.logger.warn(`Invalid progressive data for ${identifier}`);
      }
    }
    
    return {
      blocked: !!blockData,
      blockData: parsedBlockData,
      progressiveData: parsedProgressiveData,
    };
  }

  async healthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    try {
      const redisHealth = await this.redis.health();
      const rulesCount = this.rulesCache.size;
      
      return {
        status: redisHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        details: {
          redis: redisHealth,
          rulesCache: {
            size: rulesCount,
            lastUpdate: new Date(this.lastRulesCacheUpdate).toISOString(),
          },
          config: {
            enabled: this.config.enabled,
            botDetectionEnabled: this.config.botDetection.enabled,
            captchaEnabled: this.config.captcha.enabled,
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }
}