-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "subscriptionTier" TEXT,
ADD COLUMN     "trialEndDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."PasswordSetupToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordSetupToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateLimitRule" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT,
    "method" TEXT,
    "maxAttempts" INTEGER NOT NULL,
    "windowMs" INTEGER NOT NULL,
    "blockDurationMs" INTEGER NOT NULL,
    "skipIps" TEXT[],
    "skipUserIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateLimitEvent" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedUntil" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BotDetectionEvent" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "detectionType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "details" JSONB,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "headers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotDetectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordSetupToken_token_key" ON "public"."PasswordSetupToken"("token");

-- CreateIndex
CREATE INDEX "PasswordSetupToken_token_idx" ON "public"."PasswordSetupToken"("token");

-- CreateIndex
CREATE INDEX "PasswordSetupToken_userId_idx" ON "public"."PasswordSetupToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordSetupToken_expiresAt_idx" ON "public"."PasswordSetupToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitRule_isActive_idx" ON "public"."RateLimitRule"("isActive");

-- CreateIndex
CREATE INDEX "RateLimitRule_endpoint_idx" ON "public"."RateLimitRule"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitRule_endpoint_method_key" ON "public"."RateLimitRule"("endpoint", "method");

-- CreateIndex
CREATE INDEX "RateLimitEvent_identifier_endpoint_method_createdAt_idx" ON "public"."RateLimitEvent"("identifier", "endpoint", "method", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitEvent_identifier_blocked_blockedUntil_idx" ON "public"."RateLimitEvent"("identifier", "blocked", "blockedUntil");

-- CreateIndex
CREATE INDEX "RateLimitEvent_createdAt_idx" ON "public"."RateLimitEvent"("createdAt");

-- CreateIndex
CREATE INDEX "RateLimitEvent_blocked_blockedUntil_idx" ON "public"."RateLimitEvent"("blocked", "blockedUntil");

-- CreateIndex
CREATE INDEX "BotDetectionEvent_identifier_detectionType_createdAt_idx" ON "public"."BotDetectionEvent"("identifier", "detectionType", "createdAt");

-- CreateIndex
CREATE INDEX "BotDetectionEvent_score_blocked_idx" ON "public"."BotDetectionEvent"("score", "blocked");

-- CreateIndex
CREATE INDEX "BotDetectionEvent_createdAt_idx" ON "public"."BotDetectionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "BotDetectionEvent_identifier_blocked_idx" ON "public"."BotDetectionEvent"("identifier", "blocked");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "public"."User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "public"."User"("subscriptionId");

-- AddForeignKey
ALTER TABLE "public"."PasswordSetupToken" ADD CONSTRAINT "PasswordSetupToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

