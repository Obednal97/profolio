import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { PrismaService } from "@/common/prisma.service";
import { hash } from "bcrypt";
import { randomBytes } from "crypto";
import { 
  SetPasswordDto, 
  TokenValidationResponse, 
  PasswordSetupResponse,
  PasswordSetupRequestResponse 
} from "./dto/oauth-password.dto";

@Injectable()
export class OAuthPasswordService {
  private readonly logger = new Logger(OAuthPasswordService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly TOKEN_EXPIRY_HOURS = 1;
  private readonly BCRYPT_ROUNDS = 12;
  private readonly TOKEN_LENGTH = 32; // 32 bytes = 256 bits
  
  
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Request password setup for OAuth user
   */
  async requestPasswordSetup(userId: string): Promise<PasswordSetupRequestResponse> {
    try {
      // Get user and validate
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          password: true,
          provider: true,
          emailVerified: true,
          name: true
        }
      });

      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      // Check if user already has a password
      if (user.password && user.password.length > 0) {
        throw new HttpException(
          "User already has a password set", 
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if user is OAuth user (all OAuth users have provider = "firebase")
      if (user.provider !== "firebase") {
        throw new HttpException(
          "This feature is only available for OAuth users", 
          HttpStatus.BAD_REQUEST
        );
      }

      // Rate limiting is handled by global RateLimitMiddleware

      // Invalidate any existing unused tokens
      await this.prisma.passwordSetupToken.updateMany({
        where: {
          userId: user.id,
          used: false,
          expiresAt: { gt: new Date() }
        },
        data: {
          expiresAt: new Date() // Expire immediately
        }
      });

      // Generate secure token
      const rawToken = this.generateSecureToken();
      const hashedToken = await this.hashToken(rawToken);
      
      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Create token record
      await this.prisma.passwordSetupToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt,
          used: false,
          attempts: 0
        }
      });

      // Send email (simplified - in production use proper email service)
      await this.sendPasswordSetupEmail(user.email, user.name || "User", rawToken);

      this.logger.log(`Password setup requested for user: ${user.email}`);

      return {
        success: true,
        message: "Password setup email sent to your registered email address"
      };
    } catch (error) {
      this.logger.error("Password setup request failed:", error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        "Failed to process password setup request",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verify setup token
   */
  async verifySetupToken(token: string): Promise<TokenValidationResponse> {
    try {
      const hashedToken = await this.hashToken(token);
      
      // Find token with user
      const tokenRecord = await this.prisma.passwordSetupToken.findFirst({
        where: {
          token: hashedToken,
          used: false,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });

      if (!tokenRecord) {
        // Check if token exists but is expired or used
        const expiredToken = await this.prisma.passwordSetupToken.findFirst({
          where: { token: hashedToken }
        });
        
        if (expiredToken) {
          if (expiredToken.used) {
            throw new HttpException("Token has already been used", HttpStatus.BAD_REQUEST);
          }
          if (expiredToken.expiresAt < new Date()) {
            throw new HttpException("Token has expired", HttpStatus.BAD_REQUEST);
          }
        }
        
        throw new HttpException("Invalid token", HttpStatus.BAD_REQUEST);
      }

      // Check attempts
      if (tokenRecord.attempts >= this.MAX_ATTEMPTS) {
        throw new HttpException(
          "Too many verification attempts. Please request a new token.",
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Update attempt count
      await this.prisma.passwordSetupToken.update({
        where: { id: tokenRecord.id },
        data: { attempts: tokenRecord.attempts + 1 }
      });

      // Calculate time until expiry
      const expiresIn = Math.floor(
        (tokenRecord.expiresAt.getTime() - Date.now()) / 1000
      );

      return {
        valid: true,
        email: tokenRecord.user?.email || "",
        expiresIn
      };
    } catch (error) {
      this.logger.error("Token verification failed:", error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        "Failed to verify token",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Set password using token
   */
  async setPassword(dto: SetPasswordDto): Promise<PasswordSetupResponse> {
    try {
      const { token, password, confirmPassword } = dto;

      // Validate passwords match
      if (password !== confirmPassword) {
        throw new HttpException(
          "Passwords do not match",
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate password strength (additional check beyond DTO validation)
      if (!this.validatePasswordStrength(password)) {
        throw new HttpException(
          "Password does not meet security requirements",
          HttpStatus.BAD_REQUEST
        );
      }

      const hashedToken = await this.hashToken(token);
      
      // Find and validate token
      const tokenRecord = await this.prisma.passwordSetupToken.findFirst({
        where: {
          token: hashedToken,
          used: false,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              password: true
            }
          }
        }
      });

      if (!tokenRecord) {
        throw new HttpException("Invalid or expired token", HttpStatus.BAD_REQUEST);
      }

      // Check if user already has password (double-check)
      if (tokenRecord.user?.password && tokenRecord.user.password.length > 0) {
        throw new HttpException(
          "Password has already been set",
          HttpStatus.CONFLICT
        );
      }

      // Ensure password doesn't contain email
      const emailLocal = tokenRecord.user?.email.split("@")[0].toLowerCase();
      if (emailLocal && password.toLowerCase().includes(emailLocal)) {
        throw new HttpException(
          "Password cannot contain your email address",
          HttpStatus.BAD_REQUEST
        );
      }

      // Hash the new password
      const hashedPassword = await hash(password, this.BCRYPT_ROUNDS);

      // Update user in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Update user password and provider
        await tx.user.update({
          where: { id: tokenRecord.userId },
          data: {
            password: hashedPassword,
            provider: "dual", // Now supports both OAuth and email/password
            emailVerified: true // Mark as verified since they received the email
          }
        });

        // Mark token as used
        await tx.passwordSetupToken.update({
          where: { id: tokenRecord.id },
          data: { used: true }
        });

        // Clean up old tokens for this user
        await tx.passwordSetupToken.deleteMany({
          where: {
            userId: tokenRecord.userId,
            id: { not: tokenRecord.id }
          }
        });
      });

      this.logger.log(`Password set successfully for user: ${tokenRecord.user?.email}`);

      return {
        success: true,
        message: "Password set successfully. You can now sign in with email and password.",
        provider: "dual"
      };
    } catch (error) {
      this.logger.error("Password setup failed:", error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        "Failed to set password",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate cryptographically secure token
   */
  private generateSecureToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString("hex");
  }

  /**
   * Hash token for storage
   */
  private async hashToken(token: string): Promise<string> {
    return hash(token, 10); // Lower rounds for tokens since they're temporary
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): boolean {
    // Check minimum length
    if (password.length < 12) {
      return false;
    }

    // Check for required character types
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }


  /**
   * Send password setup email (simplified - in production use proper email service)
   */
  private async sendPasswordSetupEmail(
    email: string, 
    name: string, 
    token: string
  ): Promise<void> {
    // In production, this would use a proper email service like SendGrid, AWS SES, etc.
    const setupUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/setup-password?token=${token}`;
    
    this.logger.log(`
      ========================================
      PASSWORD SETUP EMAIL (Development Mode)
      ========================================
      To: ${name} <${email}>
      Subject: Set up password for your Profolio account
      
      Click the link below to set your password:
      ${setupUrl}
      
      This link will expire in 1 hour.
      ========================================
    `);

    // TODO: Implement actual email sending using a service like:
    // - SendGrid
    // - AWS SES
    // - Postmark
    // - Resend
    // Example:
    // await this.emailService.send({
    //   to: email,
    //   subject: "Set up password for your Profolio account",
    //   template: "password-setup",
    //   data: { name, setupUrl }
    // });
  }
}