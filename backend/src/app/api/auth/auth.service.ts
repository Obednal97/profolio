import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma.service';
import { hash, compare } from 'bcrypt';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Sign up a new user
   */
  async signUp(dto: SignUpDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        name: dto.name || null,
        provider: 'local',
        emailVerified: false,
        lastSignIn: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = this.generateToken(user);

    this.logger.log(`New user registered: ${user.email}`);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Sign in user
   */
  async signIn(dto: SignInDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    // Verify password
    const hasValidPassword = user ? await compare(dto.password, user.password) : false;

    if (!user || !hasValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last sign in
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignIn: new Date() },
    });

    // Generate token
    const token = this.generateToken(user);

    this.logger.log(`User signed in: ${user.email}`);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Get current user basic info
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastSignIn: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user,
    };
  }

  /**
   * Get user full profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        bio: true,
        photoURL: true,
        location: true,
        preferredCurrency: true,
        theme: true,
        timezone: true,
        language: true,
        taxCountry: true,
        taxRate: true,
        provider: true,
        emailVerified: true,
        lastSignIn: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // If email is being updated, check it doesn't already exist
    if (dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: dto.email.toLowerCase(),
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        email: dto.email ? dto.email.toLowerCase() : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        bio: true,
        photoURL: true,
        location: true,
        preferredCurrency: true,
        theme: true,
        timezone: true,
        language: true,
        taxCountry: true,
        taxRate: true,
        provider: true,
        emailVerified: true,
        lastSignIn: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Profile updated for user: ${updatedUser.email}`);

    return {
      success: true,
      user: updatedUser,
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: { id: string; email: string; name?: string | null }) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
  }
}