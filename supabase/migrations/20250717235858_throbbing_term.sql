/*
  # Arreglo del Sistema de Permisos de Usuario
  
  1. Verificación y creación de tablas faltantes
    - `permisos_usuario` para permisos de personal
    - `permisos_equipo` para permisos de equipo  
    - `permisos_operacion` para permisos de operación
    
  2. Verificación de columnas en usuarios
    - `permisos_completos` para usuarios admin
    
  3. Datos iniciales
    - Permisos para usuarios admin
    - Función para obtener roles permitidos
    
  4. Verificaciones de integridad
*/

-- Usar la base de datos correcta
USE plantas_concreto;

-- 1. Verificar y crear tabla permisos_usuario
CREATE TABLE IF NOT EXISTS permisos_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    rol_personal_id INT NOT NULL,
    puede_evaluar BOOLEAN DEFAULT TRUE,
    puede_ver_resultados BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_role_permission (usuario_id, rol_personal_id),
    INDEX idx_usuario_permisos (usuario_id),
    INDEX idx_rol_permisos (rol_personal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Verificar y crear tabla permisos_equipo
CREATE TABLE IF NOT EXISTS permisos_equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    puede_evaluar BOOLEAN DEFAULT TRUE,
    puede_ver_resultados BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_equipo (usuario_id),
    INDEX idx_usuario_equipo (usuario_id),
    INDEX idx_puede_evaluar_equipo (puede_evaluar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Verificar y crear tabla permisos_operacion
CREATE TABLE IF NOT EXISTS permisos_operacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    puede_evaluar BOOLEAN DEFAULT TRUE,
    puede_ver_resultados BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_operacion (usuario_id),
    INDEX idx_usuario_operacion (usuario_id),
    INDEX idx_puede_evaluar_operacion (puede_evaluar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Verificar y agregar columna permisos_completos a usuarios
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

-- 5. Actualizar usuarios admin para que tengan permisos completos
UPDATE usuarios 
SET permisos_completos = TRUE 
WHERE rol = 'admin';

-- 6. Insertar permisos para usuarios admin en todas las tablas
INSERT IGNORE INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

INSERT IGNORE INTO permisos_operacion (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE rol = 'admin';

-- 7. Asignar permisos de personal para todos los roles a usuarios admin
INSERT IGNORE INTO permisos_usuario (usuario_id, rol_personal_id, puede_evaluar, puede_ver_resultados)
SELECT u.id, rp.id, TRUE, TRUE
FROM usuarios u
CROSS JOIN roles_personal rp
WHERE u.rol = 'admin' AND rp.activo = 1;

-- 8. Crear usuarios de prueba con permisos limitados
INSERT IGNORE INTO usuarios (username, password_hash, nombre_completo, email, rol, permisos_completos, activo) VALUES
('evaluador1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Evaluador Jefe Planta', 'evaluador1@imcyc.org', 'evaluador', FALSE, TRUE),
('evaluador2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Evaluador Equipo', 'evaluador2@imcyc.org', 'evaluador', FALSE, TRUE),
('evaluador3', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Evaluador Operación', 'evaluador3@imcyc.org', 'evaluador', FALSE, TRUE);

-- 9. Asignar permisos específicos a usuarios de prueba
-- evaluador1: solo jefe de planta
INSERT IGNORE INTO permisos_usuario (usuario_id, rol_personal_id, puede_evaluar, puede_ver_resultados)
SELECT u.id, rp.id, TRUE, TRUE
FROM usuarios u, roles_personal rp
WHERE u.username = 'evaluador1'
  AND rp.codigo = 'jefe_planta'
  AND rp.activo = 1;

-- evaluador2: solo equipo
INSERT IGNORE INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE username = 'evaluador2';

-- evaluador3: solo operación
INSERT IGNORE INTO permisos_operacion (usuario_id, puede_evaluar, puede_ver_resultados)
SELECT id, TRUE, TRUE
FROM usuarios 
WHERE username = 'evaluador3';

-- 10. Recrear función para obtener roles permitidos
DROP FUNCTION IF EXISTS ObtenerRolesPermitidos;

DELIMITER //
CREATE FUNCTION ObtenerRolesPermitidos(p_usuario_id INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_roles_json JSON;
    
    -- Verificar si el usuario existe y tiene permisos completos
    SELECT COALESCE(permisos_completos, FALSE) INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id AND activo = 1;
    
    -- Si tiene permisos completos, devolver todos los roles
    IF v_permisos_completos = TRUE THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', rp.id,
                'codigo', rp.codigo,
                'nombre', rp.nombre,
                'descripcion', COALESCE(rp.descripcion, ''),
                'puede_evaluar', TRUE,
                'puede_ver_resultados', TRUE
            )
        ) INTO v_roles_json
        FROM roles_personal rp
        WHERE rp.activo = 1
        ORDER BY rp.nombre;
    ELSE
        -- Si no tiene permisos completos, devolver solo los roles permitidos
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', rp.id,
                'codigo', rp.codigo,
                'nombre', rp.nombre,
                'descripcion', COALESCE(rp.descripcion, ''),
                'puede_evaluar', pu.puede_evaluar,
                'puede_ver_resultados', pu.puede_ver_resultados
            )
        ) INTO v_roles_json
        FROM permisos_usuario pu
        JOIN roles_personal rp ON pu.rol_personal_id = rp.id
        WHERE pu.usuario_id = p_usuario_id 
          AND rp.activo = 1
          AND pu.puede_evaluar = TRUE
        ORDER BY rp.nombre;
    END IF;
    
    RETURN COALESCE(v_roles_json, JSON_ARRAY());
END //
DELIMITER ;

-- 11. Crear función para verificar permisos de equipo
DROP FUNCTION IF EXISTS UsuarioPuedeEvaluarEquipo;

DELIMITER //
CREATE FUNCTION UsuarioPuedeEvaluarEquipo(p_usuario_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_puede_evaluar BOOLEAN DEFAULT FALSE;
    
    -- Verificar si el usuario tiene permisos completos
    SELECT COALESCE(permisos_completos, FALSE) INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id AND activo = 1;
    
    -- Si tiene permisos completos, puede evaluar
    IF v_permisos_completos = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permisos específicos de equipo
    SELECT COALESCE(puede_evaluar, FALSE) INTO v_puede_evaluar
    FROM permisos_equipo 
    WHERE usuario_id = p_usuario_id;
    
    RETURN v_puede_evaluar;
END //
DELIMITER ;

-- 12. Crear función para verificar permisos de operación
DROP FUNCTION IF EXISTS UsuarioPuedeEvaluarOperacion;

DELIMITER //
CREATE FUNCTION UsuarioPuedeEvaluarOperacion(p_usuario_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_puede_evaluar BOOLEAN DEFAULT FALSE;
    
    -- Verificar si el usuario tiene permisos completos
    SELECT COALESCE(permisos_completos, FALSE) INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id AND activo = 1;
    
    -- Si tiene permisos completos, puede evaluar
    IF v_permisos_completos = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permisos específicos de operación
    SELECT COALESCE(puede_evaluar, FALSE) INTO v_puede_evaluar
    FROM permisos_operacion 
    WHERE usuario_id = p_usuario_id;
    
    RETURN v_puede_evaluar;
END //
DELIMITER ;

-- 13. Verificaciones finales
SELECT 'Sistema de permisos configurado correctamente' as status;

SELECT 
    (SELECT COUNT(*) FROM permisos_usuario) as permisos_personal,
    (SELECT COUNT(*) FROM permisos_equipo) as permisos_equipo,
    (SELECT COUNT(*) FROM permisos_operacion) as permisos_operacion,
    (SELECT COUNT(*) FROM usuarios WHERE permisos_completos = TRUE) as usuarios_admin;

-- Mostrar usuarios y sus permisos
SELECT 
    u.username,
    u.nombre_completo,
    u.rol,
    u.permisos_completos,
    (SELECT COUNT(*) FROM permisos_usuario pu WHERE pu.usuario_id = u.id) as roles_personal,
    (SELECT COUNT(*) FROM permisos_equipo pe WHERE pe.usuario_id = u.id) as tiene_equipo,
    (SELECT COUNT(*) FROM permisos_operacion po WHERE po.usuario_id = u.id) as tiene_operacion
FROM usuarios u
WHERE u.activo = 1
ORDER BY u.rol, u.username;