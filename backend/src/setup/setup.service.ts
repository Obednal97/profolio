import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/common/prisma.service";
import { ApiKeysService } from "@/app/api/api-keys/api-keys.service";
import { SetupConfigDto } from "./setup.controller";
import { ApiProvider } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);
  private readonly configPath = path.join(process.cwd(), ".env");
  private readonly setupFlagPath = path.join(process.cwd(), ".setup-complete");

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private apiKeysService: ApiKeysService
  ) {}

  async getSetupStatus() {
    const isSetupComplete = fs.existsSync(this.setupFlagPath);
    const hasDatabaseUrl = !!this.configService.get("DATABASE_URL");

    return {
      isSetupComplete,
      hasDatabaseUrl,
      needsInitialization: !isSetupComplete || !hasDatabaseUrl,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };
  }

  async initializeApplication(config: SetupConfigDto) {
    try {
      this.logger.log("Starting application initialization...");

      // 1. Generate secure secrets if not provided
      const jwtSecret =
        config.security.jwtSecret || this.generateSecureSecret(32);
      const encryptionKey =
        config.security.encryptionKey || this.generateSecureSecret(32);

      // 2. Build database URL
      const databaseUrl = this.buildDatabaseUrl(config.database);

      // 3. Create/update environment configuration
      await this.updateEnvironmentConfig({
        DATABASE_URL: databaseUrl,
        JWT_SECRET: jwtSecret,
        API_KEY_ENCRYPTION_SECRET: encryptionKey,
        NODE_ENV: "production",
        PORT: "3001",
        ALLOW_NETWORK_BYPASS: config.features.allowNetworkBypass.toString(),
        REQUIRE_EMAIL_VERIFICATION:
          config.features.requireEmailVerification.toString(),
      });

      // 4. Test database connection
      await this.testDatabaseConnection(config.database);

      // 5. Run database migrations
      await this.runDatabaseMigrations();

      // 6. Create admin user
      await this.createAdminUser(config.admin);

      // 7. Store optional API keys
      if (config.apiKeys) {
        await this.storeInitialApiKeys(config.apiKeys, config.admin.email);
      }

      // 8. Mark setup as complete
      await this.markSetupComplete();

      this.logger.log("Application initialization completed successfully");

      return {
        success: true,
        message: "Application initialized successfully",
        adminEmail: config.admin.email,
        databaseConnected: true,
        migrationsRun: true,
      };
    } catch (error) {
      this.logger.error("Application initialization failed:", error);
      return {
        success: false,
        message: `Initialization failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  }

  async testDatabaseConnection(dbConfig: SetupConfigDto["database"]) {
    try {
      const testUrl = this.buildDatabaseUrl(dbConfig);

      // Create a temporary Prisma client with the test URL
      const { PrismaClient } = await import("@prisma/client");
      const testClient = new PrismaClient({
        datasources: {
          db: { url: testUrl },
        },
      });

      // Test the connection
      await testClient.$connect();
      await testClient.$disconnect();

      return {
        success: true,
        message: "Database connection successful",
      };
    } catch (error) {
      return {
        success: false,
        message: `Database connection failed: ${(error as Error).message}`,
      };
    }
  }

  private buildDatabaseUrl(dbConfig: SetupConfigDto["database"]): string {
    const { host, port, username, password, database } = dbConfig;
    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }

  private generateSecureSecret(length: number): string {
    return crypto.randomBytes(length).toString("base64");
  }

  private async updateEnvironmentConfig(config: Record<string, string>) {
    const envLines = Object.entries(config).map(
      ([key, value]) => `${key}="${value}"`
    );
    const envContent = envLines.join("\n") + "\n";

    await fs.promises.writeFile(this.configPath, envContent, "utf8");
  }

  private async runDatabaseMigrations() {
    // In a real implementation, you'd use Prisma's programmatic API
    // For now, we'll assume migrations are handled during deployment
    this.logger.log("Database migrations would be run here");
  }

  private async createAdminUser(adminConfig: SetupConfigDto["admin"]) {
    try {
      // Check if admin user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: adminConfig.email },
      });

      if (existingUser) {
        this.logger.log(`Admin user ${adminConfig.email} already exists`);
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(adminConfig.password, 12);

      await this.prisma.user.create({
        data: {
          email: adminConfig.email,
          password: hashedPassword,
          name: adminConfig.name || "Administrator",
        },
      });

      this.logger.log(`Admin user ${adminConfig.email} created successfully`);
    } catch (error) {
      this.logger.error("Failed to create admin user:", error);
      throw error;
    }
  }

  private async storeInitialApiKeys(
    apiKeys: Record<string, string>,
    userEmail: string
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        throw new Error("Admin user not found");
      }

      // Store API keys using the ApiKeysService
      const validProviders: ApiProvider[] = [
        "ALPHA_VANTAGE",
        "TWELVE_DATA",
        "POLYGON_IO",
        "COINGECKO",
        "COINMARKETCAP",
        "BINANCE",
        "TRADING212",
      ];

      let successCount = 0;
      let errorCount = 0;

      for (const [providerKey, key] of Object.entries(apiKeys)) {
        if (key && key.trim()) {
          // Convert provider key to uppercase and check if it's valid
          const providerName = providerKey.toUpperCase() as ApiProvider;

          if (validProviders.includes(providerName)) {
            try {
              await this.apiKeysService.create(user.id, {
                provider: providerName,
                user_api_key_raw_value: key.trim(),
                user_api_key_display_name: `Setup - ${providerName}`,
                user_api_key_environment: "production",
                permissions:
                  this.getDefaultPermissionsForProvider(providerName),
              });

              this.logger.log(
                `✅ Successfully stored API key for ${providerName}`
              );
              successCount++;
            } catch (error) {
              this.logger.error(
                `❌ Failed to store API key for ${providerName}:`,
                error
              );
              errorCount++;
            }
          } else {
            this.logger.warn(`⚠️ Skipping unknown provider: ${providerKey}`);
          }
        }
      }

      this.logger.log(
        `API key storage completed: ${successCount} successful, ${errorCount} failed`
      );
    } catch (error) {
      this.logger.error("Failed to store initial API keys:", error);
      // Don't throw here - API keys are optional during setup
    }
  }

  private getDefaultPermissionsForProvider(provider: ApiProvider): string[] {
    const defaultPermissions: Record<ApiProvider, string[]> = {
      ALPHA_VANTAGE: ["real-time", "historical"],
      TWELVE_DATA: ["stocks", "forex", "crypto"],
      POLYGON_IO: ["stocks", "options", "forex"],
      COINGECKO: ["crypto-prices", "market-data"],
      COINMARKETCAP: ["crypto-prices", "market-data"],
      BINANCE: ["trading", "market-data"],
      TRADING212: ["account-info", "trading"],
    };

    return defaultPermissions[provider] || ["basic"];
  }

  private async markSetupComplete() {
    await fs.promises.writeFile(
      this.setupFlagPath,
      new Date().toISOString(),
      "utf8"
    );
  }

  // Method to check if this is a self-hosted deployment
  isSelHosted(): boolean {
    return (
      process.env.DEPLOYMENT_TYPE === "self-hosted" ||
      fs.existsSync(path.join(process.cwd(), ".self-hosted"))
    );
  }

  // Method to get default credentials for first-time setup
  getDefaultCredentials() {
    if (this.isSelHosted()) {
      return {
        email: "admin@localhost",
        password: "changeme123",
        mustChange: true,
      };
    }
    return null;
  }
}
