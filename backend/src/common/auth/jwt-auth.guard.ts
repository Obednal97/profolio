import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);

  // Rate limiting for failed authentication attempts
  private static readonly authAttempts = new Map<
    string,
    { count: number; lastAttempt: Date }
  >();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const clientIP = this.getClientIP(request);

    // Check rate limiting for this IP
    if (this.isRateLimited(clientIP)) {
      this.logger.warn(
        `Authentication rate limit exceeded for IP: ${clientIP}`
      );
      throw new UnauthorizedException(
        "Too many authentication attempts. Please try again later."
      );
    }

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

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const clientIP = this.getClientIP(request);

    // Handle demo user case
    if (user && user.id === "demo-user-id" && user.isDemo) {
      return user;
    }

    // For regular users, handle authentication failures
    if (err || !user) {
      // Record failed attempt for rate limiting
      this.recordFailedAttempt(clientIP);

      // Enhanced error logging for security monitoring
      this.logger.warn(`Authentication failed for IP: ${clientIP}`, {
        error: err?.message,
        info: info?.message,
        timestamp: new Date().toISOString(),
      });

      // Generic error message to prevent information disclosure
      throw new UnauthorizedException("Authentication failed");
    }

    // Clear failed attempts on successful authentication
    this.clearFailedAttempts(clientIP);

    return user;
  }

  /**
   * SECURITY: Enhanced demo token validation
   */
  private isValidDemoToken(
    authHeader: string | undefined,
    request: any
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

  /**
   * Get client IP address for rate limiting
   */
  private getClientIP(request: any): string {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.headers["x-forwarded-for"]?.split(",")[0] ||
      "unknown"
    );
  }

  /**
   * Check if IP is rate limited
   */
  private isRateLimited(clientIP: string): boolean {
    const attempts = JwtAuthGuard.authAttempts.get(clientIP);
    if (!attempts) return false;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();

    // Reset attempts if lockout period has passed
    if (timeSinceLastAttempt > JwtAuthGuard.LOCKOUT_DURATION) {
      JwtAuthGuard.authAttempts.delete(clientIP);
      return false;
    }

    return attempts.count >= JwtAuthGuard.MAX_ATTEMPTS;
  }

  /**
   * Record a failed authentication attempt
   */
  private recordFailedAttempt(clientIP: string): void {
    const attempts = JwtAuthGuard.authAttempts.get(clientIP) || {
      count: 0,
      lastAttempt: new Date(),
    };
    attempts.count += 1;
    attempts.lastAttempt = new Date();
    JwtAuthGuard.authAttempts.set(clientIP, attempts);
  }

  /**
   * Clear failed attempts for successful authentication
   */
  private clearFailedAttempts(clientIP: string): void {
    JwtAuthGuard.authAttempts.delete(clientIP);
  }
}
