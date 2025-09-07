import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@/common/redis/redis.service';
import { PrismaService } from '@/common/prisma.service';
import { BotDetectionResult, BotDetectionDetails, BOT_USER_AGENTS, AUTOMATION_INDICATOR_HEADERS } from './rate-limit.types';

interface DetectionContext {
  identifier: string;
  identifierType: 'ip' | 'user';
  userAgent?: string;
  headers?: Record<string, string>;
  endpoint: string;
  method: string;
  timestamp: number;
}

interface TimingPattern {
  requests: number[];
  avgInterval: number;
  variance: number;
  isSuspicious: boolean;
}

@Injectable()
export class BotDetectionService {
  private readonly logger = new Logger(BotDetectionService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async analyzeRequest(context: DetectionContext): Promise<BotDetectionResult> {
    const detections: Array<{ type: string; score: number; details: BotDetectionDetails }> = [];

    try {
      // 1. User Agent Analysis
      const userAgentAnalysis = await this.analyzeUserAgent(context);
      if (userAgentAnalysis.score > 0) {
        detections.push(userAgentAnalysis);
      }

      // 2. Header Fingerprinting
      const headerAnalysis = await this.analyzeHeaders(context);
      if (headerAnalysis.score > 0) {
        detections.push(headerAnalysis);
      }

      // 3. Timing Pattern Analysis
      const timingAnalysis = await this.analyzeTimingPatterns(context);
      if (timingAnalysis.score > 0) {
        detections.push(timingAnalysis);
      }

      // 4. Request Pattern Analysis
      const patternAnalysis = await this.analyzeRequestPatterns(context);
      if (patternAnalysis.score > 0) {
        detections.push(patternAnalysis);
      }

      // Calculate overall score (weighted average)
      const totalScore = this.calculateOverallScore(detections);
      const isBot = totalScore >= 75; // 75+ is considered bot
      const shouldBlock = totalScore >= 90; // 90+ gets blocked immediately

      // Log detection if significant
      if (totalScore >= 50) {
        await this.logBotDetection(context, totalScore, detections, shouldBlock);
      }

      return {
        isBot,
        score: totalScore,
        detectionType: detections.map(d => d.type).join(','),
        details: {
          detections,
          totalScore,
          timestamp: context.timestamp,
        },
        shouldBlock,
      };

    } catch (error) {
      this.logger.error(`Bot detection failed for ${context.identifier}:`, error);
      return {
        isBot: false,
        score: 0,
        detectionType: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        shouldBlock: false,
      };
    }
  }

  private async analyzeUserAgent(context: DetectionContext): Promise<{ type: string; score: number; details: BotDetectionDetails }> {
    if (!context.userAgent) {
      return { type: 'user_agent', score: 30, details: { reason: 'missing_user_agent' } };
    }

    const userAgent = context.userAgent.toLowerCase();
    const details: BotDetectionDetails = { userAgent: context.userAgent };

    // Check for known bot user agents
    for (const botAgent of BOT_USER_AGENTS) {
      if (userAgent.includes(botAgent)) {
        return { 
          type: 'user_agent', 
          score: 95, 
          details: { ...details, reason: 'known_bot', matched: botAgent }
        };
      }
    }

    // Check for headless browsers
    const headlessIndicators = ['headless', 'phantom', 'selenium', 'webdriver', 'nightmare'];
    for (const indicator of headlessIndicators) {
      if (userAgent.includes(indicator)) {
        return { 
          type: 'user_agent', 
          score: 85, 
          details: { ...details, reason: 'headless_browser', matched: indicator }
        };
      }
    }

    // Check for suspicious patterns
    if (userAgent.length < 10) {
      return { type: 'user_agent', score: 60, details: { ...details, reason: 'too_short' } };
    }

    if (userAgent.length > 1000) {
      return { type: 'user_agent', score: 40, details: { ...details, reason: 'too_long' } };
    }

    // Check for missing common browser indicators
    const browserIndicators = ['mozilla', 'webkit', 'chrome', 'safari', 'firefox', 'edge'];
    const hasBrowserIndicator = browserIndicators.some(indicator => userAgent.includes(indicator));
    
    if (!hasBrowserIndicator) {
      return { type: 'user_agent', score: 50, details: { ...details, reason: 'no_browser_indicators' } };
    }

    return { type: 'user_agent', score: 0, details };
  }

  private async analyzeHeaders(context: DetectionContext): Promise<{ type: string; score: number; details: BotDetectionDetails }> {
    if (!context.headers) {
      return { type: 'headers', score: 10, details: { reason: 'no_headers' } };
    }

    const headers = Object.keys(context.headers).map(k => k.toLowerCase());
    const details: BotDetectionDetails = { headerCount: headers.length };
    let score = 0;

    // Check for automation tool indicators
    for (const automationHeader of AUTOMATION_INDICATOR_HEADERS) {
      if (headers.includes(automationHeader)) {
        score += 40; // Higher score for actual automation indicators
        if (!details.suspiciousHeaders) {
          details.suspiciousHeaders = [];
        }
        (details.suspiciousHeaders as string[]).push(automationHeader);
      }
    }

    // Check for missing common browser headers
    const commonHeaders = ['accept', 'accept-language', 'accept-encoding', 'connection'];
    const missingHeaders = commonHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 2) {
      score += 30;
      details.missingHeaders = missingHeaders;
    }

    // Check for too many headers (could be a script)
    if (headers.length > 50) {
      score += 25;
      details.reason = 'too_many_headers';
    }

    // Check for too few headers (minimal bot)
    if (headers.length < 5) {
      score += 35;
      details.reason = 'too_few_headers';
    }

    return { type: 'headers', score: Math.min(score, 100), details };
  }

