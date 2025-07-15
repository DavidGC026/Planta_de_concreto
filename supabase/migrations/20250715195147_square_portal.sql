-- Script para crear las tablas de permisos faltantes
-- IMCYC - Sistema de Evaluación de Plantas de Concreto

USE plantas_concreto;

-- Crear tabla para permisos de equipo
CREATE TABLE IF NOT EXISTS permisos_equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    puede_evaluar BOOLEAN DEFAULT TRUE,
    puede_ver_resultados BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índice único para evitar duplicados
    UNIQUE KEY unique_user_equipo (usuario_id),
    
    -- Índices para consultas rápidas
    INDEX idx_usuario_equipo (usuario_id),
    INDEX idx_puede_evaluar_equipo (puede_evaluar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para permisos de operación
CREATE TABLE IF NOT EXISTS permisos_operacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    puede_evaluar BOOLEAN DEFAULT TRUE,
    puede_ver_resultados BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índice único para evitar duplicados
    UNIQUE KEY unique_user_operacion (usuario_id),
    
    -- Índices para consultas rápidas
    INDEX idx_usuario_operacion (usuario_id),
    INDEX idx_puede_evaluar_operacion (puede_evaluar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar que la tabla usuarios tenga la columna permisos_completos
-- Si no existe, agregarla
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = 'plantas_concreto'
    AND table_name = 'usuarios'
    AND column_name = 'permisos_completos'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE usuarios ADD COLUMN permisos_completos BOOLEAN DEFAULT FALSE COMMENT "Si TRUE, el usuario puede acceder a todos los roles sin restricciones"',
    'SELECT "Column permisos_completos already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar usuarios admin para que tengan permisos completos
UPDATE usuarios 
SET permisos_completos = TRUE 
WHERE rol = 'admin' AND (permisos_completos IS NULL OR permisos_completos = FALSE);

-- Insertar permisos de ejemplo para usuarios admin existentes
INSERT IGNORE INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

INSERT IGNORE INTO permisos_operacion (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

-- Verificar que las tablas se crearon correctamente
SELECT 'Tablas creadas exitosamente' as status;
SELECT COUNT(*) as usuarios_con_permisos_equipo FROM permisos_equipo;
SELECT COUNT(*) as usuarios_con_permisos_operacion FROM permisos_operacion;