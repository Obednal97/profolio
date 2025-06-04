import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { PrismaService } from "@/common/prisma.service";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    allowedHeaders: ["Content-Type", "Authorization"],
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

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 Backend running on http://localhost:${port}`);

  if (process.env.NODE_ENV === "production") {
    console.log(
      `🔒 CORS origins: ${
        Array.isArray(corsOrigins) ? corsOrigins.join(", ") : corsOrigins
      }`
    );
  }
}
bootstrap();
