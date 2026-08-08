import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  // Redis is a degradable dependency, not a boot requirement. When it is
  // unavailable the backend still starts and rate limiting fails open, which
  // the middleware already handles. Losing rate limiting is a lesser failure
  // than the whole API being down.
  private available = false;
  private connectionErrorLogged = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Managed Redis providers (Upstash, Redis Cloud, Heroku) hand out a single
    // connection URL rather than discrete host/port/password, so accept either
    // form. Without this the discrete-fields-only version would silently fall
    // back to localhost:6379 on a hosted deployment and never connect.
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      this.configService.get<string>('KV_URL');

    const commonOptions = {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      // Fail commands immediately while disconnected rather than queueing them.
      // Without this, every request would hang waiting on a Redis that is down.
      enableOfflineQueue: false,
    };

    if (redisUrl) {
      // Never log the URL itself - it embeds the password.
      this.logger.log('Connecting to Redis via connection URL');
      this.client = new Redis(redisUrl, commonOptions);
    } else {
      const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
      const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
      const redisDb = this.configService.get<number>('REDIS_DB', 0);

      this.logger.log(`Connecting to Redis at ${redisHost}:${redisPort}/${redisDb}`);

      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        db: redisDb,
        ...commonOptions,
      });
    }

    this.client.on('connect', () => {
      this.available = true;
      this.connectionErrorLogged = false;
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.available = false;
      // ioredis emits 'error' on every retry attempt; log once per outage so a
      // sustained Redis failure cannot flood the logs.
      if (!this.connectionErrorLogged) {
        this.connectionErrorLogged = true;
        this.logger.error('Redis connection error:', error);
      }
    });

    this.client.on('close', () => {
      this.available = false;
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });

    try {
      await this.client.connect();
      await this.client.ping();
      this.available = true;
      this.logger.log('Redis connection verified with PING');
    } catch (error) {
      this.available = false;
      this.logger.error(
        'Failed to connect to Redis - starting in degraded mode. ' +
          'Rate limiting and bot detection will fail open until Redis returns.',
        error,
      );
      // Deliberately not rethrown: ioredis keeps retrying in the background and
      // the 'connect' handler restores availability when it succeeds.
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis connection closed');
      } catch (error) {
        // A quit() against an already-broken connection must not block shutdown.
        this.logger.warn('Error closing Redis connection:', error);
      }
    }
  }

  /**
   * Whether Redis is currently usable. Callers that need to distinguish
   * "no data" from "Redis is down" should check this first.
   */
  isAvailable(): boolean {
    return this.available;
  }

  getClient(): Redis {
    return this.client;
  }

  // Rate limiting specific methods
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number | null> {
    try {
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      if (ttlSeconds) {
        pipeline.expire(key, ttlSeconds);
      }
      const results = await pipeline.exec();
      
      if (results && results[0] && results[0][1] !== null) {
        return results[0][1] as number;
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Failed to hget ${key}.${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      this.logger.error(`Failed to hset ${key}.${field}:`, error);
      return false;
    }
  }

  async hincrby(key: string, field: string, increment = 1): Promise<number | null> {
    try {
      return await this.client.hincrby(key, field, increment);
    } catch (error) {
      this.logger.error(`Failed to hincrby ${key}.${field}:`, error);
      return null;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.client.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set expire for key ${key}:`, error);
      return false;
    }
  }

  // Utility method for rate limiting keys
  generateRateLimitKey(identifier: string, endpoint?: string): string {
    const prefix = 'rate_limit';
    if (endpoint) {
      return `${prefix}:${endpoint}:${identifier}`;
    }
    return `${prefix}:${identifier}`;
  }

  // Utility method for bot detection keys  
  generateBotDetectionKey(identifier: string, type: string): string {
    return `bot_detection:${type}:${identifier}`;
  }

  // Utility method for progressive lockout tracking
  generateLockoutKey(identifier: string): string {
    return `lockout:${identifier}`;
  }

  async health(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return { status: 'unhealthy' };
    }
  }
}