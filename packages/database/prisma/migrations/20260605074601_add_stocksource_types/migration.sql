-- AlterTable
ALTER TABLE `stockmovement` ADD COLUMN `sourceId` INTEGER NULL,
    ADD COLUMN `sourceType` ENUM('PURCHASE', 'SALE', 'ADJUSTMENT') NOT NULL DEFAULT 'ADJUSTMENT';

-- CreateIndex
CREATE INDEX `StockMovement_tenantId_productId_idx` ON `StockMovement`(`tenantId`, `productId`);

-- CreateIndex
CREATE INDEX `StockMovement_sourceType_sourceId_idx` ON `StockMovement`(`sourceType`, `sourceId`);
