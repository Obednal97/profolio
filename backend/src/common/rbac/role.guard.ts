import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { RbacService } from "./rbac.service";
import { AuthUser } from "@/common/auth/jwt.strategy";

// Decorator to set required roles for a route
export const RequireRoles = (...roles: UserRole[]) =>
  SetMetadata("roles", roles);

// Decorator for admin access (ADMIN or SUPER_ADMIN)
export const RequireAdmin = () =>
  RequireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

// Decorator for super admin access only
export const RequireSuperAdmin = () => RequireRoles(UserRole.SUPER_ADMIN);

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from route metadata
    const requiredRoles =
      this.reflector.get<UserRole[]>("roles", context.getHandler()) ||
      this.reflector.get<UserRole[]>("roles", context.getClass());

    // If no roles specified, allow access (handled by JWT guard)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (should be added by JWT guard)
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      return false;
    }

    // Check if user has any of the required roles
    for (const role of requiredRoles) {
      const hasRole = await this.rbacService.hasRole(user.id, role);
      if (hasRole) {
        return true;
      }
    }

    return false;
  }
}
