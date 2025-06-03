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
  Patch
} from '@nestjs/common';
import { Response, Request } from 'express';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '@/common/prisma.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthUser } from '@/common/auth/jwt.strategy';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private static loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockoutUntil?: Date }>();
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  /**
   * Check and update rate limiting for authentication attempts
   */
  private checkRateLimit(identifier: string): void {
    const now = new Date();
    const attempts = AuthController.loginAttempts.get(identifier);

    if (attempts) {
      // Check if account is locked out
      if (attempts.lockoutUntil && now < attempts.lockoutUntil) {
        const remainingTime = Math.ceil((attempts.lockoutUntil.getTime() - now.getTime()) / 1000 / 60);
        throw new HttpException(
          `Account temporarily locked. Please try again in ${remainingTime} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Reset if outside rate limit window
      if (now.getTime() - attempts.lastAttempt.getTime() > AuthController.RATE_LIMIT_WINDOW) {
        AuthController.loginAttempts.delete(identifier);
      } else if (attempts.count >= AuthController.MAX_LOGIN_ATTEMPTS) {
        // Lock account
        attempts.lockoutUntil = new Date(now.getTime() + AuthController.LOCKOUT_DURATION);
        AuthController.loginAttempts.set(identifier, attempts);
        
        this.logger.warn(`Account locked for excessive login attempts: ${identifier}`);
        throw new HttpException(
          'Too many failed login attempts. Account locked for 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(identifier: string, success: boolean): void {
    if (success) {
      // Clear attempts on successful login
      AuthController.loginAttempts.delete(identifier);
    } else {
      const attempts = AuthController.loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
      attempts.count += 1;
      attempts.lastAttempt = new Date();
      AuthController.loginAttempts.set(identifier, attempts);
    }
  }

  /**
   * Generate secure JWT token
   */
  private generateToken(user: { id: string; email: string }): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    return sign(
      { 
        sub: user.id, // Use 'sub' (subject) claim as per JWT standard
        email: user.email,
        iat: Math.floor(Date.now() / 1000), // issued at
        iss: 'profolio' // issuer
      },
      jwtSecret,
      { 
        expiresIn: '24h', // Shorter expiration for security
        algorithm: 'HS256'
      }
    );
  }

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async signUp(@Body(ValidationPipe) dto: SignUpDto) {
    try {
      return await this.authService.signUp(dto);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create user', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Sign in successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body(ValidationPipe) dto: SignInDto) {
    try {
      return await this.authService.signIn(dto);
    } catch (error) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('signout')
  @ApiOperation({ summary: 'Sign out user' })
  @ApiResponse({ status: 200, description: 'Sign out successful' })
  async signOut() {
    return { message: 'Signed out successfully' };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user basic info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: { user: AuthUser }) {
    try {
      return await this.authService.getCurrentUser(req.user.id);
    } catch (error) {
      throw new HttpException('Failed to get user info', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user full profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Req() req: { user: AuthUser }) {
    try {
      return await this.authService.getProfile(req.user.id);
    } catch (error) {
      throw new HttpException('Failed to get profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Body(ValidationPipe) dto: UpdateProfileDto, @Req() req: { user: AuthUser }) {
    try {
      return await this.authService.updateProfile(req.user.id, dto);
    } catch (error) {
      if (error instanceof Error && error.message.includes('email already exists')) {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to update profile', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('firebase-exchange')
  @ApiOperation({ summary: 'Exchange Firebase token for backend JWT' })
  @ApiResponse({ status: 200, description: 'Token exchange successful' })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })
  async exchangeFirebaseToken(@Body() body: { firebaseToken: string }) {
    try {
      // Decode Firebase token (without verification for now - we'll add proper verification later)
      const payload = JSON.parse(Buffer.from(body.firebaseToken.split('.')[1], 'base64').toString());
      
      const email = payload.email;
      const uid = payload.user_id || payload.uid;
      const name = payload.name || email?.split('@')[0] || 'User';
      
      if (!email || !uid) {
        throw new HttpException('Invalid Firebase token', HttpStatus.UNAUTHORIZED);
      }

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Create new user for Firebase sign-in
        user = await this.prisma.user.create({
          data: {
            id: uid,
            email: email.toLowerCase(),
            name: name,
            password: '', // Empty for Firebase users
            provider: 'firebase',
            emailVerified: payload.email_verified || false,
            lastSignIn: new Date(),
          },
        });
        this.logger.log(`New Firebase user created: ${user.email}`);
      } else {
        // Update last sign in
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastSignIn: new Date() },
        });
      }

      // Generate our backend JWT token
      const token = this.generateToken(user);

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
      this.logger.error('Firebase token exchange failed:', error);
      throw new HttpException('Invalid Firebase token', HttpStatus.UNAUTHORIZED);
    }
  }
}