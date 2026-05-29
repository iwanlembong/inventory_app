-- AlterTable
ALTER TABLE `stockmovement` ADD COLUMN `afterStock` INTEGER NULL,
    ADD COLUMN `beforeStock` INTEGER NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
