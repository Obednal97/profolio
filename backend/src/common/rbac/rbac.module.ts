import { Module, Global } from "@nestjs/common";
import { RbacService } from "./rbac.service";
import { RoleGuard } from "./role.guard";

@Global()
@Module({
  providers: [RbacService, RoleGuard],
  exports: [RbacService, RoleGuard],
})
export class RbacModule {}
