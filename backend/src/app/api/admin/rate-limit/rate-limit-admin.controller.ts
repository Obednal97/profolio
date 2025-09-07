import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Put,
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RoleGuard, RequireRoles } from '@/common/rbac/role.guard';
import { UserRole } from '@prisma/client';
import { RateLimitService } from '@/common/rate-limit/rate-limit.service';
import { BotDetectionService } from '@/common/rate-limit/bot-detection.service';
import { CaptchaService } from '@/common/rate-limit/captcha.service';
import { PrismaService } from '@/common/prisma.service';

class UnlockIdentifierDto {
  @IsString()
  identifier!: string;
  
  @IsOptional()
  @IsString()
  reason?: string;
}

class CreateRateLimitRuleDto {
  @IsOptional()
  @IsString()
  endpoint!: string | null;
  
  @IsOptional()
  @IsString()
  method!: string | null;
  
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxAttempts!: number;
  
  @IsNumber()
  @Min(1000) // At least 1 second
  @Max(24 * 60 * 60 * 1000) // At most 24 hours
  windowMs!: number;
  
  @IsNumber()
  @Min(1000) // At least 1 second
  @Max(7 * 24 * 60 * 60 * 1000) // At most 7 days
  blockDurationMs!: number;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skipIps?: string[];
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skipUserIds?: string[];
  
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateRateLimitRuleDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxAttempts?: number;
  
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(24 * 60 * 60 * 1000)
  windowMs?: number;
  
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(7 * 24 * 60 * 60 * 1000)
  blockDurationMs?: number;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skipIps?: string[];
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skipUserIds?: string[];
  
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('admin/rate-limit')
@ApiBearerAuth()
@Controller('admin/rate-limit')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class RateLimitAdminController {
  private readonly logger = new Logger(RateLimitAdminController.name);

  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly botDetectionService: BotDetectionService,
    private readonly captchaService: CaptchaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get rate limiting system health status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Health status retrieved' })
  async getHealth() {
    return await this.rateLimitService.healthCheck();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get rate limiting statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved' })
  async getStats(
    @Query('hours') hours: string = '24',
    @Query('identifier') identifier?: string
  ) {
    const hoursNum = parseInt(hours, 10) || 24;
    const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

    try {
      const [rateLimitEvents, botDetectionEvents] = await Promise.all([
        this.prisma.rateLimitEvent.findMany({
          where: {
            createdAt: { gte: since },
            ...(identifier && { identifier }),
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
        this.prisma.botDetectionEvent.findMany({
          where: {
            createdAt: { gte: since },
            ...(identifier && { identifier }),
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
      ]);

      // Aggregate statistics
      const blockedRequests = rateLimitEvents.filter(e => e.blocked).length;
      const totalRequests = rateLimitEvents.length;
      const uniqueIdentifiers = new Set(rateLimitEvents.map(e => e.identifier)).size;
      const topEndpoints = this.getTopEndpoints(rateLimitEvents);
      const topBotScores = this.getTopBotScores(botDetectionEvents);

      return {
        timeRange: `${hoursNum} hours`,
        totalEvents: totalRequests,
        blockedRequests,
        allowedRequests: totalRequests - blockedRequests,
        blockRate: totalRequests > 0 ? (blockedRequests / totalRequests * 100).toFixed(2) + '%' : '0%',
        uniqueIdentifiers,
        botDetectionEvents: botDetectionEvents.length,
        highRiskBots: botDetectionEvents.filter(e => e.score >= 80).length,
        topEndpoints,
        topBotScores,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit stats:', error);
      throw error;
    }
  }

  @Get('events')
  @ApiOperation({ summary: 'Get recent rate limit events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Events retrieved' })
  async getEvents(
    @Query('limit') limit = '100',
    @Query('identifier') identifier?: string,
    @Query('blocked') blocked?: string
  ) {
    const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);
    
    return await this.prisma.rateLimitEvent.findMany({
      where: {
        ...(identifier && { identifier }),
        ...(blocked !== undefined && { blocked: blocked === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
    });
  }

  @Get('bot-events')
  @ApiOperation({ summary: 'Get recent bot detection events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bot events retrieved' })
  async getBotEvents(
    @Query('limit') limit = '100',
    @Query('identifier') identifier?: string,
    @Query('minScore') minScore?: string
  ) {
    const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);
    const minScoreNum = parseInt(minScore || '0', 10);
    
    return await this.prisma.botDetectionEvent.findMany({
      where: {
        ...(identifier && { identifier }),
        ...(minScoreNum > 0 && { score: { gte: minScoreNum } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
    });
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all rate limit rules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rules retrieved' })
  async getRules() {
    return await this.prisma.rateLimitRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create a new rate limit rule' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Rule created' })
  async createRule(@Body() data: CreateRateLimitRuleDto) {
    return await this.prisma.rateLimitRule.create({
      data: {
        endpoint: data.endpoint,
        method: data.method,
        maxAttempts: data.maxAttempts,
        windowMs: data.windowMs,
        blockDurationMs: data.blockDurationMs,
        skipIps: data.skipIps || [],
        skipUserIds: data.skipUserIds || [],
        isActive: data.isActive ?? true,
      },
    });
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update a rate limit rule' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule updated' })
  async updateRule(@Param('id') id: string, @Body() data: UpdateRateLimitRuleDto) {
    return await this.prisma.rateLimitRule.update({
      where: { id },
      data,
    });
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete a rate limit rule' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule deleted' })
  async deleteRule(@Param('id') id: string) {
    return await this.prisma.rateLimitRule.delete({
      where: { id },
    });
  }

  @Get('identifier/:identifier')
  @ApiOperation({ summary: 'Get status for a specific identifier' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Identifier status retrieved' })
  async getIdentifierStatus(@Param('identifier') identifier: string) {
    const [rateLimitStatus, botScore, captchaStats] = await Promise.all([
      this.rateLimitService.getIdentifierStatus(identifier),
      this.botDetectionService.getBotScore(identifier),
      this.captchaService.getCaptchaStats(identifier),
    ]);

    return {
      identifier,
      rateLimit: rateLimitStatus,
      botDetection: botScore,
      captcha: captchaStats,
    };
  }

  @Post('unlock')
  @ApiOperation({ summary: 'Unlock a rate-limited identifier' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Identifier unlocked' })
  async unlockIdentifier(@Body() data: UnlockIdentifierDto) {
    const success = await this.rateLimitService.unlockIdentifier(data.identifier);
    
    if (success) {
      // Also clear CAPTCHA failures
      await this.captchaService.clearFailedAttempts(data.identifier);
      
      this.logger.log(`Admin unlocked identifier: ${data.identifier}${data.reason ? ` - Reason: ${data.reason}` : ''}`);
    }

    return { success, identifier: data.identifier };
  }

  @Get('blocked-identifiers')
  @ApiOperation({ summary: 'Get all currently blocked identifiers' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Blocked identifiers retrieved' })
  async getBlockedIdentifiers() {
    // This would require scanning Redis for blocked identifiers
    // For now, return recent blocked events
    const recentBlocked = await this.prisma.rateLimitEvent.findMany({
      where: {
        blocked: true,
        blockedUntil: {
          gt: new Date(),
        },
      },
      select: {
        identifier: true,
        identifierType: true,
        blockedUntil: true,
        endpoint: true,
        method: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['identifier'],
      take: 100,
    });

    return recentBlocked;
  }

  private getTopEndpoints(events: Array<{ method: string; endpoint: string; blocked: boolean }>): Array<{ endpoint: string; count: number; blocked: number }> {
    const endpointStats = new Map<string, { count: number; blocked: number }>();
    
    for (const event of events) {
      const key = `${event.method} ${event.endpoint}`;
      const stats = endpointStats.get(key) || { count: 0, blocked: 0 };
      stats.count++;
      if (event.blocked) stats.blocked++;
      endpointStats.set(key, stats);
    }

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({ endpoint, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopBotScores(events: Array<{ identifier: string; score: number }>): Array<{ identifier: string; avgScore: number; count: number }> {
    const identifierStats = new Map<string, { totalScore: number; count: number }>();
    
    for (const event of events) {
      const stats = identifierStats.get(event.identifier) || { totalScore: 0, count: 0 };
      stats.totalScore += event.score;
      stats.count++;
      identifierStats.set(event.identifier, stats);
    }

    return Array.from(identifierStats.entries())
      .map(([identifier, stats]) => ({
        identifier,
        avgScore: Math.round(stats.totalScore / stats.count),
        count: stats.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);
  }
}