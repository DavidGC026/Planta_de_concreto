/*
  # Sistema de Bloqueo/Desbloqueo de Exámenes por Jefe de Planta
  
  Esta migración implementa un sistema que permite al jefe de planta bloquear
  o desbloquear la capacidad de los usuarios para realizar exámenes.
  
  1. Nueva tabla: `estado_examenes_usuario`
     - Controla el estado de acceso a exámenes por usuario
     - Permite bloquear/desbloquear por jefe de planta
     - Registra historial de cambios
  
  2. Funciones y procedimientos:
     - Verificar si un usuario puede realizar exámenes
     - Bloquear/desbloquear acceso a exámenes
     - Obtener historial de cambios de estado
*/

-- Tabla para controlar el estado de acceso a exámenes por usuario
CREATE TABLE IF NOT EXISTS estado_examenes_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    examen_bloqueado BOOLEAN DEFAULT FALSE COMMENT 'TRUE = Usuario no puede realizar exámenes',
    motivo_bloqueo TEXT NULL COMMENT 'Razón del bloqueo del examen',
    fecha_bloqueo TIMESTAMP NULL COMMENT 'Fecha y hora del bloqueo',
    fecha_desbloqueo TIMESTAMP NULL COMMENT 'Fecha y hora del desbloqueo',
    bloqueado_por_usuario_id INT NULL COMMENT 'ID del usuario que realizó el bloqueo/desbloqueo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (bloqueado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    -- Índice único para un usuario
    UNIQUE KEY unique_usuario_estado (usuario_id),
    
    -- Índices para consultas rápidas
    INDEX idx_usuario_estado (usuario_id),
    INDEX idx_bloqueado_por (bloqueado_por_usuario_id)
);

-- Tabla para historial de cambios de estado de exámenes
CREATE TABLE IF NOT EXISTS historial_estado_examenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    accion ENUM('BLOQUEAR', 'DESBLOQUEAR') NOT NULL,
    motivo TEXT NULL,
    realizado_por_usuario_id INT NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (realizado_por_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_usuario_historial (usuario_id),
    INDEX idx_realizado_por (realizado_por_usuario_id),
    INDEX idx_fecha_accion (fecha_accion)
);

-- Inicializar estado de exámenes para usuarios existentes (desbloqueados por defecto)
INSERT INTO estado_examenes_usuario (usuario_id, examen_bloqueado)
SELECT id, FALSE
FROM usuarios
WHERE activo = 1
ON DUPLICATE KEY UPDATE usuario_id = usuario_id;

