/*
  Warnings:

  - Made the column `userId` on table `stockmovement` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `stockmovement` DROP FOREIGN KEY `StockMovement_userId_fkey`;

-- DropIndex
DROP INDEX `StockMovement_userId_fkey` ON `stockmovement`;

-- AlterTable
ALTER TABLE `stockmovement` MODIFY `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
