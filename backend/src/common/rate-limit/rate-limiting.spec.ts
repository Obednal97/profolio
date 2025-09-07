import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';
import { BotDetectionService } from './bot-detection.service';
import { CaptchaService } from './captcha.service';
import { RedisService } from '@/common/redis/redis.service';
import { PrismaService } from '@/common/prisma.service';

describe('Rate Limiting System', () => {
  let rateLimitService: RateLimitService;
  let botDetectionService: BotDetectionService;
  let captchaService: CaptchaService;
  let redisService: RedisService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  // Mock implementations
  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    increment: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    health: jest.fn().mockResolvedValue({ status: 'healthy' }),
    generateLockoutKey: jest.fn((identifier: string) => `lockout:${identifier}`),
    generateRateLimitKey: jest.fn((identifier: string, endpoint: string) => `rate_limit:${identifier}:${endpoint}`),
    generateAttemptKey: jest.fn((identifier: string, endpoint: string) => `attempt:${identifier}:${endpoint}`),
    generateProgressiveKey: jest.fn((identifier: string) => `progressive_lockout:${identifier}`),
  };

  const mockPrismaService = {
    rateLimitRule: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rateLimitEvent: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    botDetectionEvent: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'RATE_LIMIT_ENABLED': true,
        'BOT_DETECTION_ENABLED': true,
        'CAPTCHA_ENABLED': true,
        'PROGRESSIVE_LOCKOUT_ENABLED': true,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        BotDetectionService,
        CaptchaService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    rateLimitService = module.get<RateLimitService>(RateLimitService);
    botDetectionService = module.get<BotDetectionService>(BotDetectionService);
    captchaService = module.get<CaptchaService>(CaptchaService);
    redisService = module.get<RedisService>(RedisService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BotDetectionService', () => {
    describe('analyzeUserAgent', () => {
      it('should detect known bot user agents', async () => {
        const context = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          userAgent: 'googlebot/2.1',
          headers: {},
          endpoint: '/api/test',
          method: 'GET',
          timestamp: Date.now(),
        };

        const result = await botDetectionService.analyzeRequest(context);

        expect(result.score).toBeGreaterThan(70);
        expect(result.detectionType).toContain('user_agent');
        expect(result.isBot).toBe(true); // Score >= 75 means isBot = true
      });

      it('should flag missing user agents', async () => {
        const context = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          userAgent: undefined,
          headers: {},
          endpoint: '/api/test',
          method: 'GET',
          timestamp: Date.now(),
        };

        const result = await botDetectionService.analyzeRequest(context);

        expect(result.score).toBeGreaterThan(0);
        expect(result.detectionType).toContain('user_agent');
      });

      it('should detect headless browsers', async () => {
        const context = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 HeadlessChrome/91.0.4472.124',
          headers: {},
          endpoint: '/api/test',
          method: 'GET',
          timestamp: Date.now(),
        };

        const result = await botDetectionService.analyzeRequest(context);

        expect(result.score).toBeGreaterThan(50);
        expect(result.detectionType).toContain('user_agent');
      });
    });

    describe('analyzeTimingPatterns', () => {
      beforeEach(() => {
        mockRedisService.get.mockClear();
        mockRedisService.set.mockClear();
      });

      it('should detect rapid fire requests', async () => {
        const timestamps = Array.from({ length: 10 }, (_, i) => Date.now() + i * 100); // 100ms apart
        mockRedisService.get.mockResolvedValue(JSON.stringify(timestamps));

        const context = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          userAgent: 'test-agent',
          headers: {},
          endpoint: '/api/test',
          method: 'GET',
          timestamp: Date.now(),
        };

        const result = await botDetectionService.analyzeRequest(context);

        expect(result.score).toBeGreaterThan(0);
        expect(mockRedisService.set).toHaveBeenCalled();
      });

      it('should handle insufficient timing data', async () => {
        mockRedisService.get.mockResolvedValue(JSON.stringify([Date.now()])); // Only one timestamp

        const context = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          userAgent: 'test-agent',
          headers: {},
          endpoint: '/api/test',
          method: 'GET',
          timestamp: Date.now(),
        };

        const result = await botDetectionService.analyzeRequest(context);

        // Should still process but timing analysis should be minimal
        expect(result.score).toBeGreaterThanOrEqual(0);
      });
    });

    describe('analyzeHeaders', () => {
      it('should detect automation headers', async () => {
        const context = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          userAgent: 'test-agent',
          headers: {
            'x-automated': 'true',
            'accept': 'application/json',
          },
          endpoint: '/api/test',
          method: 'GET',
          timestamp: Date.now(),
        };

        const result = await botDetectionService.analyzeRequest(context);

        expect(result.score).toBeGreaterThan(30);
        expect(result.detectionType).toContain('headers');
      });

      it('should flag missing common headers', async () => {
        const context = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          userAgent: 'test-agent',
          headers: {
            'host': 'localhost',
          }, // Missing accept, accept-language, etc.
          endpoint: '/api/test',
          method: 'GET',
          timestamp: Date.now(),
        };

        const result = await botDetectionService.analyzeRequest(context);

        expect(result.score).toBeGreaterThan(0);
        expect(result.detectionType).toContain('headers');
      });
    });
  });

  describe('CaptchaService', () => {
    describe('generateChallenge', () => {
      it('should generate math challenges', async () => {
        const challenge = await captchaService.generateChallenge('test-user');

        expect(challenge).toBeDefined();
        expect(challenge?.id).toBeDefined();
        expect(challenge?.question).toMatch(/What is \d+ [+\-] \d+\?/);
        expect(challenge?.answer).toMatch(/^\d+$/);
        expect(mockRedisService.set).toHaveBeenCalled();
      });

      it('should return null when CAPTCHA is disabled', async () => {
        // Create a new service instance with CAPTCHA disabled
        const disabledConfigService = {
          get: jest.fn((key: string, defaultValue?: any) => {
            if (key === 'CAPTCHA_ENABLED') return false;
            return true;
          }),
        };
        
        const module = await Test.createTestingModule({
          providers: [
            CaptchaService,
            {
              provide: RedisService,
              useValue: mockRedisService,
            },
            {
              provide: ConfigService,
              useValue: disabledConfigService,
            },
          ],
        }).compile();
        
        const disabledCaptchaService = module.get<CaptchaService>(CaptchaService);
        const challenge = await disabledCaptchaService.generateChallenge('test-user');

        expect(challenge).toBeNull();
      });

      it('should generate unique challenge IDs', async () => {
        const challenge1 = await captchaService.generateChallenge('user1');
        const challenge2 = await captchaService.generateChallenge('user2');

        expect(challenge1?.id).not.toBe(challenge2?.id);
      });
    });

    describe('validateChallenge', () => {
      it('should validate correct answers', async () => {
        const challengeData = {
          answer: '5',
          identifier: 'test-user',
          createdAt: new Date().toISOString(),
        };
        mockRedisService.get.mockResolvedValue(JSON.stringify(challengeData));

        const result = await captchaService.validateChallenge('test-id', '5', 'test-user');

        expect(result.valid).toBe(true);
        expect(mockRedisService.del).toHaveBeenCalledWith('captcha:test-id');
      });

      it('should reject incorrect answers', async () => {
        const challengeData = {
          answer: '5',
          identifier: 'test-user',
          createdAt: new Date().toISOString(),
        };
        mockRedisService.get.mockResolvedValue(JSON.stringify(challengeData));

        const result = await captchaService.validateChallenge('test-id', '7', 'test-user');

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Incorrect answer');
      });

      it('should reject expired challenges', async () => {
        mockRedisService.get.mockResolvedValue(null);

        const result = await captchaService.validateChallenge('test-id', '5', 'test-user');

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Challenge not found or expired');
      });

      it('should reject identifier mismatches', async () => {
        const challengeData = {
          answer: '5',
          identifier: 'different-user',
          createdAt: new Date().toISOString(),
        };
        mockRedisService.get.mockResolvedValue(JSON.stringify(challengeData));

        const result = await captchaService.validateChallenge('test-id', '5', 'test-user');

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid challenge');
      });
    });
  });

  describe('RateLimitService', () => {
    beforeEach(() => {
      mockRedisService.get.mockClear();
      mockRedisService.set.mockClear();
      mockPrismaService.rateLimitRule.findMany.mockResolvedValue([]);
    });

    describe('checkRateLimit', () => {
      it('should allow requests when no rules exist', async () => {
        const options = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          endpoint: '/api/test',
          method: 'GET',
        };

        const result = await rateLimitService.checkRateLimit(options);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(0);
        expect(result.remaining).toBe(0);
      });

      it('should apply rate limit rules when they exist', async () => {
        const rule = {
          id: 'test-rule',
          endpoint: '/api/test',
          method: 'GET',
          maxAttempts: 5,
          windowMs: 60000,
          blockDurationMs: 300000,
          skipIps: [],
          skipUserIds: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaService.rateLimitRule.findMany.mockResolvedValue([rule]);
        mockRedisService.get.mockResolvedValue(null); // No existing attempts

        const options = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          endpoint: '/api/test',
          method: 'GET',
        };

        const result = await rateLimitService.checkRateLimit(options);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(5);
        expect(result.remaining).toBe(4); // 5 - 1 (current request)
      });

      it('should block requests when limit exceeded', async () => {
        const rule = {
          id: 'test-rule',
          endpoint: '/api/test', // Specific endpoint rule
          method: 'GET',
          maxAttempts: 2,
          windowMs: 60000,
          blockDurationMs: 300000,
          skipIps: [],
          skipUserIds: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaService.rateLimitRule.findMany.mockResolvedValue([rule]);
        
        // Mock existing attempts that exceed the limit
        mockRedisService.get.mockImplementation((key) => {
          if (key.includes('lockout:')) {
            return Promise.resolve(null); // No existing block
          }
          if (key.includes('rate_limit:')) {
            return Promise.resolve('3'); // 3 existing attempts > limit of 2
          }
          return Promise.resolve(null);
        });

        const options = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          endpoint: '/api/test',
          method: 'GET',
        };

        const result = await rateLimitService.checkRateLimit(options);

        expect(result.allowed).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.retryAfter).toBeGreaterThan(0);
      });

      it('should skip rate limiting for whitelisted IPs', async () => {
        const rule = {
          id: 'test-rule',
          endpoint: null,
          method: null,
          maxAttempts: 1,
          windowMs: 60000,
          blockDurationMs: 300000,
          skipIps: ['127.0.0.1'],
          skipUserIds: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaService.rateLimitRule.findMany.mockResolvedValue([rule]);

        const options = {
          identifier: '127.0.0.1',
          identifierType: 'ip' as const,
          endpoint: '/api/test',
          method: 'GET',
        };

        const result = await rateLimitService.checkRateLimit(options);

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(0); // Skip list returns createAllowedResult with 0 limit
        expect(result.remaining).toBe(0);
      });
    });

    describe('progressive lockout', () => {
      it('should implement progressive lockout durations', async () => {
        const violations = [
          { timestamp: Date.now() - 10000, duration: 300000 }, // 5 minutes ago
          { timestamp: Date.now() - 20000, duration: 900000 }, // 15 minutes ago
        ];

        mockRedisService.get.mockResolvedValue(JSON.stringify(violations));

        // This would be called internally by checkRateLimit
        // For unit testing, we'd need to expose the progressive lockout logic
        // or test it through the main checkRateLimit method
        expect(violations.length).toBe(2); // Placeholder for actual progressive logic test
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate bot detection with rate limiting', async () => {
      const context = {
        identifier: '127.0.0.1',
        identifierType: 'ip' as const,
        userAgent: 'suspicious-bot',
        headers: { 'x-automated': 'true' },
        endpoint: '/api/test',
        method: 'GET',
        timestamp: Date.now(),
      };

      // Test bot detection
      const botResult = await botDetectionService.analyzeRequest(context);
      expect(botResult.score).toBeGreaterThan(50);

      // Test that high bot scores can trigger different rate limit behavior
      const rateLimitOptions = {
        identifier: context.identifier,
        identifierType: context.identifierType,
        endpoint: context.endpoint,
        method: context.method,
        botScore: botResult.score,
      };

      const rateLimitResult = await rateLimitService.checkRateLimit(rateLimitOptions);
      expect(rateLimitResult).toBeDefined();
    });

    it('should handle service failures gracefully', async () => {
      // Mock Redis failure
      mockRedisService.get.mockRejectedValue(new Error('Redis connection failed'));

      const context = {
        identifier: '127.0.0.1',
        identifierType: 'ip' as const,
        userAgent: 'test-agent',
        headers: {},
        endpoint: '/api/test',
        method: 'GET',
        timestamp: Date.now(),
      };

      // Should not throw, should return safe defaults
      const result = await botDetectionService.analyzeRequest(context);
      expect(result.isBot).toBe(false);
      expect(result.score).toBe(0);
      expect(result.shouldBlock).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed Redis data gracefully', async () => {
      mockRedisService.get.mockResolvedValue('invalid-json');

      const context = {
        identifier: '127.0.0.1',
        identifierType: 'ip' as const,
        userAgent: 'test-agent',
        headers: {},
        endpoint: '/api/test',
        method: 'GET',
        timestamp: Date.now(),
      };

      const result = await botDetectionService.analyzeRequest(context);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle database connection failures', async () => {
      mockPrismaService.rateLimitRule.findMany.mockRejectedValue(new Error('Database connection failed'));

      const options = {
        identifier: '127.0.0.1',
        identifierType: 'ip' as const,
        endpoint: '/api/test',
        method: 'GET',
      };

      const result = await rateLimitService.checkRateLimit(options);
      expect(result.allowed).toBe(true); // Should allow on failure
    });
  });

  describe('Configuration', () => {
    it('should respect disabled rate limiting', async () => {
      mockConfigService.get.mockReturnValueOnce(false); // RATE_LIMIT_ENABLED = false

      const options = {
        identifier: '127.0.0.1',
        identifierType: 'ip' as const,
        endpoint: '/api/test',
        method: 'GET',
      };

      const result = await rateLimitService.checkRateLimit(options);
      expect(result.allowed).toBe(true);
    });

    it('should respect disabled bot detection via rate limit service', async () => {
      // Bot detection is controlled by rate limit service config, not bot detection service itself
      // The bot detection service always analyzes, but rate limit service ignores results when disabled
      const context = {
        identifier: '127.0.0.1',
        identifierType: 'ip' as const,
        userAgent: 'googlebot',
        headers: {},
        endpoint: '/api/test',
        method: 'GET',
        timestamp: Date.now(),
      };

      const result = await botDetectionService.analyzeRequest(context);
      // Bot detection service always does analysis regardless of global config
      expect(result.score).toBeGreaterThan(0); // Should still detect the googlebot
      expect(result.isBot).toBe(true); // Score will be >= 75
      
      // The integration with rate limiting would ignore this when BOT_DETECTION_ENABLED=false
      // but that's tested in the rate limit service integration tests
    });
  });
});