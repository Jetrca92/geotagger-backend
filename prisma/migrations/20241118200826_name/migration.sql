/*
  Warnings:

  - Added the required column `address` to the `Guess` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guess" ADD COLUMN     "address" TEXT NOT NULL;
