-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'INTERMEDIATE';
ALTER TYPE "Category" ADD VALUE 'BEGINNER';

-- AlterEnum
ALTER TYPE "Discipline" ADD VALUE 'THREE_BAND_ANNUAL';

-- AlterTable
ALTER TABLE "TournamentRegistration" ADD COLUMN     "turnAvailability" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "turnPreference" TEXT;
