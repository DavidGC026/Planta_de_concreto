/*
  # Sistema de Permisos de Usuario

  1. Nuevas Tablas
    - `permisos_usuario`
      - `id` (int, primary key)
      - `usuario_id` (int, foreign key)
      - `rol_personal_id` (int, foreign key)
      - `puede_evaluar` (boolean)
      - `fecha_creacion` (timestamp)

  2. Datos de ejemplo
    - Usuarios con permisos específicos para jefe de planta únicamente

  3. Funciones
    - Función para verificar permisos de usuario
    - Función para asignar permisos a usuario
*/

-- Crear tabla para permisos específicos de usuario
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
);

-- Agregar campo para indicar si el usuario tiene permisos completos (admin)
ALTER TABLE usuarios 
ADD COLUMN permisos_completos BOOLEAN DEFAULT FALSE COMMENT 'Si TRUE, el usuario puede acceder a todos los roles sin restricciones';

-- Actualizar usuarios existentes para que tengan permisos completos
UPDATE usuarios SET permisos_completos = TRUE WHERE rol = 'admin';

-- Crear usuarios de ejemplo con permisos limitados
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, permisos_completos) VALUES
('evaluador1', '$2y$10$HRryB93eIfGqmccxtfQM.e9GlNm9ipoVDnUCczr1WDRzyYAIFaP.W', 'Evaluador Jefe Planta 1', 'evaluador1@imcyc.org', 'evaluador', FALSE),
('evaluador2', '$2y$10$HRryB93eIfGqmccxtfQM.e9GlNm9ipoVDnUCczr1WDRzyYAIFaP.W', 'Evaluador Jefe Planta 2', 'evaluador2@imcyc.org', 'evaluador', FALSE),
('evaluador3', '$2y$10$HRryB93eIfGqmccxtfQM.e9GlNm9ipoVDnUCczr1WDRzyYAIFaP.W', 'Evaluador Jefe Planta 3', 'evaluador3@imcyc.org', 'evaluador', FALSE);

-- Asignar permisos específicos para jefe de planta únicamente
INSERT INTO permisos_usuario (usuario_id, rol_personal_id, puede_evaluar, puede_ver_resultados)
SELECT u.id, rp.id, TRUE, TRUE
FROM usuarios u, roles_personal rp
WHERE u.username IN ('evaluador1', 'evaluador2', 'evaluador3')
  AND rp.codigo = 'jefe_planta';

-- Función para obtener roles permitidos para un usuario
DELIMITER //
CREATE FUNCTION IF NOT EXISTS ObtenerRolesPermitidos(p_usuario_id INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_roles_json JSON;
    
    -- Verificar si el usuario tiene permisos completos
    SELECT permisos_completos INTO v_permisos_completos
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

-- Función para verificar si un usuario puede evaluar un rol específico
DELIMITER //
CREATE FUNCTION IF NOT EXISTS UsuarioPuedeEvaluarRol(p_usuario_id INT, p_rol_codigo VARCHAR(50))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_puede_evaluar BOOLEAN DEFAULT FALSE;
    DECLARE v_rol_id INT;
    
    -- Verificar si el usuario tiene permisos completos
    SELECT permisos_completos INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id;
    
    -- Si tiene permisos completos, puede evaluar cualquier rol
    IF v_permisos_completos = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- Obtener ID del rol
    SELECT id INTO v_rol_id
    FROM roles_personal 
    WHERE codigo = p_rol_codigo AND activo = 1;
    
    IF v_rol_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar permisos específicos
    SELECT puede_evaluar INTO v_puede_evaluar
    FROM permisos_usuario 
    WHERE usuario_id = p_usuario_id 
      AND rol_personal_id = v_rol_id;
    
    RETURN COALESCE(v_puede_evaluar, FALSE);
END //
DELIMITER ;

-- Procedimiento para asignar permisos a un usuario
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS AsignarPermisosUsuario(
    IN p_usuario_id INT,
    IN p_rol_codigo VARCHAR(50),
    IN p_puede_evaluar BOOLEAN,
    IN p_puede_ver_resultados BOOLEAN
)
BEGIN
    DECLARE v_rol_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Obtener ID del rol
    SELECT id INTO v_rol_id
    FROM roles_personal 
    WHERE codigo = p_rol_codigo AND activo = 1;
    
    IF v_rol_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rol no encontrado';
    END IF;
    
    -- Insertar o actualizar permisos
    INSERT INTO permisos_usuario (usuario_id, rol_personal_id, puede_evaluar, puede_ver_resultados)
    VALUES (p_usuario_id, v_rol_id, p_puede_evaluar, p_puede_ver_resultados)
    ON DUPLICATE KEY UPDATE
        puede_evaluar = p_puede_evaluar,
        puede_ver_resultados = p_puede_ver_resultados,
        fecha_actualizacion = NOW();
    
    COMMIT;
END //
DELIMITER ;

-- Vista para consultar permisos de usuarios
CREATE OR REPLACE VIEW vista_permisos_usuarios AS
SELECT 
    u.id as usuario_id,
    u.username,
    u.nombre_completo,
    u.rol as rol_sistema,
    u.permisos_completos,
    rp.id as rol_personal_id,
    rp.codigo as rol_codigo,
    rp.nombre as rol_nombre,
    pu.puede_evaluar,
    pu.puede_ver_resultados,
    pu.fecha_creacion as fecha_asignacion
FROM usuarios u
LEFT JOIN permisos_usuario pu ON u.id = pu.usuario_id
LEFT JOIN roles_personal rp ON pu.rol_personal_id = rp.id
WHERE u.activo = 1
ORDER BY u.username, rp.nombre;

-- Comentarios finales
-- Esta migración crea un sistema completo de permisos por usuario
-- Permite restringir el acceso a roles específicos de evaluación
-- Los usuarios admin mantienen acceso completo
-- Los usuarios evaluadores pueden tener permisos limitados a roles específicos