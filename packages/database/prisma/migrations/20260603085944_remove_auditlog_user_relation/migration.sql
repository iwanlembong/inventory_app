-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_userId_fkey`;

-- DropIndex
DROP INDEX `AuditLog_userId_fkey` ON `auditlog`;
