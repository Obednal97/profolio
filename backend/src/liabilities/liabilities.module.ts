import { Module } from '@nestjs/common';
import { LiabilitiesService } from './liabilities.service';
import { LiabilitiesController } from './liabilities.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [LiabilitiesController],
  providers: [LiabilitiesService, PrismaService],
})
export class LiabilitiesModule {}
