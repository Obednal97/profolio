import { Injectable, Logger, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma.service";
import { UserRole } from "@prisma/client";
import { AuthUser } from "@/common/auth/jwt.strategy";

export interface RoleChangeRequest {
  userId: string;
  newRole: UserRole;
  reason?: string;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has required role or higher in the hierarchy
   */
  async hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return false;
      }

      return this.isRoleEqualOrHigher(user.role, requiredRole);
    } catch (error) {
      this.logger.error(`Failed to check role for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has admin role or higher
   */
  async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, UserRole.ADMIN);
  }

  /**
   * Check if user has super admin role
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, UserRole.SUPER_ADMIN);
  }

  /**
   * Verify user has required role, throw exception if not
   */
  async verifyRole(user: AuthUser, requiredRole: UserRole): Promise<void> {
    const hasRequiredRole = await this.hasRole(user.id, requiredRole);

    if (!hasRequiredRole) {
      const roleNames = {
        [UserRole.USER]: "User",
        [UserRole.ADMIN]: "Admin",
        [UserRole.SUPER_ADMIN]: "Super Admin",
      };

      this.logger.warn(
        `Access denied: User ${user.email} (${user.id}) attempted to access ${roleNames[requiredRole]} resource`
      );

      throw new ForbiddenException(
        `${roleNames[requiredRole]} access required for this operation`
      );
    }
  }

  /**
   * Verify admin access (ADMIN or SUPER_ADMIN)
   */
  async verifyAdminAccess(user: AuthUser): Promise<void> {
    await this.verifyRole(user, UserRole.ADMIN);
  }

  /**
   * Verify super admin access
   */
  async verifySuperAdminAccess(user: AuthUser): Promise<void> {
    await this.verifyRole(user, UserRole.SUPER_ADMIN);
  }

  /**
   * Get user's current role
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      return user?.role || null;
    } catch (error) {
      this.logger.error(`Failed to get role for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Change user's role (admin or super admin only)
   */
  async changeUserRole(
    adminUser: AuthUser,
    request: RoleChangeRequest
  ): Promise<void> {
    try {
      // Verify admin has permission to change roles
      await this.verifyAdminAccess(adminUser);

      // Get target user and admin user details
      const [targetUser, admin] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: request.userId },
          select: { id: true, email: true, role: true },
        }),
        this.prisma.user.findUnique({
          where: { id: adminUser.id },
          select: { role: true },
        }),
      ]);

      if (!targetUser) {
        throw new ForbiddenException("Target user not found");
      }

      if (!admin) {
        throw new ForbiddenException("Admin user not found");
      }

      // Prevent role escalation beyond admin's own role
      if (!this.canAssignRole(admin.role, request.newRole)) {
        throw new ForbiddenException(
          "Cannot assign a role higher than your own"
        );
      }

      // Prevent admins from changing super admin roles (only super admins can)
      if (
        targetUser.role === UserRole.SUPER_ADMIN &&
        admin.role !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          "Only super admins can modify super admin roles"
        );
      }

      // Prevent self-demotion to avoid lockout
      if (
        adminUser.id === request.userId &&
        request.newRole < targetUser.role
      ) {
        throw new ForbiddenException(
          "Cannot demote your own role to prevent lockout"
        );
      }

      // Perform role change in transaction
      await this.prisma.$transaction(async (tx) => {
        // Update user role
        await tx.user.update({
          where: { id: request.userId },
          data: {
            role: request.newRole,
            roleAssignedAt: new Date(),
            roleAssignedBy: adminUser.id,
          },
        });

        // Create audit trail
        await tx.roleChange.create({
          data: {
            userId: request.userId,
            adminId: adminUser.id,
            previousRole: targetUser.role,
            newRole: request.newRole,
            reason: request.reason || "No reason provided",
          },
        });
      });

      this.logger.log(
        `Role changed: ${targetUser.email} (${targetUser.role} → ${request.newRole}) by ${adminUser.email}`
      );
    } catch (error) {
      this.logger.error("Failed to change user role:", error);
      throw error;
    }
  }

  /**
   * Get role change history for a user
   */
  async getRoleHistory(userId: string): Promise<Array<{
    id: string;
    userId: string;
    fromRole: string;
    toRole: string;
    reason?: string | null;
    performedById: string;
    createdAt: Date;
    performedBy?: { email: string; name?: string | null };
  }>> {
    try {
      const roleChanges = await this.prisma.roleChange.findMany({
        where: { userId },
        include: {
          admin: {
            select: { email: true, name: true },
          },
        },
        orderBy: { timestamp: "desc" },
      });
      
      return roleChanges.map(change => ({
        id: change.id,
        userId: change.userId,
        fromRole: change.previousRole,
        toRole: change.newRole,
        reason: change.reason,
        performedById: change.adminId,
        createdAt: change.timestamp,
        performedBy: change.admin
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get role history for user ${userId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Initialize default admin user from environment variables
   * This is for initial setup only
   */
  async initializeDefaultAdmin(): Promise<void> {
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

      if (adminEmails.length === 0) {
        this.logger.warn("No ADMIN_EMAILS defined in environment variables");
        return;
      }

      for (const email of adminEmails) {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) continue;

        const user = await this.prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (user && user.role === UserRole.USER) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              role: UserRole.ADMIN,
              roleAssignedAt: new Date(),
              roleAssignedBy: "system", // System assignment
            },
          });

          this.logger.log(
            `Promoted ${trimmedEmail} to ADMIN role from environment variable`
          );
        }
      }
    } catch (error) {
      this.logger.error("Failed to initialize default admin:", error);
    }
  }

  /**
   * Check if role A is equal or higher than role B in hierarchy
   */
  private isRoleEqualOrHigher(
    userRole: UserRole,
    requiredRole: UserRole
  ): boolean {
    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if admin can assign a specific role
   */
  private canAssignRole(adminRole: UserRole, targetRole: UserRole): boolean {
    // Super admins can assign any role
    if (adminRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admins can only assign USER or ADMIN roles, not SUPER_ADMIN
    if (adminRole === UserRole.ADMIN) {
      return targetRole !== UserRole.SUPER_ADMIN;
    }

    // Users cannot assign any roles
    return false;
  }
}
