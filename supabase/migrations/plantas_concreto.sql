-- Adminer 4.8.1 MySQL 8.0.42-0ubuntu0.24.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DELIMITER ;;

DROP FUNCTION IF EXISTS `calcular_calidad_planta`;;
CREATE FUNCTION `calcular_calidad_planta`(
    p_evaluacion_id INT
) RETURNS decimal(5,2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE calidad_total DECIMAL(5,2) DEFAULT 0.00;
    DECLARE done INT DEFAULT FALSE;
    DECLARE seccion_ponderacion DECIMAL(5,2);
    DECLARE seccion_score DECIMAL(5,2);
    
    DECLARE seccion_cursor CURSOR FOR
        SELECT 
            se.ponderacion,
            (COUNT(CASE WHEN re.respuesta = 'si' THEN 1 END) / 
             NULLIF(COUNT(CASE WHEN re.respuesta IN ('si', 'no') THEN 1 END), 0)) * 100 as score
        FROM evaluaciones e
        JOIN respuestas_evaluacion re ON re.evaluacion_id = e.id
        JOIN preguntas p ON re.pregunta_id = p.id
        JOIN subsecciones_evaluacion sub ON p.subseccion_id = sub.id
        JOIN secciones_evaluacion se ON sub.seccion_id = se.id
        WHERE e.id = p_evaluacion_id
        AND re.respuesta IN ('si', 'no') -- Excluir N/A
        GROUP BY se.id, se.ponderacion;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN seccion_cursor;
    
    read_loop: LOOP
        FETCH seccion_cursor INTO seccion_ponderacion, seccion_score;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET calidad_total = calidad_total + ((seccion_ponderacion / 100) * COALESCE(seccion_score, 0));
    END LOOP;
    
    CLOSE seccion_cursor;
    
    RETURN COALESCE(calidad_total, 0.00);
END;;

DROP FUNCTION IF EXISTS `ObtenerRolesPermitidos`;;
CREATE FUNCTION `ObtenerRolesPermitidos`(p_usuario_id INT) RETURNS json
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
END;;

DROP FUNCTION IF EXISTS `UsuarioPuedeEvaluarRol`;;
CREATE FUNCTION `UsuarioPuedeEvaluarRol`(p_usuario_id INT, p_rol_codigo VARCHAR(50)) RETURNS tinyint(1)
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
END;;

DROP FUNCTION IF EXISTS `UsuarioPuedeGestionarEstadoExamenes`;;
CREATE DEFINER=`root`@`localhost` FUNCTION `UsuarioPuedeGestionarEstadoExamenes`(p_usuario_id INT) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_permisos_completos BOOLEAN DEFAULT FALSE;
    DECLARE v_puede_evaluar_jefe_planta BOOLEAN DEFAULT FALSE;
    DECLARE v_rol_jefe_planta_id INT;
    
    
    SELECT permisos_completos INTO v_permisos_completos
    FROM usuarios 
    WHERE id = p_usuario_id AND activo = 1;
    
    
    IF v_permisos_completos = TRUE THEN
        RETURN TRUE;
    END IF;
    
    
    SELECT id INTO v_rol_jefe_planta_id
    FROM roles_personal 
    WHERE codigo = 'jefe_planta' AND activo = 1;
    
    IF v_rol_jefe_planta_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    
    SELECT puede_evaluar INTO v_puede_evaluar_jefe_planta
    FROM permisos_usuario 
    WHERE usuario_id = p_usuario_id 
      AND rol_personal_id = v_rol_jefe_planta_id;
    
    RETURN COALESCE(v_puede_evaluar_jefe_planta, FALSE);
END;;

DROP FUNCTION IF EXISTS `UsuarioPuedeRealizarExamenes`;;
CREATE DEFINER=`root`@`localhost` FUNCTION `UsuarioPuedeRealizarExamenes`(p_usuario_id INT) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_usuario_activo BOOLEAN DEFAULT FALSE;
    DECLARE v_examen_bloqueado BOOLEAN DEFAULT FALSE;
    
    
    SELECT activo INTO v_usuario_activo
    FROM usuarios 
    WHERE id = p_usuario_id;
    
    
    IF v_usuario_activo = FALSE OR v_usuario_activo IS NULL THEN
        RETURN FALSE;
    END IF;
    
    
    SELECT examen_bloqueado INTO v_examen_bloqueado
    FROM estado_examenes_usuario
    WHERE usuario_id = p_usuario_id;
    
    
    IF v_examen_bloqueado IS NULL THEN
        RETURN TRUE;
    END IF;
    
    
    RETURN NOT v_examen_bloqueado;
END;;

DROP FUNCTION IF EXISTS `validar_ponderacion_total`;;
CREATE FUNCTION `validar_ponderacion_total`(p_tipo_evaluacion VARCHAR(50),
    p_rol_personal VARCHAR(50)
) RETURNS decimal(5,2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE total_ponderacion DECIMAL(5,2) DEFAULT 0.00;
    
    SELECT COALESCE(SUM(se.ponderacion), 0.00) INTO total_ponderacion
    FROM secciones_evaluacion se
    JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
    LEFT JOIN roles_personal rp ON se.rol_personal_id = rp.id
    WHERE te.codigo = p_tipo_evaluacion
    AND (p_rol_personal IS NULL OR rp.codigo = p_rol_personal)
    AND se.activo = TRUE
    AND se.es_trampa = FALSE;
    
    RETURN total_ponderacion;
END;;

DROP PROCEDURE IF EXISTS `AsignarPermisosUsuario`;;
CREATE PROCEDURE `AsignarPermisosUsuario`(
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
END;;

DROP PROCEDURE IF EXISTS `BloquearExamenUsuario`;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `BloquearExamenUsuario`(
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
    
    
    SELECT UsuarioPuedeGestionarEstadoExamenes(p_bloqueado_por_usuario_id) INTO v_puede_gestionar;
    
    IF v_puede_gestionar = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No tiene permisos para bloquear exámenes';
    END IF;
    
    
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
END;;

DROP PROCEDURE IF EXISTS `DesbloquearExamenUsuario`;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `DesbloquearExamenUsuario`(
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
    
    
    SELECT UsuarioPuedeGestionarEstadoExamenes(p_desbloqueado_por_usuario_id) INTO v_puede_gestionar;
    
    IF v_puede_gestionar = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No tiene permisos para desbloquear exámenes';
    END IF;
    
    
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
END;;

DROP PROCEDURE IF EXISTS `LimpiarProgresoEquipoUsuario`;;
CREATE PROCEDURE `LimpiarProgresoEquipoUsuario`(
    IN p_usuario_id INT,
    IN p_tipo_planta VARCHAR(20)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Eliminar progreso de subsecciones
    DELETE psse FROM progreso_subsecciones_equipo psse
    JOIN progreso_secciones_equipo pse ON psse.progreso_seccion_id = pse.id
    WHERE pse.usuario_id = p_usuario_id 
      AND pse.tipo_planta = p_tipo_planta;
    
    -- Eliminar progreso de secciones
    DELETE FROM progreso_secciones_equipo 
    WHERE usuario_id = p_usuario_id 
      AND tipo_planta = p_tipo_planta;
    
    COMMIT;
END;;

DROP PROCEDURE IF EXISTS `MarcarSeccionEquipoCompletada`;;
CREATE PROCEDURE `MarcarSeccionEquipoCompletada`(
    IN p_usuario_id INT,
    IN p_tipo_planta VARCHAR(20),
    IN p_seccion_id INT,
    IN p_seccion_nombre VARCHAR(200),
    IN p_puntaje_obtenido DECIMAL(5,2),
    IN p_puntaje_porcentaje DECIMAL(5,2),
    IN p_total_subsecciones INT,
    IN p_subsecciones_completadas INT,
    IN p_respuestas_correctas INT,
    IN p_total_preguntas INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insertar o actualizar el progreso de la sección
    INSERT INTO progreso_secciones_equipo (
        usuario_id, tipo_planta, seccion_id, seccion_nombre,
        completada, puntaje_obtenido, puntaje_porcentaje,
        total_subsecciones, subsecciones_completadas,
        respuestas_correctas, total_preguntas, fecha_completada
    ) VALUES (
        p_usuario_id, p_tipo_planta, p_seccion_id, p_seccion_nombre,
        TRUE, p_puntaje_obtenido, p_puntaje_porcentaje,
        p_total_subsecciones, p_subsecciones_completadas,
        p_respuestas_correctas, p_total_preguntas, NOW()
    )
    ON DUPLICATE KEY UPDATE
        completada = TRUE,
        puntaje_obtenido = p_puntaje_obtenido,
        puntaje_porcentaje = p_puntaje_porcentaje,
        total_subsecciones = p_total_subsecciones,
        subsecciones_completadas = p_subsecciones_completadas,
        respuestas_correctas = p_respuestas_correctas,
        total_preguntas = p_total_preguntas,
        fecha_completada = NOW(),
        fecha_actualizacion = NOW();
    
    COMMIT;
END;;

DROP PROCEDURE IF EXISTS `MarcarSubseccionEquipoCompletada`;;
CREATE PROCEDURE `MarcarSubseccionEquipoCompletada`(
    IN p_usuario_id INT,
    IN p_tipo_planta VARCHAR(20),
    IN p_seccion_id INT,
    IN p_subseccion_id INT,
    IN p_subseccion_nombre VARCHAR(200),
    IN p_puntaje_obtenido DECIMAL(5,2),
    IN p_puntaje_porcentaje DECIMAL(5,2),
    IN p_respuestas_correctas INT,
    IN p_total_preguntas INT
)
BEGIN
    DECLARE v_progreso_seccion_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Obtener o crear el registro de progreso de sección
    SELECT id INTO v_progreso_seccion_id 
    FROM progreso_secciones_equipo 
    WHERE usuario_id = p_usuario_id 
      AND tipo_planta = p_tipo_planta 
      AND seccion_id = p_seccion_id;
    
    -- Si no existe el progreso de sección, crearlo
    IF v_progreso_seccion_id IS NULL THEN
        INSERT INTO progreso_secciones_equipo (
            usuario_id, tipo_planta, seccion_id, seccion_nombre,
            completada, total_subsecciones, subsecciones_completadas
        ) 
        SELECT p_usuario_id, p_tipo_planta, p_seccion_id, se.nombre, FALSE, 
               COUNT(sub.id), 0
        FROM secciones_evaluacion se
        LEFT JOIN subsecciones_evaluacion sub ON se.id = sub.seccion_id AND sub.activo = 1
        WHERE se.id = p_seccion_id
        GROUP BY se.id, se.nombre;
        
        SET v_progreso_seccion_id = LAST_INSERT_ID();
    END IF;
    
    -- Insertar o actualizar el progreso de la subsección
    INSERT INTO progreso_subsecciones_equipo (
        progreso_seccion_id, usuario_id, tipo_planta, subseccion_id, subseccion_nombre,
        completada, puntaje_obtenido, puntaje_porcentaje,
        respuestas_correctas, total_preguntas, fecha_completada
    ) VALUES (
        v_progreso_seccion_id, p_usuario_id, p_tipo_planta, p_subseccion_id, p_subseccion_nombre,
        TRUE, p_puntaje_obtenido, p_puntaje_porcentaje,
        p_respuestas_correctas, p_total_preguntas, NOW()
    )
    ON DUPLICATE KEY UPDATE
        completada = TRUE,
        puntaje_obtenido = p_puntaje_obtenido,
        puntaje_porcentaje = p_puntaje_porcentaje,
        respuestas_correctas = p_respuestas_correctas,
        total_preguntas = p_total_preguntas,
        fecha_completada = NOW(),
        fecha_actualizacion = NOW();
    
    -- Actualizar el contador de subsecciones completadas en la sección
    UPDATE progreso_secciones_equipo 
    SET subsecciones_completadas = (
        SELECT COUNT(*) 
        FROM progreso_subsecciones_equipo 
        WHERE progreso_seccion_id = v_progreso_seccion_id 
          AND completada = TRUE
    ),
    puntaje_obtenido = (
        SELECT COALESCE(AVG(puntaje_obtenido), 0)
        FROM progreso_subsecciones_equipo 
        WHERE progreso_seccion_id = v_progreso_seccion_id 
          AND completada = TRUE
    ),
    puntaje_porcentaje = (
        SELECT COALESCE(AVG(puntaje_porcentaje), 0)
        FROM progreso_subsecciones_equipo 
        WHERE progreso_seccion_id = v_progreso_seccion_id 
          AND completada = TRUE
    ),
    respuestas_correctas = (
        SELECT COALESCE(SUM(respuestas_correctas), 0)
        FROM progreso_subsecciones_equipo 
        WHERE progreso_seccion_id = v_progreso_seccion_id 
          AND completada = TRUE
    ),
    total_preguntas = (
        SELECT COALESCE(SUM(total_preguntas), 0)
        FROM progreso_subsecciones_equipo 
        WHERE progreso_seccion_id = v_progreso_seccion_id 
          AND completada = TRUE
    )
    WHERE id = v_progreso_seccion_id;
    
    -- Marcar la sección como completada si todas las subsecciones están completadas
    UPDATE progreso_secciones_equipo 
    SET completada = (subsecciones_completadas >= total_subsecciones),
        fecha_completada = CASE 
            WHEN (subsecciones_completadas >= total_subsecciones) THEN NOW() 
            ELSE fecha_completada 
        END
    WHERE id = v_progreso_seccion_id;
    
    COMMIT;
END;;

DROP PROCEDURE IF EXISTS `ObtenerProgresoEquipoUsuario`;;
CREATE PROCEDURE `ObtenerProgresoEquipoUsuario`(
    IN p_usuario_id INT,
    IN p_tipo_planta VARCHAR(20)
)
BEGIN
    SELECT 
        seccion_id,
        seccion_nombre,
        seccion_completada,
        seccion_puntaje,
        seccion_porcentaje,
        total_subsecciones,
        subsecciones_completadas,
        seccion_respuestas_correctas,
        seccion_total_preguntas,
        seccion_fecha_completada,
        subsecciones_detalle
    FROM vista_progreso_equipo_usuario
    WHERE usuario_id = p_usuario_id 
      AND tipo_planta = p_tipo_planta
    ORDER BY seccion_id;
END;;

DROP PROCEDURE IF EXISTS `obtener_estadisticas_evaluacion`;;
CREATE PROCEDURE `obtener_estadisticas_evaluacion`(
    IN p_tipo_evaluacion VARCHAR(50),
    IN p_rol_personal VARCHAR(50)
)
    READS SQL DATA
BEGIN
    SELECT 
        te.codigo as tipo_evaluacion,
        te.nombre as tipo_nombre,
        rp.codigo as rol_personal,
        rp.nombre as rol_nombre,
        COUNT(DISTINCT se.id) as total_secciones,
        COUNT(DISTINCT CASE WHEN se.es_trampa = FALSE THEN se.id END) as secciones_normales,
        COUNT(DISTINCT CASE WHEN se.es_trampa = TRUE THEN se.id END) as secciones_trampa,
        SUM(CASE WHEN se.es_trampa = FALSE THEN se.ponderacion ELSE 0 END) as ponderacion_total,
        COUNT(p.id) as total_preguntas,
        COUNT(CASE WHEN p.es_trampa = FALSE THEN 1 END) as preguntas_normales,
        COUNT(CASE WHEN p.es_trampa = TRUE THEN 1 END) as preguntas_trampa,
        cp.preguntas_trampa_por_seccion
    FROM tipos_evaluacion te
    LEFT JOIN roles_personal rp ON rp.codigo = p_rol_personal
    LEFT JOIN secciones_evaluacion se ON se.tipo_evaluacion_id = te.id 
        AND (se.rol_personal_id IS NULL OR se.rol_personal_id = rp.id)
        AND se.activo = TRUE
    LEFT JOIN preguntas p ON p.seccion_id = se.id AND p.activo = TRUE
    LEFT JOIN configuracion_ponderacion cp ON cp.tipo_evaluacion_id = te.id 
        AND (cp.rol_personal_id IS NULL OR cp.rol_personal_id = rp.id)
        AND cp.activo = TRUE
    WHERE te.codigo = p_tipo_evaluacion
    GROUP BY te.codigo, te.nombre, rp.codigo, rp.nombre, cp.preguntas_trampa_por_seccion;
END;;

DROP PROCEDURE IF EXISTS `obtener_estructura_evaluacion_equipo`;;
CREATE PROCEDURE `obtener_estructura_evaluacion_equipo`()
    READS SQL DATA
BEGIN
    SELECT 
        se.id as seccion_id,
        se.nombre as seccion_nombre,
        se.orden as seccion_orden,
        se.ponderacion as seccion_ponderacion,
        sub.id as subseccion_id,
        sub.nombre as subseccion_nombre,
        sub.orden as subseccion_orden,
        sub.ponderacion_subseccion,
        COUNT(p.id) as total_preguntas
    FROM secciones_evaluacion se
    JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
    LEFT JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id AND sub.activo = TRUE
    LEFT JOIN preguntas p ON p.subseccion_id = sub.id AND p.activo = TRUE
    WHERE te.codigo = 'equipo' AND se.activo = TRUE AND se.es_trampa = FALSE
    GROUP BY se.id, se.nombre, se.orden, se.ponderacion, sub.id, sub.nombre, sub.orden, sub.ponderacion_subseccion
    ORDER BY se.orden, sub.orden;
END;;

DELIMITER ;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `configuracion_ponderacion`;
CREATE TABLE `configuracion_ponderacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_evaluacion_id` int NOT NULL,
  `rol_personal_id` int DEFAULT NULL,
  `total_preguntas_trampa` int DEFAULT '0' COMMENT 'Total de preguntas trampa disponibles',
  `preguntas_trampa_por_seccion` int DEFAULT '1' COMMENT 'Preguntas trampa a mostrar por sección',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tipo_evaluacion_id` (`tipo_evaluacion_id`),
  KEY `rol_personal_id` (`rol_personal_id`),
  CONSTRAINT `configuracion_ponderacion_ibfk_1` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipos_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `configuracion_ponderacion_ibfk_2` FOREIGN KEY (`rol_personal_id`) REFERENCES `roles_personal` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `configuracion_ponderacion` (`id`, `tipo_evaluacion_id`, `rol_personal_id`, `total_preguntas_trampa`, `preguntas_trampa_por_seccion`, `activo`, `fecha_creacion`) VALUES
(1,	1,	1,	20,	1,	1,	'2025-06-24 15:29:49'),
(2,	1,	1,	20,	1,	1,	'2025-06-24 15:32:58'),
(3,	1,	2,	10,	1,	1,	'2025-06-24 15:32:58'),
(4,	1,	4,	10,	1,	1,	'2025-06-24 15:32:58'),
(5,	1,	3,	10,	1,	1,	'2025-06-24 15:32:58'),
(6,	1,	1,	20,	1,	1,	'2025-06-24 15:36:27'),
(7,	1,	2,	10,	1,	1,	'2025-06-24 15:36:27'),
(8,	1,	4,	10,	1,	1,	'2025-06-24 15:36:27'),
(9,	1,	3,	10,	1,	1,	'2025-06-24 15:36:27');

DROP TABLE IF EXISTS `datos_volumen_operacion`;
CREATE TABLE `datos_volumen_operacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `volumen` decimal(10,2) NOT NULL,
  `minimo` decimal(10,2) NOT NULL,
  `maximo` decimal(10,2) NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `datos_volumen_operacion` (`id`, `fecha`, `volumen`, `minimo`, `maximo`, `observaciones`, `created_at`, `updated_at`) VALUES
(1,	'2025-06-01',	90.00,	80.00,	120.00,	'Operación normal',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(2,	'2025-06-02',	80.00,	80.00,	120.00,	'Reducción por mantenimiento',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(3,	'2025-06-03',	70.00,	80.00,	120.00,	'Baja demanda',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(4,	'2025-06-04',	120.00,	80.00,	120.00,	'Máxima capacidad',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(5,	'2025-06-05',	110.00,	80.00,	120.00,	'Alta demanda',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(6,	'2025-06-06',	90.00,	80.00,	120.00,	'Operación normal',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(7,	'2025-06-07',	90.00,	80.00,	120.00,	'Operación normal',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(8,	'2025-06-08',	85.00,	80.00,	120.00,	'Ligeramente bajo promedio',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(9,	'2025-06-09',	87.00,	80.00,	120.00,	'Operación normal',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(10,	'2025-06-10',	100.00,	80.00,	120.00,	'Buen volumen',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(11,	'2025-06-11',	102.00,	80.00,	120.00,	'Sobre promedio',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(12,	'2025-06-12',	60.00,	80.00,	120.00,	'Falla en equipo',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(13,	'2025-06-13',	94.00,	80.00,	120.00,	'Recuperación',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(14,	'2025-06-14',	93.00,	80.00,	120.00,	'Operación normal',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51'),
(15,	'2025-06-15',	100.00,	80.00,	120.00,	'Buen rendimiento',	'2025-08-04 16:49:53',	'2025-08-04 16:57:51');

DROP TABLE IF EXISTS `estado_examenes_usuario`;
CREATE TABLE `estado_examenes_usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `examen_bloqueado` tinyint(1) DEFAULT '0' COMMENT 'TRUE = Usuario no puede realizar exámenes',
  `motivo_bloqueo` text COLLATE utf8mb4_unicode_ci COMMENT 'Razón del bloqueo del examen',
  `fecha_bloqueo` timestamp NULL DEFAULT NULL COMMENT 'Fecha y hora del bloqueo',
  `fecha_desbloqueo` timestamp NULL DEFAULT NULL COMMENT 'Fecha y hora del desbloqueo',
  `bloqueado_por_usuario_id` int DEFAULT NULL COMMENT 'ID del usuario que realizó el bloqueo/desbloqueo',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_usuario_estado` (`usuario_id`),
  KEY `idx_usuario_estado` (`usuario_id`),
  KEY `idx_bloqueado_por` (`bloqueado_por_usuario_id`),
  CONSTRAINT `estado_examenes_usuario_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `estado_examenes_usuario_ibfk_2` FOREIGN KEY (`bloqueado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `evaluaciones`;
CREATE TABLE `evaluaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo_evaluacion_id` int NOT NULL,
  `rol_personal_id` int DEFAULT NULL,
  `puntuacion_total` decimal(5,2) NOT NULL DEFAULT '0.00',
  `total_preguntas` int NOT NULL DEFAULT '0',
  `respuestas_si` int NOT NULL DEFAULT '0',
  `respuestas_no` int NOT NULL DEFAULT '0',
  `respuestas_na` int NOT NULL DEFAULT '0',
  `estado` enum('en_progreso','completada','cancelada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_progreso',
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_finalizacion` timestamp NULL DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `puntuacion_ponderada` decimal(5,2) DEFAULT '0.00',
  `preguntas_trampa_respondidas` int DEFAULT '0',
  `preguntas_trampa_incorrectas` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `rol_personal_id` (`rol_personal_id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_tipo_evaluacion` (`tipo_evaluacion_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_inicio` (`fecha_inicio`),
  CONSTRAINT `evaluaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluaciones_ibfk_2` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipos_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluaciones_ibfk_3` FOREIGN KEY (`rol_personal_id`) REFERENCES `roles_personal` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `evaluaciones` (`id`, `usuario_id`, `tipo_evaluacion_id`, `rol_personal_id`, `puntuacion_total`, `total_preguntas`, `respuestas_si`, `respuestas_no`, `respuestas_na`, `estado`, `fecha_inicio`, `fecha_finalizacion`, `observaciones`, `puntuacion_ponderada`, `preguntas_trampa_respondidas`, `preguntas_trampa_incorrectas`) VALUES
(1,	8,	1,	1,	280.00,	50,	0,	0,	0,	'completada',	'2025-07-29 23:33:13',	'2025-07-29 23:33:13',	'Evaluación de personal completada - Rol: jefe_planta - REPROBADO POR PREGUNTAS TRAMPA - Sistema: Ponderación por secciones',	56.00,	0,	0),
(2,	8,	1,	1,	280.00,	50,	0,	0,	0,	'completada',	'2025-07-30 00:18:14',	'2025-07-30 00:18:14',	'Evaluación de personal completada - Rol: jefe_planta - REPROBADO POR PREGUNTAS TRAMPA - Sistema: Ponderación por secciones',	56.00,	0,	0),
(3,	8,	1,	1,	290.00,	50,	0,	1,	0,	'completada',	'2025-08-06 23:22:51',	'2025-08-06 23:22:51',	'Evaluación de personal completada - Rol: jefe_planta - REPROBADO POR PREGUNTAS TRAMPA - Sistema: Ponderación por secciones',	58.00,	0,	0),
(4,	1,	1,	1,	76.00,	50,	0,	0,	0,	'completada',	'2025-08-08 22:05:58',	'2025-08-08 22:05:58',	'Evaluación de personal completada - Rol: jefe_planta - REPROBADO POR PREGUNTAS TRAMPA - Sistema: Ponderación por secciones',	76.00,	0,	0);

DROP TABLE IF EXISTS `historial_estado_examenes`;
CREATE TABLE `historial_estado_examenes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `accion` enum('BLOQUEAR','DESBLOQUEAR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `realizado_por_usuario_id` int NOT NULL,
  `fecha_accion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_historial` (`usuario_id`),
  KEY `idx_realizado_por` (`realizado_por_usuario_id`),
  KEY `idx_fecha_accion` (`fecha_accion`),
  CONSTRAINT `historial_estado_examenes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_estado_examenes_ibfk_2` FOREIGN KEY (`realizado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `parametros_operacion`;
CREATE TABLE `parametros_operacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seccion_operacion_id` int NOT NULL,
  `parametro` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia_sugerida` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `referencia_normativa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_seccion` (`seccion_operacion_id`),
  KEY `idx_orden` (`orden`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `parametros_operacion_ibfk_1` FOREIGN KEY (`seccion_operacion_id`) REFERENCES `secciones_operacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Parámetros de evaluación de operación relacionados con secciones';

INSERT INTO `parametros_operacion` (`id`, `seccion_operacion_id`, `parametro`, `frecuencia_sugerida`, `observaciones`, `referencia_normativa`, `orden`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(21,	5,	'Almacenamiento de cemento',	'Diario',	'Condiciones de almacenaje y rotación',	'NMX-C-414-ONNCCE',	1,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(22,	5,	'Control de inventarios',	'Diario',	'Registro de entradas y salidas de materiales',	'Procedimiento interno',	2,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(23,	5,	'Estado de agregados pétreos',	'Cada entrega',	'Limpieza y granulometría',	'NMX-C-111-ONNCCE',	3,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(24,	5,	'Almacenamiento de aditivos',	'Semanal',	'Condiciones de temperatura y vencimiento',	'Especificaciones del fabricante',	4,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(25,	5,	'Segregación de materiales',	'Diario',	'Evitar contaminación cruzada',	'Buenas prácticas',	5,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(26,	6,	'Registros de producción',	'Cada lote',	'Documentar todas las entregas',	'Procedimiento interno',	1,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(27,	6,	'Certificados de calidad de materiales',	'Cada entrega',	'Verificar documentación de proveedores',	'NMX-C-414-ONNCCE',	2,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(28,	6,	'Reportes de ensayos de laboratorio',	'Según programa',	'Archivo de resultados de pruebas',	'Procedimiento interno',	3,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(29,	6,	'Bitácoras de mantenimiento',	'Cada actividad',	'Registro de actividades de mantenimiento',	'ISO 55000',	4,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21'),
(30,	6,	'Control de no conformidades',	'Cuando aplique',	'Registro y seguimiento de desviaciones',	'ISO 9001',	5,	1,	'2025-08-04 14:45:21',	'2025-08-04 14:45:21');

DROP TABLE IF EXISTS `parametros_seguimiento`;
CREATE TABLE `parametros_seguimiento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seccion_id` int NOT NULL,
  `parametro` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia_sugerida` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `lectura` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_normativa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden_en_seccion` int DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_seccion` (`seccion_id`),
  KEY `idx_orden_seccion` (`seccion_id`,`orden_en_seccion`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `parametros_seguimiento_ibfk_1` FOREIGN KEY (`seccion_id`) REFERENCES `secciones_operacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `parametros_seguimiento` (`id`, `seccion_id`, `parametro`, `frecuencia_sugerida`, `observaciones`, `lectura`, `referencia_normativa`, `orden_en_seccion`, `activo`, `created_at`, `updated_at`) VALUES
(1,	1,	'Básculas de agregados, cemento y agua',	'Semestral o por lote',	NULL,	NULL,	'NOM-010-SCFI-1994, IMCYC',	1,	1,	'2025-08-04 15:18:29',	'2025-08-04 15:18:29'),
(2,	1,	'Medidor volumétrico de agua',	'Anual',	NULL,	NULL,	'Buenas prácticas',	2,	1,	'2025-08-04 15:18:55',	'2025-08-04 15:18:55'),
(3,	1,	'Termómetros y sensores de temperatura',	'Anual o por desviación',	NULL,	NULL,	'ACI, ASTM',	3,	1,	'2025-08-04 15:19:14',	'2025-08-04 15:19:14'),
(4,	1,	'Mezclador (tiempo y homogeneidad)',	'Semestral o si hay fallas ',	NULL,	NULL,	'ACI 304R',	4,	1,	'2025-08-04 15:19:45',	'2025-08-04 15:19:45'),
(5,	2,	'Mezclador, bandas, válvulas, vibradores',	'Mensual',	NULL,	NULL,	'NOM-004-STPS, Manual de planta',	1,	1,	'2025-08-04 15:48:16',	'2025-08-04 15:48:16'),
(6,	2,	'Compresores, bombas, motores',	'Mensual',	NULL,	NULL,	'Buenas prácticas',	2,	1,	'2025-08-04 15:48:33',	'2025-08-04 15:48:33'),
(7,	2,	'Sistema eléctrico y tableros',	'Trimestral',	NULL,	NULL,	'NOM-001-SEDE',	3,	1,	'2025-08-04 15:48:50',	'2025-08-04 15:48:50'),
(8,	2,	'Revisión general de planta',	'Mensual',	NULL,	NULL,	'Recomendado',	4,	1,	'2025-08-04 15:49:08',	'2025-08-04 15:49:08'),
(9,	3,	'Ensayos de revenimiento (cono de Abrams)',	'Por carga/lote',	NULL,	'cm',	'NMX-C-156, ASTM C143',	1,	1,	'2025-08-04 15:55:43',	'2025-08-04 15:55:43'),
(10,	3,	'Temperatura del concreto',	'Por carga/lote',	NULL,	'°C',	'ASTM C1064',	2,	1,	'2025-08-04 15:56:21',	'2025-08-04 15:56:21'),
(11,	3,	'Elaboración de cilindros',	'Por muestra',	NULL,	'Unidades ',	'NMX-C-159, ASTM C31',	3,	1,	'2025-08-04 15:57:22',	'2025-08-04 15:57:22'),
(12,	3,	'Resultados de resistencia',	'A los 7 y 28 días',	NULL,	'kg/cm2 ',	'NMX-C-083, ASTM C39',	4,	1,	'2025-08-04 15:57:48',	'2025-08-04 15:57:48'),
(13,	4,	'Volumen producido por día/semana/mes',	'Diario',	NULL,	'm3',	'Gestión operativa',	1,	1,	'2025-08-04 15:58:10',	'2025-08-04 15:58:10'),
(14,	4,	'Tiempos de mezcla y ciclos de producción',	'Diario',	NULL,	'min',	'ACI, control interno',	2,	1,	'2025-08-04 15:58:37',	'2025-08-04 15:58:37'),
(15,	4,	'Control de pedidos y entregas',	'Diario',	NULL,	'Unidades ',	'Logística y trazabilidad',	3,	1,	'2025-08-04 15:58:58',	'2025-08-04 15:58:58'),
(16,	4,	'Paros no programados o fallas operativas',	'Cada evento',	NULL,	'--',	'Auditoría interna',	4,	1,	'2025-08-04 15:59:24',	'2025-08-04 15:59:24'),
(17,	5,	'Capacitación en seguridad y operación',	'Anual o por personal nuevo',	NULL,	NULL,	'NOM-019-STPS, NOM-030-STPS',	1,	1,	'2025-08-04 15:59:41',	'2025-08-04 15:59:41'),
(18,	5,	'Evaluación del operador del mezclador',	'Anual o semestral',	NULL,	NULL,	'Interno / Seguridad Industrial',	2,	1,	'2025-08-04 16:00:04',	'2025-08-04 16:00:04'),
(19,	5,	'Certificación de laboratorio (si aplica)',	'Según organismo',	NULL,	NULL,	'ONNCCE, EMA, etc.',	3,	1,	'2025-08-04 16:00:33',	'2025-08-04 16:00:33'),
(20,	6,	'Inspección de extintores',	'Mensual (visual) / Anual (recarga)',	NULL,	NULL,	'NOM-002-STPS',	1,	1,	'2025-08-04 16:04:12',	'2025-08-04 16:04:12'),
(21,	6,	'Inspección de botiquín',	'Mensual',	NULL,	NULL,	'NOM-005-STPS',	2,	1,	'2025-08-04 16:04:26',	'2025-08-04 16:04:26'),
(22,	6,	'Revisión de señalización y EPP',	'Mensual',	NULL,	NULL,	'NOM-026-STPS, NOM-017-STPS',	3,	1,	'2025-08-04 16:04:41',	'2025-08-04 16:04:41'),
(23,	6,	'Simulacros o brigadas',	'Anual o semestral',	NULL,	NULL,	'NOM-002-STPS, Protección Civil',	4,	1,	'2025-08-04 16:05:05',	'2025-08-04 16:05:05');

DROP TABLE IF EXISTS `permisos_equipo`;
CREATE TABLE `permisos_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `puede_evaluar` tinyint(1) DEFAULT '1',
  `puede_ver_resultados` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_equipo` (`usuario_id`),
  KEY `idx_usuario_equipo` (`usuario_id`),
  KEY `idx_puede_evaluar_equipo` (`puede_evaluar`),
  CONSTRAINT `permisos_equipo_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permisos_equipo` (`id`, `usuario_id`, `puede_evaluar`, `puede_ver_resultados`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1,	1,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06'),
(2,	4,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06'),
(3,	8,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06');

DROP TABLE IF EXISTS `permisos_operacion`;
CREATE TABLE `permisos_operacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `puede_evaluar` tinyint(1) DEFAULT '1',
  `puede_ver_resultados` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_operacion` (`usuario_id`),
  CONSTRAINT `permisos_operacion_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permisos_operacion` (`id`, `usuario_id`, `puede_evaluar`, `puede_ver_resultados`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(2,	1,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06'),
(3,	4,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06'),
(13,	8,	1,	1,	'2025-08-11 15:49:04',	'2025-08-11 15:49:04');

DROP TABLE IF EXISTS `permisos_usuario`;
CREATE TABLE `permisos_usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `rol_personal_id` int NOT NULL,
  `puede_evaluar` tinyint(1) DEFAULT '1',
  `puede_ver_resultados` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role_permission` (`usuario_id`,`rol_personal_id`),
  KEY `idx_usuario_permisos` (`usuario_id`),
  KEY `idx_rol_permisos` (`rol_personal_id`),
  CONSTRAINT `permisos_usuario_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permisos_usuario_ibfk_2` FOREIGN KEY (`rol_personal_id`) REFERENCES `roles_personal` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permisos_usuario` (`id`, `usuario_id`, `rol_personal_id`, `puede_evaluar`, `puede_ver_resultados`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(3,	12,	1,	1,	1,	'2025-07-11 17:35:12',	'2025-07-18 16:39:38'),
(9,	1,	1,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06'),
(10,	4,	1,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06'),
(11,	8,	1,	1,	1,	'2025-07-16 19:43:06',	'2025-07-16 19:43:06'),
(28,	13,	1,	1,	1,	'2025-08-04 17:58:42',	'2025-08-04 17:58:42'),
(29,	11,	1,	1,	1,	'2025-08-04 18:01:23',	'2025-08-04 18:01:23'),
(30,	10,	1,	1,	1,	'2025-08-04 18:03:11',	'2025-08-04 18:03:11'),
(31,	15,	1,	1,	1,	'2025-08-05 21:56:31',	'2025-08-05 21:56:31'),
(32,	8,	2,	1,	1,	'2025-08-11 15:34:57',	'2025-08-11 15:34:57'),
(33,	8,	4,	1,	1,	'2025-08-11 15:34:59',	'2025-08-11 15:34:59'),
(34,	8,	3,	1,	1,	'2025-08-11 15:35:00',	'2025-08-11 15:35:00');

DROP TABLE IF EXISTS `preguntas`;
CREATE TABLE `preguntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seccion_id` int NOT NULL,
  `subseccion_id` int DEFAULT NULL,
  `pregunta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_pregunta` enum('abierta','seleccion_multiple') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'abierta',
  `opcion_a` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `opcion_b` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `opcion_c` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `respuesta_correcta` enum('a','b','c') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `es_trampa` tinyint(1) DEFAULT '0' COMMENT 'Indica si es una pregunta trampa',
  `ponderacion_individual` decimal(5,2) DEFAULT '0.00' COMMENT 'Ponderación individual de la pregunta',
  PRIMARY KEY (`id`),
  KEY `idx_seccion` (`seccion_id`),
  KEY `idx_orden` (`orden`),
  KEY `idx_tipo_pregunta` (`tipo_pregunta`),
  KEY `subseccion_id` (`subseccion_id`),
  CONSTRAINT `preguntas_ibfk_1` FOREIGN KEY (`seccion_id`) REFERENCES `secciones_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `preguntas_ibfk_2` FOREIGN KEY (`subseccion_id`) REFERENCES `subsecciones_evaluacion` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `preguntas` (`id`, `seccion_id`, `subseccion_id`, `pregunta`, `tipo_pregunta`, `opcion_a`, `opcion_b`, `opcion_c`, `respuesta_correcta`, `orden`, `activo`, `fecha_creacion`, `es_trampa`, `ponderacion_individual`) VALUES
(2000,	1001,	NULL,	'¿Qué efecto tiene una alta relación agua/cemento en el concreto endurecido?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2001,	1001,	NULL,	'¿Qué parámetro controla principalmente la fluidez del concreto?',	'seleccion_multiple',	'El contenido de aire',	'El revenimiento',	'El módulo de elasticidad',	'b',	2,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2002,	1001,	NULL,	'¿Cuál es el objetivo del curado del concreto?',	'seleccion_multiple',	'Acelerar el fraguado',	'Reducir la segregación',	'Mantener la humedad para evitar fisuración',	'c',	3,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2003,	1001,	NULL,	'¿Qué prueba se usa comúnmente para medir la consistencia del concreto fresco?',	'seleccion_multiple',	'Ensayo de resistencia a compresión',	'Ensayo de revenimiento',	'Ensayo de módulo elástico',	'b',	4,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2004,	1001,	NULL,	'¿Qué aditivo se usa para retardar el fraguado del concreto?',	'seleccion_multiple',	'Plastificante',	'Retardante',	'Acelerante',	'b',	5,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2005,	1001,	NULL,	'¿Qué característica mejora el uso de agregados angulosos frente a los redondeados?',	'seleccion_multiple',	'Fluidez',	'Adherencia y resistencia mecánica',	'Tiempo de fraguado',	'b',	6,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2006,	1001,	NULL,	'¿Qué puede causar un exceso de finos en los agregados?',	'seleccion_multiple',	'Mayor resistencia',	'Problemas de trabajabilidad y mayor demanda de agua',	'Menor revenimiento',	'b',	7,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2007,	1001,	NULL,	'¿Qué prueba se realiza a los agregados para conocer su desgaste en mezcla?',	'seleccion_multiple',	'Análisis granulométrico',	'Ensayo de Los Ángeles',	'Equivalente de arena',	'b',	8,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2008,	1001,	NULL,	'¿Qué tipo de cemento es más adecuado para zonas con riesgo de ataque por sulfatos?',	'seleccion_multiple',	'Cemento Portland tipo I',	'Cemento Portland tipo V',	'Cemento blanco',	'b',	9,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2009,	1001,	NULL,	'¿Qué sucede si no se corrige la humedad de los agregados en la dosificación?',	'seleccion_multiple',	'El concreto será más resistente',	'Se mantiene constante la trabajabilidad',	'Se altera la relación agua/cemento y la calidad del concreto',	'c',	10,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2010,	1001,	NULL,	'¿Qué se debe hacer antes de iniciar la producción diaria?',	'seleccion_multiple',	'Verificar las condiciones del clima',	'Realizar limpieza superficial únicamente',	'Verificar calibración, niveles de tolvas, aditivos y limpieza',	'c',	11,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2011,	1001,	NULL,	'¿Cuál es el orden de carga típico de materiales en el mezclador?',	'seleccion_multiple',	'Cemento – agua – agregados',	'Agregados – cemento – agua y aditivos',	'Agua – cemento – aditivos – agregados',	'b',	12,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2012,	1001,	NULL,	'¿Qué función cumple el mezclador en la planta?',	'seleccion_multiple',	'Almacenar el concreto',	'Dosificar los materiales',	'Homogeneizar la mezcla',	'c',	13,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2013,	1001,	NULL,	'¿Cuál es el tiempo mínimo recomendado de mezclado para concreto convencional en planta central?',	'seleccion_multiple',	'10 minutos',	'30 segundos a 1 minuto',	'5 segundos',	'b',	14,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2014,	1001,	NULL,	'¿Qué hacer si se detecta concreto con revenimiento fuera de especificación?',	'seleccion_multiple',	'Liberarlo sin pruebas',	'Ajustar con más agua sin control',	'Rechazarlo o ajustarlo según procedimiento controlado',	'c',	15,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2015,	1001,	NULL,	'¿Cuál es una señal de desgaste en las aspas del mezclador?',	'seleccion_multiple',	'Exceso de revenimiento',	'Mezcla no homogénea y tiempos largos de mezclado',	'Pérdida de volumen del concreto',	'b',	16,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2016,	1001,	NULL,	'¿Qué se requiere para un cambio de diseño de mezcla durante la jornada?',	'seleccion_multiple',	'Aviso al operador de bomba',	'Cambiar solo el revenimiento',	'Registro formal y verificación de laboratorio',	'c',	17,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2017,	1001,	NULL,	'¿Qué equipo requiere calibración periódica en planta?',	'seleccion_multiple',	'Compresor de aire',	'Básculas de cemento y agregados',	'Ventilador del tablero eléctrico',	'b',	18,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2018,	1001,	NULL,	'¿Qué problema puede causar el exceso de tiempo entre carga y colocación del concreto?',	'seleccion_multiple',	'Disminución del revenimiento y fraguado adelantado',	'Mayor resistencia',	'Reducción de retracción',	'a',	19,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2019,	1001,	NULL,	'¿Qué aspecto operativo se mejora con un adecuado mantenimiento preventivo del sistema de aditivos?',	'seleccion_multiple',	'El consumo de agua',	'La dosificación precisa y estabilidad de mezcla',	'11. La granulometría del agregado',	'b',	20,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2020,	1001,	NULL,	'¿Qué indica una desviación de más de ±1% en la báscula de cemento?',	'seleccion_multiple',	'Que puede continuar la producción',	'Que debe calibrarse y detener la dosificación',	'Que el cemento está contaminado',	'b',	21,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2021,	1001,	NULL,	'¿Qué acción se debe tomar si un camión llega a obra con el revenimiento muy alto?',	'seleccion_multiple',	'Se descarga sin avisar',	'Se agrega más agregado en obra',	'Se rechaza o se solicita aprobación técnica antes de usar',	'c',	22,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2022,	1001,	NULL,	'¿Qué medida de seguridad es obligatoria para el operador del mezclador?',	'seleccion_multiple',	'Usar radio de comunicación',	'Tener acceso libre al tambor',	'Bloqueo/etiquetado antes de cualquier intervención',	'c',	23,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2023,	1001,	NULL,	'¿Qué acción es prioritaria si se detecta mezcla con color inusual o contaminante?',	'seleccion_multiple',	'Continuar la entrega con menor resistencia',	'Rechazar el lote y detener producción',	'Agregar agua para homogenizar',	'b',	24,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2024,	1001,	NULL,	'¿Cuál es la principal causa de formación de nidos de abeja en el concreto?',	'seleccion_multiple',	'Exceso de vibrado',	'Segregación y mala colocación',	'Curado excesivo',	'b',	25,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2025,	1001,	NULL,	'¿Qué instrumento se usa para medir el contenido de aire en concreto fresco?',	'seleccion_multiple',	'Esclerómetro',	'Balanza de aire tipo presión',	'Probeta de fraguado',	'b',	26,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2026,	1001,	NULL,	'¿Cuál es el objetivo de realizar pruebas de revenimiento, resistencia y contenido de aire?',	'seleccion_multiple',	'Verificar tiempos de entrega',	'Controlar calidad del concreto',	'Estimar costos operativos',	'b',	27,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2027,	1001,	NULL,	'¿Qué documento debe acompañar cada carga de concreto enviado a obra?',	'seleccion_multiple',	'Fotografía del camión',	'Hoja de ruta con firma de chofer',	'Remisión o vale de entrega con especificaciones del lote',	'c',	28,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2028,	1001,	NULL,	'¿Qué indica una desviación frecuente en la resistencia a compresión?',	'seleccion_multiple',	'Que el curado fue excesivo',	'Posible falla en diseño o producción',	'Problema con los moldes',	'b',	29,	1,	'2025-06-19 22:25:52',	0,	0.00),
(2029,	1001,	NULL,	'¿Cuál es la mejor práctica si se necesita modificar un diseño de mezcla aprobado?',	'seleccion_multiple',	'Notificar al operador',	'Solicitar autorización formal y pruebas previas',	'21. Hacer el cambio sin avisar si es leve',	'b',	30,	1,	'2025-06-19 22:25:52',	0,	0.00),
(10000,	1002,	NULL,	'¿Cuál es el primer paso en la planificación diaria de producción?',	'seleccion_multiple',	'Esperar instrucciones de los choferes',	'Revisar los pedidos programados y condiciones de materiales',	'Comenzar a cargar camiones',	'b',	1,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10001,	1002,	NULL,	'¿Qué herramienta ayuda a priorizar cargas cuando hay múltiples pedidos?',	'seleccion_multiple',	'Orden alfabético del cliente',	'Secuencia de carga basada en distancia y resistencia solicitada',	'Capacidad del camión',	'b',	2,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10002,	1002,	NULL,	'¿Qué se debe considerar para programar mezclas con diferentes tipos de aditivos?',	'seleccion_multiple',	'Solo considerar el revenimiento',	'Uso de líneas independientes o lavado entre mezclas',	'Cargar todos los aditivos juntos',	'b',	3,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10003,	1002,	NULL,	'¿Qué permite una correcta planificación de producción?',	'seleccion_multiple',	'Uso continuo del mezclador',	'Minimizar desperdicio, reducir tiempos muertos y evitar rechazos',	'Acelerar el desgaste del equipo',	'b',	4,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10004,	1002,	NULL,	'¿Cómo se debe planear la producción cuando hay mezcla convencional y acelerada el mismo día?',	'seleccion_multiple',	'Planear secuencias separadas y limpieza intermedia',	'Mezclar ambas en un solo diseño',	'Producir solo la mezcla acelerada',	'a',	5,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10005,	1002,	NULL,	'¿Cuál es el riesgo de una mala programación diaria?',	'seleccion_multiple',	'Menor uso de agua',	'Congestión en planta, retrasos y errores en la mezcla',	'Alta eficiencia de carga',	'b',	6,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10006,	1002,	NULL,	'¿Qué aspecto debe coordinarse con el área de ventas para una buena planeación?',	'seleccion_multiple',	'Número de vibradores en obra',	'Los refrigerios del operador',	'Cantidad y horario exacto de los pedidos',	'c',	7,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10007,	1002,	NULL,	'¿Qué variable externa es clave para ajustar la programación diaria?',	'seleccion_multiple',	'Color del cemento',	'Condiciones climáticas y tránsito',	'Velocidad del viento',	'b',	8,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10008,	1002,	NULL,	'¿Qué indicador mide la eficiencia del mezclador por hora?',	'seleccion_multiple',	'Cantidad de aditivo por carga',	'Número de operadores',	'Volumen total producido dividido entre tiempo operativo',	'c',	9,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10009,	1002,	NULL,	'¿Qué parámetro se debe registrar en cada ciclo de carga?',	'seleccion_multiple',	'Hora, diseño, m³, revenimiento, cliente y destino',	'Número de ejes del camión',	'Nombre del operador',	'a',	10,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10010,	1002,	NULL,	'¿Cómo se puede detectar una desviación en el rendimiento diario?',	'seleccion_multiple',	'Comparando contra el total de camiones disponibles',	'Contando los metros cúbicos acumulados',	'Comparando lo producido vs. lo programado',	'c',	11,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10011,	1002,	NULL,	'¿Qué significa una baja producción con alto tiempo operativo?',	'seleccion_multiple',	'Bajo rendimiento y posible ineficiencia',	'Alta eficiencia',	'Desperdicio controlado',	'a',	12,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10012,	1002,	NULL,	'¿Qué hacer si se detecta un incremento en tiempos muertos entre cargas?',	'seleccion_multiple',	'Ajustar horarios de carga y revisar logística de patio',	'Usar mezcla más fluida',	'Ignorarlo',	'a',	13,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10013,	1002,	NULL,	'¿Qué se debe hacer si un pedido se cancela de último momento?',	'seleccion_multiple',	'Continuar la producción y almacenar el concreto',	'Usar la mezcla para otro cliente sin aviso',	'Detener la producción y reajustar programación',	'c',	14,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10014,	1002,	NULL,	'¿Qué documento permite rastrear la producción de cada camión?',	'seleccion_multiple',	'Ticket de carga con número de lote y datos de mezcla',	'Vale de mantenimiento',	'Factura',	'a',	15,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10015,	1002,	NULL,	'¿Qué permite un buen registro de producción diaria?',	'seleccion_multiple',	'Llevar estadísticas sin valor técnico',	'Llenar espacio en reportes',	'Tomar decisiones informadas, detectar errores y planear mejoras',	'c',	16,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10016,	1002,	NULL,	'¿Qué aspecto logístico interno puede afectar el ritmo de producción?',	'seleccion_multiple',	'El color de los camiones',	'La ubicación de las tolvas y ruta de carga',	'La marca de los aditivos',	'b',	17,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10017,	1002,	NULL,	'¿Cómo se puede reducir la espera de camiones listos para cargar?',	'seleccion_multiple',	'Manteniéndolos encendidos',	'Cargando sin verificar diseño',	'Coordinando horarios de llegada y prechequeo',	'c',	18,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10018,	1002,	NULL,	'¿Qué estrategia mejora el flujo interno en planta en horas pico?',	'seleccion_multiple',	'Bloquear la entrada',	'Dejar libre acceso sin supervisión',	'Separar entradas y salidas, establecer señalización y horarios escalonados',	'c',	19,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10019,	1002,	NULL,	'¿Qué hacer si el tráfico o clima afecta la entrega?',	'seleccion_multiple',	'Reprogramar turnos, avisar a cliente y ajustar diseño si es necesario',	'Enviar el concreto sin importar condiciones',	'No intervenir',	'a',	20,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10020,	1002,	NULL,	'¿Qué implica una buena coordinación con operadores de camión?',	'seleccion_multiple',	'Instrucciones claras, comunicación constante y horarios definidos',	'Que ellos planifiquen la producción',	'Que ellos limpien la planta',	'a',	21,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10021,	1002,	NULL,	'¿Qué hacer si hay atasco en el cargadero?',	'seleccion_multiple',	'Cambiar los diseños de mezcla',	'Detener producción sin avisar',	'Coordinar orden de carga y usar personal para agilizar tránsito',	'c',	22,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10022,	1002,	NULL,	'¿Qué equipo requiere revisión constante para evitar interrupciones de carga?',	'seleccion_multiple',	'Cámaras de seguridad',	'Puertas de baños',	'Tolvas, compresores, válvulas y sistema de pesaje',	'c',	23,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10023,	1002,	NULL,	'¿Qué hacer si hay una falla crítica en el sistema de pesaje durante la jornada?',	'seleccion_multiple',	'Continuar producción a ojo',	'Pedir ayuda a un operador',	'Detener la planta, informar y activar protocolo de contingencia',	'c',	24,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10024,	1002,	NULL,	'¿Cuál es el criterio principal para aceptar una mezcla modificada durante la jornada?',	'seleccion_multiple',	'Que el cliente no se dé cuenta',	'Que la pida el operador',	'Que esté documentada, validada y registrada por laboratorio',	'c',	25,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10025,	1002,	NULL,	'¿Qué hacer si el operador del mezclador reporta concreto muy seco?',	'seleccion_multiple',	'Verificar parámetros y ajustar con control',	'Detener toda la producción sin revisión',	'Aumentar agua sin medir',	'a',	26,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10026,	1002,	NULL,	'¿Qué decisión tomar si la planta supera su capacidad instalada?',	'seleccion_multiple',	'Reducir la calidad del concreto',	'Reprogramar entregas o contratar apoyo externo',	'Enviar concreto incompleto',	'b',	27,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10027,	1002,	NULL,	'¿Qué hacer si se detecta desperdicio de material en la zona de carga?',	'seleccion_multiple',	'Considerarlo parte de la producción',	'Identificar la causa y corregir procedimiento',	'Limpiar sin registrar',	'b',	28,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10028,	1002,	NULL,	'¿Qué opción mejora la productividad general de planta?',	'seleccion_multiple',	'Cambiar los diseños todos los días',	'Aumentar horas sin planificación',	'Implementar mantenimiento, planificación y supervisión de ciclos',	'c',	29,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10029,	1002,	NULL,	'¿Qué se debe hacer al finalizar la jornada de producción?',	'seleccion_multiple',	'Dejar camiones cargados',	'Lavar mezclador, verificar registros, hacer respaldo y preparar para el día siguiente',	'Apagar todo inmediatamente',	'b',	30,	1,	'2025-06-19 23:05:58',	0,	0.00),
(10030,	1003,	NULL,	'¿Qué es un mantenimiento preventivo?',	'seleccion_multiple',	'Cambio completo de piezas cada mes',	'Reparación después de una falla',	'Programa para evitar fallas con revisiones periódicas',	'c',	1,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10031,	1003,	NULL,	'¿Cuál es la principal ventaja del mantenimiento predictivo?',	'seleccion_multiple',	'Detectar fallas antes de que ocurran',	'Evita todo tipo de mantenimiento',	'Requiere mayor inversión',	'a',	2,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10032,	1003,	NULL,	'¿Con qué frecuencia se deben revisar los niveles de aceite del mezclador?',	'seleccion_multiple',	'Una vez al mes',	'Cuando el operador lo note',	'Cada inicio de jornada',	'c',	3,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10033,	1003,	NULL,	'¿Qué se debe hacer antes de realizar cualquier reparación en un equipo eléctrico?',	'seleccion_multiple',	'Apagar las luces',	'Desconectar la fuente de energía',	'Llamar al jefe de planta',	'b',	4,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10034,	1003,	NULL,	'¿Cuál es el primer paso en un plan de mantenimiento?',	'seleccion_multiple',	'Hacer un inventario de los equipos',	'Comprar piezas nuevas',	'Revisar manuales del fabricante',	'a',	5,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10035,	1003,	NULL,	'¿Qué indica un ruido anormal en un reductor de velocidad?',	'seleccion_multiple',	'Lubricación excesiva',	'Operación normal',	'Desgaste o falla inminente',	'c',	6,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10036,	1003,	NULL,	'¿Qué herramienta se usa comúnmente para medir la vibración en motores?',	'seleccion_multiple',	'Voltímetro',	'Acelerómetro',	'Termómetro infrarrojo',	'b',	7,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10037,	1003,	NULL,	'¿Qué se debe hacer si se detecta una fuga de aceite hidráulico?',	'seleccion_multiple',	'Colocar trapos debajo',	'Aumentar la presión del sistema',	'Detener el equipo y reparar de inmediato',	'c',	8,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10038,	1003,	NULL,	'¿Qué componente requiere lubricación periódica en un sistema de bandas?',	'seleccion_multiple',	'Interruptores',	'Tanque de agua',	'Rodamientos',	'c',	9,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10039,	1003,	NULL,	'¿Qué parámetro se debe controlar en el sistema de pesaje para evitar errores?',	'seleccion_multiple',	'Marca del cemento',	'Temperatura ambiente',	'Calibración constante',	'c',	10,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10040,	1003,	NULL,	'¿Qué hacer si el sistema de control automático presenta fallas?',	'seleccion_multiple',	'Ignorar la falla',	'Cambiar de proveedor de concreto',	'Revisar conexiones y reiniciar sistema',	'c',	11,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10041,	1003,	NULL,	'¿Cuál es la función de un checklist de mantenimiento diario?',	'seleccion_multiple',	'Calibrar balanzas mensualmente',	'Llevar registro de combustible',	'Prevenir fallas con revisión rápida',	'c',	12,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10042,	1003,	NULL,	'¿Qué se debe revisar antes de arrancar la planta cada día?',	'seleccion_multiple',	'Cierre de puertas',	'Estado de la papelería',	'Nivel de aceite, presión de aire y sensores',	'c',	13,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10043,	1003,	NULL,	'¿Qué hacer si se detecta una fuga de agua en el tambor del mezclador?',	'seleccion_multiple',	'Agregar más agua',	'Continuar trabajando',	'Detener el equipo y sellar la fuga',	'c',	14,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10044,	1003,	NULL,	'¿Por qué es importante registrar todas las actividades de mantenimiento?',	'seleccion_multiple',	'Solo por formalidad',	'Para aumentar el consumo de refacciones',	'Historial para diagnósticos y seguimiento',	'c',	15,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10045,	1003,	NULL,	'¿Qué indica un sobrecalentamiento en el motor del compresor?',	'seleccion_multiple',	'Posible fallo de ventilación o sobrecarga',	'Condiciones normales de trabajo',	'Falta de aditivos',	'a',	16,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10046,	1003,	NULL,	'¿Qué se debe hacer cuando un componente muestra desgaste excesivo?',	'seleccion_multiple',	'Reducir la producción',	'Esperar una parada mayor',	'Reemplazarlo lo antes posible',	'c',	17,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10047,	1003,	NULL,	'¿Cuál es la consecuencia de no calibrar el sistema de pesaje regularmente?',	'seleccion_multiple',	'Mayor eficiencia',	'Reducción de aditivos',	'Errores de pesaje y producción incorrecta',	'c',	18,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10048,	1003,	NULL,	'¿Qué equipo requiere verificación frecuente durante clima lluvioso?',	'seleccion_multiple',	'Motor de arranque',	'Sistema de enfriamiento',	'Sistema eléctrico',	'c',	19,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10049,	1003,	NULL,	'¿Cuál es el propósito del mantenimiento correctivo?',	'seleccion_multiple',	'Corregir una falla existente',	'Prevenir fallas',	'Limpiar el área de trabajo',	'a',	20,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10050,	1003,	NULL,	'¿Qué aspecto es vital para evitar paros no programados?',	'seleccion_multiple',	'Entrevistas al personal',	'Revisión del clima',	'Planificación de mantenimiento y repuestos',	'c',	21,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10051,	1003,	NULL,	'¿Qué indica una variación continua en el tiempo de mezcla?',	'seleccion_multiple',	'Buena calidad del concreto',	'Aditivo mal dosificado',	'Problemas mecánicos en el mezclador',	'c',	22,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10052,	1003,	NULL,	'¿Qué hacer si la banda transportadora presenta desalineación?',	'seleccion_multiple',	'Aumentar velocidad',	'Reemplazar operador',	'Detener el equipo y alinear o ajustar',	'c',	23,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10053,	1003,	NULL,	'¿Qué equipo requiere limpieza periódica para evitar acumulación de material?',	'seleccion_multiple',	'Oficinas',	'Extintores',	'Mezclador',	'c',	24,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10054,	1003,	NULL,	'¿Qué se debe revisar para asegurar el funcionamiento del sistema neumático?',	'seleccion_multiple',	'Color del tanque',	'Tamaño de la tolva',	'Conexiones, presión y válvulas',	'c',	25,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10055,	1003,	NULL,	'¿Qué acción es obligatoria durante una intervención mayor al mezclador?',	'seleccion_multiple',	'Cerrar la puerta',	'Apagar luces exteriores',	'Bloquear y etiquetar fuente de energía',	'c',	26,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10056,	1003,	NULL,	'¿Qué se revisa al checar el nivel del aceite hidráulico?',	'seleccion_multiple',	'Volumen del tambor',	'Presión del agua',	'Cantidad y color del aceite',	'c',	27,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10057,	1003,	NULL,	'¿Qué hacer si un sensor de pesaje muestra valores erráticos?',	'seleccion_multiple',	'Golpear el sensor',	'Ignorar la variación',	'Calibrar o reemplazar el sensor',	'c',	28,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10058,	1003,	NULL,	'¿Qué componente del sistema de aditivos debe revisarse con regularidad?',	'seleccion_multiple',	'Bombas dosificadoras',	'Extintores',	'Pipas de agua',	'a',	29,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10059,	1003,	NULL,	'¿Qué debe incluir un programa mensual de mantenimiento?',	'seleccion_multiple',	'Limpieza general',	'Entrevistas, folletos y pruebas físicas',	'Checklist, cronograma, responsables y fechas',	'c',	30,	1,	'2025-06-19 23:07:22',	0,	0.00),
(10060,	1004,	NULL,	'¿Cuál es una función clave del jefe de planta en la gestión del personal?',	'seleccion_multiple',	'Realizar mezclas directamente',	'Asignar funciones y supervisar desempeño',	'Llevar la contabilidad financiera',	'b',	1,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10061,	1004,	NULL,	'¿Qué acción fortalece la motivación del equipo de trabajo?',	'seleccion_multiple',	'Castigar errores severamente',	'Reconocer logros y dar retroalimentación',	'Rotar al personal sin avisar',	'b',	2,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10062,	1004,	NULL,	'¿Qué aspecto es esencial al delegar tareas?',	'seleccion_multiple',	'Asegurarse que la persona esté ocupada',	'Capacidad y competencia del trabajador',	'Evitar darle instrucciones claras',	'b',	3,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10063,	1004,	NULL,	'¿Qué debe incluir una inducción adecuada al personal nuevo?',	'seleccion_multiple',	'Recorrido por planta, normas, funciones y EPP',	'Solo presentación con el jefe',	'Entrega de uniforme y ya',	'a',	4,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10064,	1004,	NULL,	'¿Qué herramienta ayuda a identificar necesidades de capacitación?',	'seleccion_multiple',	'Quejas del personal',	'Evaluaciones de desempeño',	'Opinión del proveedor',	'b',	5,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10065,	1004,	NULL,	'¿Cuál es el beneficio de establecer turnos bien organizados?',	'seleccion_multiple',	'Menos carga administrativa',	'Mayor continuidad operativa y menor fatiga',	'Aumentar el tiempo de descanso',	'b',	6,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10066,	1004,	NULL,	'¿Cómo debe manejarse un conflicto entre operadores?',	'seleccion_multiple',	'Ignorarlo hasta que se calme',	'Intervenir con imparcialidad y buscar solución',	'Cambiar de área a uno sin explicar',	'b',	7,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10067,	1004,	NULL,	'¿Qué documento se usa para registrar faltas, retardos o incidencias?',	'seleccion_multiple',	'Formato de calidad',	'Bitácora o control de asistencia',	'Lista de materiales',	'b',	8,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10068,	1004,	NULL,	'¿Qué debe hacer un jefe al detectar bajo desempeño repetido?',	'seleccion_multiple',	'Despedir al trabajador sin más',	'Dar retroalimentación y plan de mejora',	'Reportarlo a otro jefe sin intervenir',	'b',	9,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10069,	1004,	NULL,	'¿Qué estrategia mejora el compromiso del personal?',	'seleccion_multiple',	'Cambiar las reglas sin consultar',	'Incluir al equipo en decisiones operativas',	'Anunciar los cambios por cartel',	'b',	10,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10070,	1004,	NULL,	'¿Qué acción reduce los riesgos de rotación de personal?',	'seleccion_multiple',	'Omitir capacitación',	'Ofrecer desarrollo y buen clima laboral',	'Contratar familiares',	'b',	11,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10071,	1004,	NULL,	'¿Qué hacer si un operador se rehúsa a usar EPP?',	'seleccion_multiple',	'Tolerarlo si no hay supervisor',	'Advertencia formal y refuerzo de normas',	'Cambiarlo de puesto sin avisar',	'b',	12,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10072,	1004,	NULL,	'¿Cuál es la mejor forma de asegurar buena comunicación interna?',	'seleccion_multiple',	'Reuniones solo cuando hay problemas',	'Canales formales, reuniones regulares y claridad',	'Solo usar carteles',	'b',	13,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10073,	1004,	NULL,	'¿Qué indicador ayuda a evaluar la eficiencia del personal?',	'seleccion_multiple',	'Número de cafés por turno',	'Producción por jornada por operador',	'Marca del uniforme',	'b',	14,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10074,	1004,	NULL,	'¿Qué puede provocar una mala rotación de turnos?',	'seleccion_multiple',	'Fatiga, errores y baja productividad',	'Mayor descanso',	'Más uniformidad',	'a',	15,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10075,	1004,	NULL,	'¿Qué medida ayuda a mejorar el clima laboral?',	'seleccion_multiple',	'Escuchar sugerencias del equipo',	'Imponer sanciones sin aviso',	'Dejar que trabajen sin supervisión',	'a',	16,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10076,	1004,	NULL,	'¿Qué actitud debe evitar un líder de planta?',	'seleccion_multiple',	'Autoritarismo y falta de escucha',	'Claridad y firmeza',	'Retroalimentación oportuna',	'a',	17,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10077,	1004,	NULL,	'¿Cómo se asegura la mejora continua del personal?',	'seleccion_multiple',	'Dejando que aprendan por experiencia',	'Capacitación constante y evaluación',	'Contratando nuevos empleados',	'b',	18,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10078,	1004,	NULL,	'¿Qué hacer si un trabajador muestra síntomas de agotamiento?',	'seleccion_multiple',	'Cambiarle el uniforme',	'Reasignar funciones y evaluar carga laboral',	'Ignorarlo',	'b',	19,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10079,	1004,	NULL,	'¿Qué habilidad interpersonal es más importante para un jefe de planta?',	'seleccion_multiple',	'Fuerza física',	'Comunicación efectiva y liderazgo',	'Conocer todos los procesos manuales',	'b',	20,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10080,	1004,	NULL,	'¿Qué significa tener una cultura organizacional sólida?',	'seleccion_multiple',	'Decorar bien la oficina',	'Valores compartidos y compromiso del equipo',	'Que todos se vistan igual',	'b',	21,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10081,	1004,	NULL,	'¿Qué tipo de capacitación debe recibir el personal operativo?',	'seleccion_multiple',	'Solo teoría',	'Teórico-práctica, enfocada a su función',	'Temas financieros',	'b',	22,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10082,	1004,	NULL,	'¿Qué implica un liderazgo positivo?',	'seleccion_multiple',	'Guiar con el ejemplo, motivar y resolver conflictos',	'Evitar contacto con el equipo',	'Hacer todo solo',	'a',	23,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10083,	1004,	NULL,	'¿Qué herramienta permite planear mejor las jornadas laborales?',	'seleccion_multiple',	'Lista de precios del concreto',	'Rol de turnos y control de asistencia',	'Rutina de limpieza',	'b',	24,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10084,	1004,	NULL,	'¿Cómo se promueve la responsabilidad en el personal?',	'seleccion_multiple',	'Dando tareas sin supervisión',	'Asignando roles claros y seguimiento',	'Aumentando el horario',	'b',	25,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10085,	1004,	NULL,	'¿Qué puede causar el favoritismo en el equipo?',	'seleccion_multiple',	'Mejora del ambiente',	'Desmotivación y conflictos',	'Más productividad',	'b',	26,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10086,	1004,	NULL,	'¿Cuál es la mejor manera de evaluar competencias técnicas del personal?',	'seleccion_multiple',	'Revisión visual',	'Pruebas prácticas y observación en campo',	'Consultar con amigos',	'b',	27,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10087,	1004,	NULL,	'¿Qué acción debe tomar el jefe ante constantes retrasos de un operador?',	'seleccion_multiple',	'Ignorarlo',	'Aplicar medidas disciplinarias graduales',	'Cambiarlo de turno sin hablarlo',	'b',	28,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10088,	1004,	NULL,	'¿Cuál es el objetivo de la retroalimentación efectiva?',	'seleccion_multiple',	'Señalar errores',	'Mejorar desempeño y alinear expectativas',	'Aumentar el control',	'b',	29,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10089,	1004,	NULL,	'¿Qué es importante al contratar nuevo personal?',	'seleccion_multiple',	'Que tenga conocidos en la planta',	'Evaluar competencias, actitud y referencias',	'Que no cuestione órdenes',	'b',	30,	1,	'2025-06-19 23:22:29',	0,	0.00),
(10090,	1010,	NULL,	'¿Cuál es el primer paso para resolver un problema operativo urgente?',	'seleccion_multiple',	'Informar al cliente',	'Identificar el problema claramente y notificar',	'Reiniciar el sistema',	'b',	1,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10091,	1010,	NULL,	'¿Qué hacer si un operador comete un error repetidamente?',	'seleccion_multiple',	'Ignorar el error',	'Capacitar, retroalimentar y supervisar',	'Cambiar de puesto sin hablar',	'b',	2,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10092,	1010,	NULL,	'¿Cómo se abordan fallas en el mezclador durante la producción?',	'seleccion_multiple',	'Esperar a que termine el turno',	'Detener la planta sin aviso',	'Parar equipo, informar y activar protocolo técnico',	'c',	3,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10093,	1010,	NULL,	'¿Qué acción tomar si un cliente se queja de la calidad del concreto?',	'seleccion_multiple',	'Disculparse sin registrar',	'Ignorar la queja',	'Investigar, registrar y dar seguimiento inmediato',	'c',	4,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10094,	1010,	NULL,	'¿Qué debe incluir un análisis de causa raíz?',	'seleccion_multiple',	'Manual del operador',	'Hechos, causas, consecuencias y responsables',	'Copias de bitácoras',	'b',	5,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10095,	1010,	NULL,	'¿Cuál es el objetivo principal de una reunión de resolución de problemas?',	'seleccion_multiple',	'Crear conflictos',	'Buscar soluciones efectivas en equipo',	'Asignar culpables',	'b',	6,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10096,	1010,	NULL,	'¿Qué herramienta se puede usar para identificar causas de fallas recurrentes?',	'seleccion_multiple',	'Diagrama de Ishikawa o de Pareto',	'Control de asistencia',	'Lista de gastos',	'a',	7,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10097,	1010,	NULL,	'¿Qué hacer si el laboratorio no entrega resultados a tiempo?',	'seleccion_multiple',	'Exigir resultados inmediatos',	'Cambiar laboratorio',	'Llamar, registrar y definir solución alternativa',	'c',	8,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10098,	1010,	NULL,	'¿Cómo actuar ante una fuga de aceite en un equipo?',	'seleccion_multiple',	'Detener el equipo, aislar la falla y reportar',	'Tapar la fuga con un trapo',	'Seguir operando',	'a',	9,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10099,	1010,	NULL,	'¿Qué implica una solución correctiva?',	'seleccion_multiple',	'Diagnóstico general',	'Acción que elimina la causa del problema detectado',	'Cambiar de turno',	'b',	10,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10100,	1010,	NULL,	'¿Qué es una acción preventiva?',	'seleccion_multiple',	'Solo observar',	'Evitar que el problema ocurra en el futuro',	'Asignar el mismo operador',	'b',	11,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10101,	1010,	NULL,	'¿Cómo manejar un error en la dosificación reportado por el cliente?',	'seleccion_multiple',	'Culpar al chofer',	'Verificar bitácora, dosificación y dar respuesta técnica',	'Repetir la carga sin confirmar',	'b',	12,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10102,	1010,	NULL,	'¿Qué hacer si el sistema automatizado se detiene?',	'seleccion_multiple',	'Desconectar todo',	'Revisar fallas, activar respaldo manual y comunicar',	'Esperar 30 minutos',	'b',	13,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10103,	1010,	NULL,	'¿Qué actitud debe mostrar el jefe ante un problema grave?',	'seleccion_multiple',	'Enojo y presión',	'Escucha activa, liderazgo y solución inmediata',	'Silencio y evasión',	'b',	14,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10104,	1010,	NULL,	'¿Qué información debe recopilarse para tomar decisiones?',	'seleccion_multiple',	'Opiniones personales',	'Datos, registros y evidencia técnica',	'Conversaciones de pasillo',	'b',	15,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10105,	1010,	NULL,	'¿Cuál es el riesgo de no resolver un problema a tiempo?',	'seleccion_multiple',	'Nada',	'Riesgo de repetición, pérdidas y quejas',	'Ventaja en costos',	'b',	16,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10106,	1010,	NULL,	'¿Qué estrategia ayuda a prevenir problemas similares en el futuro?',	'seleccion_multiple',	'Despedir al responsable',	'Implementar procedimientos y capacitaciones',	'No dejar registro',	'b',	17,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10107,	1010,	NULL,	'¿Qué hacer si no se cuenta con un técnico en sitio?',	'seleccion_multiple',	'Apagar todo\r\n',	'Contactar soporte externo y seguir protocolo provisional\r\n',	'Llamar a todos los operadores\r\n',	NULL,	18,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10108,	1010,	NULL,	'¿Qué herramienta ayuda a priorizar problemas?',	'seleccion_multiple',	'Orden de carga',	'Plan de concreto',	'Matriz de priorización o análisis de impacto',	'c',	19,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10109,	1010,	NULL,	'¿Cómo manejar la presión durante una crisis en producción?',	'seleccion_multiple',	'Desconectarse de la situación',	'Mantener calma, priorizar acciones y comunicar',	'Delegar sin criterio',	'b',	20,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10110,	1010,	NULL,	'¿Qué importancia tiene documentar las soluciones aplicadas?',	'seleccion_multiple',	'Deja evidencia para mejoras futuras y auditoría',	'Retrasa la operación',	'No es necesaria',	'a',	21,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10111,	1010,	NULL,	'¿Qué hacer si una falla se repite pese a acciones correctivas?',	'seleccion_multiple',	'Ignorar el problema',	'Investigar nuevamente y reforzar acciones o cambiar enfoque',	'Repetir la solución anterior',	'b',	22,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10112,	1010,	NULL,	'¿Qué herramienta permite evaluar el impacto de un problema?',	'seleccion_multiple',	'Análisis de impacto o matriz de criticidad',	'Informe de ventas',	'Bitácora de visitas',	'a',	23,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10113,	1010,	NULL,	'¿Cuál es una buena práctica para revisar la efectividad de una solución?',	'seleccion_multiple',	'Cambiar al personal',	'Repetir la solución',	'Verificar resultados y dar seguimiento',	'c',	24,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10114,	1010,	NULL,	'¿Cómo garantizar que un problema no se repita?',	'seleccion_multiple',	'Suspender toda la planta',	'Capacitar, monitorear y verificar cumplimiento continuo',	'Crear nuevo manual',	'b',	25,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10115,	1010,	NULL,	'¿Qué debe hacerse tras implementar una solución temporal?',	'seleccion_multiple',	'Dejarla como definitiva',	'Evaluar y preparar solución permanente',	'Informar al operador',	'b',	26,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10116,	1010,	NULL,	'¿Qué acción se recomienda ante una falla eléctrica general?',	'seleccion_multiple',	'Buscar ayuda en redes',	'Verificar planta, activar respaldo y contactar soporte',	'Esperar a que regrese la luz',	'b',	27,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10117,	1010,	NULL,	'¿Qué debe evitarse en la resolución de problemas?',	'seleccion_multiple',	'Buscar culpables antes de entender el problema',	'Cortar el servicio',	'Llamar al operador',	'a',	28,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10118,	1010,	NULL,	'¿Qué hacer si un problema requiere decisión urgente?',	'seleccion_multiple',	'Esperar la junta de la tarde',	'Aplicar cualquier solución',	'Tomar decisión informada basada en datos y experiencia',	'c',	29,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10119,	1010,	NULL,	'¿Qué actitud fomenta un ambiente de resolución efectiva?',	'seleccion_multiple',	'Gritar para que obedezcan',	'Ordenar sin escuchar',	'Fomentar comunicación, colaboración y liderazgo',	'c',	30,	1,	'2025-06-19 23:25:56',	0,	0.00),
(10120,	1009,	NULL,	'¿Cuál es una función clave del jefe de planta en coordinación con logística?',	'seleccion_multiple',	'Enlazar producción con rutas y tiempos',	'Coordinar entregas, pedidos y programación diaria',	'Organizar pagos y facturas',	'b',	1,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10121,	1009,	NULL,	'¿Qué información debe contener una orden de carga?',	'seleccion_multiple',	'Volumen, hora, tipo de concreto',	'Cliente, destino, hora y tipo de mezcla',	'Nombre del operador y clima',	'b',	2,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10122,	1009,	NULL,	'¿Cómo se confirma la recepción del pedido por parte del cliente?',	'seleccion_multiple',	'Mediante confirmación escrita o digital',	'Solo con llamada',	'Cuando llega el camión',	'a',	3,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10123,	1009,	NULL,	'¿Qué hacer si el cliente cambia la hora de entrega con poca anticipación?',	'seleccion_multiple',	'Reprogramar formalmente e informar a producción',	'Cancelar sin registro',	'Ignorar el cambio',	'a',	4,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10124,	1009,	NULL,	'¿Qué canal debe priorizarse para comunicación con logística?',	'seleccion_multiple',	'Llamadas personales',	'Sistema digital o medios oficiales',	'Redes sociales',	'b',	5,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10125,	1009,	NULL,	'¿Cómo debe documentarse una entrega fuera de horario?',	'seleccion_multiple',	'Solicitar aprobación de dirección',	'Anotar en bitácora y adjuntar remisión',	'No es necesario documentarlo',	'b',	6,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10126,	1009,	NULL,	'¿Cuál es la mejor práctica si hay tráfico y la entrega se retrasará?',	'seleccion_multiple',	'Informar al cliente tras la entrega',	'Contactar al cliente anticipadamente y registrar',	'Esperar y no reportar',	'b',	7,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10127,	1009,	NULL,	'¿Qué debe verificarse antes de despachar un camión?',	'seleccion_multiple',	'Combustible, presión de llantas y ruta',	'Clima y tipo de obra',	'Orden, horario, calidad del concreto y destino',	'c',	8,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10128,	1009,	NULL,	'¿Qué acción tomar si el cliente rechaza una carga en sitio?',	'seleccion_multiple',	'Rebatir con argumentos técnicos',	'Registrar como devolución y analizar causa',	'Descargar sin preguntar',	'b',	9,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10129,	1009,	NULL,	'¿Qué documento debe firmar el cliente al recibir el concreto?',	'seleccion_multiple',	'Carta de presentación',	'Remisión o guía de entrega firmada',	'Bitácora del operador',	'b',	10,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10130,	1009,	NULL,	'¿Cuál es el objetivo de la bitácora de entregas?',	'seleccion_multiple',	'Informar clima del día',	'Verificar cumplimiento, tiempos y observaciones',	'Contar cuántos camiones salieron',	'b',	11,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10131,	1009,	NULL,	'¿Qué información debe conocer el operador antes de salir?',	'seleccion_multiple',	'Clima, ruta, destino, mezcla',	'Solo el clima',	'Destino, horario, mezcla y contacto del cliente',	'c',	12,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10132,	1009,	NULL,	'¿Cómo afecta la mala coordinación logística a la planta?',	'seleccion_multiple',	'Mejora la calidad del concreto',	'Reduce costos de mezcla',	'Genera atrasos, quejas y desperdicio',	'c',	13,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10133,	1009,	NULL,	'¿Qué indicador refleja eficiencia en entregas?',	'seleccion_multiple',	'Índice de puntualidad o cumplimiento de entregas',	'Total de llamadas',	'Horas trabajadas',	'a',	14,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10134,	1009,	NULL,	'¿Qué hacer si el camión regresa con concreto no usado?',	'seleccion_multiple',	'Guardarlo sin registrar',	'Registrar sobrante y evaluar causas',	'Vaciarlo en el terreno',	'b',	15,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10135,	1009,	NULL,	'¿Cómo se puede mejorar la puntualidad en las entregas?',	'seleccion_multiple',	'Solo avisar al operador',	'Optimizar programación y comunicación anticipada',	'Acortar la mezcla',	'b',	16,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10136,	1009,	NULL,	'¿Cuál es el rol del jefe de planta en la programación diaria?',	'seleccion_multiple',	'Cerrar turnos',	'Revisar reportes',	'Asignar horarios, pedidos y equipos según demanda',	'c',	17,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10137,	1009,	NULL,	'¿Qué hacer si hay una doble programación para un mismo cliente?',	'seleccion_multiple',	'Ignorar el segundo pedido',	'Reprogramar y confirmar con ambas partes',	'Cargar primero lo más cercano',	'b',	18,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10138,	1009,	NULL,	'¿Qué herramienta permite visualizar toda la programación del día?',	'seleccion_multiple',	'Bitácora diaria',	'Dashboard de programación o software logístico',	'Calendario de oficina',	'b',	19,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10139,	1009,	NULL,	'¿Qué actitud debe tener el jefe de planta ante una queja del cliente?',	'seleccion_multiple',	'Pasar la queja al operador',	'Escuchar, registrar y dar seguimiento inmediato',	'Culpar a logística',	'b',	20,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10140,	1009,	NULL,	'¿Cómo se actualizan los pedidos urgentes?',	'seleccion_multiple',	'Registrar, comunicar y reprogramar con logística',	'Rechazar la solicitud',	'No hacer nada',	'a',	21,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10141,	1009,	NULL,	'¿Qué debe hacer el jefe si el cliente pide un cambio en el diseño del concreto?',	'seleccion_multiple',	'Confirmar con laboratorio, actualizar orden y documentar',	'Hacer el cambio sin registro',	'Repetir el pedido anterior',	'a',	22,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10142,	1009,	NULL,	'¿Cuál es una consecuencia de una mala atención logística?',	'seleccion_multiple',	'Mejor clima',	'Pérdida de confianza y afectación de operaciones',	'Menos demanda',	'b',	23,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10143,	1009,	NULL,	'¿Cómo se debe gestionar una solicitud de cambio de sitio de entrega?',	'seleccion_multiple',	'Cancelar todo',	'Registrar cambio, confirmar con logística y producción',	'Pedir al operador que decida',	'b',	24,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10144,	1009,	NULL,	'¿Qué práctica permite anticiparse a errores de programación?',	'seleccion_multiple',	'Solicitar más personal',	'Revisar órdenes previas y confirmar con cliente',	'Aumentar inventario',	'b',	25,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10145,	1009,	NULL,	'¿Cuál es el tiempo ideal para confirmar la programación del día siguiente?',	'seleccion_multiple',	'En la mañana',	'Al finalizar la jornada del día anterior',	'Una vez iniciado el despacho',	'b',	26,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10146,	1009,	NULL,	'¿Qué hacer si el cliente reporta falta de comunicación?',	'seleccion_multiple',	'Llamar al jefe inmediato',	'Establecer un canal formal de comunicación y documentar',	'Ignorar el comentario',	'b',	27,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10147,	1009,	NULL,	'¿Cómo debe tratarse un conflicto entre logística y cliente?',	'seleccion_multiple',	'Regañar al operador',	'Culpar al cliente',	'Mediante diálogo, análisis de hechos y reporte formal',	'c',	28,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10148,	1009,	NULL,	'¿Qué documento puede evitar malentendidos en horarios y destinos?',	'seleccion_multiple',	'Orden de carga con datos exactos y firmas',	'Copia de bitácora',	'Foto del camión',	'a',	29,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10149,	1009,	NULL,	'¿Cuál es un resultado deseable de una buena coordinación logística?',	'seleccion_multiple',	'Producción más lenta',	'Clientes satisfechos y entregas puntuales',	'Más cambios en diseño de mezcla',	'b',	30,	1,	'2025-06-19 23:25:46',	0,	0.00),
(10150,	1008,	NULL,	'¿Qué es la mejora continua en una planta de concreto?',	'seleccion_multiple',	'Proceso constante de revisión y optimización de operaciones',	'Ajuste de horarios por turno',	'Reportar fallas al final del día',	'a',	1,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10151,	1008,	NULL,	'¿Cuál es el objetivo principal de implementar indicadores de desempeño?',	'seleccion_multiple',	'Cumplir con los pedidos',	'Medir desempeño y detectar áreas de mejora',	'Ver quién trabaja más',	'b',	2,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10152,	1008,	NULL,	'¿Qué significa enfoque a resultados en el contexto operativo?',	'seleccion_multiple',	'Hacer más tareas',	'Alcanzar metas con eficiencia y calidad',	'Evitar errores',	'b',	3,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10153,	1008,	NULL,	'¿Cuál es una herramienta útil para el análisis de mejoras?',	'seleccion_multiple',	'Hacer juntas',	'Análisis FODA o de causa raíz',	'Control de asistencia',	'a',	4,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10154,	1008,	NULL,	'¿Qué rol tiene el jefe de planta en la mejora continua?',	'seleccion_multiple',	'Liderar procesos, motivar y asegurar cumplimiento de metas',	'Esperar cambios externos',	'Pedir apoyo técnico',	'a',	5,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10155,	1008,	NULL,	'¿Qué se necesita para aplicar una mejora correctamente?',	'seleccion_multiple',	'Solo tener una idea',	'Análisis, recursos y personal capacitado',	'Presupuesto alto',	'b',	6,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10156,	1008,	NULL,	'¿Qué debe hacerse antes de implementar una mejora?',	'seleccion_multiple',	'Ejecutarla de inmediato',	'Evaluar viabilidad, riesgos y recursos necesarios',	'Informar al operador',	'b',	7,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10157,	1008,	NULL,	'¿Cómo puede medirse la eficacia de una mejora aplicada?',	'seleccion_multiple',	'Número de choques',	'Comparando indicadores antes y después',	'Conteo de fallas',	'b',	8,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10158,	1008,	NULL,	'¿Qué práctica fomenta la mejora continua en el personal?',	'seleccion_multiple',	'Sancionar errores',	'Ignorar las propuestas',	'Reconocer ideas, dar seguimiento y capacitar',	'c',	9,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10159,	1008,	NULL,	'¿Cuál es un obstáculo común para la mejora continua?',	'seleccion_multiple',	'Alta rotación',	'Falta de equipo',	'Resistencia al cambio o falta de seguimiento',	'c',	10,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10160,	1008,	NULL,	'¿Qué es un indicador clave de desempeño (KPI)?',	'seleccion_multiple',	'Horario de comida',	'Medición de clima',	'Métrica que refleja desempeño clave del proceso',	'c',	11,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10161,	1008,	NULL,	'¿Cómo se pueden identificar oportunidades de mejora?',	'seleccion_multiple',	'Supervisando al operador',	'Análisis de procesos, quejas, tiempos muertos',	'Cambiando el personal',	'b',	12,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10162,	1008,	NULL,	'¿Qué significa estandarización de procesos?',	'seleccion_multiple',	'Cambiar horarios',	'Uniformar procedimientos y prácticas para asegurar calidad',	'Dar premios',	'b',	13,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10163,	1008,	NULL,	'¿Qué hacer cuando una mejora no da los resultados esperados?',	'seleccion_multiple',	'Dejarla',	'Analizar, ajustar o replantear la estrategia',	'Repetirla constantemente',	'b',	14,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10164,	1008,	NULL,	'¿Cómo se fomenta el enfoque a resultados en el equipo?',	'seleccion_multiple',	'Dar premios',	'Establecer metas claras y retroalimentar el desempeño',	'Evitar comentarios',	'b',	15,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10165,	1008,	NULL,	'¿Qué actitud debe tener el jefe ante errores?',	'seleccion_multiple',	'Culpar al operador',	'Aprender del error, corregir y prevenir',	'Minimizar el problema',	'b',	16,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10166,	1008,	NULL,	'¿Qué se busca al reducir desperdicios?',	'seleccion_multiple',	'Aumentar producción',	'Mejorar eficiencia y reducir costos',	'Disminuir el personal',	'b',	17,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10167,	1008,	NULL,	'¿Qué importancia tiene la retroalimentación del personal?',	'seleccion_multiple',	'No tiene impacto',	'Permite identificar problemas y proponer soluciones',	'Retrasa procesos',	'b',	18,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10168,	1008,	NULL,	'¿Cómo asegurar que una mejora sea sostenible?',	'seleccion_multiple',	'Cambiar personal',	'Capacitar, evaluar y hacer seguimiento continuo',	'Delegar tareas',	'b',	19,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10169,	1008,	NULL,	'¿Qué hacer si un indicador no mejora con el tiempo?',	'seleccion_multiple',	'Abandonarlo',	'Cambiar al jefe',	'Revisar causas, replantear acciones y ajustar metas',	'c',	20,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10170,	1008,	NULL,	'¿Qué debe incluir un plan de mejora?',	'seleccion_multiple',	'Observaciones personales',	'Objetivo, responsables, recursos y tiempos de implementación',	'Lista de tareas del operador',	'b',	21,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10171,	1008,	NULL,	'¿Qué papel tiene la capacitación en la mejora continua?',	'seleccion_multiple',	'Controlar clima',	'Actualizar conocimientos y habilidades del personal',	'Incrementar producción',	'b',	22,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10172,	1008,	NULL,	'¿Qué proceso ayuda a verificar el cumplimiento de objetivos?',	'seleccion_multiple',	'Supervisión directa',	'Asistencia diaria',	'Auditorías internas o revisiones periódicas',	'c',	23,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10173,	1008,	NULL,	'¿Cuál es un ejemplo de mejora enfocada a resultados?',	'seleccion_multiple',	'Reducir personal',	'Aumentar volumen',	'Automatizar mezclado y reducir desperdicio',	'c',	24,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10174,	1008,	NULL,	'¿Qué permite el análisis de tendencias en la producción?',	'seleccion_multiple',	'Evaluar colores',	'Prever fallas o comportamientos futuros',	'Seleccionar equipo',	'b',	25,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10175,	1008,	NULL,	'¿Qué se debe hacer con las buenas prácticas identificadas?',	'seleccion_multiple',	'Ignorarlas',	'Documentar, estandarizar y replicar en otras áreas',	'Guardarlas sin cambios',	'b',	26,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10176,	1008,	NULL,	'¿Qué es el ciclo PHVA?',	'seleccion_multiple',	'Planear, Hacer, Verificar, Actuar',	'Parar, Hablar, Ver, Aplicar',	'Programar, Hacer, Validar, Aprobar',	'a',	27,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10177,	1008,	NULL,	'¿Qué acción genera compromiso con los resultados?',	'seleccion_multiple',	'Castigar errores',	'Involucrar al equipo en metas y resultados',	'Repartir tareas',	'b',	28,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10178,	1008,	NULL,	'¿Cuál es el valor de documentar las mejoras realizadas?',	'seleccion_multiple',	'Facilita auditorías y replicación de mejoras',	'Ocupa espacio',	'Complica procesos',	'a',	29,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10179,	1008,	NULL,	'¿Cómo se integra la mejora continua en la operación diaria?',	'seleccion_multiple',	'Aplicarla cuando haya errores',	'Integrar en procedimientos, indicadores y reuniones',	'Asignarla al operador',	'b',	30,	1,	'2025-06-19 23:25:31',	0,	0.00),
(10180,	1007,	NULL,	'¿Qué documento debe usarse para registrar la producción diaria?',	'seleccion_multiple',	'Hoja de calidad interna',	'Bitácora de producción diaria',	'Permiso de transporte',	'b',	1,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10181,	1007,	NULL,	'¿Cuál es la función principal del registro de mantenimiento?',	'seleccion_multiple',	'Llevar historial de servicios y revisiones',	'Controlar compras',	'Registrar entrada de personal',	'a',	2,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10182,	1007,	NULL,	'¿Qué información contiene una hoja de control de entregas?',	'seleccion_multiple',	'Lista de precios del día',	'Número de placas del proveedor',	'Número de viaje, hora, volumen y destino',	'c',	3,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10183,	1007,	NULL,	'¿Qué se debe hacer con los formatos oficiales después de ser llenados?',	'seleccion_multiple',	'Guardarlos en el mezclador',	'Archivarlos debidamente y respaldarlos',	'Tirarlos después de firmarlos',	'b',	4,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10184,	1007,	NULL,	'¿Cuál es el documento que respalda la salida de concreto premezclado?',	'seleccion_multiple',	'Carta de presentación',	'Bitácora del operador',	'Remisión de entrega firmada',	'c',	5,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10185,	1007,	NULL,	'¿Cada cuándo debe actualizarse el inventario de insumos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10186,	1007,	NULL,	'¿Qué dato es indispensable en la bitácora de producción?',	'seleccion_multiple',	'Clima del día',	'Volumen producido y número de camiones',	'Nombre del visitante',	'b',	7,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10187,	1007,	NULL,	'¿Qué procedimiento se debe seguir ante una falla crítica del equipo?',	'seleccion_multiple',	'Apagar y dejar pasar el turno',	'Llenar reporte, comunicar a mantenimiento y documentar',	'Avisar al cliente directamente',	'b',	8,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10188,	1007,	NULL,	'¿Para qué sirve el reporte de consumo de cemento?',	'seleccion_multiple',	'Medir temperatura del motor',	'Estimar costos de pintura',	'Verificar eficiencia de mezcla y rendimientos',	'c',	9,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10189,	1007,	NULL,	'¿Qué debe incluir el expediente de una obra atendida?',	'seleccion_multiple',	'Copia de la licencia del operador',	'Órdenes de carga, pruebas, remisiones y firmas',	'Comprobante fiscal',	'b',	10,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10190,	1007,	NULL,	'¿Qué documento permite evaluar el cumplimiento de los pedidos?',	'seleccion_multiple',	'Reporte de cumplimiento de entregas',	'Cuadro de horarios',	'Formato de vacaciones',	'a',	11,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10191,	1007,	NULL,	'¿Cómo se garantiza la trazabilidad de un pedido?',	'seleccion_multiple',	'Por llamadas al cliente',	'Solo con número de factura',	'Mediante etiquetas, registros cruzados y firmas',	'c',	12,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10192,	1007,	NULL,	'¿Qué documento contiene especificaciones técnicas del concreto?',	'seleccion_multiple',	'Nota de remisión',	'Carta de presentación',	'Hoja técnica del concreto solicitado',	'c',	13,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10193,	1007,	NULL,	'¿Qué debe hacer el jefe con documentos vencidos?',	'seleccion_multiple',	'Separarlos y retirarlos del archivo activo',	'Pegarlos en pared',	'Firmarlos nuevamente',	'a',	14,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10194,	1007,	NULL,	'¿Qué archivo debe contener firmas de responsables de turno?',	'seleccion_multiple',	'Lista de reproducción',	'Bitácora de turnos o reportes de cierre',	'Recibo de nómina',	'b',	15,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10195,	1007,	NULL,	'¿Qué documento permite controlar el rendimiento del mezclador?',	'seleccion_multiple',	'Lista de asistencia',	'Catálogo de precios',	'Formato de control horario de mezclado',	'c',	16,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10196,	1007,	NULL,	'¿Qué se hace si se detecta una inconsistencia entre el pedido y lo entregado?',	'seleccion_multiple',	'Repetir el despacho',	'Cambiar el pedido sin avisar',	'Registrar, informar y llenar un reporte de no conformidad',	'c',	17,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10197,	1007,	NULL,	'¿Cuál es el medio formal para registrar una no conformidad?',	'seleccion_multiple',	'Nota de compra',	'Formato de reporte de no conformidad',	'Registro de clima',	'b',	18,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10198,	1007,	NULL,	'¿Qué documento se usa para controlar ingresos y egresos de materiales?',	'seleccion_multiple',	'Kardex o formato de almacén',	'Lista de producción mensual',	'Hoja de vida del operador',	'a',	19,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10199,	1007,	NULL,	'¿Qué función cumple un formato de check list de limpieza?',	'seleccion_multiple',	'Solicitar vacaciones',	'Decorar oficinas',	'Verificar cumplimiento de limpieza diaria',	'c',	20,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10200,	1007,	NULL,	'¿Cómo se valida la calidad documental de un formato de producción?',	'seleccion_multiple',	'Solo verificar que tenga logo',	'Pasarlo a Word',	'Revisar datos, firmas, fecha y congruencia',	'c',	21,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10201,	1007,	NULL,	'¿Qué se debe archivar junto con los reportes de ensayo en obra?',	'seleccion_multiple',	'Ensayos de laboratorio y documentos del pedido',	'Manuales del proveedor',	'Fotografías personales',	'a',	22,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10202,	1007,	NULL,	'¿Qué importancia tiene la codificación de documentos?',	'seleccion_multiple',	'Reducir consumo de hojas',	'Evitar confusión y duplicidad documental',	'Aumentar el peso de los formatos',	'b',	23,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10203,	1007,	NULL,	'¿Qué hacer con documentos duplicados en mal estado?',	'seleccion_multiple',	'Guardarlos sin registrar',	'Eliminarlos y generar respaldo digital',	'Doblarlos y reutilizar',	'b',	24,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10204,	1007,	NULL,	'¿Qué permite el control de versiones de formatos?',	'seleccion_multiple',	'Imprimir copias ilimitadas',	'Cambiar formato sin registro',	'Asegurar que se use la versión vigente',	'c',	25,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10205,	1007,	NULL,	'¿Qué se debe hacer al finalizar cada jornada?',	'seleccion_multiple',	'Cerrar formatos del día y firmarlos',	'Guardarlos en la oficina sin firma',	'Solo anotar la hora',	'a',	26,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10206,	1007,	NULL,	'¿Qué documento debe tener la firma del cliente?',	'seleccion_multiple',	'Registro de temperatura',	'Formato de nómina',	'Remisión o bitácora de entrega',	'c',	27,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10207,	1007,	NULL,	'¿Qué registro apoya la planificación del mantenimiento preventivo?',	'seleccion_multiple',	'Lista de compras',	'Calendario de oficina',	'Hoja de programación de mantenimiento',	'c',	28,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10208,	1007,	NULL,	'¿Cuál es la función del cronograma semanal de producción?',	'seleccion_multiple',	'Calcular precios',	'Registrar ausencias',	'Coordinar turnos, pedidos y personal',	'c',	29,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10209,	1007,	NULL,	'¿Qué herramienta administrativa permite analizar tendencias?',	'seleccion_multiple',	'Reporte de clima',	'Bitácora de vacaciones',	'Tablero de control o dashboard',	'c',	30,	1,	'2025-06-19 23:25:21',	0,	0.00),
(10210,	1006,	NULL,	'¿Qué propiedad del concreto evalúa el revenimiento?',	'seleccion_multiple',	'Resistencia a compresión',	'Trabajabilidad',	'Tiempo de fraguado',	'b',	1,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10211,	1006,	NULL,	'¿Cuál es el valor típico de revenimiento para un concreto convencional?',	'seleccion_multiple',	'8 ± 2 cm',	'15 ± 5 cm',	'2 ± 1 cm',	'a',	2,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10212,	1006,	NULL,	'¿Qué equipo se utiliza para medir el contenido de aire en el concreto fresco?',	'seleccion_multiple',	'Esclerómetro',	'Aireador tipo presión',	'Termohigrómetro',	'b',	3,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10213,	1006,	NULL,	'¿Qué prueba se usa para conocer la resistencia a compresión del concreto?',	'seleccion_multiple',	'Ensayo de flexión',	'Ensayo de cilindros a compresión',	'Ensayo de revenimiento',	'b',	4,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10214,	1006,	NULL,	'¿Cuántos días se cura normalmente un cilindro de concreto antes de probarlo a compresión?',	'seleccion_multiple',	'3 días',	'21 días',	'28 días',	'b',	5,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10215,	1006,	NULL,	'¿Qué representa el F’c en un diseño de mezcla?',	'seleccion_multiple',	'Resistencia esperada a compresión',	'Tasa de fraguado',	'Factor de asentamiento',	'a',	6,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10216,	1006,	NULL,	'¿Qué prueba permite determinar el contenido de humedad en agregados?',	'seleccion_multiple',	'Análisis granulométrico',	'Método de secado en horno',	'Ensayo de revenimiento',	'b',	7,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10217,	1006,	NULL,	'¿Qué parámetro afecta directamente la resistencia del concreto?',	'seleccion_multiple',	'Tipo de aditivo',	'Relación agua/cemento',	'Color del agregado',	'b',	8,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10218,	1006,	NULL,	'¿Qué es una mezcla de concreto dosificada por peso?',	'seleccion_multiple',	'Se usa solo en plantas móviles',	'Los materiales se pesan antes de mezclar',	'Depende de la velocidad de la mezcladora',	'b',	9,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10219,	1006,	NULL,	'¿Qué significa una desviación estándar alta en los resultados de resistencia?',	'seleccion_multiple',	'Buena calidad del concreto',	'Variabilidad en el proceso o mezcla',	'Alta trabajabilidad',	'b',	10,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10220,	1006,	NULL,	'¿Qué indica la consistencia del concreto?',	'seleccion_multiple',	'Nivel de pH',	'Facilidad para colocarse y compactarse',	'Tamaño máximo del agregado',	'b',	11,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10221,	1006,	NULL,	'¿Qué norma mexicana regula el muestreo de concreto fresco?',	'seleccion_multiple',	'NMX-C-160-ONNCCE',	'NMX-B-259',	'NMX-C-012',	'a',	12,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10222,	1006,	NULL,	'¿Qué ocurre si se excede la cantidad de agua en la mezcla?',	'seleccion_multiple',	'Se mejora la resistencia',	'Se reduce el volumen',	'Disminuye la resistencia del concreto',	'c',	13,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10223,	1006,	NULL,	'¿Qué medida se toma si los resultados de resistencia son inferiores al F’c?',	'seleccion_multiple',	'Revisar procedimiento y mezcla',	'Aumentar el volumen de entrega',	'Eliminar registros del laboratorio',	'a',	14,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10224,	1006,	NULL,	'¿Qué prueba se usa para verificar el contenido de finos en arena?',	'seleccion_multiple',	'Prueba del frasco de sedimentación',	'Prueba de revenimiento',	'Compresión de mortero',	'a',	15,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10225,	1006,	NULL,	'¿Qué parámetro controla la durabilidad del concreto ante agentes agresivos?',	'seleccion_multiple',	'Color del cemento',	'Permeabilidad',	'Tipo de vibrado',	'b',	16,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10226,	1006,	NULL,	'¿Qué prueba se realiza para comprobar el fraguado del cemento?',	'seleccion_multiple',	'Penetrómetro de mortero',	'Aguja de Vicat',	'Ensayo Marshall',	'b',	17,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10227,	1006,	NULL,	'¿Qué puede causar una segregación del concreto?',	'seleccion_multiple',	'Aditivos bien dosificados',	'Exceso de agua o mala vibración',	'Uso de cemento Portland',	'b',	18,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10228,	1006,	NULL,	'¿Cuál es el objetivo del curado del concreto?',	'seleccion_multiple',	'Disminuir su color',	'Mantener humedad para desarrollo de resistencia',	'Enfriar la mezcla',	'b',	19,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10229,	1006,	NULL,	'¿Qué prueba evalúa la uniformidad del concreto entregado en obra?',	'seleccion_multiple',	'Comparación de revenimiento y temperatura por carga',	'Revisión de facturas',	'Tamaño del camión',	'a',	20,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10230,	1006,	NULL,	'¿Qué se requiere registrar en un formato de control de calidad?',	'seleccion_multiple',	'Temperatura del operador',	'Hora de muestreo, tipo de mezcla, lote y resultados',	'Fecha de compra del cemento',	'b',	21,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10231,	1006,	NULL,	'¿Cuál es el límite recomendado de contenido de aire para concreto estructural?',	'seleccion_multiple',	'1 a 2%',	'9 a 10%',	'4 a 6%',	'c',	22,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10232,	1006,	NULL,	'¿Qué parámetro controla la resistencia inicial del concreto?',	'seleccion_multiple',	'Tamaño del camión',	'Tipo de cemento y temperatura',	'Color del aditivo',	'b',	23,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10233,	1006,	NULL,	'¿Qué herramienta se usa para verificar temperatura del concreto fresco?',	'seleccion_multiple',	'Termómetro infrarrojo',	'Calibrador digital',	'Termómetro de inmersión',	'c',	24,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10234,	1006,	NULL,	'¿Qué norma mexicana establece requisitos para concreto premezclado?',	'seleccion_multiple',	'NMX-C-155-ONNCCE',	'NMX-B-259',	'NMX-D-412',	'a',	25,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10235,	1006,	NULL,	'¿Qué es una prueba de revenimiento fuera de especificación?',	'seleccion_multiple',	'Causa de rechazo del concreto',	'Indicador de mezcla mal dosificada',	'Recomendación para aditivo',	'b',	26,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10236,	1006,	NULL,	'¿Cuál es el volumen estándar del molde cilíndrico para prueba de compresión?',	'seleccion_multiple',	'0.01 m³',	'500 cm³',	'0.015 m³',	'c',	27,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10237,	1006,	NULL,	'¿Qué puede afectar la lectura del contenido de aire?',	'seleccion_multiple',	'Presión atmosférica',	'Sellos del medidor defectuosos',	'Tipo de grava',	'b',	28,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10238,	1006,	NULL,	'¿Por qué es importante controlar el tiempo entre mezcla y colocación?',	'seleccion_multiple',	'Por logística del cliente',	'Para evitar pérdida de trabajabilidad',	'Por consumo de agua',	'b',	29,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10239,	1006,	NULL,	'¿Qué hacer si el concreto presenta sangrado excesivo?',	'seleccion_multiple',	'Agregar más agua',	'Reducir relación a/c o revisar agregados',	'Añadir arena húmeda',	'b',	30,	1,	'2025-06-19 23:25:12',	0,	0.00),
(10240,	1005,	NULL,	'¿Cuál es el equipo de protección obligatorio para ingresar a planta?',	'seleccion_multiple',	'Botas de seguridad, casco, chaleco y gafas',	'Botas, casco, gafas y tapones auditivos',	'Solo chaleco y guantes',	'b',	1,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10241,	1005,	NULL,	'¿Cuál es la función de un análisis de riesgos?',	'seleccion_multiple',	'Registrar accidentes ocurridos',	'Identificar y prevenir condiciones peligrosas',	'Capacitar en primeros auxilios',	'b',	2,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10242,	1005,	NULL,	'¿Qué norma regula las condiciones de seguridad e higiene en centros de trabajo en México?',	'seleccion_multiple',	'NOM-007-STPS',	'NOM-001-STPS',	'NOM-002-SEDE',	'b',	3,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10243,	1005,	NULL,	'¿Qué hacer si se detecta una fuga de gas en planta?',	'seleccion_multiple',	'Cerrar ventanas y continuar operaciones',	'Encender el extractor de aire',	'Evacuar y notificar de inmediato',	'c',	4,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10244,	1005,	NULL,	'¿Qué documento debe acompañar el manejo de sustancias peligrosas?',	'seleccion_multiple',	'Recibo de compra',	'Hoja de datos de seguridad (HDS/MSDS)',	'Certificado de calidad',	'b',	5,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10245,	1005,	NULL,	'¿Qué debe contener un botiquín de emergencia?',	'seleccion_multiple',	'Medicamentos prescritos',	'Material de curación, guantes, manual de uso',	'Solo alcohol y algodón',	'b',	6,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10246,	1005,	NULL,	'¿Qué es un EPP?',	'seleccion_multiple',	'Evaluación Preventiva del Proceso',	'Equipo de Protección Personal',	'Estándar de Procedimiento de Planta',	'b',	7,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10247,	1005,	NULL,	'¿Qué acción es incorrecta ante un derrame químico menor?',	'seleccion_multiple',	'Notificar al supervisor',	'Limpiar sin guantes ni protección',	'Contener el derrame',	'b',	8,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10248,	1005,	NULL,	'¿Cuál es el color de los extintores para fuegos clase A?',	'seleccion_multiple',	'Verde',	'Rojo',	'Azul',	'b',	9,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10249,	1005,	NULL,	'¿Qué hacer si ocurre un accidente leve sin lesiones visibles?',	'seleccion_multiple',	'Continuar trabajando',	'Reportarlo y registrarlo en la bitácora de seguridad',	'Ignorarlo si no afecta producción',	'b',	10,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10250,	1005,	NULL,	'¿Cuál es el propósito de una señal de seguridad?',	'seleccion_multiple',	'Indicar rutas comerciales',	'Advertir o prevenir situaciones de riesgo',	'Promover el uso de uniforme',	'b',	11,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10251,	1005,	NULL,	'¿Qué norma aplica para la señalización de seguridad?',	'seleccion_multiple',	'NOM-026-STPS',	'NOM-030-STPS',	'NOM-009-STPS',	'a',	12,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10252,	1005,	NULL,	'¿Qué extintor se utiliza para incendios eléctricos?',	'seleccion_multiple',	'Agua',	'Espuma',	'Polvo químico seco o CO₂',	'c',	13,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10253,	1005,	NULL,	'¿Con qué frecuencia deben realizarse simulacros de evacuación?',	'seleccion_multiple',	'Cada 5 años',	'Al menos una vez al año',	'Solo en caso de inspección',	'b',	14,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10254,	1005,	NULL,	'¿Qué debe hacer un trabajador que presencia un acto inseguro?',	'seleccion_multiple',	'Filmarlo para redes sociales',	'Reportarlo de inmediato a su superior',	'Repetirlo si no pasa nada',	'b',	15,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10255,	1005,	NULL,	'¿Cuál es la zona de exclusión al operar una mezcladora?',	'seleccion_multiple',	'1 metro',	'5 metros',	'3 metros',	'c',	16,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10256,	1005,	NULL,	'¿Qué hacer si una alarma de emergencia suena durante el turno?',	'seleccion_multiple',	'Esperar instrucciones por radio',	'Evacuar inmediatamente por la ruta señalada',	'Buscar la causa primero',	'b',	17,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10257,	1005,	NULL,	'¿Qué indica una etiqueta amarilla en una herramienta?',	'seleccion_multiple',	'Herramienta nueva',	'Uso restringido o requiere revisión',	'No requiere mantenimiento',	'b',	18,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10258,	1005,	NULL,	'¿Qué procedimiento asegura que un equipo no pueda ser energizado durante mantenimiento?',	'seleccion_multiple',	'Bloqueo y etiquetado (Lockout/Tagout)',	'Manual de usuario',	'Bitácora de mantenimiento',	'a',	19,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10259,	1005,	NULL,	'¿Qué riesgo representa una manguera de aire dañada?',	'seleccion_multiple',	'Ninguno si no se usa',	'Explosión o proyección de partículas',	'Solo pérdida de presión',	'b',	20,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10260,	1005,	NULL,	'¿Qué debe verificarse antes de operar un montacargas?',	'seleccion_multiple',	'Que tenga gasolina',	'Frenos, luces, claxon, horquillas y cinturón',	'Que esté limpio',	'b',	21,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10261,	1005,	NULL,	'¿Qué incluye una inspección de seguridad diaria?',	'seleccion_multiple',	'Condiciones del equipo, rutas de evacuación y EPP',	'Cafetería y baños',	'Revisión de correo electrónico',	'a',	22,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10262,	1005,	NULL,	'¿Qué norma regula los trabajos en altura?',	'seleccion_multiple',	'NOM-005-STPS',	'NOM-009-STPS',	'NOM-003-STPS',	'b',	23,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10263,	1005,	NULL,	'¿Cuándo debe ser capacitado un trabajador en seguridad?',	'seleccion_multiple',	'Una vez al año',	'Solo al ser contratado',	'Al ingreso, al cambiar de puesto o equipo, y periódicamente',	'c',	24,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10264,	1005,	NULL,	'¿Qué riesgo representa un cable pelado en zona húmeda?',	'seleccion_multiple',	'Ninguno si se usa con botas',	'Electrocución',	'Caída por resbalón',	'b',	25,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10265,	1005,	NULL,	'¿Cuál es el propósito de un análisis de incidentes?',	'seleccion_multiple',	'Culpar al operador',	'Prevenir que vuelva a ocurrir',	'Reemplazar al supervisor',	'b',	26,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10266,	1005,	NULL,	'¿Cuál es la forma correcta de almacenar cilindros de gas?',	'seleccion_multiple',	'Verticales, sujetos y con válvula protegida',	'Apilados horizontalmente',	'Junto a materiales combustibles',	'a',	27,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10267,	1005,	NULL,	'¿Qué norma regula el uso de equipo de protección personal?',	'seleccion_multiple',	'NOM-001-STPS',	'NOM-017-STPS',	'NOM-027-STPS',	'b',	28,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10268,	1005,	NULL,	'¿Qué hacer si una persona se desmaya en planta?',	'seleccion_multiple',	'Llamar al jefe de producción',	'Brindar primeros auxilios y solicitar apoyo médico',	'Darle agua y dejarlo reposar',	'b',	29,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10269,	1005,	NULL,	'¿Qué riesgo genera el polvo de cemento en suspensión?',	'seleccion_multiple',	'Moho en la planta',	'Irritación pulmonar y enfermedades respiratorias',	'Solo picazón en la piel',	'b',	30,	1,	'2025-06-19 23:24:56',	0,	0.00),
(10384,	1014,	NULL,	'¿La mezcladora principal se encuentra estructuralmente íntegra, sin fugas, grietas visibles ni desgaste severo en las paletas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10385,	1014,	NULL,	'¿Los motores de la mezcladora operan sin vibraciones anormales, sobrecalentamiento o ruidos extraños?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10386,	1014,	NULL,	'¿El sistema de transmisión (reductores, acoplamientos) funciona correctamente sin fugas de aceite?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10387,	1014,	NULL,	'¿Las paletas mezcladoras mantienen la geometría adecuada y están firmemente sujetas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10388,	1014,	NULL,	'¿El sistema de descarga de la mezcladora opera sin obstrucciones y con sellado adecuado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10389,	1014,	NULL,	'¿Los sensores de posición y límites de la mezcladora funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10390,	1014,	NULL,	'¿El sistema de lubricación automática de la mezcladora opera según programación?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10391,	1014,	NULL,	'¿Las protecciones de seguridad de la mezcladora están instaladas y funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10399,	1014,	NULL,	'¿Las básculas de cemento están calibradas y funcionan dentro de los parámetros de tolerancia especificados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10400,	1014,	NULL,	'¿Las básculas de agregados mantienen la precisión requerida y están libres de interferencias?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10401,	1014,	NULL,	'¿El sistema de dosificación de agua cuenta con medidores calibrados y válvulas en buen estado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10402,	1014,	NULL,	'¿Los sistemas de dosificación de aditivos operan con precisión y están libres de obstrucciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10403,	1014,	NULL,	'¿Las celdas de carga de las básculas están protegidas y funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10404,	1014,	NULL,	'¿Los indicadores de peso son legibles y proporcionan lecturas estables?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10405,	1014,	NULL,	'¿Los sistemas de descarga de las básculas operan sin residuos ni obstrucciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10406,	1015,	NULL,	'¿Los tambores revolvedores mantienen la integridad estructural sin grietas, deformaciones ni corrosión severa?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10407,	1015,	NULL,	'¿El sistema hidráulico de los camiones opera sin fugas y mantiene la presión adecuada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10408,	1015,	NULL,	'¿Las paletas internas del tambor están completas, bien fijadas y con geometría adecuada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10409,	1015,	NULL,	'¿Los motores hidráulicos del tambor funcionan sin ruidos anormales ni sobrecalentamiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10410,	1015,	NULL,	'¿Los neumáticos están en condiciones óptimas con presión adecuada y sin desgaste irregular?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10411,	1015,	NULL,	'¿Los sistemas de frenos operan correctamente y cumplen con las especificaciones de seguridad?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10412,	1015,	NULL,	'¿Las canaletas de descarga están en buenas condiciones y operan sin obstrucciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-06-24 16:49:59',	0,	0.00),
(10413,	1014,	NULL,	'¿Las bandas transportadoras operan sin deslizamientos, desalineaciones o daños en la superficie?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10414,	1014,	NULL,	'¿Los motores y reductores de las bandas funcionan sin vibraciones anormales ni sobrecalentamiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10415,	1014,	NULL,	'¿Los rodillos de soporte están alineados y giran libremente sin desgaste excesivo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10416,	1014,	NULL,	'¿Los sistemas de limpieza de bandas (raspadores) funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10417,	1014,	NULL,	'¿Las protecciones de seguridad de las bandas están instaladas y en buen estado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10418,	1014,	NULL,	'¿Los sensores de velocidad y detección de materiales funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10420,	1014,	NULL,	'¿Los silos de cemento mantienen hermeticidad y están libres de grietas o corrosión?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10421,	1014,	NULL,	'¿Las tolvas de agregados están libres de obstrucciones y sus compuertas operan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10422,	1014,	NULL,	'¿Los sistemas de descarga de silos funcionan sin obstrucciones ni fugas de aire?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10423,	1014,	NULL,	'¿Los sensores de nivel en silos y tolvas proporcionan lecturas precisas y confiables?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10424,	1014,	NULL,	'¿Los sistemas de aireación de silos operan correctamente para mantener fluidez del cemento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10425,	1014,	NULL,	'¿Las estructuras de soporte de silos y tolvas están en condiciones seguras?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:48',	0,	0.00),
(10427,	1014,	NULL,	'¿El sistema de agua cuenta con medidores calibrados y válvulas en buen estado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10428,	1014,	NULL,	'¿Las bombas de agua operan sin fugas y mantienen la presión adecuada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10429,	1014,	NULL,	'¿Los tanques de almacenamiento de agua están limpios y libres de contaminación?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10430,	1014,	NULL,	'¿Los sistemas de dosificación de aditivos funcionan con precisión y están calibrados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10431,	1014,	NULL,	'¿Las tuberías y conexiones están libres de fugas y corrosión?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10432,	1014,	NULL,	'¿Los filtros de agua están limpios y funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10434,	1014,	NULL,	'¿El sistema de control automatizado responde correctamente a los comandos programados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10435,	1014,	NULL,	'¿Los paneles de control están en buenas condiciones y son fácilmente legibles?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10436,	1014,	NULL,	'¿Los sistemas de seguridad (paros de emergencia) funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10437,	1014,	NULL,	'¿El software de control está actualizado y opera sin errores?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10438,	1014,	NULL,	'¿Los sistemas de respaldo (UPS, generadores) están operativos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10439,	1014,	NULL,	'¿Los registros de producción se generan automáticamente y son precisos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10441,	1015,	NULL,	'¿Las bombas de concreto funcionan sin obstrucciones y mantienen el caudal especificado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10442,	1015,	NULL,	'¿Las mangueras y conexiones están libres de desgaste excesivo y fugas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10443,	1015,	NULL,	'¿El sistema hidráulico de las bombas opera sin fugas y con presión adecuada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10444,	1015,	NULL,	'¿Los sistemas de limpieza de tuberías funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10445,	1015,	NULL,	'¿Las válvulas de cambio (S-valve) operan suavemente sin obstrucciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10446,	1015,	NULL,	'¿Los sistemas de control remoto de las bombas funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10448,	1015,	NULL,	'¿Los sistemas de carga de camiones operan eficientemente sin derrames ni desperdicios?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10449,	1015,	NULL,	'¿Las canaletas de carga están en buenas condiciones y permiten flujo controlado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10450,	1015,	NULL,	'¿Los sistemas de posicionamiento de camiones funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10451,	1015,	NULL,	'¿Las básculas de camiones están calibradas y proporcionan lecturas precisas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10452,	1015,	NULL,	'¿Los sistemas de control de tráfico en la planta operan adecuadamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10453,	1015,	NULL,	'¿Las señalizaciones y semáforos de carga funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10455,	1015,	NULL,	'¿Los sistemas de limpieza de camiones funcionan adecuadamente y cuentan con drenaje apropiado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10456,	1015,	NULL,	'¿Las hidrolavadoras mantienen presión adecuada y funcionan sin interrupciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10457,	1015,	NULL,	'¿Los sistemas de reciclaje de agua de lavado operan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10458,	1015,	NULL,	'¿Las áreas de lavado tienen drenajes funcionales y sistemas de contención?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10459,	1015,	NULL,	'¿Los equipos de limpieza de mezcladora están completos y operativos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10460,	1015,	NULL,	'¿Los sistemas de aspiración de residuos funcionan eficientemente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10462,	1016,	NULL,	'¿La prensa de compresión está calibrada y opera dentro de los parámetros de precisión requeridos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10463,	1016,	NULL,	'¿Los moldes para especímenes están en buenas condiciones y libres de deformaciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10464,	1016,	NULL,	'¿La balanza de laboratorio mantiene la precisión requerida y está debidamente calibrada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10465,	1016,	NULL,	'¿Los equipos de curado mantienen temperatura y humedad controladas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10466,	1016,	NULL,	'¿Los instrumentos de medición están calibrados y certificados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10467,	1016,	NULL,	'¿Los equipos de muestreo están completos y en buenas condiciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-06-24 16:52:49',	0,	0.00),
(10468,	1013,	NULL,	'Durante un cambio de turno, un operador nuevo comete un error en la dosificación. El jefe de planta lo nota.',	'seleccion_multiple',	'Llama al operador frente a todos para corregirlo y evitar que se repita.',	'Repara el error, no dice nada y sigue trabajando.',	'Detecta la causa, da retroalimentación en privado y propone una mejora en la rutina.',	'c',	1,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10469,	1013,	NULL,	'El jefe de planta identifica que los operadores no usan el EPP en zonas críticas, pero argumentan que “estorba” durante la jornada.',	'seleccion_multiple',	'Lo deja pasar porque entiende la incomodidad y cree que “no es tan grave”.',	'Menciona que deben usarlo, pero no da seguimiento.',	'Refuerza el uso obligatorio, adapta los turnos si es necesario y reporta formalmente.',	'c',	2,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10470,	1013,	NULL,	'La producción del día estuvo por debajo de lo programado. El jefe de planta debe enviar el reporte a la dirección.',	'seleccion_multiple',	'Ajusta los datos en el sistema para que parezca que se cumplió.',	'Llama a laboratorio para validar si hubo errores en las mediciones.',	'Reporta los datos reales, explica causas y propone acciones correctivas.',	'c',	3,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10471,	1013,	NULL,	'Hay rotación frecuente en el área de operadores. Algunos colaboradores señalan que no reciben apoyo del jefe.',	'seleccion_multiple',	'El jefe de planta dice que es problema de recursos humanos.',	'El jefe organiza una reunión informal para escuchar al equipo y plantea soluciones.',	'Minimiza la situación porque “siempre hay quien no se adapta”.',	'b',	4,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10472,	1013,	NULL,	'Una falla en el sistema automatizado detiene la producción justo antes de una carga urgente para obra.',	'seleccion_multiple',	'Espera al técnico de mantenimiento y suspende entregas hasta nuevo aviso.',	'Reasigna tareas, activa un protocolo de respaldo manual y coordina con logística.',	'Llama a dirección para que decidan qué hacer.',	'b',	5,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10473,	1013,	NULL,	'Dirección general propone un nuevo sistema de análisis de datos en planta.',	'seleccion_multiple',	'Lo considera innecesario porque “así ha funcionado siempre”.',	'Solicita tiempo para revisarlo, pero no da seguimiento.',	'Se involucra, asigna pruebas piloto y evalúa beneficios reales.',	'c',	6,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10474,	1013,	NULL,	'Calidad detecta mezcla fuera de especificación. El jefe de planta lo niega sin revisar, argumentando que “la planta no falla”.',	'seleccion_multiple',	'Desestima la observación y no toma acciones.',	'Dice que probablemente fue un error en obra.',	'Revisa el proceso, analiza datos y convoca reunión con calidad. ',	'c',	7,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10475,	1013,	NULL,	'Un cliente externo reporta una entrega fuera de especificaciones. El operador afirma que cumplió la orden.',	'seleccion_multiple',	'El jefe de planta respalda ciegamente a su operador.',	'Llama al cliente y promete investigar, pero no hace seguimiento.',	'Revisa registros, escucha a ambas partes y documenta el resultado. ',	'c',	8,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10476,	1013,	NULL,	'Un proveedor ofrece al jefe de planta beneficios personales por asignación de pedidos.',	'seleccion_multiple',	'Acepta discretamente si no afecta a la planta.',	'Rechaza la oferta y lo reporta a dirección. ',	'Considera usarlo como oportunidad de “negociar mejores precios”.',	'b',	9,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10477,	1013,	NULL,	'Los operadores relajan los procedimientos de limpieza y cierre de planta al final del turno.',	'seleccion_multiple',	'Lo permite si no afecta la producción inmediata.',	'Refuerza la importancia del procedimiento, verifica cumplimiento y ajusta turnos si es necesario. ',	'Lo menciona en una junta general, pero no revisa si se cumple.',	'b',	10,	1,	'2025-06-25 05:27:02',	1,	0.00),
(10478,	1014,	40,	'¿La tolva o canaleta está fabricada con material resistente a la abrasión y la humedad (acero, polietileno o fibra de alta densidad)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10479,	1014,	40,	'¿Se encuentra libre de deformaciones, corrosión severa, fracturas, fisuras o desgaste extremo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10480,	1014,	40,	'¿La canaleta tiene una pendiente suficiente y uniforme para facilitar el flujo del concreto sin obstrucciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10481,	1014,	40,	'¿La estructura está fijada firmemente o manipulable con seguridad, sin riesgo de caída o vuelco durante la descarga?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10482,	1014,	40,	'¿Cuenta con bordes redondeados o protegidos para evitar cortes o lesiones al operador?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10483,	1014,	40,	'¿El personal que opera la canaleta cuenta con guantes, botas y gafas de seguridad como mínimo? (relación con NOM-017-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10484,	1014,	40,	'¿Está ubicada de forma que no obstruya paso peatonal ni zonas de riesgo eléctrico o de maquinaria en movimiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10485,	1014,	40,	'¿Se limpia después de cada uso para evitar residuos endurecidos que puedan contaminar futuras mezclas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10486,	1014,	40,	'¿Se verifica visualmente que no hay materiales adheridos del colado anterior antes de cada operación?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10487,	1014,	40,	'¿Se registra su condición como parte de la bitácora de limpieza o mantenimiento básico del área de carga/descarga?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10488,	1014,	41,	'¿El tanque se encuentra estructuralmente íntegro, sin fugas, grietas visibles ni óxido severo (en caso de ser metálico)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10489,	1014,	41,	'¿Está correctamente fijado al suelo o sobre base firme y estable, sin inclinación o riesgo de vuelco?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10490,	1014,	41,	'¿Cuenta con tapa funcional que evita ingreso de polvo, residuos u objetos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10491,	1014,	41,	'¿Se utiliza agua clara, sin residuos sólidos, aceites, grasas ni olores extraños?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10492,	1014,	41,	'¿Se mantiene un programa básico de limpieza periódica (mensual o bimestral) del tanque para evitar acumulación de sedimentos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10493,	1014,	41,	'¿El operador revisa visualmente la limpieza del tanque y del agua cada semana?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10494,	1014,	41,	'¿Las conexiones de entrada y salida de agua están bien selladas y etiquetadas (entrada, salida, rebose)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10495,	1014,	41,	'¿Existe una válvula de cierre de emergencia para controlar el flujo hacia la mezcladora o planta?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10496,	1014,	41,	'¿La tubería o manguera de salida está en buenas condiciones, sin fugas, aplastamientos ni improvisaciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10497,	1014,	41,	'¿El tanque está ubicado en un área sin riesgo de colisión con vehículos, caída de objetos o exposición directa al sol extremo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10498,	1014,	41,	'¿Si hay bomba eléctrica, se encuentra con instalación segura, puesta a tierra y protección contra sobrecarga? (NOM-001-SEDE-2012)',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10499,	1014,	41,	'¿Se protege de contaminación cruzada con químicos, combustibles o aceites cercanos? (relación con NOM-018-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10500,	1014,	42,	'¿El silo está correctamente anclado a cimentación firme y nivelada, sin desplazamiento o asentamiento visible?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10501,	1014,	42,	'¿La estructura metálica muestra buen estado, sin corrosión avanzada, pandeo, grietas o soldaduras fracturadas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10502,	1014,	42,	'¿Se cuenta con acceso seguro para inspección (escalera con jaula, descansos y protección anticaídas)? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10503,	1014,	42,	'¿El tubo de llenado tiene conexiones seguras y válvula antirretorno o clapeta para evitar sobrepresión?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10504,	1014,	42,	'¿Cuenta con filtro de polvo en la parte superior para evitar emisiones al ambiente durante el llenado? (recomendado por IMCYC)',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10505,	1014,	42,	'¿Se realiza inspección y limpieza periódica del filtro o válvula de venteo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10506,	1014,	42,	'¿El silo cuenta con sensor de nivel o indicador de llenado funcional (sonoro, luminoso o mecánico)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10507,	1014,	42,	'¿Los vibradores (si existen) están en buen estado y no se activan sin mezcla o sin carga? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10508,	1014,	42,	'¿Las válvulas de mariposa o compuertas abren/cierra correctamente, sin fugas ni bloqueos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10509,	1014,	42,	'¿El área alrededor del silo está libre de obstáculos, derrames de cemento y bien señalizada (acceso restringido, advertencia de polvo)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10510,	1014,	42,	'¿Se cuenta con protecciones contra sobrellenado y presión en el sistema neumático de carga? (válvulas o manómetros funcionales)',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10511,	1014,	42,	'¿Los conductos neumáticos están libres de fugas, firmemente fijados y sin conexiones improvisadas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10512,	1014,	42,	'¿Existe bitácora de inspección del silo (al menos mensual) que incluya nivel, fugas, vibradores y válvulas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10513,	1014,	42,	'¿Se tiene un procedimiento de bloqueo y etiquetado (LOTO) para reparaciones o mantenimiento? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10514,	1014,	43,	'¿La banda se encuentra alineada, sin desgarres, desgaste excesivo o desprendimientos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10515,	1014,	43,	'¿Los rodillos giran correctamente y están libres de residuos, fricción o ruido excesivo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10516,	1014,	43,	'¿Las protecciones de poleas y puntos de atrapamiento están instaladas y firmes? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10517,	1014,	43,	'¿Cuenta con interruptor de paro de emergencia accesible desde ambos extremos? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10518,	1014,	43,	'¿Existe señalización de advertencia y barreras físicas que impidan el acceso a partes móviles?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10519,	1014,	43,	'¿El tablero eléctrico tiene protección térmica y puesta a tierra? (NOM-001-SEDE-2012)',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10520,	1014,	43,	'¿Se realiza mantenimiento preventivo programado (lubricación, tensado, limpieza)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10521,	1014,	43,	'¿Se lleva bitácora de revisión semanal o mensual de rodillos, motor, banda y ajustes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10522,	1014,	43,	'¿La banda opera sin vibraciones o interrupciones anormales durante la carga?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10523,	1014,	43,	'¿El cargador muestra estructura sólida, sin fugas de aceite o refrigerante, sin grietas o golpes severos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10524,	1014,	43,	'¿Cuenta con documentación vigente (bitácora de mantenimiento, seguro, verificación mecánica si circula fuera de la planta)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10525,	1014,	43,	'¿Funciona correctamente el sistema de frenos, luces, claxon y marcha atrás con alarma sonora? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10526,	1014,	43,	'¿El operador está capacitado y cuenta con EPP completo (chaleco, casco, botas, protección auditiva)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10527,	1014,	43,	'¿Se realiza inspección diaria antes de operar (niveles, llantas, frenos, fugas)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10528,	1014,	44,	'¿Las tolvas están bien ancladas a la cimentación, sin hundimientos ni asentamientos desiguales?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10529,	1014,	44,	'¿Las paredes internas están limpias, sin acumulación de material, corrosión severa o desprendimiento de placas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10530,	1014,	44,	'¿Los compartimientos están separados correctamente, sin mezcla o contaminación cruzada entre agregados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10531,	1014,	44,	'¿Cuenta con escaleras seguras, con barandales, jaulas y plataformas de acceso para inspección? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10532,	1014,	44,	'¿Las compuertas o mecanismos de descarga están en buen estado, sin bloqueos o fugas no controladas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10533,	1014,	44,	'¿Se realiza limpieza periódica y bitácora de inspección semanal del interior de tolvas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10534,	1014,	44,	'¿Las tolvas cuentan con cubierta superior o lona para evitar ingreso de agua o materiales extraños? (NOM-006-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10535,	1014,	44,	'¿Se observa alimentación adecuada (por banda o cargador), sin segregación o derrames excesivos en el perímetro?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10536,	1014,	44,	'¿Las vibraciones (si existen) o dispositivos auxiliares están funcionando correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10537,	1014,	44,	'¿Los vibradores o compuertas eléctricas cuentan con tablero protegido, tierra física y botón de paro de emergencia? (NOM-001-SEDE-2012 y NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10538,	1014,	44,	'¿Existe protección perimetral para evitar acceso de personal a zonas de carga o atrapamiento? (barreras físicas o señalización clara)',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10539,	1014,	45,	'¿Se identifican las básculas individuales para cada componente (cemento, agua y agregados)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10540,	1014,	45,	'¿Se encuentra debidamente fijado y nivelado, sin riesgo de caída o movimiento accidental?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10541,	1014,	45,	'¿La báscula de agregados tiene estructura sólida y sin corrosión severa?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10542,	1014,	45,	'¿Las compuertas de descarga operan sin bloqueos, fugas o atascamientos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10543,	1014,	45,	'¿Cuenta con celda de carga funcional o indicador visual confiable (básculas mecánicas)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10544,	1014,	45,	'¿Se realiza calibración al menos una vez cada 6 meses, según lo exige la NOM-010-SCFI?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10545,	1014,	45,	'¿Existe registro o constancia de la calibración reciente, firmada por responsable o proveedor autorizado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10546,	1014,	45,	'¿La báscula del cemento está cerrada y sellada, evitando ingreso de humedad o polvo al sistema de pesaje?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10547,	1014,	45,	'¿La descarga es fluida y sin acumulaciones en la compuerta inferior?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10548,	1014,	45,	'¿La medición es precisa y sin fluctuaciones al cargar o descargar?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10549,	1014,	45,	'¿El sistema cuenta con válvulas de cierre manual o automático para detener la carga sin derrames?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10550,	1014,	45,	'¿Se encuentra calibrado y verificado con frecuencia mínima anual o por lote si hay fallas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10551,	1014,	45,	'¿Las básculas están limpias, libres de material acumulado o interferencias mecánicas en los sensores o resortes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10552,	1014,	45,	'¿Las básculas cuentan con protección física y señalización de seguridad en zona de operación? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10553,	1014,	45,	'¿Se lleva bitácora de revisión periódica (ajustes, limpieza, calibración)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10554,	1014,	46,	'¿El cuerpo del mezclador presenta estructura firme, sin corrosión severa ni fisuras visibles?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10555,	1014,	46,	'¿El tambor o eje gira sin vibraciones anormales, ruidos excesivos o golpeteos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10556,	1014,	46,	'¿Las aspas internas están completas, bien sujetas y sin deformaciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10557,	1014,	46,	'¿La compuerta o sistema de descarga funciona suavemente, sin atascos ni fugas de mezcla?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10558,	1014,	46,	'¿El mezclador tiene placa de identificación con capacidad nominal (0.5 a 1.0 m³ por ciclo)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10559,	1014,	46,	'¿Se realiza mezcla completa sin presencia de segregación o material mal integrado? (verificación visual o reporte del operador)',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10560,	1014,	46,	'¿El tiempo de mezclado y secuencia (carga–mezcla–descarga) está documentado o estandarizado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10561,	1014,	46,	'¿El mezclador cuenta con botón de paro de emergencia accesible, visible y funcional? (NOM-004-STPS)',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10562,	1014,	46,	'¿Existen guardas físicas en bandas, ejes y puntos de atrapamiento? (con señalización de advertencia)',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10563,	1014,	46,	'¿Hay señalización de seguridad visible sobre riesgo de atrapamiento, voltaje, o uso exclusivo del operador?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10564,	1014,	46,	'¿Cuenta con botón de paro de emergencia accesible, de acuerdo con la NOM-004-STPS-2023?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10565,	1014,	46,	'¿Existe una puesta a tierra física verificada y etiquetada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10566,	1014,	46,	'¿El tablero de control está en buen estado, con conexión a tierra, sin cables expuestos o sueltos? (NOM-001-SEDE-2012)',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10567,	1014,	46,	'¿El motor presenta arranque y frenado sin fallas, sin sobrecalentamiento o sonidos irregulares?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10568,	1014,	46,	'¿Se realiza mantenimiento periódico con bitácora de revisión (engrase, limpieza, inspección)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:23:17',	0,	0.00),
(10569,	1019,	47,	'¿La báscula cuenta con capacidad adecuada al uso previsto (mínimo 10 kg para ensayos, hasta 500 kg o más para mezclas)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10570,	1019,	47,	'¿Tiene una precisión mínima de ±10 g para usos generales, o ±1 g si se usa en ensayos de laboratorio?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10571,	1019,	47,	'¿La pantalla digital es clara y permite lectura inmediata sin errores?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10572,	1019,	47,	'¿Cuenta con tara funcional para contenedores y materiales auxiliares?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10573,	1019,	47,	'¿El equipo enciende correctamente y se estabiliza rápido antes de la medición?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10574,	1019,	47,	'¿La superficie de pesaje está limpia, nivelada y sin daños visibles?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10575,	1019,	47,	'¿El personal realiza pesajes en zonas sin vibraciones, corrientes de aire ni humedad excesiva?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10576,	1019,	47,	'¿Se verifica que no existan variaciones visibles de peso al repetir mediciones bajo las mismas condiciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10577,	1019,	47,	'¿La báscula tiene calibración vigente con patrón trazable a una entidad reconocida (mínimo una vez al año)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10578,	1019,	47,	'¿Cuenta con etiqueta de calibración con fecha, folio y responsable?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10579,	1019,	47,	'¿Se cuenta con bitácora de mantenimiento o calibración?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10580,	1019,	47,	'¿Se realiza una verificación interna periódica con pesas patrón o testigos conocidos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10581,	1019,	48,	'¿El sensor es adecuado para agregados (fino, grueso o ambos)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10582,	1019,	48,	'¿El modelo del sensor especifica el rango de humedad (%) que puede medir y su precisión?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10583,	1019,	48,	'¿Cuenta con calibración de fábrica o permite ajustes según tipo de material?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10584,	1019,	48,	'¿El sensor está libre de daño físico, oxidación o mal funcionamiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10585,	1019,	48,	'¿El sensor se usa en puntos representativos del acopio y no solo en la superficie del material?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10586,	1019,	48,	'¿El personal realiza lecturas constantes al menos una vez por turno o antes de cambios de mezcla?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10587,	1019,	48,	'¿Se verifican lecturas contra método gravimétrico (ASTM C566) de forma periódica?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10588,	1019,	48,	'¿Se registran los valores de humedad en la bitácora o control de planta?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10589,	1019,	48,	'¿Se limpia después de cada uso para evitar falsos positivos por humedad adherida?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10590,	1019,	48,	'¿Se verifica la carga (pilas o batería) y estado del display o indicadores?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10591,	1019,	48,	'¿Cuenta con manual de operación accesible y personal capacitado para su uso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10592,	1019,	49,	'¿Todos los equipos motorizados (mezcladora, banda, compresor, tablero eléctrico) cuentan con al menos un interruptor de paro de emergencia accesible?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10593,	1019,	49,	'¿Los interruptores están ubicados en un lugar visible y alcanzable fácilmente sin necesidad de esquivar obstáculos o agacharse?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10594,	1019,	49,	'¿Tiene suficiente batería o fuente de energía confiable?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10595,	1019,	49,	'¿Se puede accionar con la mano o el cuerpo en menos de 1 segundo en caso de riesgo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10596,	1019,	49,	'¿El botón es de color rojo con fondo amarillo, y tiene forma de hongo o cabezal de golpe (tipo pulsador de golpe)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10597,	1019,	49,	'¿El botón tiene acción de enclavamiento (una vez presionado, permanece activado hasta que se libere manualmente)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10598,	1019,	49,	'¿El mecanismo corta la energía de forma inmediata y completa al sistema controlado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10599,	1019,	49,	'¿El sistema no reinicia automáticamente al liberar el botón sin verificación previa?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10600,	1019,	49,	'¿Se prueba periódicamente (por lo menos cada mes) su funcionamiento real?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10601,	1019,	49,	'¿No presenta daños visibles, piezas sueltas o cables expuestos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10602,	1019,	49,	'¿El personal conoce la ubicación y uso del botón de emergencia?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10603,	1019,	50,	'¿El tablero está limpio, cerrado, sin perforaciones expuestas ni acumulación de polvo, agua o materiales extraños?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10604,	1019,	50,	'¿Se encuentra debidamente fijado y nivelado, sin riesgo de caída o movimiento accidental?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10605,	1019,	50,	'¿Se encuentra ubicado en un sitio protegido del sol directo, lluvia y vibraciones excesivas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10606,	1019,	50,	'¿Cuenta con rótulo exterior claro con el nombre del equipo, voltaje y datos del fabricante?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10607,	1019,	50,	'¿Todos los interruptores y botones están etiquetados con su función (mezcla, descarga, agua, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10608,	1019,	50,	'¿El tablero incluye diagrama unifilar o instructivo básico visible?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10609,	1019,	50,	'¿El cableado interno está organizado, sin empalmes improvisados ni aislamiento deteriorado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10610,	1019,	50,	'¿Incluye interruptor termomagnético, relevadores o protecciones para cada circuito?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10611,	1019,	50,	'¿Los botones de operación están en buen estado y responden correctamente al tacto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10612,	1019,	50,	'¿Cuenta con botón de paro de emergencia accesible, de acuerdo con la NOM-004-STPS-2023?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10613,	1019,	50,	'¿Existe una puesta a tierra física verificada y etiquetada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10614,	1019,	50,	'¿El tablero permite controlar por separado cada parte del proceso (mezcla, alimentación, descarga)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10615,	1019,	50,	'¿Permite detener el proceso en cualquier momento manualmente sin riesgo de daño al equipo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10616,	1019,	50,	'¿El personal operador conoce el uso del tablero y ha sido capacitado en su operación y riesgos eléctricos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10617,	1019,	50,	'¿Se cuenta con bitácora de revisión o mantenimiento del tablero?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10618,	1019,	50,	'¿Se realiza limpieza preventiva, revisión de conexiones, y prueba de funcionamiento al menos una vez al mes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:25:36',	0,	0.00),
(10619,	1016,	51,	'¿La prensa está en buenas condiciones físicas (estructura, platinas, cilindro hidráulico, marco)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10620,	1016,	51,	'¿No hay fugas de aceite hidráulico, ni ruidos o vibraciones anormales al operar?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10621,	1016,	51,	'¿La platina superior se desplaza de manera uniforme y centrada durante la aplicación de carga?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10622,	1016,	51,	'¿El operador utiliza EPP adecuado (gafas de seguridad, guantes, protección auditiva si aplica)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10623,	1016,	51,	'¿El área de trabajo tiene protección contra proyección de fragmentos durante la rotura? (pantalla de acrílico, cabina, escudo metálico)',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10624,	1016,	51,	'¿Cuenta con botón de paro de emergencia accesible y funcional?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10625,	1016,	51,	'¿Los controles están etiquetados claramente y son de operación sencilla y segura?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10626,	1016,	51,	'¿Se limpia regularmente el área para evitar restos de concreto, fragmentos o grasa que interfieran en la operación?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10627,	1016,	51,	'¿La prensa cuenta con certificado de calibración vigente (anual o según norma del proveedor acreditado)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10628,	1016,	51,	'¿La lectura de carga (kN o MPa) es digital, precisa, y el equipo tiene resolución adecuada para concreto estructural (±1%)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10629,	1016,	51,	'¿Se encuentra visible la placa de identificación con número de serie, capacidad y fabricante?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10630,	1016,	51,	'¿Se verifica que el tiempo de carga cumpla con lo especificado (por ejemplo, 0.25 ± 0.05 MPa/s)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10631,	1016,	51,	'¿El laboratorio lleva bitácora de ensayos con fecha, número de muestra, edad del cilindro, carga máxima y resistencia calculada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10632,	1016,	51,	'¿Las muestras están debidamente identificadas con código, fecha de colado y edad?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10633,	1016,	51,	'¿Se respetan las condiciones de curado (temperatura y humedad) hasta el momento de ensayo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10634,	1016,	51,	'¿Los resultados se entregan con carta membretada, firma del responsable técnico y trazabilidad al equipo utilizado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10635,	1016,	52,	'¿El tanque está en buen estado estructural (sin fisuras, fugas, óxido o deformaciones)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10636,	1016,	52,	'¿Las paredes internas están limpias y libres de acumulación de lama, sarro o residuos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10637,	1016,	52,	'¿El fondo del tanque está libre de objetos que afecten el apoyo uniforme de los especímenes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10638,	1016,	52,	'¿Se mantiene la temperatura del agua en el rango de 23 ± 2 °C?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10639,	1016,	52,	'¿Se mide y registra la temperatura del tanque diariamente con termómetro confiable?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10640,	1016,	52,	'¿El nivel del agua cubre completamente los especímenes durante todo el tiempo de curado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10641,	1016,	52,	'¿Hay circulación o recambio del agua al menos cada 7 días para evitar contaminación?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10642,	1016,	52,	'¿El agua utilizada está libre de productos químicos que alteren el curado (sin aceites, sales, desinfectantes agresivos)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10643,	1016,	52,	'¿Los especímenes están debidamente identificados (etiquetas, grabado o código permanente)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10644,	1016,	52,	'¿Se colocan en posición vertical, sin contacto entre ellos y con separación mínima?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10645,	1016,	52,	'¿Existe bitácora o registro del ingreso de cada cilindro (fecha de colado, edad de ruptura, ubicación en el tanque)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10646,	1016,	52,	'¿Se evita el uso del mismo tanque para diferentes edades sin separación clara?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10647,	1016,	52,	'¿El tanque cuenta con tapa o cubierta que evite contaminación externa (hojas, polvo, insectos)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10648,	1016,	52,	'¿Hay registro del mantenimiento o limpieza del tanque?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10649,	1016,	52,	'¿Se tiene termómetro o data logger visible y calibrado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10650,	1016,	53,	'¿El cronómetro está libre de daños visibles, grietas, pantalla ilegible o botones defectuosos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10651,	1016,	53,	'¿El cronómetro inicia, pausa y reinicia correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10652,	1016,	53,	'¿Tiene suficiente batería o fuente de energía confiable?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10653,	1016,	53,	'¿El cronómetro tiene una resolución mínima de 1 segundo o mejor?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10654,	1016,	53,	'¿Se ha comparado al menos una vez al año contra una fuente confiable (reloj patrón, teléfono sincronizado, GPS, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10655,	1016,	53,	'¿Se documentó esta verificación con fecha y firma del responsable?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10656,	1016,	53,	'¿El cronómetro se encuentra dentro de una tolerancia aceptable de ±2 segundos por minuto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10657,	1016,	53,	'¿El personal lo utiliza para registrar tiempos críticos durante ensayos y procedimientos en campo o laboratorio?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10658,	1016,	53,	'¿Se utiliza un cronómetro independiente (no reloj de pulso) para ensayos normados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10659,	1016,	53,	'¿El cronómetro se limpia y almacena en lugar seco y protegido?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10660,	1016,	54,	'¿La balanza está limpia, sin restos de cemento, agregados o materiales que alteren su lectura?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10661,	1016,	54,	'¿El plato de pesaje está firme, nivelado y libre de daños o desajustes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10662,	1016,	54,	'¿El display es legible y todos los botones funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10663,	1016,	54,	'¿La balanza se encuentra instalada en superficie estable, sin vibraciones ni exposición a corrientes de aire?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10664,	1016,	54,	'¿La capacidad máxima es adecuada para los materiales que se pesan (mínimo 5 kg para materiales, 20 kg para especímenes)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10665,	1016,	54,	'¿La resolución es al menos de 0.1 g para uso en laboratorio, o 1 g en equipos de campo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10666,	1016,	54,	'¿Tiene función de tara y esta funciona correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10667,	1016,	54,	'¿La balanza es usada con recipiente seco y limpio, y se tara antes de cada pesaje?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10668,	1016,	54,	'¿Cuenta con calibración vigente por laboratorio acreditado (máx. 1 año)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10669,	1016,	54,	'¿Se realiza una verificación interna frecuente con pesas patrón?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10670,	1016,	54,	'¿Existe bitácora de calibración/verificación con fecha, responsable y resultados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10671,	1016,	54,	'¿Las pesas utilizadas tienen certificado de trazabilidad?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10672,	1016,	54,	'¿Se protege con campana o cubierta contra polvo y humedad cuando no está en uso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10673,	1016,	54,	'¿Está conectada a una fuente estable o regulada (evitando variaciones de voltaje)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10674,	1016,	55,	'¿La balanza está limpia, sin restos de cemento, agregados o materiales que alteren su lectura?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10675,	1016,	55,	'¿El plato de pesaje está firme, nivelado y libre de daños o desajustes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10676,	1016,	55,	'¿El display es legible y todos los botones funcionan correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10677,	1016,	55,	'¿La balanza se encuentra instalada en superficie estable, sin vibraciones ni exposición a corrientes de aire?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10678,	1016,	55,	'¿La capacidad máxima es adecuada para los materiales que se pesan (mínimo 5 kg para materiales, 20 kg para especímenes)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10679,	1016,	55,	'¿La resolución es al menos de 0.1 g para uso en laboratorio, o 1 g en equipos de campo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10680,	1016,	55,	'¿Tiene función de tara y esta funciona correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10681,	1016,	55,	'¿La balanza es usada con recipiente seco y limpio, y se tara antes de cada pesaje?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10682,	1016,	55,	'¿Cuenta con calibración vigente por laboratorio acreditado (máx. 1 año)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10683,	1016,	55,	'¿Se realiza una verificación interna frecuente con pesas patrón?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10684,	1016,	55,	'¿Existe bitácora de calibración/verificación con fecha, responsable y resultados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10685,	1016,	55,	'¿Las pesas utilizadas tienen certificado de trazabilidad?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10686,	1016,	55,	'¿Se protege con campana o cubierta contra polvo y humedad cuando no está en uso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10687,	1016,	55,	'¿Está conectada a una fuente estable o regulada (evitando variaciones de voltaje)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10688,	1016,	56,	'¿El cono tiene la forma troncocónica correcta? (20 cm de diámetro inferior, 10 cm superior, 30 cm de altura)',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10689,	1016,	56,	'¿Está fabricado en metal no deformable (acero galvanizado o inoxidable)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10690,	1016,	56,	'¿Las asas están firmes y permiten levantar el cono verticalmente sin esfuerzo excesivo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10691,	1016,	56,	'¿La superficie interior y exterior del cono está lisa y sin oxidación, abolladuras ni residuos adheridos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10692,	1016,	56,	'¿Cuenta con base rígida y lisa, resistente a deformaciones, como acero o acrílico de al menos 2 mm de espesor?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10693,	1016,	56,	'¿Se dispone de varilla de compactación cilíndrica, de 16 ± 2 mm de diámetro y 600 ± 5 mm de longitud, con punta redondeada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10694,	1016,	56,	'¿El personal aplica el procedimiento normado (3 capas, 25 golpes por capa, remoción vertical en 5-10 s)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10695,	1016,	56,	'¿El cono se humedece antes de su uso como indica la norma?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10696,	1016,	56,	'¿Se limpia el cono después de cada uso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10697,	1016,	56,	'¿Se mide el revenimiento inmediatamente tras retirar el cono (sin retrasos)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10698,	1016,	56,	'¿Se verifica periódicamente que el cono no esté deformado (medición de altura y diámetros)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10699,	1016,	56,	'¿Se cuenta con bitácora o registro de inspección o mantenimiento del cono?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10700,	1016,	56,	'¿El equipo es exclusivo para revenimiento (no se utiliza para otras tareas de mezcla o limpieza)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10701,	1016,	57,	'¿La varilla es cilíndrica, de acero liso, sin dobleces, óxido ni rebabas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10702,	1016,	57,	'¿Tiene un diámetro de 16 ± 2 mm (5/8\")?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10703,	1016,	57,	'¿Tiene una longitud de 600 ± 5 mm?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10704,	1016,	57,	'¿El extremo está redondeado como lo indica la norma (evita daño a moldes o especímenes)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10705,	1016,	57,	'¿Se utiliza exclusivamente para compactación de concreto, no para otros usos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10706,	1016,	57,	'¿Se limpia después de cada uso para evitar adherencia de concreto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10707,	1016,	57,	'¿Se guarda protegida en estuche, tubo o superficie sin humedad ni suciedad?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10708,	1016,	58,	'¿La mesa tiene superficie metálica rígida, lisa y nivelada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10709,	1016,	58,	'¿La base tiene tope o reborde para fijar el molde y evitar desplazamiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10710,	1016,	58,	'¿El sistema de sujeción (bisagra, brazo o resorte) permite elevar y soltar la mesa con un movimiento libre de trabas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10711,	1016,	58,	'¿Produce sacudidas consistentes (mínimo 2 sacudidas por segundo durante 15 segundos)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10712,	1016,	58,	'¿La superficie de trabajo está limpia y sin residuos de concreto endurecido?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10713,	1016,	58,	'¿Se aplica solo cuando lo requiere el procedimiento según la fluidez del concreto o norma específica?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10714,	1016,	58,	'¿Se inspecciona regularmente el sistema de sacudida para verificar que esté firme y operativo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10715,	1016,	58,	'¿Se registra su uso o mantenimiento en bitácora de laboratorio?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10716,	1016,	59,	'¿Los moldes tienen dimensiones normadas de 150 mm de diámetro por 300 mm de altura (±2 mm)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10717,	1016,	59,	'¿Están hechos de metal rígido (acero o aluminio) o plástico reforzado con suficiente rigidez?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10718,	1016,	59,	'¿Las superficies internas son lisas, sin óxido, residuos ni deformaciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10719,	1016,	59,	'¿Las bases y tapas (si aplica) ajustan correctamente y no permiten fugas de lechada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10720,	1016,	59,	'¿Se ensamblan correctamente y se colocan sobre superficie rígida y nivelada al momento del colado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10721,	1016,	59,	'¿Se utiliza agente desmoldante adecuado para evitar adherencias y no contaminar el concreto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10722,	1016,	59,	'¿Se verifica que estén bien cerrados y no presenten fuga al momento de colocar el concreto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10723,	1016,	59,	'¿Se limpian inmediatamente después del desmoldeo y se almacenan protegidos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10724,	1016,	59,	'¿Se inspeccionan regularmente por desgaste, deformaciones, rebabas, óxido o fisuras?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10725,	1016,	59,	'¿Cuentan con identificación visible o sistema de control (número o código)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10726,	1016,	59,	'¿Existe registro de inspección o bitácora de mantenimiento (opcional, recomendable para laboratorios acreditados)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:27:24',	0,	0.00),
(10727,	1017,	60,	'¿Las herramientas están limpias, en buen estado y libres de óxido, astillado o deformaciones?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10728,	1017,	60,	'¿Las llaves, dados y desarmadores no presentan grietas, redondeo excesivo, filos rotos o desgaste irregular?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10729,	1017,	60,	'¿Las herramientas tienen mangos o recubrimientos intactos, sin madera astillada ni aislantes rotos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10730,	1017,	60,	'¿No se observan herramientas modificadas de forma improvisada (soldadas, lijadas, dobladas)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10731,	1017,	60,	'¿El personal que las utiliza cuenta con EPP mínimo requerido: guantes, lentes de seguridad, ropa ajustada? (NOM-017-STPS-2023)',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10732,	1017,	60,	'¿Las herramientas de golpe (martillos, punzones) tienen cabezas firmes y no presentan astillamiento en el filo o cuña?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10733,	1017,	60,	'¿Las herramientas con aislamiento (si se usan en instalaciones eléctricas) están debidamente identificadas y certificadas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10734,	1017,	60,	'¿Las herramientas están almacenadas en cajas, gabinetes o paneles designados, y no en el suelo o en zonas de paso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10735,	1017,	60,	'¿Existe un sistema básico de control de herramientas (inventario, asignación o bitácora de uso)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10736,	1017,	60,	'¿Se cuenta con repuestos o reemplazos de las herramientas de mayor uso o desgaste frecuente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10737,	1017,	61,	'¿Todos los envases de lubricantes y grasas están claramente etiquetados con nombre, marca y tipo de sustancia?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10738,	1017,	61,	'¿Las etiquetas incluyen advertencias de seguridad, pictogramas o frases de riesgo (inflamable, irritante, etc.)? (NOM-005-STPS-2008)',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10739,	1017,	61,	'¿Se evita el uso de envases reutilizados o sin etiquetado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10740,	1017,	61,	'¿Los lubricantes y grasas se almacenan en un lugar techado, ventilado y protegido del sol y calor excesivo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10741,	1017,	61,	'¿El área de almacenamiento cuenta con bandejas o contención para derrames?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10742,	1017,	61,	'¿Están separados de fuentes de ignición y sustancias incompatibles (ácidos, solventes fuertes)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10743,	1017,	61,	'¿Se cuenta con un extintor cerca y señalización visible en la zona? (recomendado: polvo químico seco tipo ABC)',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10744,	1017,	61,	'¿El personal que aplica grasas o lubricantes utiliza guantes de nitrilo/neopreno y lentes de seguridad? (NOM-017-STPS-2023)',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10745,	1017,	61,	'¿Las pistolas de engrase, botes o aplicadores se encuentran en buen estado, sin fugas ni desgaste?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10746,	1017,	61,	'¿No se observan residuos, charcos, derrames o fugas en la zona de aplicación o almacenamiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10747,	1017,	61,	'¿Se cuenta con material absorbente (aserrín, polvo absorbente, trapos) para limpieza inmediata de derrames?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10748,	1017,	61,	'¿Existe un inventario básico de los tipos de lubricantes y sus usos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10749,	1017,	61,	'¿Se registra el uso o recarga de lubricantes en bitácoras de mantenimiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10750,	1017,	61,	'¿Se verifican fechas de caducidad o vencimiento en los productos almacenados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10751,	1017,	62,	'¿El compresor se encuentra limpio, sin fugas de aceite o aire visibles?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10752,	1017,	62,	'¿El tanque no presenta corrosión, abolladuras ni reparaciones improvisadas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10753,	1017,	62,	'¿El manómetro de presión está visible, operativo y marca adecuadamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10754,	1017,	62,	'¿El regulador de presión funciona correctamente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10755,	1017,	62,	'¿Cuenta con válvula de purga (drenado) operativa en el fondo del tanque?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10756,	1017,	62,	'¿Tiene válvula de alivio de presión (válvula de seguridad) y está en buen estado? (Obligatoria según NOM-020-STPS si aplica)',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10757,	1017,	62,	'¿Las mangueras están libres de fugas, cortes, abultamientos o empates improvisados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10758,	1017,	62,	'¿Los acoplamientos (rápidos o roscados) están seguros y sin fugas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10759,	1017,	62,	'¿Se encuentra en uso con EPP adecuado: lentes, orejeras y guantes? (NOM-017-STPS-2023)',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10760,	1017,	62,	'¿Tiene interruptor de encendido protegido y en buen estado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10761,	1017,	62,	'¿Se coloca sobre una superficie nivelada y libre de obstáculos o charcos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10762,	1017,	62,	'¿No se opera en zonas cerradas sin ventilación (por riesgo de sobrecalentamiento)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10763,	1017,	62,	'¿Durante su uso no hay personas cerca de las mangueras bajo presión o sin protección?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10764,	1017,	62,	'¿Se lleva bitácora de purga del tanque (mínimo semanal) para evitar acumulación de agua?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10765,	1017,	62,	'¿Tiene mantenimiento preventivo (cambio de aceite, revisión de filtro, limpieza) documentado cada 3-6 meses?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10766,	1017,	62,	'¿El número de serie o identificación del compresor es visible para registro o inventario?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10767,	1017,	63,	'¿La hidrolavadora se encuentra en buen estado físico general, sin partes rotas, corroídas o sueltas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10768,	1017,	63,	'¿El motor (eléctrico o de combustión) enciende correctamente y trabaja sin ruidos anormales ni fugas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10769,	1017,	63,	'¿La bomba genera presión constante y no presenta fugas por conexiones, empaques o boquillas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10770,	1017,	63,	'¿Las mangueras están en buen estado, sin cortes, abultamientos o acoples improvisados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10771,	1017,	63,	'¿La boquilla o lanza está firme, sin fisuras ni fugas, y puede ser controlada fácilmente por el operador?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10772,	1017,	63,	'¿El personal que la opera utiliza el EPP adecuado: botas antiderrapantes, lentes o careta, guantes impermeables? (NOM-017-STPS-2023)',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10773,	1017,	63,	'¿La hidrolavadora tiene interruptor de encendido/apagado accesible y en buen estado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10774,	1017,	63,	'¿Cuenta con sistema de corte de presión (gatillo con cierre o válvula de alivio)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10775,	1017,	63,	'¿Se verifica que no se dirija el chorro de agua a personas, equipos eléctricos o tableros?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10776,	1017,	63,	'¿El cable de alimentación eléctrica (si aplica) está en buenas condiciones, con clavija con tierra física?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10777,	1017,	63,	'¿Se utiliza sobre superficie nivelada, libre de charcos con riesgo eléctrico o aceite?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10778,	1017,	63,	'¿Está ubicada lejos de equipos sensibles, cables, y fuentes de calor durante su operación?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10779,	1017,	63,	'¿No hay derrames que representen riesgo de caída o corto circuito en la zona de trabajo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10780,	1017,	63,	'¿Cuenta con mantenimiento preventivo registrado (revisión de bomba, mangueras, filtros y conexiones)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10781,	1017,	63,	'¿La hidrolavadora tiene etiqueta de identificación o número de serie visible?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10782,	1017,	63,	'¿Se realiza purga o drenado periódico del sistema (especialmente si no se usa a diario)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10783,	1017,	64,	'¿El banco está limpio, sin acumulación de grasa, herramientas sueltas ni materiales peligrosos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10784,	1017,	64,	'¿El banco es estructuralmente estable, sin patas flojas, bases inestables o sobrepeso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10785,	1017,	64,	'¿Tiene superficie adecuada (plana, metálica o de madera dura), sin filos ni puntas expuestas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10786,	1017,	64,	'¿Cuenta con tornillo de banco o fijaciones adecuadas en caso de trabajos mecánicos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10787,	1017,	64,	'¿Dispone de iluminación suficiente y condiciones seguras para el trabajo manual?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10788,	1017,	64,	'¿Las estanterías están firmemente sujetas al muro o piso, sin riesgo de caída?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10789,	1017,	64,	'¿Están libres de sobrecarga y los objetos pesados se almacenan en los estantes inferiores? (NOM-006-STPS-2023)',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10790,	1017,	64,	'¿Están clasificadas por tipo de herramienta, insumo o repuesto? (orden lógico o alfabético)',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10791,	1017,	64,	'¿Las herramientas están colocadas correctamente en ganchos, bandejas o separadores?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10792,	1017,	64,	'¿No hay objetos sueltos que puedan caer desde estantes altos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10793,	1017,	64,	'¿Las herramientas están identificadas con letreros o sombras de ubicación?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10794,	1017,	64,	'¿Las zonas de herramienta eléctrica o peligrosa están señalizadas con el color amarillo o rojo según su riesgo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10795,	1017,	64,	'¿El banco de herramientas tiene un cartel visible que indique el uso obligatorio de EPP (guantes, lentes, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10796,	1017,	64,	'¿Existe un inventario básico o bitácora de herramientas (manual o digital)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10797,	1017,	64,	'¿Se revisan periódicamente las herramientas para detectar daños o desgaste?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10798,	1017,	64,	'¿Hay procedimientos visibles o conocidos para el préstamo o reposición de herramientas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:28:30',	0,	0.00),
(10799,	1015,	65,	'¿La unidad cuenta con tarjeta de circulación y placas vigentes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10800,	1015,	65,	'¿La carrocería (cabina y chasis) se encuentra libre de daños estructurales visibles o corrosión severa?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10801,	1015,	65,	'¿Cuenta con espejos retrovisores en ambos lados y visibilidad adecuada desde la cabina?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10802,	1015,	65,	'¿El parabrisas, faros, luces traseras y limpiaparabrisas están en buen estado y funcionando?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10803,	1015,	65,	'¿El tambor gira correctamente sin ruidos anormales ni vibraciones excesivas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10804,	1015,	65,	'¿El sistema de carga y descarga (tolva, canaleta, rampa) está completo, fijo y sin fisuras ni piezas sueltas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10805,	1015,	65,	'¿La unidad cuenta con sistema de control de rotación (dentro de cabina o externo) en buen estado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10806,	1015,	65,	'¿La tolva de alimentación tiene rejilla de seguridad para evitar caída de objetos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10807,	1015,	65,	'¿Los niveles de aceite, refrigerante, líquido de frenos e hidráulico están dentro de rango normal?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10808,	1015,	65,	'¿Las mangueras y conexiones hidráulicas no presentan fugas, grietas ni amarres improvisados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10809,	1015,	65,	'¿El motor arranca sin dificultad y no presenta humo excesivo o fallas de combustión?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10810,	1015,	65,	'¿Cuenta con bitácora de mantenimiento actualizada con revisiones periódicas firmadas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10811,	1015,	65,	'¿El camión cuenta con extintor vigente (mínimo 4.5 kg tipo ABC) en cabina, accesible y con señalización?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10812,	1015,	65,	'¿Tiene calcomanías o señalización visibles de puntos de contacto caliente, advertencias de rotación, etc.?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10813,	1015,	65,	'¿La unidad tiene luces intermitentes, reversa sonora, triángulos reflejantes y cinta reflejante conforme a la NOM-019-SCT2?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10814,	1015,	65,	'¿El conductor utiliza el equipo de protección personal obligatorio (chaleco reflejante, casco, lentes, guantes si aplica)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10815,	1015,	66,	'¿La estructura metálica (chasis, patas, bastidor) está completa, sin grietas, soldaduras fracturadas ni corrosión severa?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10816,	1015,	66,	'¿El tambor o cuba de mezclado no presenta fisuras, perforaciones ni deformaciones importantes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10817,	1015,	66,	'¿El sistema de rotación (motor y transmisión) funciona correctamente sin ruidos irregulares o calentamientos excesivos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10818,	1015,	66,	'¿La mezcladora cuenta con resguardos físicos en zonas móviles (correas, poleas, engranes)? (Obligatorio por NOM-004-STPS-2023)',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10819,	1015,	66,	'¿Cuenta con ruedas o base estable que impida vuelcos accidentales o desplazamiento no controlado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:29:05',	0,	0.00),
(10820,	1015,	66,	'¿El cableado eléctrico (si es eléctrica) está completo, sin empalmes visibles, cinta aislante ni conexiones expuestas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10821,	1015,	66,	'¿Cuenta con interruptor o botón de paro de emergencia accesible y funcional?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10822,	1015,	66,	'¿Está conectada a una fuente protegida con interruptor termomagnético o contacto con tierra física (NOM-001-SEDE-2012)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10823,	1015,	66,	'¿En caso de ser de combustión, el escape está dirigido lejos del operador y no presenta fugas ni hollín excesivo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10824,	1015,	66,	'¿Se encuentra señalizada con advertencias visibles: “No introducir manos”, “Equipo en rotación”, “Riesgo eléctrico”?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10825,	1015,	66,	'¿Hay cartel de instrucciones básicas de operación segura (manual o pictograma)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10826,	1015,	66,	'¿Cuenta con bitácora de mantenimiento simple (fechas de revisión o limpieza, firmas)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10827,	1015,	66,	'¿El operador utiliza equipo de protección personal mínimo: guantes, lentes, casco, botas y ropa ajustada?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10828,	1015,	66,	'¿Se encuentra alejada de zonas de paso, excavaciones, rampas o escaleras?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10829,	1015,	66,	'¿Existe un área de almacenamiento limpio y ordenado para EPP nuevo o de repuesto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10830,	1015,	66,	'¿El EPP dañado o en mal estado se reemplaza de inmediato y se retira de uso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10831,	1015,	66,	'¿Se llevan registros del suministro y renovación del EPP por trabajador?',	'abierta',	NULL,	NULL,	NULL,	NULL,	17,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10832,	1015,	67,	'¿La motocicleta cuenta con tarjeta de circulación y placas vigentes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10833,	1015,	67,	'¿Se encuentra en condiciones físico-mecánicas aceptables (luces, frenos, neumáticos, escape, espejo)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10834,	1015,	67,	'¿El conductor utiliza el equipo de protección completo: casco certificado, guantes, chaleco reflejante, botas cerradas? (NOM-017-STPS-2023)',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10835,	1015,	67,	'¿La unidad cuenta con luces delanteras, traseras y direccionales en buen estado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10836,	1015,	67,	'¿Se realiza una revisión o bitácora de mantenimiento periódico al vehículo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10837,	1015,	67,	'¿La carga transportada (si aplica) está asegurada y no compromete la estabilidad del vehículo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10838,	1015,	67,	'¿El equipo de radio funciona correctamente y tiene buena calidad de audio y recepción?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10839,	1015,	67,	'¿Cuenta con batería en buen estado y cargadores funcionales?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10840,	1015,	67,	'¿Está autorizado por el IFT o cumple con las características técnicas de la NOM-206-SCFI-2017 (frecuencias libres o licencia vigente)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10841,	1015,	67,	'¿El personal ha recibido capacitación básica sobre el uso adecuado del radio (canales, protocolos, lenguaje claro)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10842,	1015,	67,	'¿El uso del radio no interfiere con la operación segura de equipos (como manejo de concreto, grúas, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10843,	1015,	68,	'¿El remolque cuenta con tarjeta de circulación o permiso de circulación vigente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10844,	1015,	68,	'¿Tiene placas o número de identificación legible?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10845,	1015,	68,	'¿Se encuentra registrado como parte del parque vehicular de la planta o del contratista?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10846,	1015,	68,	'¿La estructura metálica (chasis, largueros, barandales) está libre de grietas, deformaciones o corrosión severa?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10847,	1015,	68,	'¿Las llantas presentan dibujo visible, sin desgaste irregular, ni grietas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10848,	1015,	68,	'¿El sistema de luces traseras (frenado, reversa, direccionales) funciona correctamente? (Obligatorio por NOM-068-SCT-2',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10849,	1015,	68,	'¿Cuenta con reflejantes, cinta retrorreflectante o calcomanías visibles en bordes traseros y laterales?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10850,	1015,	68,	'¿Tiene frenos propios (si aplica por peso) y están operativos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10851,	1015,	68,	'¿El sistema de enganche (cuello de ganso, bola o acoplador) se encuentra en buen estado, sin holguras ni fisuras?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10852,	1015,	68,	'¿Utiliza pasadores de seguridad, cadenas cruzadas o cables de retención de emergencia correctamente instalados?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10853,	1015,	68,	'¿El sistema de soporte (pata retráctil o fija) funciona correctamente y permite estabilizar el remolque sin apoyo externo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10854,	1015,	68,	'¿El remolque no excede la capacidad de carga del vehículo que lo arrastra? (Peso bruto total ≤ capacidad nominal del vehículo)',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10855,	1015,	68,	'¿La carga transportada va sujeta, centrada y asegurada con amarres, bandas, cadenas o redes?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10856,	1015,	68,	'¿La operación de acople/desacople se realiza por personal capacitado, con uso de EPP (guantes, botas, chaleco)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10857,	1015,	68,	'¿Cuenta con bitácora de inspección o al menos registro del mantenimiento reciente (llantas, luces, enganche)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:29:06',	0,	0.00),
(10858,	1018,	69,	'¿Los extintores están visibles y señalizados correctamente (según NOM-026-STPS)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10859,	1018,	69,	'¿Cuentan con etiquetas legibles que indiquen: tipo de agente, capacidad, instrucciones de uso y fecha de recarga vigente (menos de 1 año)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10860,	1018,	69,	'¿Se encuentran montados de forma segura, a una altura no mayor a 1.5 m desde el suelo (mango superior), o 1.0 m si pesa más de 18 kg?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10861,	1018,	69,	'¿La cantidad y tipo de extintores corresponde a los riesgos de la planta (Clase A, B, C, o mixto) según lo determinado en el estudio de riesgo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10862,	1018,	69,	'¿Están libres de obstrucciones o elementos que dificulten su acceso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10863,	1018,	69,	'¿Tienen una señalización visible con símbolo de color rojo y figura blanca sobre fondo cuadrado o rectangular (según NOM-026-STPS-2021)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10864,	1018,	69,	'¿Se verifica que el manómetro esté en zona verde, sin fugas, sin abolladuras ni evidencia de maltrato?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10865,	1018,	69,	'¿Ningún extintor está obstruido por objetos, maquinaria o materiales que impidan su acceso inmediato?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10866,	1018,	69,	'¿Existen señales visibles de “Uso obligatorio de EPP” en zonas de riesgo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10867,	1018,	69,	'¿Se encuentran instaladas señales de advertencia en zonas de maquinaria o peligro (ruido, atrapamiento, electricidad, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:30:29',	0,	0.00),
(10868,	1018,	69,	'¿Las señales están colocadas a una altura visible (1.5–2 m desde el suelo) y en puntos estratégicos (accesos, cruces, zonas de riesgo)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10869,	1018,	69,	'¿Señales de advertencia utilizan fondo amarillo, símbolo negro en forma de triángulo con vértice hacia arriba? (Ej: Riesgo eléctrico, atrapamiento, resbalones, etc.)',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10870,	1018,	69,	'¿Señales de prohibición utilizan fondo blanco, símbolo negro y banda diagonal roja sobre un círculo rojo? (Ej: Prohibido fumar, acceso no autorizado, etc.)',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10871,	1018,	69,	'¿Señales de obligación (uso de EPP) utilizan fondo azul, símbolo blanco, en forma circular? (Ej: Uso obligatorio de casco, lentes, etc.)',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10872,	1018,	69,	'¿Señales de información de emergencia tienen fondo verde, símbolo blanco, en forma rectangular o cuadrada? (Ej: ruta de evacuación, botiquín, salida de emergencia)',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10873,	1018,	69,	'¿Están delimitadas con cintas visibles las zonas restringidas o de tránsito controlado?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10874,	1018,	69,	'¿Las cintas o barreras están firmemente colocadas y sin daños visibles?',	'abierta',	NULL,	NULL,	NULL,	NULL,	17,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10875,	1018,	69,	'¿Las áreas con riesgo de caída o movimiento de maquinaria cuentan con advertencias físicas y visuales?',	'abierta',	NULL,	NULL,	NULL,	NULL,	18,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10876,	1018,	69,	'¿Se encuentra visible un plano actualizado con rutas de evacuación y ubicación de extintores?',	'abierta',	NULL,	NULL,	NULL,	NULL,	19,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10877,	1018,	69,	'¿Las rutas de evacuación están señalizadas y libres de obstáculos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	20,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10878,	1018,	70,	'¿Se ha realizado un análisis de riesgos por puesto para determinar el EPP requerido (como indica la NOM-017-STPS)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10879,	1018,	70,	'¿El personal cuenta con el EPP adecuado según los riesgos del área (casco, lentes, guantes, chaleco, botas, respirador, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10880,	1018,	70,	'¿El EPP cuenta con marcado o certificado del fabricante y cumple con normas aplicables (NMX o internacionales)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10881,	1018,	70,	'¿El EPP es de uso personal y no compartido entre trabajadores sin sanitización?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10882,	1018,	70,	'¿El EPP se encuentra en buenas condiciones (sin roturas, sin desgaste excesivo, sin contaminación)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10883,	1018,	70,	'¿El personal porta el EPP durante todas las actividades de riesgo, sin excepción?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10884,	1018,	70,	'¿Se cuenta con zonas señalizadas de uso obligatorio de EPP (según NOM-026-STPS)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10885,	1018,	70,	'¿Se utiliza casco de seguridad con suspensión interior y fecha vigente (no mayor a 5 años de fabricación)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10886,	1018,	70,	'¿El personal utiliza lentes o goggles cuando hay riesgo de partículas, polvo o líquidos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10887,	1018,	70,	'¿Se utilizan guantes adecuados para manejo de concreto, aceites, mantenimiento o productos químicos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10888,	1018,	70,	'¿Se utilizan botas con casquillo y suela antiderrapante en zonas de trabajo húmedo o con maquinaria?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10889,	1018,	70,	'¿Se utiliza chaleco reflejante en patios, zonas de carga o tránsito vehicular?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10890,	1018,	70,	'¿Se cuenta con protección respiratoria (mascarilla o respirador) cuando se trabaja con aditivos, polvos o vapores?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10891,	1018,	70,	'¿Se proporciona protección auditiva en zonas con exposición a ruidos mayores a 85 dB (mezcladora, compresores, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10892,	1018,	70,	'¿Existe un área de almacenamiento limpio y ordenado para EPP nuevo o de repuesto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10893,	1018,	70,	'¿El EPP dañado o en mal estado se reemplaza de inmediato y se retira de uso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10894,	1018,	70,	'¿Se llevan registros del suministro y renovación del EPP por trabajador?',	'abierta',	NULL,	NULL,	NULL,	NULL,	17,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10895,	1018,	71,	'¿El botiquín está ubicado en un lugar visible, accesible, señalizado con símbolo blanco sobre fondo verde (NOM-026-STPS)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10896,	1018,	71,	'¿Se encuentra limpio, ordenado y protegido del polvo, humedad o calor excesivo?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10897,	1018,	71,	'¿El contenido del botiquín está completo y actualizado según los riesgos de la planta? (ver tabla siguiente)',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10898,	1018,	71,	'¿Los productos tienen fecha de caducidad vigente y se encuentran cerrados e higiénicos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10899,	1018,	71,	'¿Se lleva registro de revisión mensual del botiquín con nombre, firma y fecha?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10900,	1018,	71,	'¿Hay al menos una persona capacitada en primeros auxilios por turno, según lo indica la NOM-030-STPS-2009?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10901,	1018,	71,	'¿Existen instrucciones básicas de uso o números de emergencia visibles junto al botiquín?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10902,	1018,	72,	'¿Cada equipo cuenta con su manual de operación del fabricante disponible físicamente o en formato digital accesible para el operador?',	'abierta',	NULL,	NULL,	NULL,	NULL,	1,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10903,	1018,	72,	'¿Los manuales están en idioma español y contienen instrucciones claras de operación, seguridad, mantenimiento y advertencias?',	'abierta',	NULL,	NULL,	NULL,	NULL,	2,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10904,	1018,	72,	'¿Se encuentran resguardados en un lugar definido y señalizado (oficina técnica, cuarto de control, caseta de operador)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	3,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10905,	1018,	72,	'¿Existe un procedimiento definido para la entrega de manuales al personal nuevo o de mantenimiento?',	'abierta',	NULL,	NULL,	NULL,	NULL,	4,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10906,	1018,	72,	'¿Se cuenta con bitácoras de operación diarias para cada equipo crítico (planta dosificadora, mezcladora, tolvas, compresor, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	5,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10907,	1018,	72,	'¿Las bitácoras contienen los campos mínimos: fecha, hora, operador, actividad realizada, observaciones y firma?',	'abierta',	NULL,	NULL,	NULL,	NULL,	6,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10908,	1018,	72,	'¿Existen bitácoras de mantenimiento preventivo y correctivo con evidencia de que se llenan puntualmente?',	'abierta',	NULL,	NULL,	NULL,	NULL,	7,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10909,	1018,	72,	'¿Se registran las fallas mecánicas o eléctricas que afecten la producción o seguridad, junto con las acciones correctivas realizadas?',	'abierta',	NULL,	NULL,	NULL,	NULL,	8,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10910,	1018,	72,	'¿Las bitácoras están foliadas, protegidas y organizadas cronológicamente (físicas o digitales con respaldo)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	9,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10911,	1018,	72,	'¿Se designa a un responsable para la revisión y firma diaria/semanal de las bitácoras?',	'abierta',	NULL,	NULL,	NULL,	NULL,	10,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10912,	1018,	72,	'¿Se utiliza casco de seguridad con suspensión interior y fecha vigente (no mayor a 5 años de fabricación)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	11,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10913,	1018,	72,	'¿El personal utiliza lentes o goggles cuando hay riesgo de partículas, polvo o líquidos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	12,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10914,	1018,	72,	'¿Se utilizan guantes adecuados para manejo de concreto, aceites, mantenimiento o productos químicos?',	'abierta',	NULL,	NULL,	NULL,	NULL,	13,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10915,	1018,	72,	'¿Se utilizan botas con casquillo y suela antiderrapante en zonas de trabajo húmedo o con maquinaria?',	'abierta',	NULL,	NULL,	NULL,	NULL,	14,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10916,	1018,	72,	'¿Se utiliza chaleco reflejante en patios, zonas de carga o tránsito vehicular?',	'abierta',	NULL,	NULL,	NULL,	NULL,	15,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10917,	1018,	72,	'¿Se cuenta con protección respiratoria (mascarilla o respirador) cuando se trabaja con aditivos, polvos o vapores?',	'abierta',	NULL,	NULL,	NULL,	NULL,	16,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10918,	1018,	72,	'¿Se proporciona protección auditiva en zonas con exposición a ruidos mayores a 85 dB (mezcladora, compresores, etc.)?',	'abierta',	NULL,	NULL,	NULL,	NULL,	17,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10919,	1018,	72,	'¿Existe un área de almacenamiento limpio y ordenado para EPP nuevo o de repuesto?',	'abierta',	NULL,	NULL,	NULL,	NULL,	18,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10920,	1018,	72,	'¿El EPP dañado o en mal estado se reemplaza de inmediato y se retira de uso?',	'abierta',	NULL,	NULL,	NULL,	NULL,	19,	1,	'2025-07-10 16:30:30',	0,	0.00),
(10921,	1018,	72,	'¿Se llevan registros del suministro y renovación del EPP por trabajador?',	'abierta',	NULL,	NULL,	NULL,	NULL,	20,	1,	'2025-07-10 16:30:30',	0,	0.00);

DROP TABLE IF EXISTS `progreso_secciones`;
CREATE TABLE `progreso_secciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `evaluacion_id` int DEFAULT NULL,
  `tipo_evaluacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `seccion_nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `seccion_orden` int NOT NULL,
  `puntaje_seccion` decimal(5,2) DEFAULT '0.00',
  `puntaje_porcentaje` decimal(5,2) DEFAULT '0.00',
  `respuestas_correctas` int DEFAULT '0',
  `total_preguntas` int DEFAULT '0',
  `tipo_planta` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_completada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progreso` (`usuario_id`,`tipo_evaluacion`,`seccion_orden`,`tipo_planta`,`categoria`),
  KEY `idx_evaluacion_id` (`evaluacion_id`),
  CONSTRAINT `progreso_secciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `progreso_secciones` (`id`, `usuario_id`, `evaluacion_id`, `tipo_evaluacion`, `seccion_nombre`, `seccion_orden`, `puntaje_seccion`, `puntaje_porcentaje`, `respuestas_correctas`, `total_preguntas`, `tipo_planta`, `categoria`, `fecha_completada`, `fecha_actualizacion`) VALUES
(1,	8,	1,	'personal',	'Conocimiento técnico y operativo',	1,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-07-29 23:32:06',	'2025-08-08 22:43:56'),
(2,	8,	1,	'personal',	'Gestión de la producción',	2,	10.00,	20.00,	1,	5,	NULL,	NULL,	'2025-07-29 23:32:11',	'2025-08-08 22:43:56'),
(3,	8,	1,	'personal',	'Mantenimiento del equipo',	3,	10.00,	20.00,	1,	5,	NULL,	NULL,	'2025-07-29 23:32:20',	'2025-08-08 22:43:56'),
(4,	8,	1,	'personal',	'Gestión del personal',	4,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-07-29 23:32:25',	'2025-08-08 22:43:56'),
(5,	8,	1,	'personal',	'Seguridad y cumplimiento normativo',	5,	50.00,	100.00,	5,	5,	NULL,	NULL,	'2025-07-29 23:32:28',	'2025-08-08 22:43:56'),
(6,	8,	1,	'personal',	'Control de calidad',	6,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-07-29 23:32:33',	'2025-08-08 22:43:56'),
(7,	8,	1,	'personal',	'Documentación y control administrativo',	7,	10.00,	20.00,	1,	5,	NULL,	NULL,	'2025-07-29 23:32:37',	'2025-08-08 22:43:56'),
(8,	8,	1,	'personal',	'Mejora continua y enfoque a resultados',	8,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-07-29 23:32:43',	'2025-08-08 22:43:56'),
(9,	8,	1,	'personal',	'Coordinación con logística y clientes',	9,	20.00,	40.00,	2,	5,	NULL,	NULL,	'2025-07-29 23:33:06',	'2025-08-08 22:43:56'),
(10,	8,	1,	'personal',	'Resolución de problemas',	10,	50.00,	100.00,	5,	5,	NULL,	NULL,	'2025-07-29 23:33:13',	'2025-08-08 22:43:56'),
(11,	8,	2,	'personal',	'Conocimiento técnico y operativo',	1,	20.00,	40.00,	2,	5,	NULL,	NULL,	'2025-07-30 00:17:34',	'2025-08-08 22:44:01'),
(12,	8,	2,	'personal',	'Gestión de la producción',	2,	10.00,	20.00,	1,	5,	NULL,	NULL,	'2025-07-30 00:17:40',	'2025-08-08 22:44:01'),
(13,	8,	2,	'personal',	'Mantenimiento del equipo',	3,	10.00,	20.00,	1,	5,	NULL,	NULL,	'2025-07-30 00:17:43',	'2025-08-08 22:44:01'),
(14,	8,	2,	'personal',	'Gestión del personal',	4,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-07-30 00:17:47',	'2025-08-08 22:44:01'),
(15,	8,	2,	'personal',	'Seguridad y cumplimiento normativo',	5,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-07-30 00:17:51',	'2025-08-08 22:44:01'),
(16,	8,	2,	'personal',	'Control de calidad',	6,	50.00,	100.00,	5,	5,	NULL,	NULL,	'2025-07-30 00:17:55',	'2025-08-08 22:44:01'),
(17,	8,	2,	'personal',	'Documentación y control administrativo',	7,	0.00,	0.00,	0,	5,	NULL,	NULL,	'2025-07-30 00:18:01',	'2025-08-08 22:44:01'),
(18,	8,	2,	'personal',	'Mejora continua y enfoque a resultados',	8,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-07-30 00:18:05',	'2025-08-08 22:44:01'),
(19,	8,	2,	'personal',	'Coordinación con logística y clientes',	9,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-07-30 00:18:09',	'2025-08-08 22:44:01'),
(20,	8,	2,	'personal',	'Resolución de problemas',	10,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-07-30 00:18:14',	'2025-08-08 22:44:01'),
(21,	8,	3,	'personal',	'Conocimiento técnico y operativo',	1,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-06 23:22:13',	'2025-08-08 22:43:42'),
(22,	8,	3,	'personal',	'Gestión de la producción',	2,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-06 23:22:18',	'2025-08-08 22:43:42'),
(23,	8,	3,	'personal',	'Mantenimiento del equipo',	3,	20.00,	40.00,	2,	5,	NULL,	NULL,	'2025-08-06 23:22:23',	'2025-08-08 22:43:42'),
(24,	8,	3,	'personal',	'Gestión del personal',	4,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-06 23:22:29',	'2025-08-08 22:43:42'),
(25,	8,	3,	'personal',	'Seguridad y cumplimiento normativo',	5,	20.00,	40.00,	2,	5,	NULL,	NULL,	'2025-08-06 23:22:33',	'2025-08-08 22:43:42'),
(26,	8,	3,	'personal',	'Control de calidad',	6,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-06 23:22:37',	'2025-08-08 22:43:42'),
(27,	8,	3,	'personal',	'Documentación y control administrativo',	7,	10.00,	20.00,	1,	5,	NULL,	NULL,	'2025-08-06 23:22:41',	'2025-08-08 22:43:42'),
(28,	8,	3,	'personal',	'Mejora continua y enfoque a resultados',	8,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-08-06 23:22:44',	'2025-08-08 22:43:42'),
(29,	8,	3,	'personal',	'Coordinación con logística y clientes',	9,	50.00,	100.00,	5,	5,	NULL,	NULL,	'2025-08-06 23:22:48',	'2025-08-08 22:43:42'),
(30,	8,	3,	'personal',	'Resolución de problemas',	10,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-06 23:22:51',	'2025-08-08 22:43:42'),
(31,	1,	4,	'personal',	'Conocimiento técnico y operativo',	1,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-08 22:04:42',	'2025-08-08 22:43:11'),
(32,	1,	4,	'personal',	'Gestión de la producción',	2,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-08 22:04:50',	'2025-08-08 22:43:11'),
(33,	1,	4,	'personal',	'Mantenimiento del equipo',	3,	50.00,	100.00,	5,	5,	NULL,	NULL,	'2025-08-08 22:05:14',	'2025-08-08 22:43:11'),
(34,	1,	4,	'personal',	'Gestión del personal',	4,	50.00,	100.00,	5,	5,	NULL,	NULL,	'2025-08-08 22:05:28',	'2025-08-08 22:43:11'),
(35,	1,	4,	'personal',	'Seguridad y cumplimiento normativo',	5,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-08-08 22:05:34',	'2025-08-08 22:43:11'),
(36,	1,	4,	'personal',	'Control de calidad',	6,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-08 22:05:38',	'2025-08-08 22:43:11'),
(37,	1,	4,	'personal',	'Documentación y control administrativo',	7,	30.00,	60.00,	3,	5,	NULL,	NULL,	'2025-08-08 22:05:45',	'2025-08-08 22:43:11'),
(38,	1,	4,	'personal',	'Mejora continua y enfoque a resultados',	8,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-08-08 22:05:49',	'2025-08-08 22:43:11'),
(39,	1,	4,	'personal',	'Coordinación con logística y clientes',	9,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-08-08 22:05:54',	'2025-08-08 22:43:11'),
(40,	1,	4,	'personal',	'Resolución de problemas',	10,	40.00,	80.00,	4,	5,	NULL,	NULL,	'2025-08-08 22:05:58',	'2025-08-08 22:43:11');

DROP TABLE IF EXISTS `progreso_secciones_equipo`;
CREATE TABLE `progreso_secciones_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo_planta` enum('pequena','mediana','grande') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `seccion_id` int NOT NULL,
  `seccion_nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `completada` tinyint(1) DEFAULT '0',
  `puntaje_obtenido` decimal(5,2) DEFAULT '0.00',
  `puntaje_porcentaje` decimal(5,2) DEFAULT '0.00',
  `total_subsecciones` int DEFAULT '0',
  `subsecciones_completadas` int DEFAULT '0',
  `respuestas_correctas` int DEFAULT '0',
  `total_preguntas` int DEFAULT '0',
  `fecha_completada` timestamp NULL DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_plant_section` (`usuario_id`,`tipo_planta`,`seccion_id`),
  KEY `seccion_id` (`seccion_id`),
  KEY `idx_usuario_tipo_planta` (`usuario_id`,`tipo_planta`),
  KEY `idx_completada` (`completada`),
  KEY `idx_fecha_completada` (`fecha_completada`),
  CONSTRAINT `progreso_secciones_equipo_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progreso_secciones_equipo_ibfk_2` FOREIGN KEY (`seccion_id`) REFERENCES `secciones_evaluacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `progreso_secciones_equipo` (`id`, `usuario_id`, `tipo_planta`, `seccion_id`, `seccion_nombre`, `completada`, `puntaje_obtenido`, `puntaje_porcentaje`, `total_subsecciones`, `subsecciones_completadas`, `respuestas_correctas`, `total_preguntas`, `fecha_completada`, `fecha_actualizacion`, `fecha_creacion`) VALUES
(8,	8,	'pequena',	1014,	'Producción y Mezclado',	1,	390.00,	100.00,	6,	6,	39,	39,	'2025-07-09 19:09:26',	'2025-07-09 19:09:26',	'2025-07-07 16:20:32'),
(27,	8,	'pequena',	1017,	'Mantenimiento',	1,	120.00,	90.00,	4,	4,	12,	12,	'2025-07-09 23:28:08',	'2025-08-06 23:37:54',	'2025-07-09 19:29:56'),
(33,	8,	'pequena',	1019,	'Gestión y Administración',	1,	120.00,	75.00,	4,	4,	12,	12,	'2025-07-09 21:48:26',	'2025-08-06 23:37:54',	'2025-07-09 19:52:08'),
(38,	8,	'pequena',	1015,	'Transporte y Entrega',	1,	590.00,	100.00,	4,	4,	59,	59,	'2025-07-10 16:33:00',	'2025-07-10 16:33:00',	'2025-07-10 16:31:16'),
(41,	8,	'pequena',	1016,	'Laboratorio y Control de Calidad',	1,	0.00,	85.00,	9,	9,	0,	108,	'2025-08-06 23:34:56',	'2025-08-06 23:37:54',	'2025-08-06 23:33:55'),
(45,	8,	'pequena',	1018,	'Seguridad y Normatividad',	1,	950.00,	95.00,	6,	6,	57,	60,	'2025-08-06 23:37:54',	'2025-08-06 23:37:54',	'2025-08-06 23:37:54'),
(46,	1,	'pequena',	1019,	'Control y Automatización',	1,	500.00,	100.00,	4,	4,	50,	50,	'2025-08-07 15:20:00',	'2025-08-07 15:20:00',	'2025-08-06 23:49:45'),
(48,	1,	'pequena',	1018,	'Seguridad y Normatividad',	1,	640.00,	100.00,	4,	4,	64,	64,	'2025-08-07 15:10:47',	'2025-08-07 15:10:47',	'2025-08-07 15:09:53');

DROP TABLE IF EXISTS `progreso_secciones_operacion`;
CREATE TABLE `progreso_secciones_operacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `seccion_operacion_id` int NOT NULL,
  `parametros_completados` int DEFAULT '0',
  `total_parametros` int DEFAULT '0',
  `porcentaje_completado` decimal(5,2) DEFAULT '0.00',
  `observaciones_generales` text COLLATE utf8mb4_unicode_ci,
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultima_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_usuario_seccion` (`usuario_id`,`seccion_operacion_id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_seccion` (`seccion_operacion_id`),
  CONSTRAINT `progreso_secciones_operacion_ibfk_1` FOREIGN KEY (`seccion_operacion_id`) REFERENCES `secciones_operacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Progreso del usuario en las secciones de operación';


DROP TABLE IF EXISTS `progreso_subsecciones`;
CREATE TABLE `progreso_subsecciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo_evaluacion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subseccion_nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subseccion_orden` int NOT NULL,
  `puntaje_subseccion` decimal(5,2) DEFAULT '0.00',
  `puntaje_porcentaje` decimal(5,2) DEFAULT '0.00',
  `respuestas_correctas` int DEFAULT '0',
  `total_preguntas` int DEFAULT '0',
  `tipo_planta` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol_personal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_completada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progreso_subseccion` (`usuario_id`,`tipo_evaluacion`,`subseccion_orden`,`tipo_planta`,`categoria`,`rol_personal`),
  CONSTRAINT `progreso_subsecciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `progreso_subsecciones_equipo`;
CREATE TABLE `progreso_subsecciones_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `progreso_seccion_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo_planta` enum('pequena','mediana','grande') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subseccion_id` int NOT NULL,
  `subseccion_nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `completada` tinyint(1) DEFAULT '0',
  `puntaje_obtenido` decimal(5,2) DEFAULT '0.00',
  `puntaje_porcentaje` decimal(5,2) DEFAULT '0.00',
  `respuestas_correctas` int DEFAULT '0',
  `total_preguntas` int DEFAULT '0',
  `fecha_completada` timestamp NULL DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_plant_subsection` (`usuario_id`,`tipo_planta`,`subseccion_id`),
  KEY `subseccion_id` (`subseccion_id`),
  KEY `idx_progreso_seccion` (`progreso_seccion_id`),
  KEY `idx_usuario_tipo_planta` (`usuario_id`,`tipo_planta`),
  KEY `idx_completada` (`completada`),
  CONSTRAINT `progreso_subsecciones_equipo_ibfk_1` FOREIGN KEY (`progreso_seccion_id`) REFERENCES `progreso_secciones_equipo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progreso_subsecciones_equipo_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progreso_subsecciones_equipo_ibfk_3` FOREIGN KEY (`subseccion_id`) REFERENCES `subsecciones_evaluacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `progreso_subsecciones_equipo` (`id`, `progreso_seccion_id`, `usuario_id`, `tipo_planta`, `subseccion_id`, `subseccion_nombre`, `completada`, `puntaje_obtenido`, `puntaje_porcentaje`, `respuestas_correctas`, `total_preguntas`, `fecha_completada`, `fecha_actualizacion`, `fecha_creacion`) VALUES
(145,	38,	8,	'pequena',	65,	'Camión revolvedor',	1,	160.00,	100.00,	16,	16,	'2025-07-10 16:31:16',	'2025-07-10 16:31:16',	'2025-07-10 16:31:16'),
(146,	38,	8,	'pequena',	66,	'Mezcladora Portatil',	1,	170.00,	100.00,	17,	17,	'2025-07-10 16:32:01',	'2025-07-10 16:32:01',	'2025-07-10 16:32:01'),
(147,	38,	8,	'pequena',	67,	'Motocicleta o radio',	1,	110.00,	100.00,	11,	11,	'2025-07-10 16:32:25',	'2025-07-10 16:32:25',	'2025-07-10 16:32:25'),
(148,	38,	8,	'pequena',	68,	'Remolques',	1,	150.00,	100.00,	15,	15,	'2025-07-10 16:33:00',	'2025-07-10 16:33:00',	'2025-07-10 16:32:55'),
(150,	41,	8,	'pequena',	51,	'PRENSA HIDRÁULICA',	1,	0.00,	0.00,	0,	16,	'2025-08-06 23:33:55',	'2025-08-06 23:33:55',	'2025-08-06 23:33:55'),
(151,	41,	8,	'pequena',	52,	'TANQUE DE CURADO',	1,	0.00,	0.00,	0,	15,	'2025-08-06 23:34:06',	'2025-08-06 23:34:06',	'2025-08-06 23:34:06'),
(152,	41,	8,	'pequena',	53,	'CRONÓMETRO',	1,	0.00,	0.00,	0,	10,	'2025-08-06 23:34:14',	'2025-08-06 23:34:14',	'2025-08-06 23:34:14'),
(153,	41,	8,	'pequena',	54,	'TERMÓMETRO PARA CONCRETO',	1,	0.00,	0.00,	0,	14,	'2025-08-06 23:34:23',	'2025-08-06 23:34:23',	'2025-08-06 23:34:23'),
(154,	41,	8,	'pequena',	55,	'BALANZA DE PRECISIÓN',	1,	0.00,	0.00,	0,	14,	'2025-08-06 23:34:32',	'2025-08-06 23:34:32',	'2025-08-06 23:34:32'),
(155,	41,	8,	'pequena',	56,	'CONO DE ABRAMS',	1,	0.00,	0.00,	0,	13,	'2025-08-06 23:34:40',	'2025-08-06 23:34:40',	'2025-08-06 23:34:40'),
(156,	41,	8,	'pequena',	57,	'VARILLA DE COMPACTACIÓN',	1,	0.00,	0.00,	0,	7,	'2025-08-06 23:34:46',	'2025-08-06 23:34:46',	'2025-08-06 23:34:46'),
(157,	41,	8,	'pequena',	58,	'MESA DE SACUDIDAS',	1,	0.00,	0.00,	0,	8,	'2025-08-06 23:34:51',	'2025-08-06 23:34:51',	'2025-08-06 23:34:51'),
(158,	41,	8,	'pequena',	59,	'MOLDES CILÍNDRICOS',	1,	0.00,	0.00,	0,	11,	'2025-08-06 23:34:56',	'2025-08-06 23:34:56',	'2025-08-06 23:34:56'),
(159,	46,	1,	'pequena',	47,	'BÁSCULAS DIGITALES SIMPLES',	1,	120.00,	100.00,	12,	12,	'2025-08-07 15:19:11',	'2025-08-07 15:19:11',	'2025-08-06 23:49:45'),
(160,	46,	1,	'pequena',	48,	'SENSOR DE HUMEDAD',	1,	110.00,	100.00,	11,	11,	'2025-08-07 15:19:24',	'2025-08-07 15:19:24',	'2025-08-06 23:49:57'),
(161,	46,	1,	'pequena',	49,	'PARO DE EMERGENCIA',	1,	110.00,	100.00,	11,	11,	'2025-08-07 15:19:46',	'2025-08-07 15:19:46',	'2025-08-06 23:50:05'),
(162,	46,	1,	'pequena',	50,	'TABLERO DE CONTROL',	1,	160.00,	100.00,	16,	16,	'2025-08-07 15:20:00',	'2025-08-07 15:20:00',	'2025-08-06 23:50:18'),
(163,	48,	1,	'pequena',	69,	'Señalización básica',	1,	200.00,	100.00,	20,	20,	'2025-08-07 15:09:53',	'2025-08-07 15:09:53',	'2025-08-07 15:09:53'),
(164,	48,	1,	'pequena',	70,	'Equipo de proteccion personal',	1,	170.00,	100.00,	17,	17,	'2025-08-07 15:10:16',	'2025-08-07 15:10:16',	'2025-08-07 15:10:16'),
(165,	48,	1,	'pequena',	71,	'Botiquín de primeros auxilios',	1,	70.00,	100.00,	7,	7,	'2025-08-07 15:10:30',	'2025-08-07 15:10:30',	'2025-08-07 15:10:30'),
(166,	48,	1,	'pequena',	72,	'Manuales de operación y bitacora',	1,	200.00,	100.00,	20,	20,	'2025-08-07 15:10:47',	'2025-08-07 15:10:47',	'2025-08-07 15:10:47');

DROP TABLE IF EXISTS `reportes`;
CREATE TABLE `reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evaluacion_id` int NOT NULL,
  `tipo_reporte` enum('pdf','excel','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta_archivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamaño_archivo` int DEFAULT NULL,
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evaluacion` (`evaluacion_id`),
  KEY `idx_tipo_reporte` (`tipo_reporte`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `respuestas_evaluacion`;
CREATE TABLE `respuestas_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evaluacion_id` int NOT NULL,
  `pregunta_id` int NOT NULL,
  `respuesta` enum('si','no','na','a','b','c') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_respuesta` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `es_trampa` tinyint(1) DEFAULT '0',
  `ponderacion_obtenida` decimal(5,2) DEFAULT '0.00',
  `subseccion_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_evaluacion_pregunta` (`evaluacion_id`,`pregunta_id`),
  KEY `idx_evaluacion` (`evaluacion_id`),
  KEY `idx_pregunta` (`pregunta_id`),
  KEY `idx_respuesta` (`respuesta`),
  CONSTRAINT `respuestas_evaluacion_ibfk_1` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `respuestas_evaluacion_ibfk_2` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `respuestas_evaluacion` (`id`, `evaluacion_id`, `pregunta_id`, `respuesta`, `observacion`, `fecha_respuesta`, `es_trampa`, `ponderacion_obtenida`, `subseccion_id`) VALUES
(1,	1,	2026,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(2,	1,	2016,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(3,	1,	2025,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(4,	1,	2027,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(5,	1,	10470,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(6,	1,	2003,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(7,	1,	10003,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(8,	1,	10004,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(9,	1,	10471,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(10,	1,	10012,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(11,	1,	10009,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(12,	1,	10022,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(13,	1,	10039,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(14,	1,	10055,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(15,	1,	10474,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(16,	1,	10036,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(17,	1,	10031,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(18,	1,	10058,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(19,	1,	10087,	'c',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(20,	1,	10473,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(21,	1,	10077,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(22,	1,	10081,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(23,	1,	10088,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(24,	1,	10071,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(25,	1,	10269,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(26,	1,	10468,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(27,	1,	10257,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(28,	1,	10262,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(29,	1,	10259,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(30,	1,	10245,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(31,	1,	10233,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(32,	1,	10216,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(33,	1,	10476,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(34,	1,	10218,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(35,	1,	10213,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(36,	1,	10234,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(37,	1,	10203,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(38,	1,	10190,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(39,	1,	10191,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(40,	1,	10181,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(41,	1,	10208,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(42,	1,	10472,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(43,	1,	10165,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(44,	1,	10172,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(45,	1,	10175,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(46,	1,	10162,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(47,	1,	10475,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(48,	1,	10154,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(49,	1,	10125,	'a',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(50,	1,	10148,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(51,	1,	10477,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(52,	1,	10122,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(53,	1,	10121,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(54,	1,	10145,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(55,	1,	10115,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(56,	1,	10469,	'b',	'Pregunta trampa',	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(57,	1,	10104,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(58,	1,	10109,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(59,	1,	10090,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(60,	1,	10105,	'b',	NULL,	'2025-07-29 23:33:13',	0,	0.00,	NULL),
(61,	2,	2011,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(62,	2,	10469,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(63,	2,	2018,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(64,	2,	2004,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(65,	2,	2021,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(66,	2,	2027,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(67,	2,	10022,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(68,	2,	10012,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(69,	2,	10470,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(70,	2,	10025,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(71,	2,	10003,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(72,	2,	10009,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(73,	2,	10477,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(74,	2,	10038,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(75,	2,	10053,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(76,	2,	10050,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(77,	2,	10058,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(78,	2,	10036,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(79,	2,	10474,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(80,	2,	10075,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(81,	2,	10074,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(82,	2,	10066,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(83,	2,	10081,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(84,	2,	10062,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(85,	2,	10471,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(86,	2,	10247,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(87,	2,	10243,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(88,	2,	10250,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(89,	2,	10268,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(90,	2,	10253,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(91,	2,	10232,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(92,	2,	10468,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(93,	2,	10227,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(94,	2,	10228,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(95,	2,	10213,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(96,	2,	10239,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(97,	2,	10186,	'c',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(98,	2,	10200,	'a',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(99,	2,	10472,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(100,	2,	10206,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(101,	2,	10196,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(102,	2,	10207,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(103,	2,	10473,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(104,	2,	10152,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(105,	2,	10155,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(106,	2,	10159,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(107,	2,	10156,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(108,	2,	10166,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(109,	2,	10121,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(110,	2,	10475,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(111,	2,	10142,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(112,	2,	10140,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(113,	2,	10126,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(114,	2,	10135,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(115,	2,	10102,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(116,	2,	10476,	'b',	'Pregunta trampa',	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(117,	2,	10104,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(118,	2,	10103,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(119,	2,	10109,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(120,	2,	10110,	'b',	NULL,	'2025-07-30 00:18:14',	0,	0.00,	NULL),
(121,	3,	2018,	'a',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(122,	3,	2002,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(123,	3,	2014,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(124,	3,	2020,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(125,	3,	10477,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(126,	3,	2019,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(127,	3,	10004,	'a',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(128,	3,	10027,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(129,	3,	10018,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(130,	3,	10015,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(131,	3,	10474,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(132,	3,	10007,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(133,	3,	10051,	'c',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(134,	3,	10034,	'a',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(135,	3,	10046,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(136,	3,	10040,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(137,	3,	10471,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(138,	3,	10048,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(139,	3,	10079,	'c',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(140,	3,	10062,	'c',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(141,	3,	10470,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(142,	3,	10072,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(143,	3,	10066,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(144,	3,	10078,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(145,	3,	10261,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(146,	3,	10245,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(147,	3,	10468,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(148,	3,	10255,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(149,	3,	10243,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(150,	3,	10250,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(151,	3,	10229,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(152,	3,	10236,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(153,	3,	10473,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(154,	3,	10212,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(155,	3,	10220,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(156,	3,	10228,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(157,	3,	10190,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(158,	3,	10182,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(159,	3,	10469,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(160,	3,	10185,	'no',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(161,	3,	10184,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(162,	3,	10197,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(163,	3,	10177,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(164,	3,	10174,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(165,	3,	10476,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(166,	3,	10163,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(167,	3,	10169,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(168,	3,	10152,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(169,	3,	10121,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(170,	3,	10143,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(171,	3,	10475,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(172,	3,	10138,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(173,	3,	10144,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(174,	3,	10128,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(175,	3,	10117,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(176,	3,	10110,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(177,	3,	10114,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(178,	3,	10106,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(179,	3,	10472,	'b',	'Pregunta trampa',	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(180,	3,	10104,	'b',	NULL,	'2025-08-06 23:22:51',	0,	0.00,	NULL),
(181,	4,	2017,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(182,	4,	2010,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(183,	4,	2021,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(184,	4,	2013,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(185,	4,	10472,	'b',	'Pregunta trampa',	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(186,	4,	2029,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(187,	4,	10025,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(188,	4,	10007,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(189,	4,	10027,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(190,	4,	10017,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(191,	4,	10016,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(192,	4,	10475,	'b',	'Pregunta trampa',	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(193,	4,	10046,	'c',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(194,	4,	10033,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(195,	4,	10055,	'c',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(196,	4,	10477,	'b',	'Pregunta trampa',	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(197,	4,	10038,	'c',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(198,	4,	10034,	'a',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(199,	4,	10077,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(200,	4,	10063,	'a',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(201,	4,	10061,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(202,	4,	10468,	'c',	'Pregunta trampa',	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(203,	4,	10086,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(204,	4,	10064,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(205,	4,	10267,	'a',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(206,	4,	10469,	'b',	'Pregunta trampa',	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(207,	4,	10249,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(208,	4,	10260,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(209,	4,	10257,	'b',	NULL,	'2025-08-08 22:05:58',	0,	0.00,	NULL),
(210,	4,	10265,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(211,	4,	10227,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(212,	4,	10237,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(213,	4,	10223,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(214,	4,	10216,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(215,	4,	10471,	'b',	'Pregunta trampa',	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(216,	4,	10233,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(217,	4,	10197,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(218,	4,	10205,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(219,	4,	10194,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(220,	4,	10208,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(221,	4,	10189,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(222,	4,	10470,	'b',	'Pregunta trampa',	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(223,	4,	10165,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(224,	4,	10474,	'b',	'Pregunta trampa',	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(225,	4,	10160,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(226,	4,	10162,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(227,	4,	10166,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(228,	4,	10156,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(229,	4,	10134,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(230,	4,	10146,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(231,	4,	10143,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(232,	4,	10473,	'b',	'Pregunta trampa',	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(233,	4,	10125,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(234,	4,	10148,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(235,	4,	10101,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(236,	4,	10476,	'b',	'Pregunta trampa',	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(237,	4,	10095,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(238,	4,	10112,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(239,	4,	10090,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL),
(240,	4,	10099,	'b',	NULL,	'2025-08-08 22:05:59',	0,	0.00,	NULL);

DROP TABLE IF EXISTS `respuestas_parametros_operacion`;
CREATE TABLE `respuestas_parametros_operacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `parametro_operacion_id` int NOT NULL,
  `estado` enum('cumple','no_cumple','no_aplica','observacion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_evaluacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_usuario_parametro` (`usuario_id`,`parametro_operacion_id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_parametro` (`parametro_operacion_id`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `respuestas_parametros_operacion_ibfk_1` FOREIGN KEY (`parametro_operacion_id`) REFERENCES `parametros_operacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Respuestas del usuario a parámetros individuales de operación';


DROP TABLE IF EXISTS `roles_personal`;
CREATE TABLE `roles_personal` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles_personal` (`id`, `codigo`, `nombre`, `descripcion`, `activo`, `fecha_creacion`) VALUES
(1,	'jefe_planta',	'Jefe de Planta',	'Responsable general de la operación de la planta',	1,	'2025-06-19 15:38:34'),
(2,	'laboratorista',	'Laboratorista',	'Encargado del control de calidad y pruebas de laboratorio',	1,	'2025-06-19 15:38:34'),
(3,	'operador_camion',	'Operador de Camión Revolvedor',	'Operador de vehículos de transporte de concreto',	1,	'2025-06-19 15:38:34'),
(4,	'operador_bombas',	'Operador de Bombas de Concreto',	'Operador de equipos de bombeo de concreto',	1,	'2025-06-19 15:38:34');

DROP TABLE IF EXISTS `secciones_evaluacion`;
CREATE TABLE `secciones_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_evaluacion_id` int NOT NULL,
  `rol_personal_id` int DEFAULT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `orden` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ponderacion` decimal(5,2) DEFAULT '0.00' COMMENT 'Porcentaje de ponderación de la sección (ej: 17.55)',
  `es_trampa` tinyint(1) DEFAULT '0' COMMENT 'Indica si es una sección de preguntas trampa',
  `preguntas_trampa_por_seccion` int DEFAULT '0' COMMENT 'Número de preguntas trampa a mostrar por sección normal',
  `p_minimo_aprobacion` decimal(5,2) DEFAULT '90.00' COMMENT 'Porcentaje mínimo de aprobación de cuestionario individual por sección',
  PRIMARY KEY (`id`),
  KEY `idx_tipo_evaluacion` (`tipo_evaluacion_id`),
  KEY `idx_rol_personal` (`rol_personal_id`),
  KEY `idx_orden` (`orden`),
  CONSTRAINT `secciones_evaluacion_ibfk_1` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipos_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `secciones_evaluacion_ibfk_2` FOREIGN KEY (`rol_personal_id`) REFERENCES `roles_personal` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `secciones_evaluacion` (`id`, `tipo_evaluacion_id`, `rol_personal_id`, `nombre`, `descripcion`, `orden`, `activo`, `fecha_creacion`, `ponderacion`, `es_trampa`, `preguntas_trampa_por_seccion`, `p_minimo_aprobacion`) VALUES
(1001,	1,	1,	'Conocimiento técnico y operativo',	'Evaluación de conocimientos técnicos relacionados con los procesos productivos, equipos y tecnologías utilizadas en la planta. Incluye comprensión de especificaciones técnicas, procedimientos operativos y normativas industriales.',	1,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1002,	1,	1,	'Gestión de la producción',	'Capacidad para planificar, organizar y controlar los procesos productivos. Incluye optimización de recursos, programación de producción, cumplimiento de objetivos y eficiencia operacional.',	2,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1003,	1,	1,	'Mantenimiento del equipo',	'Gestión del mantenimiento preventivo y correctivo de equipos y maquinaria. Incluye planificación de mantenimientos, control de inventarios de repuestos y coordinación con equipos técnicos.',	3,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1004,	1,	1,	'Gestión del personal',	'Habilidades de liderazgo, supervisión y desarrollo del equipo de trabajo. Incluye motivación, capacitación, evaluación del desempeño y resolución de conflictos laborales.',	4,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1005,	1,	1,	'Seguridad y cumplimiento normativo',	'Implementación y supervisión de políticas de seguridad industrial, cumplimiento de normativas ambientales y laborales. Incluye prevención de accidentes y gestión de riesgos.',	5,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1006,	1,	1,	'Control de calidad',	'Supervisión y control de la calidad del producto final. Incluye implementación de sistemas de calidad, control de especificaciones y mejora continua de procesos.',	6,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1007,	1,	1,	'Documentación y control administrativo',	'Gestión de la documentación técnica y administrativa de la planta. Incluye reportes de producción, registros de control, documentación de procesos y archivo de información.',	7,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	80.00),
(1008,	1,	1,	'Mejora continua y enfoque a resultados',	'Implementación de metodologías de mejora continua, análisis de indicadores de desempeño y búsqueda constante de optimización en procesos y resultados.',	8,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1009,	1,	1,	'Coordinación con logística y clientes',	'Coordinación con áreas de logística para el cumplimiento de entregas, comunicación con clientes y resolución de requerimientos especiales de producción.',	9,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	80.00),
(1010,	1,	1,	'Resolución de problemas',	'Capacidad para identificar, analizar y resolver problemas operativos de manera eficiente. Incluye toma de decisiones bajo presión y implementación de soluciones efectivas.',	10,	1,	'2025-06-19 16:32:53',	10.00,	0,	1,	90.00),
(1013,	1,	1,	'Preguntas Trampa - Jefe de Planta',	'Preguntas trampa para evaluar conocimiento específico',	999,	1,	'2025-06-24 15:36:27',	0.00,	1,	0,	90.00),
(1014,	2,	NULL,	'Producción y Mezclado',	'Evaluación de equipos de producción, mezclado y dosificación',	1,	1,	'2025-06-24 16:49:59',	19.90,	0,	0,	90.00),
(1015,	2,	NULL,	'Transporte y Entrega',	'Evaluación de equipos de transporte y sistemas de entrega',	2,	1,	'2025-06-24 16:49:59',	12.04,	0,	0,	90.00),
(1016,	2,	NULL,	'Laboratorio y Control de Calidad',	'Evaluación de equipos de laboratorio y control de calidad',	3,	1,	'2025-06-24 16:49:59',	18.50,	0,	0,	90.00),
(1017,	2,	NULL,	'Mantenimiento',	'Evaluación de equipos y herramientas de mantenimiento',	4,	1,	'2025-06-24 16:49:59',	15.20,	0,	0,	90.00),
(1018,	2,	NULL,	'Seguridad y Normatividad',	'Evaluación de equipos de seguridad y protección ambiental',	5,	1,	'2025-06-24 16:49:59',	20.36,	0,	0,	90.00),
(1019,	2,	NULL,	'Control y Automatización',	'Evaluación de sistemas de gestión y equipos administrativos',	6,	1,	'2025-06-24 16:49:59',	14.00,	0,	0,	90.00);

DROP TABLE IF EXISTS `secciones_operacion`;
CREATE TABLE `secciones_operacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `orden` int NOT NULL DEFAULT '1',
  `icono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'settings',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mostrar_lectura` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_orden` (`orden`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Secciones de evaluación de operación navegables con flechas';

INSERT INTO `secciones_operacion` (`id`, `nombre`, `descripcion`, `orden`, `icono`, `activo`, `fecha_creacion`, `fecha_actualizacion`, `mostrar_lectura`) VALUES
(1,	'Calibraciones y Verificaciones',	'Parámetros de calibración y verificación de equipos de medición y control',	1,	'settings',	1,	'2025-08-04 15:11:38',	'2025-08-04 15:11:38',	0),
(2,	'Mantenimiento Preventivo y Correctivo',	'Parámetros de mantenimiento programado y reparaciones de equipos',	2,	'settings',	1,	'2025-08-04 15:11:38',	'2025-08-04 15:11:38',	0),
(3,	'Laboratorio y Control de Calidad',	'Parámetros de control de calidad del concreto y materiales',	3,	'settings',	1,	'2025-08-04 15:11:38',	'2025-08-04 15:51:19',	1),
(4,	'Producción y Operación',	'Parámetros del proceso de producción y operación diaria',	4,	'settings',	1,	'2025-08-04 15:11:38',	'2025-08-04 15:51:19',	1),
(5,	'Personal y Capacitación',	'',	5,	'package',	1,	'2025-08-04 14:45:20',	'2025-08-04 14:45:20',	0),
(6,	'Seguridad y Normatividad',	'',	6,	'file-text',	1,	'2025-08-04 14:45:20',	'2025-08-04 14:45:20',	0);

DROP TABLE IF EXISTS `subsecciones_evaluacion`;
CREATE TABLE `subsecciones_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seccion_id` int NOT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `orden` int NOT NULL DEFAULT '1',
  `ponderacion_subseccion` decimal(5,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subseccion_seccion` (`seccion_id`),
  KEY `idx_subseccion_orden` (`orden`),
  CONSTRAINT `subsecciones_evaluacion_ibfk_1` FOREIGN KEY (`seccion_id`) REFERENCES `secciones_evaluacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subsecciones_evaluacion` (`id`, `seccion_id`, `nombre`, `descripcion`, `orden`, `ponderacion_subseccion`, `activo`, `fecha_creacion`) VALUES
(40,	1014,	'TOLVA DE DESCARGA MANUAL',	'',	1,	0.00,	1,	'2025-07-10 16:23:17'),
(41,	1014,	'TANQUE DE AGUA',	'',	1,	0.00,	1,	'2025-07-10 16:23:17'),
(42,	1014,	'SILO DE CEMENTO',	'',	1,	0.00,	1,	'2025-07-10 16:23:17'),
(43,	1014,	'BANDA TRANSPORTADORA',	'',	1,	0.00,	1,	'2025-07-10 16:23:17'),
(44,	1014,	'TOLVAS DE AGREGADOS',	'',	1,	0.00,	1,	'2025-07-10 16:23:17'),
(45,	1014,	'BÁSCULAS',	'',	1,	0.00,	1,	'2025-07-10 16:23:17'),
(46,	1014,	'MEZCLADOR',	'',	1,	0.00,	1,	'2025-07-10 16:23:17'),
(47,	1019,	'BÁSCULAS DIGITALES SIMPLES',	'',	1,	0.00,	1,	'2025-07-10 16:25:36'),
(48,	1019,	'SENSOR DE HUMEDAD',	'',	1,	0.00,	1,	'2025-07-10 16:25:36'),
(49,	1019,	'PARO DE EMERGENCIA',	'',	1,	0.00,	1,	'2025-07-10 16:25:36'),
(50,	1019,	'TABLERO DE CONTROL',	'',	1,	0.00,	1,	'2025-07-10 16:25:36'),
(51,	1016,	'PRENSA HIDRÁULICA',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(52,	1016,	'TANQUE DE CURADO',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(53,	1016,	'CRONÓMETRO',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(54,	1016,	'TERMÓMETRO PARA CONCRETO',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(55,	1016,	'BALANZA DE PRECISIÓN',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(56,	1016,	'CONO DE ABRAMS',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(57,	1016,	'VARILLA DE COMPACTACIÓN',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(58,	1016,	'MESA DE SACUDIDAS',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(59,	1016,	'MOLDES CILÍNDRICOS',	'',	1,	0.00,	1,	'2025-07-10 16:27:24'),
(60,	1017,	'HERRAMIENTAS MANUALES BÁSICAS',	'',	1,	0.00,	1,	'2025-07-10 16:28:30'),
(61,	1017,	'GRASA Y LUBRICANTES',	'',	1,	0.00,	1,	'2025-07-10 16:28:30'),
(62,	1017,	'COMPRESOR DE AIRE PORTÁTIL',	'',	1,	0.00,	1,	'2025-07-10 16:28:30'),
(63,	1017,	'HIDROLAVADORA PEQUEÑA',	'',	1,	0.00,	1,	'2025-07-10 16:28:30'),
(64,	1017,	'BANCO DE HERRAMIENTAS',	'',	1,	0.00,	1,	'2025-07-10 16:28:30'),
(65,	1015,	'Camión revolvedor',	'',	1,	0.00,	1,	'2025-07-10 16:29:05'),
(66,	1015,	'Mezcladora Portatil',	'',	1,	0.00,	1,	'2025-07-10 16:29:05'),
(67,	1015,	'Motocicleta o radio',	'',	1,	0.00,	1,	'2025-07-10 16:29:06'),
(68,	1015,	'Remolques',	'',	1,	0.00,	1,	'2025-07-10 16:29:06'),
(69,	1018,	'Señalización básica',	'',	1,	0.00,	1,	'2025-07-10 16:30:29'),
(70,	1018,	'Equipo de proteccion personal',	'',	1,	0.00,	1,	'2025-07-10 16:30:30'),
(71,	1018,	'Botiquín de primeros auxilios',	'',	1,	0.00,	1,	'2025-07-10 16:30:30'),
(72,	1018,	'Manuales de operación y bitacora',	'',	1,	0.00,	1,	'2025-07-10 16:30:30');

DROP TABLE IF EXISTS `tipos_evaluacion`;
CREATE TABLE `tipos_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tipos_evaluacion` (`id`, `codigo`, `nombre`, `descripcion`, `activo`, `fecha_creacion`) VALUES
(1,	'personal',	'Evaluación de Personal',	'Evaluación de competencias y conocimientos del personal',	1,	'2025-06-19 15:38:34'),
(2,	'equipo',	'Evaluación de Equipo',	'Evaluación del estado y funcionamiento de equipos',	1,	'2025-06-19 15:38:34'),
(3,	'operacion',	'Evaluación de Operación',	'Evaluación de procesos operativos y procedimientos',	1,	'2025-06-19 15:38:34');

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` enum('admin','evaluador','supervisor') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'evaluador',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `permisos_completos` tinyint(1) DEFAULT '0' COMMENT 'Si TRUE, el usuario puede acceder a todos los roles sin restricciones',
  `puede_hacer_examen` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `rol`, `activo`, `fecha_creacion`, `fecha_actualizacion`, `permisos_completos`, `puede_hacer_examen`) VALUES
(1,	'admin',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Administrador IMCYC',	'admin@imcyc.org',	'admin',	1,	'2025-06-19 15:38:34',	'2025-08-05 22:22:52',	1,	1),
(4,	'ruribe2',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Administrador',	'admin@admin.com',	'admin',	1,	'2025-06-19 15:58:30',	'2025-08-05 22:22:52',	1,	1),
(8,	'ruribe',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Roberto Uribe',	'ruribe@imcyc.com',	'supervisor',	1,	'2025-06-20 22:50:22',	'2025-08-05 22:22:52',	1,	1),
(10,	'evaluador1',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Evaluador Jefe Planta 1',	'evaluador1@imcyc.org',	'evaluador',	1,	'2025-07-11 17:35:12',	'2025-08-05 22:22:52',	0,	1),
(11,	'evaluador2',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Evaluador Jefe Planta 2',	'evaluador2@imcyc.org',	'evaluador',	1,	'2025-07-11 17:35:12',	'2025-08-05 22:22:52',	0,	1),
(12,	'evaluador3',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Evaluador Jefe Planta 3',	'evaluador3@imcyc.org',	'evaluador',	1,	'2025-07-11 17:35:12',	'2025-08-05 22:22:52',	0,	1),
(13,	'luis_daniel_lopez',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Luis Daniel López García',	'daniel25lg@gmail.com',	'evaluador',	1,	'2025-07-18 23:04:39',	'2025-08-05 22:22:52',	0,	1),
(15,	'Juan',	'$2y$10$p/BYNfNyyt/RLmWQkfmP2.8deYsmE6AM6qRWcLS5IIe4lXBqftVSW',	'Juan Martinez Completo',	'juanito_martinez@gmail.com',	'evaluador',	1,	'2025-08-05 21:56:25',	'2025-08-05 21:56:25',	0,	1);

DROP VIEW IF EXISTS `vista_estadisticas_evaluacion`;
CREATE TABLE `vista_estadisticas_evaluacion` (`tipo_evaluacion` varchar(200), `total_evaluaciones` bigint, `promedio_puntuacion` decimal(9,6), `aprobados` decimal(23,0), `reprobados` decimal(23,0));


DROP VIEW IF EXISTS `vista_estado_examenes_usuarios`;
CREATE TABLE `vista_estado_examenes_usuarios` (`usuario_id` int, `username` varchar(100), `nombre_completo` varchar(200), `email` varchar(150), `usuario_activo` tinyint(1), `examen_bloqueado` int, `motivo_bloqueo` text, `fecha_bloqueo` timestamp, `fecha_desbloqueo` timestamp, `bloqueado_por_username` varchar(100), `bloqueado_por_nombre` varchar(200), `puede_realizar_examenes` tinyint(1), `fecha_actualizacion` timestamp);


DROP VIEW IF EXISTS `vista_evaluacion_equipo_subsecciones`;
CREATE TABLE `vista_evaluacion_equipo_subsecciones` (`seccion_id` int, `seccion_nombre` varchar(200), `seccion_orden` int, `seccion_ponderacion` decimal(5,2), `subseccion_id` int, `subseccion_nombre` varchar(200), `subseccion_orden` int, `ponderacion_subseccion` decimal(5,2), `total_preguntas` bigint, `tipo_evaluacion` varchar(50));


DROP VIEW IF EXISTS `vista_evaluacion_ponderada`;
CREATE TABLE `vista_evaluacion_ponderada` (`seccion_id` int, `seccion_nombre` varchar(200), `seccion_orden` int, `seccion_ponderacion` decimal(5,2), `seccion_es_trampa` tinyint(1), `preguntas_trampa_por_seccion` int, `tipo_evaluacion` varchar(50), `tipo_nombre` varchar(200), `rol_codigo` varchar(50), `rol_nombre` varchar(200), `total_preguntas` bigint, `preguntas_normales` bigint, `preguntas_trampa` bigint);


DROP VIEW IF EXISTS `vista_evaluaciones_completas`;
CREATE TABLE `vista_evaluaciones_completas` (`id` int, `puntuacion_total` decimal(5,2), `total_preguntas` int, `estado` enum('en_progreso','completada','cancelada'), `fecha_inicio` timestamp, `fecha_finalizacion` timestamp, `username` varchar(100), `nombre_completo` varchar(200), `tipo_evaluacion` varchar(200), `rol_personal` varchar(200), `resultado` varchar(9));


DROP VIEW IF EXISTS `vista_historial_estado_examenes`;
CREATE TABLE `vista_historial_estado_examenes` (`id` int, `usuario_id` int, `username` varchar(100), `nombre_completo` varchar(200), `accion` enum('BLOQUEAR','DESBLOQUEAR'), `motivo` text, `fecha_accion` timestamp, `realizado_por_username` varchar(100), `realizado_por_nombre` varchar(200));


DROP VIEW IF EXISTS `vista_permisos_usuarios`;
CREATE TABLE `vista_permisos_usuarios` (`usuario_id` int, `username` varchar(100), `nombre_completo` varchar(200), `rol_sistema` enum('admin','evaluador','supervisor'), `permisos_completos` tinyint(1), `rol_personal_id` int, `rol_codigo` varchar(50), `rol_nombre` varchar(200), `puede_evaluar` tinyint(1), `puede_ver_resultados` tinyint(1), `fecha_asignacion` timestamp);


DROP VIEW IF EXISTS `vista_preguntas_ponderadas`;
CREATE TABLE `vista_preguntas_ponderadas` (`id` int, `seccion_id` int, `pregunta` text, `tipo_pregunta` enum('abierta','seleccion_multiple'), `opcion_a` text, `opcion_b` text, `opcion_c` text, `respuesta_correcta` enum('a','b','c'), `orden` int, `activo` tinyint(1), `es_trampa` tinyint(1), `ponderacion_individual` decimal(5,2), `seccion_nombre` varchar(200), `seccion_ponderacion` decimal(5,2), `seccion_es_trampa` tinyint(1), `preguntas_trampa_por_seccion` int, `tipo_evaluacion` varchar(50), `rol_personal` varchar(50), `ponderacion_calculada` decimal(6,2));


DROP VIEW IF EXISTS `vista_progreso_equipo_usuario`;
CREATE TABLE `vista_progreso_equipo_usuario` (`usuario_id` int, `tipo_planta` enum('pequena','mediana','grande'), `seccion_id` int, `seccion_nombre` varchar(200), `seccion_completada` tinyint(1), `seccion_puntaje` decimal(5,2), `seccion_porcentaje` decimal(5,2), `total_subsecciones` int, `subsecciones_completadas` int, `seccion_respuestas_correctas` int, `seccion_total_preguntas` int, `seccion_fecha_completada` timestamp, `subsecciones_detalle` text, `total_subsecciones_registradas` bigint, `subsecciones_completadas_real` decimal(23,0), `username` varchar(100), `nombre_completo` varchar(200));


DROP TABLE IF EXISTS `vista_estadisticas_evaluacion`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_estadisticas_evaluacion` AS select `te`.`nombre` AS `tipo_evaluacion`,count(`e`.`id`) AS `total_evaluaciones`,avg(`e`.`puntuacion_total`) AS `promedio_puntuacion`,sum((case when (`e`.`puntuacion_total` >= 120) then 1 else 0 end)) AS `aprobados`,sum((case when (`e`.`puntuacion_total` < 120) then 1 else 0 end)) AS `reprobados` from (`tipos_evaluacion` `te` left join `evaluaciones` `e` on(((`te`.`id` = `e`.`tipo_evaluacion_id`) and (`e`.`estado` = 'completada')))) group by `te`.`id`,`te`.`nombre`;

DROP TABLE IF EXISTS `vista_estado_examenes_usuarios`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_estado_examenes_usuarios` AS select `u`.`id` AS `usuario_id`,`u`.`username` AS `username`,`u`.`nombre_completo` AS `nombre_completo`,`u`.`email` AS `email`,`u`.`activo` AS `usuario_activo`,coalesce(`eeu`.`examen_bloqueado`,false) AS `examen_bloqueado`,`eeu`.`motivo_bloqueo` AS `motivo_bloqueo`,`eeu`.`fecha_bloqueo` AS `fecha_bloqueo`,`eeu`.`fecha_desbloqueo` AS `fecha_desbloqueo`,`ub`.`username` AS `bloqueado_por_username`,`ub`.`nombre_completo` AS `bloqueado_por_nombre`,`UsuarioPuedeRealizarExamenes`(`u`.`id`) AS `puede_realizar_examenes`,`eeu`.`fecha_actualizacion` AS `fecha_actualizacion` from ((`usuarios` `u` left join `estado_examenes_usuario` `eeu` on((`u`.`id` = `eeu`.`usuario_id`))) left join `usuarios` `ub` on((`eeu`.`bloqueado_por_usuario_id` = `ub`.`id`))) where (`u`.`activo` = 1) order by `u`.`nombre_completo`;

DROP TABLE IF EXISTS `vista_evaluacion_equipo_subsecciones`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_evaluacion_equipo_subsecciones` AS select `se`.`id` AS `seccion_id`,`se`.`nombre` AS `seccion_nombre`,`se`.`orden` AS `seccion_orden`,`se`.`ponderacion` AS `seccion_ponderacion`,`sub`.`id` AS `subseccion_id`,`sub`.`nombre` AS `subseccion_nombre`,`sub`.`orden` AS `subseccion_orden`,`sub`.`ponderacion_subseccion` AS `ponderacion_subseccion`,count(`p`.`id`) AS `total_preguntas`,`te`.`codigo` AS `tipo_evaluacion` from (((`secciones_evaluacion` `se` join `tipos_evaluacion` `te` on((`se`.`tipo_evaluacion_id` = `te`.`id`))) left join `subsecciones_evaluacion` `sub` on(((`sub`.`seccion_id` = `se`.`id`) and (`sub`.`activo` = true)))) left join `preguntas` `p` on(((`p`.`subseccion_id` = `sub`.`id`) and (`p`.`activo` = true)))) where ((`te`.`codigo` = 'equipo') and (`se`.`activo` = true) and (`se`.`es_trampa` = false)) group by `se`.`id`,`se`.`nombre`,`se`.`orden`,`se`.`ponderacion`,`sub`.`id`,`sub`.`nombre`,`sub`.`orden`,`sub`.`ponderacion_subseccion`,`te`.`codigo` order by `se`.`orden`,`sub`.`orden`;

DROP TABLE IF EXISTS `vista_evaluacion_ponderada`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_evaluacion_ponderada` AS select `se`.`id` AS `seccion_id`,`se`.`nombre` AS `seccion_nombre`,`se`.`orden` AS `seccion_orden`,`se`.`ponderacion` AS `seccion_ponderacion`,`se`.`es_trampa` AS `seccion_es_trampa`,`se`.`preguntas_trampa_por_seccion` AS `preguntas_trampa_por_seccion`,`te`.`codigo` AS `tipo_evaluacion`,`te`.`nombre` AS `tipo_nombre`,`rp`.`codigo` AS `rol_codigo`,`rp`.`nombre` AS `rol_nombre`,count(`p`.`id`) AS `total_preguntas`,count((case when (`p`.`es_trampa` = 0) then 1 end)) AS `preguntas_normales`,count((case when (`p`.`es_trampa` = 1) then 1 end)) AS `preguntas_trampa` from (((`secciones_evaluacion` `se` join `tipos_evaluacion` `te` on((`se`.`tipo_evaluacion_id` = `te`.`id`))) left join `roles_personal` `rp` on((`se`.`rol_personal_id` = `rp`.`id`))) left join `preguntas` `p` on(((`se`.`id` = `p`.`seccion_id`) and (`p`.`activo` = 1)))) where (`se`.`activo` = 1) group by `se`.`id`,`se`.`nombre`,`se`.`orden`,`se`.`ponderacion`,`se`.`es_trampa`,`se`.`preguntas_trampa_por_seccion`,`te`.`codigo`,`te`.`nombre`,`rp`.`codigo`,`rp`.`nombre` order by `te`.`codigo`,`rp`.`codigo`,`se`.`orden`;

DROP TABLE IF EXISTS `vista_evaluaciones_completas`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_evaluaciones_completas` AS select `e`.`id` AS `id`,`e`.`puntuacion_total` AS `puntuacion_total`,`e`.`total_preguntas` AS `total_preguntas`,`e`.`estado` AS `estado`,`e`.`fecha_inicio` AS `fecha_inicio`,`e`.`fecha_finalizacion` AS `fecha_finalizacion`,`u`.`username` AS `username`,`u`.`nombre_completo` AS `nombre_completo`,`te`.`nombre` AS `tipo_evaluacion`,`rp`.`nombre` AS `rol_personal`,(case when (`e`.`puntuacion_total` >= 120) then 'APROBADO' else 'REPROBADO' end) AS `resultado` from (((`evaluaciones` `e` join `usuarios` `u` on((`e`.`usuario_id` = `u`.`id`))) join `tipos_evaluacion` `te` on((`e`.`tipo_evaluacion_id` = `te`.`id`))) left join `roles_personal` `rp` on((`e`.`rol_personal_id` = `rp`.`id`)));

DROP TABLE IF EXISTS `vista_historial_estado_examenes`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_historial_estado_examenes` AS select `hee`.`id` AS `id`,`hee`.`usuario_id` AS `usuario_id`,`u`.`username` AS `username`,`u`.`nombre_completo` AS `nombre_completo`,`hee`.`accion` AS `accion`,`hee`.`motivo` AS `motivo`,`hee`.`fecha_accion` AS `fecha_accion`,`ur`.`username` AS `realizado_por_username`,`ur`.`nombre_completo` AS `realizado_por_nombre` from ((`historial_estado_examenes` `hee` join `usuarios` `u` on((`hee`.`usuario_id` = `u`.`id`))) join `usuarios` `ur` on((`hee`.`realizado_por_usuario_id` = `ur`.`id`))) order by `hee`.`fecha_accion` desc;

DROP TABLE IF EXISTS `vista_permisos_usuarios`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_permisos_usuarios` AS select `u`.`id` AS `usuario_id`,`u`.`username` AS `username`,`u`.`nombre_completo` AS `nombre_completo`,`u`.`rol` AS `rol_sistema`,`u`.`permisos_completos` AS `permisos_completos`,`rp`.`id` AS `rol_personal_id`,`rp`.`codigo` AS `rol_codigo`,`rp`.`nombre` AS `rol_nombre`,`pu`.`puede_evaluar` AS `puede_evaluar`,`pu`.`puede_ver_resultados` AS `puede_ver_resultados`,`pu`.`fecha_creacion` AS `fecha_asignacion` from ((`usuarios` `u` left join `permisos_usuario` `pu` on((`u`.`id` = `pu`.`usuario_id`))) left join `roles_personal` `rp` on((`pu`.`rol_personal_id` = `rp`.`id`))) where (`u`.`activo` = 1) order by `u`.`username`,`rp`.`nombre`;

DROP TABLE IF EXISTS `vista_preguntas_ponderadas`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_preguntas_ponderadas` AS select `p`.`id` AS `id`,`p`.`seccion_id` AS `seccion_id`,`p`.`pregunta` AS `pregunta`,`p`.`tipo_pregunta` AS `tipo_pregunta`,`p`.`opcion_a` AS `opcion_a`,`p`.`opcion_b` AS `opcion_b`,`p`.`opcion_c` AS `opcion_c`,`p`.`respuesta_correcta` AS `respuesta_correcta`,`p`.`orden` AS `orden`,`p`.`activo` AS `activo`,`p`.`es_trampa` AS `es_trampa`,`p`.`ponderacion_individual` AS `ponderacion_individual`,`se`.`nombre` AS `seccion_nombre`,`se`.`ponderacion` AS `seccion_ponderacion`,`se`.`es_trampa` AS `seccion_es_trampa`,`se`.`preguntas_trampa_por_seccion` AS `preguntas_trampa_por_seccion`,`te`.`codigo` AS `tipo_evaluacion`,`rp`.`codigo` AS `rol_personal`,(case when (`p`.`ponderacion_individual` > 0) then `p`.`ponderacion_individual` when (`se`.`es_trampa` = 1) then 0.00 else round((`se`.`ponderacion` / (select count(0) from `preguntas` `p2` where ((`p2`.`seccion_id` = `se`.`id`) and (`p2`.`activo` = 1) and (`p2`.`es_trampa` = 0)))),2) end) AS `ponderacion_calculada` from (((`preguntas` `p` join `secciones_evaluacion` `se` on((`p`.`seccion_id` = `se`.`id`))) join `tipos_evaluacion` `te` on((`se`.`tipo_evaluacion_id` = `te`.`id`))) left join `roles_personal` `rp` on((`se`.`rol_personal_id` = `rp`.`id`))) where ((`p`.`activo` = 1) and (`se`.`activo` = 1));

DROP TABLE IF EXISTS `vista_progreso_equipo_usuario`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_progreso_equipo_usuario` AS select `pse`.`usuario_id` AS `usuario_id`,`pse`.`tipo_planta` AS `tipo_planta`,`pse`.`seccion_id` AS `seccion_id`,`pse`.`seccion_nombre` AS `seccion_nombre`,`pse`.`completada` AS `seccion_completada`,`pse`.`puntaje_obtenido` AS `seccion_puntaje`,`pse`.`puntaje_porcentaje` AS `seccion_porcentaje`,`pse`.`total_subsecciones` AS `total_subsecciones`,`pse`.`subsecciones_completadas` AS `subsecciones_completadas`,`pse`.`respuestas_correctas` AS `seccion_respuestas_correctas`,`pse`.`total_preguntas` AS `seccion_total_preguntas`,`pse`.`fecha_completada` AS `seccion_fecha_completada`,group_concat(concat(`psse`.`subseccion_id`,':',`psse`.`subseccion_nombre`,':',`psse`.`completada`,':',`psse`.`puntaje_porcentaje`) order by `psse`.`subseccion_id` ASC separator '|') AS `subsecciones_detalle`,count(`psse`.`id`) AS `total_subsecciones_registradas`,sum((case when (`psse`.`completada` = 1) then 1 else 0 end)) AS `subsecciones_completadas_real`,`u`.`username` AS `username`,`u`.`nombre_completo` AS `nombre_completo` from ((`progreso_secciones_equipo` `pse` left join `progreso_subsecciones_equipo` `psse` on((`pse`.`id` = `psse`.`progreso_seccion_id`))) join `usuarios` `u` on((`pse`.`usuario_id` = `u`.`id`))) group by `pse`.`id`,`pse`.`usuario_id`,`pse`.`tipo_planta`,`pse`.`seccion_id`,`pse`.`seccion_nombre`,`pse`.`completada`,`pse`.`puntaje_obtenido`,`pse`.`puntaje_porcentaje`,`pse`.`total_subsecciones`,`pse`.`subsecciones_completadas`,`pse`.`respuestas_correctas`,`pse`.`total_preguntas`,`pse`.`fecha_completada`,`u`.`username`,`u`.`nombre_completo`;

-- 2025-08-12 16:35:50
