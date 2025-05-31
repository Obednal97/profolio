import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '@/common/prisma.service';
import { CryptoService } from './crypto.service';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, CryptoService, PrismaService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {} 