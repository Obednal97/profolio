-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE 'BOND';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "symbol" TEXT;

-- CreateTable
CREATE TABLE "Settings" (
    "userId" TEXT NOT NULL,
    "theme" TEXT,
    "currency" TEXT,
    "timezone" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
