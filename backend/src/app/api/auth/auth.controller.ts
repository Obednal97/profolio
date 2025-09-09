import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Logger,
  Patch,
} from "@nestjs/common";
import { Response, Request } from "express";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { PrismaService } from "@/common/prisma.service";
import { AuthGuard } from "./guards/auth.guard";
import { AuthUser } from "@/common/auth/jwt.strategy";
import { JwtAuthGuard } from "@/common/auth/jwt-auth.guard";
import { FirebaseService } from "./firebase.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from "class-validator";
import { AuthService } from "./auth.service";
import { SignUpDto } from "./dto/signup.dto";
import { SignInDto } from "./dto/signin.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { TwoFactorService } from "./two-factor.service";
import {
  SetupTwoFactorDto,
  VerifyTwoFactorDto,
  CompleteTwoFactorDto,
  DisableTwoFactorDto,
  VerifyBackupCodeDto,
  RegenerateBackupCodesDto,
} from "./dto/two-factor.dto";
import { OAuthPasswordService } from "./oauth-password.service";
import {
  SetPasswordDto,
  VerifySetupTokenDto,
} from "./dto/oauth-password.dto";

@ApiTags("auth")
@Controller("auth")
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  })
)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly firebaseService: FirebaseService,
    private readonly twoFactorService: TwoFactorService,
    private readonly oauthPasswordService: OAuthPasswordService
  ) {}


  /**
   * Generate secure JWT token
   */
  private generateToken(user: { id: string; email: string }): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    return sign(
      {
        sub: user.id, // Use 'sub' (subject) claim as per JWT standard
        email: user.email,
        iat: Math.floor(Date.now() / 1000), // issued at
        iss: "profolio", // issuer
      },
      jwtSecret,
      {
        expiresIn: "24h", // Shorter expiration for security
        algorithm: "HS256",
      }
    );
  }

  @Post("signup")
  @ApiOperation({ summary: "Create a new user account" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  async signUp(@Body(ValidationPipe) dto: SignUpDto) {
    try {
      return await this.authService.signUp(dto);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        throw new HttpException("Email already exists", HttpStatus.CONFLICT);
      }
      throw new HttpException("Failed to create user", HttpStatus.BAD_REQUEST);
    }
  }

  @Post("signin")
  @ApiOperation({ summary: "Sign in with email and password" })
  @ApiResponse({ status: 200, description: "Sign in successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async signIn(@Body(ValidationPipe) dto: SignInDto) {
    try {
      const result = await this.authService.signIn(dto);
      
      // Check if 2FA is enabled for this user
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() }
      });
      
      if (user && await this.twoFactorService.isEnabled(user.id)) {
        // Generate verification token for 2FA flow
        const verificationToken = await this.twoFactorService.generateVerificationToken(user.id);
        return {
          requiresTwoFactor: true,
          verificationToken
        };
      }
      
      return result;
    } catch (error) {
      throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
    }
  }

  @Post("signout")
  @ApiOperation({ summary: "Sign out user" })
  @ApiResponse({ status: 200, description: "Sign out successful" })
  async signOut() {
    return { message: "Signed out successfully" };
  }

  @Get("user")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user basic info" })
  @ApiResponse({ status: 200, description: "User info retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getCurrentUser(@Req() req: { user: AuthUser }) {
    try {
      return await this.authService.getCurrentUser(req.user.id);
    } catch (error) {
      throw new HttpException(
        "Failed to get user info",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user full profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Profile not found" })
  async getProfile(@Req() req: { user: AuthUser }) {
    try {
      return await this.authService.getProfile(req.user.id);
    } catch (error) {
      throw new HttpException(
        "Failed to get profile",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateProfile(
    @Body(ValidationPipe) dto: UpdateProfileDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      return await this.authService.updateProfile(req.user.id, dto);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("email already exists")
      ) {
        throw new HttpException("Email already exists", HttpStatus.CONFLICT);
      }
      throw new HttpException(
        "Failed to update profile",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch("password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change or set user password" })
  @ApiResponse({ status: 200, description: "Password updated successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid input data or current password incorrect",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async changePassword(
    @Body(ValidationPipe) dto: ChangePasswordDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      return await this.authService.changePassword(req.user.id, dto);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Current password is incorrect")
      ) {
        throw new HttpException(
          "Current password is incorrect",
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        error instanceof Error &&
        error.message.includes("Current password is required")
      ) {
        throw new HttpException(
          "Current password is required for existing password users",
          HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException(
        "Failed to change password",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("firebase-exchange")
  @ApiOperation({ summary: "Exchange Firebase token for backend JWT" })
  @ApiResponse({ status: 200, description: "Token exchange successful" })
  @ApiResponse({ status: 401, description: "Invalid Firebase token" })
  async exchangeFirebaseToken(@Body() body: { firebaseToken: string }) {
    try {
      // Validate input
      if (
        !body ||
        !body.firebaseToken ||
        typeof body.firebaseToken !== "string"
      ) {
        this.logger.warn("Firebase token exchange: Invalid request body");
        throw new HttpException(
          "Firebase token is required",
          HttpStatus.BAD_REQUEST
        );
      }

      // Rate limiting handled by global RateLimitMiddleware
      const clientIP = this.getClientIP();

      // SECURITY: Use Firebase Admin SDK for proper token verification
      let firebaseUserInfo;
      try {
        firebaseUserInfo = await this.firebaseService.verifyIdToken(
          body.firebaseToken
        );
      } catch (verificationError) {

        // Firebase service already provides proper error handling
        throw verificationError;
      }

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: firebaseUserInfo.email.toLowerCase() },
      });

      if (!user) {
        // Create new user for Firebase sign-in
        user = await this.prisma.user.create({
          data: {
            id: firebaseUserInfo.uid,
            email: firebaseUserInfo.email.toLowerCase(),
            name: firebaseUserInfo.name,
            password: "", // Empty for Firebase users
            provider: "firebase",
            emailVerified: firebaseUserInfo.emailVerified,
            lastSignIn: new Date(),
          },
        });
        this.logger.log(`✅ New Firebase user created: ${user.email}`);
      } else {
        // Update last sign in and provider info
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastSignIn: new Date(),
            provider: "firebase",
            emailVerified: firebaseUserInfo.emailVerified,
          },
        });
      }

      // Generate our backend JWT token
      const token = this.generateToken(user);


      this.logger.log(
        `✅ Firebase token exchange successful for user: ${user.email}`
      );

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      this.logger.error("Firebase token exchange failed:", error);

      // Re-throw HttpExceptions (already handled by FirebaseService)
      if (error instanceof HttpException) {
        throw error;
      }

      // Generic fallback for unexpected errors
      throw new HttpException(
        "Token exchange failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get client IP address for rate limiting
   */
  private getClientIP(): string {
    // This should be implemented based on your deployment setup
    // For now, return a placeholder for development
    return "dev-client";
  }

  // ============= Two-Factor Authentication Endpoints =============

  @Post("2fa/setup")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Setup two-factor authentication" })
  @ApiResponse({ status: 200, description: "2FA setup initiated" })
  @ApiResponse({ status: 400, description: "2FA already enabled" })
  async setupTwoFactor(
    @Body(ValidationPipe) dto: SetupTwoFactorDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      // Verify password first
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user || !user.password) {
        throw new HttpException(
          "Password verification required",
          HttpStatus.BAD_REQUEST
        );
      }

      const isPasswordValid = await compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new HttpException(
          "Invalid password",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Generate 2FA setup
      const result = await this.twoFactorService.generateSecret(req.user.id);
      
      return {
        qrCode: result.qrCode,
        secret: result.secret,
        backupCodes: result.backupCodes
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to setup 2FA",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("2fa/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify and enable two-factor authentication" })
  @ApiResponse({ status: 200, description: "2FA enabled successfully" })
  @ApiResponse({ status: 400, description: "Invalid verification code" })
  async verifyTwoFactor(
    @Body(ValidationPipe) dto: VerifyTwoFactorDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      const success = await this.twoFactorService.verifyAndEnable(
        req.user.id,
        dto.code
      );

      return { success };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to verify 2FA code",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("2fa/complete")
  @ApiOperation({ summary: "Complete login with 2FA code" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid 2FA code" })
  async completeTwoFactor(@Body(ValidationPipe) dto: CompleteTwoFactorDto) {
    try {
      // Validate verification token
      const userId = await this.twoFactorService.validateVerificationToken(
        dto.verificationToken
      );

      if (!userId) {
        throw new HttpException(
          "Invalid or expired verification token",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Check rate limiting for 2FA attempts
      // Rate limiting handled by global RateLimitMiddleware

      // Verify the TOTP code
      const isValid = await this.twoFactorService.verifyToken(userId, dto.code);

      if (!isValid) {
        throw new HttpException(
          "Invalid 2FA code",
          HttpStatus.UNAUTHORIZED
        );
      }


      // Get user and generate JWT
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      const token = this.generateToken(user);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to complete 2FA verification",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("2fa/backup")
  @ApiOperation({ summary: "Complete login with backup code" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid backup code" })
  async verifyBackupCode(@Body(ValidationPipe) dto: VerifyBackupCodeDto) {
    try {
      // Validate verification token
      const userId = await this.twoFactorService.validateVerificationToken(
        dto.verificationToken
      );

      if (!userId) {
        throw new HttpException(
          "Invalid or expired verification token",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Verify the backup code
      const isValid = await this.twoFactorService.verifyBackupCode(
        userId,
        dto.code
      );

      if (!isValid) {
        throw new HttpException(
          "Invalid backup code",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Get user and generate JWT
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      const token = this.generateToken(user);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        warning: "Backup code used. Please generate new backup codes."
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to verify backup code",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("2fa/disable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Disable two-factor authentication" })
  @ApiResponse({ status: 200, description: "2FA disabled successfully" })
  @ApiResponse({ status: 400, description: "Invalid credentials" })
  async disableTwoFactor(
    @Body(ValidationPipe) dto: DisableTwoFactorDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      // Verify password
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user || !user.password) {
        throw new HttpException(
          "Password verification required",
          HttpStatus.BAD_REQUEST
        );
      }

      const isPasswordValid = await compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new HttpException(
          "Invalid password",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Verify TOTP code
      const isCodeValid = await this.twoFactorService.verifyToken(
        req.user.id,
        dto.code
      );

      if (!isCodeValid) {
        throw new HttpException(
          "Invalid 2FA code",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Disable 2FA
      await this.twoFactorService.disable(req.user.id);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to disable 2FA",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("2fa/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get 2FA status for current user" })
  @ApiResponse({ status: 200, description: "2FA status retrieved" })
  async getTwoFactorStatus(@Req() req: { user: AuthUser }) {
    try {
      return await this.twoFactorService.getStatus(req.user.id);
    } catch (error) {
      throw new HttpException(
        "Failed to get 2FA status",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("2fa/regenerate-backup")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Regenerate backup codes" })
  @ApiResponse({ status: 200, description: "Backup codes regenerated" })
  @ApiResponse({ status: 400, description: "Invalid credentials" })
  async regenerateBackupCodes(
    @Body(ValidationPipe) dto: RegenerateBackupCodesDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      // Verify password
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user || !user.password) {
        throw new HttpException(
          "Password verification required",
          HttpStatus.BAD_REQUEST
        );
      }

      const isPasswordValid = await compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new HttpException(
          "Invalid password",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Verify TOTP code
      const isCodeValid = await this.twoFactorService.verifyToken(
        req.user.id,
        dto.code
      );

      if (!isCodeValid) {
        throw new HttpException(
          "Invalid 2FA code",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Regenerate backup codes
      const backupCodes = await this.twoFactorService.regenerateBackupCodes(
        req.user.id
      );

      return {
        success: true,
        backupCodes
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to regenerate backup codes",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============= OAuth Password Setup Endpoints =============

  @Post("oauth/request-password-setup")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request password setup for OAuth users" })
  @ApiResponse({ status: 200, description: "Password setup email sent" })
  @ApiResponse({ status: 400, description: "User already has password or not OAuth user" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async requestPasswordSetup(@Req() req: { user: AuthUser }) {
    try {
      // Rate limiting handled by global RateLimitMiddleware
      const result = await this.oauthPasswordService.requestPasswordSetup(req.user.id);
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to process password setup request",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("oauth/verify-setup-token")
  @ApiOperation({ summary: "Verify password setup token" })
  @ApiResponse({ status: 200, description: "Token is valid" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  @ApiResponse({ status: 429, description: "Too many verification attempts" })
  async verifySetupToken(@Body(ValidationPipe) dto: VerifySetupTokenDto) {
    try {
      // Rate limiting handled by global RateLimitMiddleware
      const result = await this.oauthPasswordService.verifySetupToken(dto.token);
      
      return result;
    } catch (error) {
      
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to verify token",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("oauth/set-password")
  @ApiOperation({ summary: "Set password using setup token" })
  @ApiResponse({ status: 200, description: "Password set successfully" })
  @ApiResponse({ status: 400, description: "Invalid token or password requirements not met" })
  @ApiResponse({ status: 409, description: "Password already set" })
  async setPasswordWithToken(@Body(ValidationPipe) dto: SetPasswordDto) {
    try {
      // Rate limiting handled by global RateLimitMiddleware
      const result = await this.oauthPasswordService.setPassword(dto);
      
      return result;
    } catch (error) {
      
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to set password",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
