import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
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
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });

    try {
      await this.client.connect();
      await this.client.ping();
      this.logger.log('Redis connection verified with PING');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
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