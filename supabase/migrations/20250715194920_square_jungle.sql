-- Migración para crear tablas de permisos faltantes
-- IMCYC - Sistema de Evaluación de Plantas de Concreto

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
);

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
);

-- Verificar que la tabla usuarios tenga la columna permisos_completos
-- Si no existe, agregarla
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
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

-- Insertar permisos de ejemplo para usuarios existentes (opcional)
-- Esto dará permisos de equipo y operación a todos los usuarios admin
INSERT IGNORE INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

INSERT IGNORE INTO permisos_operacion (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

-- Crear vista para consultar todos los permisos de un usuario
CREATE OR REPLACE VIEW vista_permisos_completos AS
SELECT 
    u.id as usuario_id,
    u.username,
    u.nombre_completo,
    u.rol as rol_sistema,
    u.permisos_completos,
    
    -- Permisos de personal (contar roles)
    COUNT(DISTINCT pu.rol_personal_id) as total_roles_personal,
    
    -- Permisos de equipo
    COALESCE(pe.puede_evaluar, FALSE) as puede_evaluar_equipo,
    COALESCE(pe.puede_ver_resultados, FALSE) as puede_ver_resultados_equipo,
    
    -- Permisos de operación
    COALESCE(po.puede_evaluar, FALSE) as puede_evaluar_operacion,
    COALESCE(po.puede_ver_resultados, FALSE) as puede_ver_resultados_operacion,
    
    -- Estadísticas generales
    (COUNT(DISTINCT pu.rol_personal_id) + 
     COALESCE(pe.puede_evaluar, 0) + 
     COALESCE(po.puede_evaluar, 0)) as total_permisos_activos
     
FROM usuarios u
LEFT JOIN permisos_usuario pu ON u.id = pu.usuario_id AND pu.puede_evaluar = TRUE
LEFT JOIN permisos_equipo pe ON u.id = pe.usuario_id
LEFT JOIN permisos_operacion po ON u.id = po.usuario_id
WHERE u.activo = 1
GROUP BY 
    u.id, u.username, u.nombre_completo, u.rol, u.permisos_completos,
    pe.puede_evaluar, pe.puede_ver_resultados,
    po.puede_evaluar, po.puede_ver_resultados
ORDER BY u.username;

-- Función para obtener resumen de permisos de un usuario
DELIMITER //
CREATE FUNCTION IF NOT EXISTS ObtenerResumenPermisos(p_usuario_id INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_total_personal INT DEFAULT 0;
    DECLARE v_puede_equipo BOOLEAN DEFAULT FALSE;
    DECLARE v_puede_operacion BOOLEAN DEFAULT FALSE;
    DECLARE v_resumen JSON;
    
    -- Verificar permisos completos
    SELECT permisos_completos INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id;
    
    -- Si tiene permisos completos, devolver todo habilitado
    IF v_permisos_completos = TRUE THEN
        SET v_resumen = JSON_OBJECT(
            'permisos_completos', TRUE,
            'personal', (SELECT COUNT(*) FROM roles_personal WHERE activo = 1),
            'equipo', TRUE,
            'operacion', TRUE,
            'total_permisos', 999
        );
    ELSE
        -- Contar permisos específicos
        SELECT COUNT(*) INTO v_total_personal
        FROM permisos_usuario 
        WHERE usuario_id = p_usuario_id AND puede_evaluar = TRUE;
        
        SELECT COALESCE(puede_evaluar, FALSE) INTO v_puede_equipo
        FROM permisos_equipo 
        WHERE usuario_id = p_usuario_id;
        
        SELECT COALESCE(puede_evaluar, FALSE) INTO v_puede_operacion
        FROM permisos_operacion 
        WHERE usuario_id = p_usuario_id;
        
        SET v_resumen = JSON_OBJECT(
            'permisos_completos', FALSE,
            'personal', v_total_personal,
            'equipo', v_puede_equipo,
            'operacion', v_puede_operacion,
            'total_permisos', v_total_personal + IF(v_puede_equipo, 1, 0) + IF(v_puede_operacion, 1, 0)
        );
    END IF;
    
    RETURN v_resumen;
END //
DELIMITER ;

-- Comentarios finales
-- Esta migración crea las tablas faltantes para el sistema de permisos expandido
-- Incluye permisos para evaluaciones de equipo y operación
-- Mantiene compatibilidad con el sistema existente de permisos de personal
-- Agrega funciones y vistas para facilitar las consultas de permisos