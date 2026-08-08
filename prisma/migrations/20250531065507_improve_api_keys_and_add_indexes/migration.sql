/*
  Warnings:

  - You are about to drop the column `encryptedKey` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `keyName` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsed` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `rateLimitHit` on the `ApiKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,provider,user_api_key_display_name]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_api_key_display_name` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_api_key_encrypted_value` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_userId_fkey";

-- DropIndex
DROP INDEX "ApiKey_userId_provider_keyName_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "encryptedKey",
DROP COLUMN "keyName",
DROP COLUMN "lastUsed",
DROP COLUMN "rateLimitHit",
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rateLimitInfo" JSONB,
ADD COLUMN     "testResult" TEXT,
ADD COLUMN     "testedAt" TIMESTAMP(3),
ADD COLUMN     "user_api_key_display_name" TEXT NOT NULL,
ADD COLUMN     "user_api_key_encrypted_value" TEXT NOT NULL,
ADD COLUMN     "user_api_key_environment" TEXT NOT NULL DEFAULT 'production',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_userId_provider_user_api_key_display_name_key" ON "ApiKey"("userId", "provider", "user_api_key_display_name");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
