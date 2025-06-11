import { Module, Global } from "@nestjs/common";
import { RbacService } from "./rbac.service";
import { RoleGuard } from "./role.guard";
import { PrismaService } from "@/common/prisma.service";

@Global()
@Module({
  providers: [RbacService, RoleGuard, PrismaService],
  exports: [RbacService, RoleGuard],
})
export class RbacModule {}
