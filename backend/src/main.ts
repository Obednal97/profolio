import "dotenv/config";
import { config } from "dotenv";
import { createApp, resolvedCorsOrigins } from "@/create-app";
config();

/**
 * Standalone server entry point, used by Docker and self-hosted installs.
 * The serverless deployment uses api/index.ts instead, which shares the same
 * createApp() configuration.
 */
async function bootstrap() {
  const app = await createApp();

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 Backend running on http://localhost:${port}`);

  if (process.env.NODE_ENV === "production") {
    console.log(`🔒 CORS origins: ${resolvedCorsOrigins()}`);
  }
}
bootstrap();
