import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaService } from '@/common/prisma.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  controllers: [AuthController],
  providers: [PrismaService, AuthGuard],
})
export class AuthModule {}