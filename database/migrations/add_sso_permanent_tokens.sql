-- Migración: Tabla para tokens permanentes de SSO y columna de expiración
-- Ejecutar en MySQL/MariaDB. Es idempotente (segura para ejecuciones repetidas).

START TRANSACTION;

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS `sso_permanent_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `token` VARCHAR(128) NOT NULL,
  `page_slug` VARCHAR(150) NOT NULL,
  `tipo_evaluacion` VARCHAR(50) DEFAULT NULL,
  `activo` TINYINT(1) DEFAULT 1,
  `fecha_creacion` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token` (`token`),
  KEY `idx_page_slug` (`page_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asegurar columna expires_at si la tabla ya existía sin dicha columna
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sso_permanent_tokens'
    AND COLUMN_NAME = 'expires_at'
);
SET @ddl := IF(@has_col = 0,
  'ALTER TABLE `sso_permanent_tokens` ADD COLUMN `expires_at` TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Asegurar índice único en token
SET @has_unique := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sso_permanent_tokens'
    AND INDEX_NAME = 'unique_token'
);
SET @ddl2 := IF(@has_unique = 0,
  'ALTER TABLE `sso_permanent_tokens` ADD UNIQUE KEY `unique_token` (`token`)',
  'SELECT 1'
);
PREPARE stmt2 FROM @ddl2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

COMMIT;


