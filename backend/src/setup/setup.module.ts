import { Module } from "@nestjs/common";
import { SetupController } from "./setup.controller";
import { SetupService } from "./setup.service";
import { PrismaService } from "@/common/prisma.service";
import { ApiKeysModule } from "@/app/api/api-keys/api-keys.module";

@Module({
  imports: [ApiKeysModule],
  controllers: [SetupController],
  providers: [SetupService, PrismaService],
  exports: [SetupService],
})
export class SetupModule {}
