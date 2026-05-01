-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "adjustmentPhaseConfig" JSONB,
ADD COLUMN     "playoffBracketSize" INTEGER,
ADD COLUMN     "requiresAdjustment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tournamentStructure" TEXT;
