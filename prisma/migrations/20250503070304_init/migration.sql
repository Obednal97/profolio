/*
  Warnings:

  - You are about to alter the column `quantity` on the `Asset` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `valueOverride` on the `Asset` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `balance` on the `Liability` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `interestRate` on the `Liability` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `taxRate` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Changed the type of `type` on the `Asset` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('CRYPTO', 'STOCK', 'PROPERTY', 'EQUITY', 'OTHER');

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "type",
ADD COLUMN     "type" "AssetType" NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER,
ALTER COLUMN "valueOverride" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Liability" ALTER COLUMN "balance" SET DATA TYPE INTEGER,
ALTER COLUMN "interestRate" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "taxRate" SET DATA TYPE INTEGER;
