import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '@/common/prisma.service';
import { AuthGuard } from './guards/auth.guard';
import { JwtStrategy } from '@/common/auth/jwt.strategy';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-fallback',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService, 
    AuthGuard, 
    JwtStrategy, 
    JwtAuthGuard
  ],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, JwtModule],
})
export class AuthModule {}