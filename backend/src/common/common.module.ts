import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global providers shared across every feature module.
 *
 * PrismaService MUST live here and nowhere else. Nest instantiates a provider
 * once per module that declares it, so listing PrismaService in each feature
 * module's `providers` array created one PrismaClient per module - each opening
 * its own connection pool. Marking this module @Global() means a single shared
 * instance is injectable everywhere without importing anything.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class CommonModule {}
