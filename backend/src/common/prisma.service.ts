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

  constructor() {
    super({
      // Enterprise-grade connection configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Enhanced logging for production debugging
      log: ["query", "error", "info", "warn"],
      // Connection management
      errorFormat: "colorless",
    });
  }

  async onModuleInit() {
    try {
      this.logger.log("Connecting to database...");
      await this.$connect();
      this.logger.log("✅ Database connected successfully");

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
   * Get database connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        connected: true,
        latency,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
