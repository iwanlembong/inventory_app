/*
  Warnings:

  - You are about to alter the column `createdBy` on the `expense` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `expense` MODIFY `createdBy` INTEGER NULL;