-- Función para verificar si un usuario puede realizar exámenes
DELIMITER //
CREATE FUNCTION IF NOT EXISTS UsuarioPuedeRealizarExamenes(p_usuario_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_usuario_activo BOOLEAN DEFAULT FALSE;
    DECLARE v_examen_bloqueado BOOLEAN DEFAULT FALSE;
    
    -- Verificar si el usuario está activo
    SELECT activo INTO v_usuario_activo
    FROM usuarios 
    WHERE id = p_usuario_id;
    
    -- Si el usuario no está activo, no puede realizar exámenes
    IF v_usuario_activo = FALSE OR v_usuario_activo IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar si el examen está bloqueado
    SELECT examen_bloqueado INTO v_examen_bloqueado
    FROM estado_examenes_usuario
    WHERE usuario_id = p_usuario_id;
    
    -- Si no hay registro, asumir que no está bloqueado
    IF v_examen_bloqueado IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Retornar el inverso del estado de bloqueo
    RETURN NOT v_examen_bloqueado;
END //
DELIMITER ;

-- Función para verificar si un usuario puede bloquear/desbloquear exámenes
DELIMITER //
CREATE FUNCTION IF NOT EXISTS UsuarioPuedeGestionarEstadoExamenes(p_usuario_id INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_puede_evaluar_jefe_planta BOOLEAN DEFAULT FALSE;
    DECLARE v_rol_jefe_planta_id INT;
    
    -- Verificar si el usuario tiene permisos completos (admin)
    SELECT permisos_completos INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id AND activo = 1;
    
    -- Los admins pueden gestionar estado de exámenes
    IF v_permisos_completos = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- Obtener ID del rol jefe_planta
    SELECT id INTO v_rol_jefe_planta_id
    FROM roles_personal 
    WHERE codigo = 'jefe_planta' AND activo = 1;
    
    IF v_rol_jefe_planta_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar si el usuario puede evaluar el rol jefe_planta
    SELECT puede_evaluar INTO v_puede_evaluar_jefe_planta
    FROM permisos_usuario 
    WHERE usuario_id = p_usuario_id 
      AND rol_personal_id = v_rol_jefe_planta_id;
    
    RETURN COALESCE(v_puede_evaluar_jefe_planta, FALSE);
END //
DELIMITER ;

-- Procedimiento para bloquear acceso a exámenes
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS BloquearExamenUsuario(
    IN p_usuario_id INT,
    IN p_motivo TEXT,
    IN p_bloqueado_por_usuario_id INT
)
BEGIN
    DECLARE v_puede_gestionar BOOLEAN DEFAULT FALSE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar permisos del usuario que quiere bloquear
    SELECT UsuarioPuedeGestionarEstadoExamenes(p_bloqueado_por_usuario_id) INTO v_puede_gestionar;
    
    IF v_puede_gestionar = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No tiene permisos para bloquear exámenes';
    END IF;
    
    -- Insertar o actualizar estado del examen
    INSERT INTO estado_examenes_usuario (
        usuario_id, 
        examen_bloqueado, 
        motivo_bloqueo, 
        fecha_bloqueo, 
        fecha_desbloqueo, 
        bloqueado_por_usuario_id
    )
    VALUES (
        p_usuario_id, 
        TRUE, 
        p_motivo, 
        NOW(), 
        NULL, 
        p_bloqueado_por_usuario_id
    )
    ON DUPLICATE KEY UPDATE
        examen_bloqueado = TRUE,
        motivo_bloqueo = p_motivo,
        fecha_bloqueo = NOW(),
        fecha_desbloqueo = NULL,
        bloqueado_por_usuario_id = p_bloqueado_por_usuario_id,
        fecha_actualizacion = NOW();
    
    -- Registrar en historial
    INSERT INTO historial_estado_examenes (
        usuario_id, 
        accion, 
        motivo, 
        realizado_por_usuario_id
    )
    VALUES (
        p_usuario_id, 
        'BLOQUEAR', 
        p_motivo, 
        p_bloqueado_por_usuario_id
    );
    
    COMMIT;
END //
DELIMITER ;

-- Procedimiento para desbloquear acceso a exámenes
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS DesbloquearExamenUsuario(
    IN p_usuario_id INT,
    IN p_motivo TEXT,
    IN p_desbloqueado_por_usuario_id INT
)
BEGIN
    DECLARE v_puede_gestionar BOOLEAN DEFAULT FALSE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar permisos del usuario que quiere desbloquear
    SELECT UsuarioPuedeGestionarEstadoExamenes(p_desbloqueado_por_usuario_id) INTO v_puede_gestionar;
    
    IF v_puede_gestionar = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No tiene permisos para desbloquear exámenes';
    END IF;
    
    -- Actualizar estado del examen
    INSERT INTO estado_examenes_usuario (
        usuario_id, 
        examen_bloqueado, 
        motivo_bloqueo, 
        fecha_bloqueo, 
        fecha_desbloqueo, 
        bloqueado_por_usuario_id
    )
    VALUES (
        p_usuario_id, 
        FALSE, 
        NULL, 
        NULL, 
        NOW(), 
        p_desbloqueado_por_usuario_id
    )
    ON DUPLICATE KEY UPDATE
        examen_bloqueado = FALSE,
        motivo_bloqueo = NULL,
        fecha_bloqueo = NULL,
        fecha_desbloqueo = NOW(),
        bloqueado_por_usuario_id = p_desbloqueado_por_usuario_id,
        fecha_actualizacion = NOW();
    
    -- Registrar en historial
    INSERT INTO historial_estado_examenes (
        usuario_id, 
        accion, 
        motivo, 
        realizado_por_usuario_id
    )
    VALUES (
        p_usuario_id, 
        'DESBLOQUEAR', 
        p_motivo, 
        p_desbloqueado_por_usuario_id
    );
    
    COMMIT;
END //
DELIMITER ;

-- Vista para consultar estado de exámenes de usuarios
CREATE OR REPLACE VIEW vista_estado_examenes_usuarios AS
SELECT 
    u.id as usuario_id,
    u.username,
    u.nombre_completo,
    u.email,
    u.activo as usuario_activo,
    COALESCE(eeu.examen_bloqueado, FALSE) as examen_bloqueado,
    eeu.motivo_bloqueo,
    eeu.fecha_bloqueo,
    eeu.fecha_desbloqueo,
    ub.username as bloqueado_por_username,
    ub.nombre_completo as bloqueado_por_nombre,
    UsuarioPuedeRealizarExamenes(u.id) as puede_realizar_examenes,
    eeu.fecha_actualizacion
FROM usuarios u
LEFT JOIN estado_examenes_usuario eeu ON u.id = eeu.usuario_id
LEFT JOIN usuarios ub ON eeu.bloqueado_por_usuario_id = ub.id
WHERE u.activo = 1
ORDER BY u.nombre_completo;

-- Vista para historial de cambios de estado
CREATE OR REPLACE VIEW vista_historial_estado_examenes AS
SELECT 
    hee.id,
    hee.usuario_id,
    u.username,
    u.nombre_completo,
    hee.accion,
    hee.motivo,
    hee.fecha_accion,
    ur.username as realizado_por_username,
    ur.nombre_completo as realizado_por_nombre
FROM historial_estado_examenes hee
JOIN usuarios u ON hee.usuario_id = u.id
JOIN usuarios ur ON hee.realizado_por_usuario_id = ur.id
ORDER BY hee.fecha_accion DESC;

-- Comentarios finales
-- Esta migración crea un sistema completo de bloqueo/desbloqueo de exámenes
-- Solo usuarios con permisos de jefe_planta o admins pueden gestionar el estado
-- Se mantiene un historial completo de cambios para auditoría
-- El sistema es compatible con el sistema de permisos existente
