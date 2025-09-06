import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { AuthenticatedRequest } from "../../types/common";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // SECURITY: Enhanced demo mode validation
    if (this.isValidDemoToken(authHeader, request)) {
      // Demo mode: set demo user with proper validation
      request.user = {
        id: "demo-user-id",
        email: "demo@profolio.com",
        name: "Demo User",
        isDemo: true,
      };
      return true;
    }

    // For regular JWT tokens, use passport validation
    return super.canActivate(context);
  }

  handleRequest(
    err: Error | null,
    user: { id: string; email?: string; name?: string; isDemo?: boolean } | null,
    info: { message?: string } | null,
    context: ExecutionContext
  ) {
    const request = context.switchToHttp().getRequest();

    // Handle demo user case
    if (user && user.id === "demo-user-id" && user.isDemo) {
      return user;
    }

    // For regular users, handle authentication failures
    if (err || !user) {
      // Enhanced error logging for security monitoring (but no rate limiting here)
      this.logger.warn(`JWT validation failed`, {
        error: err?.message,
        info: info?.message,
        timestamp: new Date().toISOString(),
        userAgent: request.headers["user-agent"],
      });

      // Provide specific error message for debugging (in development only)
      if (process.env.NODE_ENV === "development") {
        const errorDetail = err?.message || info?.message || "Unknown error";
        throw new UnauthorizedException(
          `JWT validation failed: ${errorDetail}`
        );
      }

      // Generic error message in production to prevent information disclosure
      throw new UnauthorizedException("Invalid or expired token");
    }

    return user;
  }

  /**
   * SECURITY: Enhanced demo token validation
   */
  private isValidDemoToken(
    authHeader: string | undefined,
    request: AuthenticatedRequest
  ): boolean {
    if (!authHeader) return false;

    // Check for demo token pattern
    if (!authHeader.startsWith("Bearer demo-token-")) return false;

    // Additional security: Check if demo mode is enabled
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ENABLE_DEMO_MODE !== "true"
    ) {
      this.logger.warn(
        "Demo mode access attempted in production but not enabled"
      );
      return false;
    }

    // Validate demo token format (should be: Bearer demo-token-secure-{timestamp})
    const tokenParts = authHeader.split("-");
    if (
      tokenParts.length !== 4 ||
      tokenParts[0] !== "Bearer demo" ||
      tokenParts[1] !== "token" ||
      tokenParts[2] !== "secure"
    ) {
      return false;
    }

    // Optional: Validate timestamp if needed for session expiration
    const timestamp = tokenParts[3];
    if (!/^\d+$/.test(timestamp)) {
      return false;
    }

    // Demo token is valid
    this.logger.log("Demo mode authentication successful");
    return true;
  }
}
