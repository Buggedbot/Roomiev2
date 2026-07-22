-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('HAS_ROOM', 'NEEDS_ROOM');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "listingType" "ListingType";
