/*
  # Migración para progreso de secciones de equipo

  1. Nuevas Tablas
    - `progreso_secciones_equipo`
      - `id` (int, primary key)
      - `usuario_id` (int, foreign key)
      - `tipo_planta` (varchar)
      - `seccion_id` (int, foreign key)
      - `seccion_nombre` (varchar)
      - `completada` (boolean)
      - `puntaje_obtenido` (decimal)
      - `total_subsecciones` (int)
      - `subsecciones_completadas` (int)
      - `fecha_completada` (timestamp)
      - `fecha_actualizacion` (timestamp)

  2. Índices
    - Índice único por usuario, tipo_planta y sección
    - Índices para consultas rápidas

  3. Funciones
    - Función para marcar sección como completada
    - Función para obtener progreso por usuario y tipo de planta
*/

-- Crear tabla para el progreso de secciones de equipo
CREATE TABLE IF NOT EXISTS progreso_secciones_equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_planta ENUM('pequena', 'mediana', 'grande') NOT NULL,
    seccion_id INT NOT NULL,
    seccion_nombre VARCHAR(200) NOT NULL,
    completada BOOLEAN DEFAULT FALSE,
    puntaje_obtenido DECIMAL(5,2) DEFAULT 0.00,
    puntaje_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    total_subsecciones INT DEFAULT 0,
    subsecciones_completadas INT DEFAULT 0,
    respuestas_correctas INT DEFAULT 0,
    total_preguntas INT DEFAULT 0,
    fecha_completada TIMESTAMP NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (seccion_id) REFERENCES secciones_evaluacion(id) ON DELETE CASCADE,
    
    -- Índice único para evitar duplicados
    UNIQUE KEY unique_user_plant_section (usuario_id, tipo_planta, seccion_id),
    
    -- Índices para consultas rápidas
    INDEX idx_usuario_tipo_planta (usuario_id, tipo_planta),
    INDEX idx_completada (completada),
    INDEX idx_fecha_completada (fecha_completada)
);

-- Crear tabla para el progreso detallado de subsecciones
CREATE TABLE IF NOT EXISTS progreso_subsecciones_equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    progreso_seccion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_planta ENUM('pequena', 'mediana', 'grande') NOT NULL,
    subseccion_id INT NOT NULL,
    subseccion_nombre VARCHAR(200) NOT NULL,
    completada BOOLEAN DEFAULT FALSE,
    puntaje_obtenido DECIMAL(5,2) DEFAULT 0.00,
    puntaje_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    respuestas_correctas INT DEFAULT 0,
    total_preguntas INT DEFAULT 0,
    fecha_completada TIMESTAMP NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (progreso_seccion_id) REFERENCES progreso_secciones_equipo(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (subseccion_id) REFERENCES subsecciones_evaluacion(id) ON DELETE CASCADE,
    
    -- Índice único para evitar duplicados
    UNIQUE KEY unique_user_plant_subsection (usuario_id, tipo_planta, subseccion_id),
    
    -- Índices para consultas rápidas
    INDEX idx_progreso_seccion (progreso_seccion_id),
    INDEX idx_usuario_tipo_planta (usuario_id, tipo_planta),
    INDEX idx_completada (completada)
);

-- Función para marcar una sección como completada
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS MarcarSeccionEquipoCompletada(
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
END //
DELIMITER ;

-- Función para marcar una subsección como completada
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS MarcarSubseccionEquipoCompletada(
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
END //
DELIMITER ;

-- Vista para obtener el progreso completo de un usuario
CREATE OR REPLACE VIEW vista_progreso_equipo_usuario AS
SELECT 
    pse.usuario_id,
    pse.tipo_planta,
    pse.seccion_id,
    pse.seccion_nombre,
    pse.completada as seccion_completada,
    pse.puntaje_obtenido as seccion_puntaje,
    pse.puntaje_porcentaje as seccion_porcentaje,
    pse.total_subsecciones,
    pse.subsecciones_completadas,
    pse.respuestas_correctas as seccion_respuestas_correctas,
    pse.total_preguntas as seccion_total_preguntas,
    pse.fecha_completada as seccion_fecha_completada,
    
    -- Información de subsecciones
    GROUP_CONCAT(
        CONCAT(
            psse.subseccion_id, ':', 
            psse.subseccion_nombre, ':', 
            psse.completada, ':', 
            psse.puntaje_porcentaje
        ) 
        ORDER BY psse.subseccion_id 
        SEPARATOR '|'
    ) as subsecciones_detalle,
    
    -- Estadísticas generales
    COUNT(psse.id) as total_subsecciones_registradas,
    SUM(CASE WHEN psse.completada = 1 THEN 1 ELSE 0 END) as subsecciones_completadas_real,
    
    u.username,
    u.nombre_completo
FROM progreso_secciones_equipo pse
LEFT JOIN progreso_subsecciones_equipo psse ON pse.id = psse.progreso_seccion_id
JOIN usuarios u ON pse.usuario_id = u.id
GROUP BY 
    pse.id, pse.usuario_id, pse.tipo_planta, pse.seccion_id, 
    pse.seccion_nombre, pse.completada, pse.puntaje_obtenido, 
    pse.puntaje_porcentaje, pse.total_subsecciones, 
    pse.subsecciones_completadas, pse.respuestas_correctas, 
    pse.total_preguntas, pse.fecha_completada,
    u.username, u.nombre_completo;

-- Función para obtener el progreso de un usuario específico
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS ObtenerProgresoEquipoUsuario(
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
END //
DELIMITER ;

-- Función para limpiar progreso de un usuario (útil para testing)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS LimpiarProgresoEquipoUsuario(
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
END //
DELIMITER ;

-- Insertar datos de ejemplo para testing (opcional)
-- Descomentar las siguientes líneas si quieres datos de prueba

/*
-- Ejemplo de uso de las funciones
CALL MarcarSubseccionEquipoCompletada(
    1,                    -- usuario_id
    'mediana',           -- tipo_planta
    1014,                -- seccion_id (Producción y Mezclado)
    1,                   -- subseccion_id (Mezcladora Principal)
    'Mezcladora Principal', -- subseccion_nombre
    85.50,               -- puntaje_obtenido
    85.50,               -- puntaje_porcentaje
    17,                  -- respuestas_correctas
    20                   -- total_preguntas
);

-- Ver el progreso
CALL ObtenerProgresoEquipoUsuario(1, 'mediana');
*/

-- Comentarios finales
-- Esta migración crea un sistema completo para rastrear el progreso de las evaluaciones de equipo
-- Permite guardar el estado de secciones y subsecciones completadas
-- Incluye procedimientos almacenados para facilitar las operaciones
-- Incluye una vista para consultar el progreso de manera eficiente