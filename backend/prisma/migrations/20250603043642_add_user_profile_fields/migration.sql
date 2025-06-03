-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "lastSignIn" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoURL" TEXT,
ADD COLUMN     "preferredCurrency" TEXT DEFAULT 'USD',
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "theme" TEXT DEFAULT 'system',
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC';
