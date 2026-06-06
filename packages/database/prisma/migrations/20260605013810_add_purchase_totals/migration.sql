/*
  Warnings:

  - Added the required column `subtotal` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `purchase` ADD COLUMN `discount` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `subtotal` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `tax` DECIMAL(5, 2) NOT NULL DEFAULT 0;
