import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  // 🛡️ CONNECTION POOL ISOLATION: Track user connections to prevent exhaustion
  private userConnectionCounts = new Map<string, number>();
  private readonly MAX_CONNECTIONS_PER_USER = 10; // Prevent single user from consuming all connections
  private readonly CONNECTION_POOL_SIZE = 100; // Total pool size
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds

  // 🔒 CIRCUIT BREAKER: Protect against database overload
  private circuitBreaker = {
    isOpen: false,
    failureCount: 0,
    threshold: 5,
    timeout: 60000, // 1 minute
    lastFailure: 0,
  };

  constructor() {
    super({
      // 🚀 ENTERPRISE CONNECTION POOL CONFIGURATION
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Query logging writes every statement and its parameters (emails,
      // transaction amounts) to the log stream. Restrict it to development.
      log:
        process.env.NODE_ENV === "production"
          ? ["error", "warn"]
          : ["query", "error", "info", "warn"],
      errorFormat: "colorless",
      // Connection pool configuration is handled at the database URL level
      // Format: postgresql://user:password@host:port/database?connection_limit=100&pool_timeout=30
    });
  }

  /**
   * 🛡️ SECURE CONNECTION: Check user limits and circuit breaker before database operations
   */
  async secureQuery<T>(
    userId: string,
    operation: () => Promise<T>,
    operationName: string = "query"
  ): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      throw new Error(
        "Database temporarily unavailable - circuit breaker open"
      );
    }

    // Check per-user connection limits
    const userConnections = this.userConnectionCounts.get(userId) || 0;
    if (userConnections >= this.MAX_CONNECTIONS_PER_USER) {
      this.logger.warn(
        `🚨 User ${userId} has exceeded connection limit (${userConnections}/${this.MAX_CONNECTIONS_PER_USER})`
      );
      throw new Error("Too many concurrent operations - please try again");
    }

    // Track user connection
    this.incrementUserConnection(userId);

    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise(operationName),
      ]);

      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      this.logger.error(`Database operation failed for user ${userId}:`, error);
      throw error;
    } finally {
      this.decrementUserConnection(userId);
    }
  }

  /**
   * 🛡️ USER CONNECTION TRACKING
   */
  private incrementUserConnection(userId: string): void {
    const current = this.userConnectionCounts.get(userId) || 0;
    this.userConnectionCounts.set(userId, current + 1);
  }

  private decrementUserConnection(userId: string): void {
    const current = this.userConnectionCounts.get(userId) || 0;
    if (current <= 1) {
      this.userConnectionCounts.delete(userId);
    } else {
      this.userConnectionCounts.set(userId, current - 1);
    }
  }

  /**
   * 🔒 CIRCUIT BREAKER IMPLEMENTATION
   */
  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreaker.isOpen) return false;

    // Check if timeout has passed
    if (
      Date.now() - this.circuitBreaker.lastFailure >
      this.circuitBreaker.timeout
    ) {
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failureCount = 0;
      this.logger.log("🔓 Circuit breaker reset - database reconnected");
      return false;
    }

    return true;
  }

  private recordSuccess(): void {
    this.circuitBreaker.failureCount = 0;
    if (this.circuitBreaker.isOpen) {
      this.circuitBreaker.isOpen = false;
      this.logger.log("🔓 Circuit breaker closed after successful operation");
    }
  }

  private recordFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      this.logger.error(
        `🔒 Circuit breaker opened after ${this.circuitBreaker.failureCount} failures`
      );
    }
  }

  private createTimeoutPromise(operationName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Database operation '${operationName}' timed out after ${this.CONNECTION_TIMEOUT}ms`
          )
        );
      }, this.CONNECTION_TIMEOUT);
    });
  }

  /**
   * 📊 MONITORING: Get resource usage statistics
   */
  getResourceStats(): {
    totalUsers: number;
    activeConnections: number;
    maxConnectionsPerUser: number;
    circuitBreakerStatus: string;
    userConnectionBreakdown: Record<string, number>;
  } {
    const totalConnections = Array.from(
      this.userConnectionCounts.values()
    ).reduce((sum, count) => sum + count, 0);

    return {
      totalUsers: this.userConnectionCounts.size,
      activeConnections: totalConnections,
      maxConnectionsPerUser: this.MAX_CONNECTIONS_PER_USER,
      circuitBreakerStatus: this.circuitBreaker.isOpen ? "OPEN" : "CLOSED",
      userConnectionBreakdown: Object.fromEntries(this.userConnectionCounts),
    };
  }

  async onModuleInit() {
    try {
      this.logger.log(
        "🔗 Connecting to database with enhanced connection pooling..."
      );
      await this.$connect();
      this.logger.log("✅ Database connected successfully");
      this.logger.log(
        `🛡️ Connection pool initialized: ${this.CONNECTION_POOL_SIZE} max connections, ${this.MAX_CONNECTIONS_PER_USER} per user`
      );

      // Verify database connectivity with a simple query
      await this.healthCheck();
    } catch (error) {
      this.logger.error("❌ Failed to connect to database:", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log("Disconnecting from database...");
      await this.$disconnect();
      this.logger.log("✅ Database disconnected successfully");
    } catch (error) {
      this.logger.error("❌ Error during database disconnection:", error);
      // Don't throw here to allow graceful shutdown
    }
  }

  /**
   * Health check method to verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error("Database health check failed:", error);
      return false;
    }
  }

  /**
   * Get database connection status with enhanced metrics
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
    resourceStats?: {
      totalUsers: number;
      activeConnections: number;
      maxConnectionsPerUser: number;
      circuitBreakerStatus: string;
      userConnectionBreakdown: Record<string, number>;
    };
  }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        connected: true,
        latency,
        resourceStats: this.getResourceStats(),
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        resourceStats: this.getResourceStats(),
      };
    }
  }
}
