import { NestFactory } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "@/app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

/**
 * Builds and configures the Nest application without starting a listener.
 *
 * Split out of main.ts so the same configuration is used by both entry points:
 * the standalone server (main.ts, used by Docker and self-hosting) and the
 * serverless handler (api/index.ts, used on Vercel). Previously this lived
 * inline in bootstrap(), so a serverless entry point would have had to
 * duplicate the CORS, helmet, validation and prefix setup - and drift from it.
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  // Enable CORS with proper production configuration
  const corsOrigins =
    process.env.NODE_ENV === "production"
      ? (
          process.env.CORS_ORIGINS ||
          process.env.FRONTEND_URL ||
          "http://localhost:3000"
        ).split(",")
      : true;

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  });

  // Apply security headers
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
    })
  );

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global prefix
  app.setGlobalPrefix("api");

  // Swagger setup (only in development)
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Profolio API")
      .setDescription("API for managing users, assets, and liabilities")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);
  }

  return app;
}

/** The CORS origins actually in effect, for startup logging. */
export function resolvedCorsOrigins(): string {
  if (process.env.NODE_ENV !== "production") return "all (development)";
  return (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  );
}