  private async analyzeTimingPatterns(context: DetectionContext): Promise<{ type: string; score: number; details: BotDetectionDetails }> {
    const timingKey = `timing:${context.identifier}`;
    
    // Get recent request times
    const recentTimesStr = await this.redis.get(timingKey);
    let recentTimes: number[] = [];
    
    if (recentTimesStr) {
      try {
        const parsed = JSON.parse(recentTimesStr);
        recentTimes = Array.isArray(parsed) && parsed.every(item => typeof item === 'number') ? parsed : [];
      } catch (error) {
        this.logger.warn(`Invalid timing data for ${context.identifier}, resetting`);
        await this.redis.del(timingKey);
      }
    }
    
    // Add current request time
    recentTimes.push(context.timestamp);
    
    // Keep only last 20 requests
    if (recentTimes.length > 20) {
      recentTimes.shift();
    }
    
    // Store updated times (expire in 10 minutes)
    await this.redis.set(timingKey, JSON.stringify(recentTimes), 600);
    
    if (recentTimes.length < 3) {
      return { type: 'timing', score: 0, details: { reason: 'insufficient_data' } };
    }

    const pattern = this.analyzeTimingPattern(recentTimes);
    const details: BotDetectionDetails = {
      requestCount: recentTimes.length,
      avgInterval: pattern.avgInterval,
      variance: pattern.variance,
    };

    let score = 0;

    // Very regular intervals (bot-like)
    if (pattern.variance < 100 && pattern.avgInterval < 5000) { // Less than 100ms variance, less than 5s intervals
      score += 70;
      details.reason = 'too_regular';
    }

    // Too fast requests (inhuman speed)
    if (pattern.avgInterval < 500) { // Less than 500ms between requests
      score += 60;
      details.reason = 'too_fast';
    }

    // Burst patterns (many requests in short time)
    const last10Requests = recentTimes.slice(-10);
    if (last10Requests.length === 10) {
      const timespan = last10Requests[9] - last10Requests[0];
      if (timespan < 10000) { // 10 requests in less than 10 seconds
        score += 50;
        details.reason = 'burst_pattern';
        details.burstTimespan = timespan;
      }
    }

    return { type: 'timing', score: Math.min(score, 100), details };
  }

