import { Body, Controller, Post, Res, Get, Req, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '@/common/prisma.service';
import { Request } from 'express';
import { AuthGuard } from './guards/auth.guard'; // adjust path as needed
import { AuthUser } from '@/common/auth/jwt.strategy';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('signup')
  async signup(@Body() body: { email: string; password: string; name?: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return { error: 'User already exists' };
    }

    const hashedPassword = await hash(body.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name ?? null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const token = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return { token };
  }

  @Post('signin')
  async signin(@Body() body: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) return { error: 'Invalid credentials' };

    const validPassword = await compare(body.password, user.password);
    if (!validPassword) return { error: 'Invalid credentials' };

    const token = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return { token };
  }

  @Post('signout')
  signout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' });
    return { message: 'Signed out successfully' };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  getUser(@Req() req: { user: AuthUser }) {
    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name ?? null,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: { user: AuthUser }) {
    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name ?? null,
    };
  }
}