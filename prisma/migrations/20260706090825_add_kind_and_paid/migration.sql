-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('LAUNDRY', 'SNOOKER', 'LUMP_SUM');

-- AlterTable
ALTER TABLE "CollectionSession" ADD COLUMN     "kind" "SessionKind" NOT NULL DEFAULT 'LAUNDRY',
ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;
