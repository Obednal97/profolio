import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@/common/redis/redis.service';
import { randomBytes } from 'crypto';

interface CaptchaChallenge {
  id: string;
  answer: string;
  question: string;
  expiresAt: Date;
}

interface CaptchaValidationResult {
  valid: boolean;
  reason?: string;
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly captchaEnabled: boolean;
  private readonly captchaTtlSeconds = 300; // 5 minutes

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.captchaEnabled = this.configService.get<boolean>('CAPTCHA_ENABLED', true);
    this.logger.log(`CAPTCHA service initialized - Enabled: ${this.captchaEnabled}`);
  }

  async generateChallenge(identifier: string): Promise<CaptchaChallenge | null> {
    if (!this.captchaEnabled) {
      return null;
    }

    try {
      // Generate simple math challenge for now
      // In production, this would integrate with reCAPTCHA, hCaptcha, etc.
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const operations = ['+', '-'];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      let answer: number;
      let question: string;
      
      switch (operation) {
        case '+':
          answer = num1 + num2;
          question = `What is ${num1} + ${num2}?`;
          break;
        case '-': {
          // Ensure positive result
          const larger = Math.max(num1, num2);
          const smaller = Math.min(num1, num2);
          answer = larger - smaller;
          question = `What is ${larger} - ${smaller}?`;
          break;
        }
        default:
          answer = num1 + num2;
          question = `What is ${num1} + ${num2}?`;
      }

      const challengeId = this.generateChallengeId();
      const expiresAt = new Date(Date.now() + this.captchaTtlSeconds * 1000);

      const challenge: CaptchaChallenge = {
        id: challengeId,
        answer: answer.toString(),
        question,
        expiresAt,
      };

      // Store in Redis
      const key = `captcha:${challengeId}`;
      await this.redis.set(
        key,
        JSON.stringify({
          answer: challenge.answer,
          identifier,
          createdAt: new Date().toISOString(),
        }),
        this.captchaTtlSeconds
      );

      this.logger.debug(`Generated CAPTCHA challenge ${challengeId} for ${identifier}`);
      return challenge;

    } catch (error) {
      this.logger.error(`Failed to generate CAPTCHA challenge for ${identifier}:`, error);
      return null;
    }
  }

  async validateChallenge(challengeId: string, answer: string, identifier: string): Promise<CaptchaValidationResult> {
    if (!this.captchaEnabled) {
      return { valid: true };
    }

    try {
      const key = `captcha:${challengeId}`;
      const challengeData = await this.redis.get(key);

      if (!challengeData) {
        return { valid: false, reason: 'Challenge not found or expired' };
      }

      let correctAnswer: string;
      let challengeIdentifier: string;
      
      try {
        const parsed = JSON.parse(challengeData);
        if (!parsed || typeof parsed !== 'object' || !parsed.answer || !parsed.identifier) {
          throw new Error('Invalid challenge data structure');
        }
        correctAnswer = parsed.answer;
        challengeIdentifier = parsed.identifier;
      } catch (error) {
        this.logger.warn(`Invalid CAPTCHA data for challenge ${challengeId}`);
        return { valid: false, reason: 'Invalid challenge data' };
      }

      // Verify the identifier matches
      if (challengeIdentifier !== identifier) {
        this.logger.warn(`CAPTCHA identifier mismatch: expected ${challengeIdentifier}, got ${identifier}`);
        return { valid: false, reason: 'Invalid challenge' };
      }

      // Verify the answer
      const isValid = answer.trim().toLowerCase() === correctAnswer.toLowerCase();

      if (isValid) {
        // Remove the challenge after successful validation
        await this.redis.del(key);
        this.logger.debug(`CAPTCHA challenge ${challengeId} validated successfully for ${identifier}`);
      } else {
        this.logger.warn(`Invalid CAPTCHA answer for challenge ${challengeId} from ${identifier}`);
      }

      return {
        valid: isValid,
        reason: isValid ? undefined : 'Incorrect answer',
      };

    } catch (error) {
      this.logger.error(`Failed to validate CAPTCHA challenge ${challengeId}:`, error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  async isCaptchaRequired(identifier: string, endpoint: string): Promise<boolean> {
    if (!this.captchaEnabled) {
      return false;
    }

    try {
      // Check if there are recent failed CAPTCHA attempts
      const failedAttemptsKey = `captcha_failed:${identifier}`;
      const failedAttempts = await this.redis.get(failedAttemptsKey);
      
      if (failedAttempts && parseInt(failedAttempts, 10) >= 3) {
        return true;
      }

      // Check with rate limiting service if threshold is met
      // This would typically be called from the rate limiting service
      return false;

    } catch (error) {
      this.logger.error(`Failed to check CAPTCHA requirement for ${identifier}:`, error);
      return false;
    }
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    try {
      const key = `captcha_failed:${identifier}`;
      const ttlSeconds = 3600; // 1 hour
      await this.redis.increment(key, ttlSeconds);
    } catch (error) {
      this.logger.error(`Failed to record failed CAPTCHA attempt for ${identifier}:`, error);
    }
  }

  async clearFailedAttempts(identifier: string): Promise<void> {
    try {
      const key = `captcha_failed:${identifier}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to clear failed CAPTCHA attempts for ${identifier}:`, error);
    }
  }

  private generateChallengeId(): string {
    return randomBytes(16).toString('hex');
  }

  async getCaptchaStats(identifier?: string): Promise<{
    identifier?: string;
    failedAttempts?: number;
    captchaRequired?: boolean;
    enabled?: boolean;
    ttlSeconds?: number;
    error?: string;
  }> {
    try {
      if (identifier) {
        const failedAttemptsKey = `captcha_failed:${identifier}`;
        const failedAttempts = await this.redis.get(failedAttemptsKey);
        
        return {
          identifier,
          failedAttempts: failedAttempts ? parseInt(failedAttempts, 10) : 0,
          captchaRequired: await this.isCaptchaRequired(identifier, ''),
        };
      }

      // Return global stats (would need to implement key scanning)
      return {
        enabled: this.captchaEnabled,
        ttlSeconds: this.captchaTtlSeconds,
      };

    } catch (error) {
      this.logger.error('Failed to get CAPTCHA stats:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Integration methods for reCAPTCHA (for future implementation)
  async verifyRecaptcha(token: string, remoteIp: string): Promise<boolean> {
    const recaptchaSecret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (!recaptchaSecret) {
      this.logger.warn('reCAPTCHA secret key not configured');
      return false;
    }

    try {
      // This would make an HTTP request to Google's reCAPTCHA verification endpoint
      // For now, return false as it's not implemented
      this.logger.warn('reCAPTCHA verification not yet implemented');
      return false;
    } catch (error) {
      this.logger.error('reCAPTCHA verification failed:', error);
      return false;
    }
  }
}