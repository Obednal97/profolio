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
  Logger
} from '@nestjs/common';
import { Response, Request } from 'express';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '@/common/prisma.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthUser } from '@/common/auth/jwt.strategy';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

class SignupDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

class SigninDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}

@ApiTags('auth')
@Controller('api/auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private static loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockoutUntil?: Date }>();
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

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
  @ApiResponse({ status: 400, description: 'Invalid input or user already exists' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async signup(@Body() body: SignupDto, @Req() req: Request) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const identifier = `signup_${clientIp}`;
    
    try {
      // Check rate limiting for signup attempts
      this.checkRateLimit(identifier);

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      });

      if (existingUser) {
        this.updateRateLimit(identifier, false);
        // Don't reveal that user exists - return generic message
        throw new HttpException(
          'Invalid input provided',
          HttpStatus.BAD_REQUEST
        );
      }

      // Hash password with stronger rounds
      const hashedPassword = await hash(body.password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: body.email.toLowerCase(),
          password: hashedPassword,
          name: body.name ?? null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      // Generate secure token
      const token = this.generateToken(user);

      // Clear rate limiting on success
      this.updateRateLimit(identifier, true);

      // Log successful signup
      this.logger.log(`New user registered: ${user.email}`);

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
      
      this.logger.error(`Signup error for ${body.email}:`, error);
      this.updateRateLimit(identifier, false);
      
      throw new HttpException(
        'Registration failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in to user account' })
  @ApiResponse({ status: 200, description: 'Signed in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many attempts or account locked' })
  async signin(@Body() body: SigninDto, @Req() req: Request) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const identifier = `signin_${body.email.toLowerCase()}_${clientIp}`;
    
    try {
      // Check rate limiting
      this.checkRateLimit(identifier);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
        }
      });

      // Verify password (always run comparison even if user doesn't exist to prevent timing attacks)
      const hasValidPassword = user ? await compare(body.password, user.password) : false;
      
      if (!user || !hasValidPassword) {
        this.updateRateLimit(identifier, false);
        
        // Log failed attempt
        this.logger.warn(`Failed login attempt for ${body.email} from ${clientIp}`);
        
        // Return generic error message
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Generate secure token
      const token = this.generateToken(user);

      // Clear rate limiting on success
      this.updateRateLimit(identifier, true);

      // Log successful signin
      this.logger.log(`User signed in: ${user.email}`);

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
      
      this.logger.error(`Signin error for ${body.email}:`, error);
      this.updateRateLimit(identifier, false);
      
      throw new HttpException(
        'Authentication failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('signout')
  @ApiOperation({ summary: 'Sign out of user account' })
  @ApiResponse({ status: 200, description: 'Signed out successfully' })
  signout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    try {
      // Clear any authentication cookies
      res.clearCookie('token', { 
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict'
      });

      // In a production system, you might want to blacklist the JWT token
      // For now, we rely on short token expiration
      
      return { 
        success: true,
        message: 'Signed out successfully' 
      };
    } catch (error) {
      this.logger.error('Signout error:', error);
      throw new HttpException(
        'Signout failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUser(@Req() req: { user: AuthUser }) {
    return {
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name ?? null,
      }
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: { user: AuthUser }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!user) {
        throw new HttpException(
          'User not found',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Profile fetch error for user ${req.user.id}:`, error);
      throw new HttpException(
        'Failed to fetch profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}