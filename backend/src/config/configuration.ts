export default () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  external: {
    cryptoApiKey: process.env.CRYPTO_API_KEY,
    stockApiKey: process.env.STOCK_API_KEY,
  },
});
