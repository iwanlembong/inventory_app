-- CreateTable
CREATE TABLE `InvoiceSequence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `prefix` VARCHAR(191) NOT NULL,
    `dateKey` VARCHAR(191) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InvoiceSequence_tenantId_prefix_dateKey_sequence_key`(`tenantId`, `prefix`, `dateKey`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
