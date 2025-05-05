import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaService } from '@/common/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [PrismaService],
})
export class AuthModule {}