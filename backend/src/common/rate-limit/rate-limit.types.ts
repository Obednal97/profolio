export interface RateLimitOptions {
  identifier: string;
  identifierType: 'ip' | 'user';
  endpoint: string;
  method: string;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds
  blocked: boolean;
  blockedUntil?: Date;
  reason?: string;
  requiresCaptcha?: boolean;
}

export interface RateLimitRule {
  id: string;
  endpoint: string | null;
  method: string | null;
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  skipIps: string[];
  skipUserIds: string[];
  isActive: boolean;
}

// Simplified type for bot detection details - used internally
export interface BotDetectionDetails {
  [key: string]: string | number | string[] | object | undefined;
}

export interface BotDetectionResult {
  isBot: boolean;
  score: number; // 0-100
  detectionType: string;
  details: BotDetectionDetails;
  shouldBlock: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
  globalLimits: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  endpointLimits: Record<string, {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  }>;
  botDetection: {
    enabled: boolean;
    threshold: number; // Bot score threshold (0-100)
  };
  captcha: {
    enabled: boolean;
    threshold: number; // Percentage of limit to trigger CAPTCHA (0-1)
  };
  progressiveLockout: {
    enabled: boolean;
    multiplier: number;
    maxLockoutMs: number;
  };
}

export interface ProgressiveLockoutInfo {
  lockoutLevel: number;
  lockoutDurationMs: number;
  nextLockoutMs: number;
}

export const DEFAULT_RATE_LIMITS: Record<string, { maxAttempts: number; windowMs: number; blockDurationMs: number }> = {
  '/auth/signin': { maxAttempts: 5, windowMs: 5 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 }, // 5 attempts per 5min, block for 15min
  '/auth/signup': { maxAttempts: 3, windowMs: 10 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }, // 3 attempts per 10min, block for 30min
  '/auth/2fa': { maxAttempts: 3, windowMs: 5 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }, // 3 attempts per 5min, block for 30min
  '/auth/firebase-exchange': { maxAttempts: 10, windowMs: 60 * 1000, blockDurationMs: 5 * 60 * 1000 }, // 10 per minute
  'GET:/api': { maxAttempts: 100, windowMs: 60 * 1000, blockDurationMs: 5 * 60 * 1000 }, // 100 GET requests per minute
  'POST:/api': { maxAttempts: 50, windowMs: 60 * 1000, blockDurationMs: 5 * 60 * 1000 }, // 50 POST requests per minute
  'DELETE:/api': { maxAttempts: 10, windowMs: 60 * 1000, blockDurationMs: 15 * 60 * 1000 }, // 10 DELETE requests per minute
};

export const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'headless', 'selenium', 'phantom', 'nightmare',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot'
];

// These are legitimate proxy headers, not suspicious
// Renamed to avoid confusion - high presence of these headers could indicate automation tools
export const AUTOMATION_INDICATOR_HEADERS = [
  'x-requested-with',
  'x-automation-tool',
  'x-webdriver',
  'selenium-remote-control',
  'phantomjs'
];