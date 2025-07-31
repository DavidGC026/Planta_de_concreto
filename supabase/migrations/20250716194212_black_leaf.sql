-- Script para crear las tablas de permisos faltantes
-- IMCYC - Sistema de Evaluación de Plantas de Concreto
-- Ejecutar este script directamente en MySQL

USE plantas_concreto;

-- Verificar si la columna permisos_completos existe en usuarios
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = 'plantas_concreto'
    AND table_name = 'usuarios'
    AND column_name = 'permisos_completos'
);

-- Agregar columna permisos_completos si no existe
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE usuarios ADD COLUMN permisos_completos BOOLEAN DEFAULT FALSE COMMENT "Si TRUE, el usuario puede acceder a todos los roles sin restricciones"',
    'SELECT "Column permisos_completos already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla para permisos de usuario (personal) si no existe
CREATE TABLE IF NOT EXISTS permisos_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    rol_personal_id INT NOT NULL,
    puede_evaluar BOOLEAN DEFAULT TRUE,
    puede_ver_resultados BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE CASCADE,
    
    -- Índice único para evitar duplicados
    UNIQUE KEY unique_user_role_permission (usuario_id, rol_personal_id),
    
    -- Índices para consultas rápidas
    INDEX idx_usuario_permisos (usuario_id),
    INDEX idx_rol_permisos (rol_personal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Actualizar usuarios admin para que tengan permisos completos
UPDATE usuarios 
SET permisos_completos = TRUE 
WHERE rol = 'admin';

-- Insertar permisos de ejemplo para usuarios admin existentes
INSERT IGNORE INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

INSERT IGNORE INTO permisos_operacion (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

-- Asignar permisos de personal para jefe de planta a usuarios admin
INSERT IGNORE INTO permisos_usuario (usuario_id, rol_personal_id, puede_evaluar, puede_ver_resultados)
SELECT u.id, rp.id, TRUE, TRUE
FROM usuarios u, roles_personal rp
WHERE u.rol = 'admin'
  AND rp.codigo = 'jefe_planta';

-- Crear función para obtener roles permitidos
DELIMITER //
DROP FUNCTION IF EXISTS ObtenerRolesPermitidos //
CREATE FUNCTION ObtenerRolesPermitidos(p_usuario_id INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_roles_json JSON;
    
    -- Verificar si el usuario tiene permisos completos
    SELECT COALESCE(permisos_completos, FALSE) INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id;
    
    -- Si tiene permisos completos, devolver todos los roles
    IF v_permisos_completos = TRUE THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', rp.id,
                'codigo', rp.codigo,
                'nombre', rp.nombre,
                'descripcion', rp.descripcion,
                'puede_evaluar', TRUE,
                'puede_ver_resultados', TRUE
            )
        ) INTO v_roles_json
        FROM roles_personal rp
        WHERE rp.activo = 1;
    ELSE
        -- Si no tiene permisos completos, devolver solo los roles permitidos
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', rp.id,
                'codigo', rp.codigo,
                'nombre', rp.nombre,
                'descripcion', rp.descripcion,
                'puede_evaluar', pu.puede_evaluar,
                'puede_ver_resultados', pu.puede_ver_resultados
            )
        ) INTO v_roles_json
        FROM permisos_usuario pu
        JOIN roles_personal rp ON pu.rol_personal_id = rp.id
        WHERE pu.usuario_id = p_usuario_id 
          AND rp.activo = 1
          AND pu.puede_evaluar = TRUE;
    END IF;
    
    RETURN COALESCE(v_roles_json, JSON_ARRAY());
END //
DELIMITER ;

-- Verificar que las tablas se crearon correctamente
SELECT 'Verificando tablas creadas...' as status;

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'permisos_usuario: OK'
        ELSE 'permisos_usuario: ERROR'
    END as tabla_permisos_usuario
FROM information_schema.tables 
WHERE table_schema = 'plantas_concreto' AND table_name = 'permisos_usuario';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'permisos_equipo: OK'
        ELSE 'permisos_equipo: ERROR'
    END as tabla_permisos_equipo
FROM information_schema.tables 
WHERE table_schema = 'plantas_concreto' AND table_name = 'permisos_equipo';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'permisos_operacion: OK'
        ELSE 'permisos_operacion: ERROR'
    END as tabla_permisos_operacion
FROM information_schema.tables 
WHERE table_schema = 'plantas_concreto' AND table_name = 'permisos_operacion';

-- Mostrar estadísticas
SELECT COUNT(*) as usuarios_con_permisos_equipo FROM permisos_equipo;
SELECT COUNT(*) as usuarios_con_permisos_operacion FROM permisos_operacion;
SELECT COUNT(*) as usuarios_con_permisos_personal FROM permisos_usuario;

SELECT 'Script ejecutado exitosamente' as resultado;