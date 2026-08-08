import { Module } from "@nestjs/common";
import { SetupController } from "./setup.controller";
import { SetupService } from "./setup.service";
import { ApiKeysModule } from "@/app/api/api-keys/api-keys.module";

@Module({
  imports: [ApiKeysModule],
  controllers: [SetupController],
  providers: [SetupService],
  exports: [SetupService],
})
export class SetupModule {}