  private analyzeTimingPattern(timestamps: number[]): TimingPattern {
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    if (intervals.length === 0) {
      return { requests: timestamps, avgInterval: 0, variance: 0, isSuspicious: false };
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    const variance = intervals.reduce((sum, interval) => {
      const diff = interval - avgInterval;
      return sum + (diff * diff);
    }, 0) / intervals.length;

    const isSuspicious = variance < 100 && avgInterval < 5000;

    return {
      requests: timestamps,
      avgInterval,
      variance,
      isSuspicious,
    };
  }

  private async analyzeRequestPatterns(context: DetectionContext): Promise<{ type: string; score: number; details: BotDetectionDetails }> {
    const patternKey = `pattern:${context.identifier}`;
    
    // Get recent endpoints  
    const recentPatternsStr = await this.redis.get(patternKey);
    let recentPatterns: Array<{ endpoint: string; method: string; timestamp: number }> = [];
    
    if (recentPatternsStr) {
      try {
        const parsed = JSON.parse(recentPatternsStr);
        if (Array.isArray(parsed) && parsed.every(item => 
          typeof item === 'object' && 
          typeof item.endpoint === 'string' && 
          typeof item.method === 'string' && 
          typeof item.timestamp === 'number'
        )) {
          recentPatterns = parsed;
        }
      } catch (error) {
        this.logger.warn(`Invalid pattern data for ${context.identifier}, resetting`);
        await this.redis.del(patternKey);
      }
    }
    
    // Add current request
    recentPatterns.push({
      endpoint: context.endpoint,
      method: context.method,
      timestamp: context.timestamp,
    });
    
    // Keep only last 50 requests
    if (recentPatterns.length > 50) {
      recentPatterns.shift();
    }
    
    // Store updated patterns (expire in 1 hour)
    await this.redis.set(patternKey, JSON.stringify(recentPatterns), 3600);
    
    if (recentPatterns.length < 5) {
      return { type: 'pattern', score: 0, details: { reason: 'insufficient_data' } };
    }

    const details: BotDetectionDetails = { requestCount: recentPatterns.length };
    let score = 0;

    // Check for scanning behavior (accessing many different endpoints)
    const uniqueEndpoints = new Set(recentPatterns.map(p => p.endpoint));
    if (uniqueEndpoints.size > 20) {
      score += 60;
      details.reason = 'endpoint_scanning';
      details.uniqueEndpoints = uniqueEndpoints.size;
    }

    // Check for repeated identical requests
    const recentRequests = recentPatterns.slice(-10);
    const requestCounts = new Map<string, number>();
    
    for (const request of recentRequests) {
      const key = `${request.method}:${request.endpoint}`;
      requestCounts.set(key, (requestCounts.get(key) || 0) + 1);
    }
    
    const maxRepeats = Math.max(...requestCounts.values());
    if (maxRepeats > 7) { // Same request more than 7 times in last 10
      score += 50;
      details.reason = 'repeated_requests';
      details.maxRepeats = maxRepeats;
    }

    // Check for sequential endpoint access (admin panel probing)
    const adminEndpoints = recentPatterns.filter(p => 
      p.endpoint.includes('/admin') || 
      p.endpoint.includes('/api/admin') ||
      p.endpoint.includes('/management')
    );
    
    if (adminEndpoints.length > 5) {
      score += 80;
      details.reason = 'admin_probing';
      details.adminRequests = adminEndpoints.length;
    }

    return { type: 'pattern', score: Math.min(score, 100), details };
  }

  private calculateOverallScore(detections: Array<{ type: string; score: number; details: BotDetectionDetails }>): number {
    if (detections.length === 0) return 0;

    // Weighted scoring - some detection types are more reliable
    const weights: Record<string, number> = {
      user_agent: 0.4,
      headers: 0.2,
      timing: 0.3,
      pattern: 0.3,
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const detection of detections) {
      const weight = weights[detection.type] || 0.1;
      totalWeightedScore += detection.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  private async logBotDetection(
    context: DetectionContext,
    score: number,
    detections: Array<{ type: string; score: number; details: BotDetectionDetails }>,
    blocked: boolean,
  ): Promise<void> {
    try {
      await this.prisma.botDetectionEvent.create({
        data: {
          identifier: context.identifier,
          identifierType: context.identifierType,
          detectionType: detections.map(d => d.type).join(','),
          score,
          details: {
            endpoint: context.endpoint,
            method: context.method,
            detections: detections.map(d => ({
              type: d.type,
              score: d.score,
              details: Object.fromEntries(
                Object.entries(d.details).filter(([_, value]) => value !== undefined)
              )
            })),
          } as Record<string, unknown>,
          blocked,
          userAgent: context.userAgent,
          headers: context.headers,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log bot detection event:', error);
    }
  }

  async isKnownBot(userAgent: string): Promise<boolean> {
    if (!userAgent) return false;
    
    const lowerUserAgent = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some(botAgent => lowerUserAgent.includes(botAgent));
  }

  async getBotScore(identifier: string): Promise<{ score: number; detections: Array<{ score: number; detectionType: string; timestamp: Date; blocked: boolean }> }> {
    try {
      const recent = await this.prisma.botDetectionEvent.findMany({
        where: {
          identifier,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (recent.length === 0) {
        return { score: 0, detections: [] };
      }

      // Calculate average score from recent detections
      const avgScore = recent.reduce((sum, event) => sum + event.score, 0) / recent.length;
      
      return {
        score: Math.round(avgScore),
        detections: recent.map(event => ({
          score: event.score,
          detectionType: event.detectionType,
          timestamp: event.createdAt,
          blocked: event.blocked,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get bot score for ${identifier}:`, error);
      return { score: 0, detections: [] };
    }
  }
}