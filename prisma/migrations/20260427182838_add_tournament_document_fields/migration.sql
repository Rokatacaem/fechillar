/*
  Warnings:

  - You are about to drop the column `primaryColor` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryColor` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `innings` on the `Match` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicSlug]` on the table `PlayerProfile` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `category` on the `Ranking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Tournament` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('MASTER', 'HONOR', 'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH_A', 'FIFTH_B', 'SENIOR', 'FEMALE', 'PROMO');

-- CreateEnum
CREATE TYPE "ClubMembershipStatus" AS ENUM ('VIGENTE', 'MOROSO', 'RETIRADO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "ClubBoardRole" AS ENUM ('PRESIDENTE', 'VICEPRESIDENTE', 'SECRETARIO', 'TESORERO', 'DIRECTOR', 'DELEGADO_DEPORTIVO');

-- ALTER TYPE "Discipline" ADD VALUE 'POOL_CHILENO';
-- ALTER TYPE "Discipline" ADD VALUE 'HAYBALL';
-- ALTER TYPE "Discipline" ADD VALUE 'SNOOKER';
-- ALTER TYPE "Discipline" ADD VALUE 'POOL_ABIERTO';
-- ALTER TYPE "Discipline" ADD VALUE 'BUCHACAS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


-- ALTER TYPE "TournamentStatus" ADD VALUE 'DRAFT';
-- ALTER TYPE "TournamentStatus" ADD VALUE 'UPCOMING';

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_homePlayerId_fkey";

-- AlterTable
ALTER TABLE "Club" DROP COLUMN "primaryColor",
DROP COLUMN "secondaryColor",
ADD COLUMN     "accentColor" TEXT DEFAULT '#10b981',
ADD COLUMN     "brandColor" TEXT DEFAULT '#0f2040',
ADD COLUMN     "certificateUrl" TEXT,
ADD COLUMN     "foundedDate" TIMESTAMP(3),
ADD COLUMN     "infrastructure" JSONB,
ADD COLUMN     "legalExpiryDate" TIMESTAMP(3),
ADD COLUMN     "membershipStatus" "ClubMembershipStatus" NOT NULL DEFAULT 'VIGENTE';

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "innings",
ADD COLUMN     "hasEqualizingInning" BOOLEAN,
ADD COLUMN     "phaseId" TEXT,
ADD COLUMN     "refereeName" TEXT,
ALTER COLUMN "homePlayerId" DROP NOT NULL,
ALTER COLUMN "homeScore" SET DEFAULT 0,
ALTER COLUMN "awayScore" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "lastAmount" DOUBLE PRECISION,
ALTER COLUMN "amount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "averageBase" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "publicSlug" TEXT NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Ranking" ADD COLUMN     "handicapTarget" INTEGER DEFAULT 15,
DROP COLUMN "category",
ADD COLUMN     "category" "Category" NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "bankAccountEmail" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankAccountRut" TEXT,
ADD COLUMN     "bankAccountType" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "config" JSONB,
ADD COLUMN     "distanceFinal" INTEGER DEFAULT 30,
ADD COLUMN     "distanceGroups" INTEGER DEFAULT 25,
ADD COLUMN     "distancePlayoffs" INTEGER DEFAULT 25,
ADD COLUMN     "extensionsPerPlayer" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "finalUnlimitedInnings" BOOLEAN DEFAULT true,
ADD COLUMN     "groupFormat" TEXT,
ADD COLUMN     "groupsPublishDate" TIMESTAMP(3),
ADD COLUMN     "hasTimeLimit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxCapacity" INTEGER,
ADD COLUMN     "maxTables" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "playersPerTable" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "prizeDistribution" JSONB,
ADD COLUMN     "registrationContact" TEXT,
ADD COLUMN     "registrationDeadline" TIMESTAMP(3),
ADD COLUMN     "registrationFee" INTEGER DEFAULT 30000,
ADD COLUMN     "registrationPhone" TEXT,
ADD COLUMN     "scheduleDay1Start" TEXT,
ADD COLUMN     "scheduleDay2Start" TEXT,
ADD COLUMN     "secondsPerShot" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "venue" TEXT,
ADD COLUMN     "venueClubId" TEXT,
ADD COLUMN     "venueLogoUrl" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "Category" NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "TournamentGroup" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TournamentRegistration" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "groupOrder" INTEGER DEFAULT 0,
ADD COLUMN     "isWaitingList" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "registeredHandicap" INTEGER DEFAULT 30;

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ClubBoardRole" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distribution" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentPhase" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "hasEqualizingInning" BOOLEAN NOT NULL DEFAULT true,
    "inningLimit" INTEGER DEFAULT 30,

    CONSTRAINT "TournamentPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitingList" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "category" "Category" NOT NULL,
    "points" INTEGER NOT NULL,
    "rankPosition" INTEGER NOT NULL,
    "average" DOUBLE PRECISION,
    "powerScore" DOUBLE PRECISION,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RankingSnapshot_playerId_snapshotDate_idx" ON "RankingSnapshot"("playerId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_publicSlug_key" ON "PlayerProfile"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_playerId_discipline_category_key" ON "Ranking"("playerId", "discipline", "category");

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_venueClubId_fkey" FOREIGN KEY ("venueClubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPhase" ADD CONSTRAINT "TournamentPhase_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homePlayerId_fkey" FOREIGN KEY ("homePlayerId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "TournamentPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
