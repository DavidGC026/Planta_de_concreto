/*
  # Sistema de Ponderación y Preguntas Trampa

  1. Modificaciones a tablas existentes
    - Agregar campo `ponderacion` a secciones_evaluacion
    - Agregar campo `es_trampa` a secciones_evaluacion
    - Agregar campo `es_trampa` a preguntas
    - Agregar campo `ponderacion_individual` a preguntas

  2. Nuevas funcionalidades
    - Sistema de ponderación por sección
    - Preguntas trampa aleatorias
    - Cálculo automático de puntuación ponderada
*/

-- Agregar campos de ponderación a secciones_evaluacion
ALTER TABLE secciones_evaluacion 
ADD COLUMN ponderacion DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de ponderación de la sección (ej: 17.55)';

ALTER TABLE secciones_evaluacion 
ADD COLUMN es_trampa BOOLEAN DEFAULT FALSE COMMENT 'Indica si es una sección de preguntas trampa';

ALTER TABLE secciones_evaluacion 
ADD COLUMN preguntas_trampa_por_seccion INT DEFAULT 0 COMMENT 'Número de preguntas trampa a mostrar por sección normal';

-- Agregar campos de ponderación a preguntas
ALTER TABLE preguntas 
ADD COLUMN es_trampa BOOLEAN DEFAULT FALSE COMMENT 'Indica si es una pregunta trampa';

ALTER TABLE preguntas 
ADD COLUMN ponderacion_individual DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Ponderación individual de la pregunta';

-- Crear tabla para configuración de ponderación por tipo de evaluación
CREATE TABLE IF NOT EXISTS configuracion_ponderacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evaluacion_id INT NOT NULL,
    rol_personal_id INT NULL,
    total_preguntas_trampa INT DEFAULT 0 COMMENT 'Total de preguntas trampa disponibles',
    preguntas_trampa_por_seccion INT DEFAULT 1 COMMENT 'Preguntas trampa a mostrar por sección',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_evaluacion_id) REFERENCES tipos_evaluacion(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE SET NULL
);

-- Actualizar ponderaciones para Jefe de Planta (basado en los criterios que mencionaste)
UPDATE secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN roles_personal rp ON se.rol_personal_id = rp.id
SET se.ponderacion = CASE 
    WHEN se.nombre LIKE '%Conocimiento técnico%' THEN 15.00
    WHEN se.nombre LIKE '%Gestión de la producción%' THEN 20.00
    WHEN se.nombre LIKE '%Mantenimiento%' THEN 10.00
    WHEN se.nombre LIKE '%Seguridad%' THEN 10.00
    WHEN se.nombre LIKE '%Control de calidad%' THEN 10.00
    WHEN se.nombre LIKE '%Gestión del personal%' THEN 10.00
    WHEN se.nombre LIKE '%Documentación%' THEN 5.00
    WHEN se.nombre LIKE '%Coordinación%' THEN 5.00
    WHEN se.nombre LIKE '%Resolución%' THEN 7.50
    WHEN se.nombre LIKE '%Mejora continua%' THEN 7.50
    ELSE 10.00
END
WHERE te.codigo = 'personal' AND rp.codigo = 'jefe_planta';

-- Crear sección de preguntas trampa para Jefe de Planta
INSERT INTO secciones_evaluacion (tipo_evaluacion_id, rol_personal_id, nombre, descripcion, orden, activo, es_trampa, ponderacion)
SELECT 
    te.id,
    rp.id,
    'Preguntas Trampa - Jefe de Planta',
    'Preguntas trampa para evaluar conocimiento específico',
    999,
    TRUE,
    TRUE,
    0.00
FROM tipos_evaluacion te
JOIN roles_personal rp ON rp.codigo = 'jefe_planta'
WHERE te.codigo = 'personal'
AND NOT EXISTS (
    SELECT 1 FROM secciones_evaluacion se2 
    WHERE se2.tipo_evaluacion_id = te.id 
    AND se2.rol_personal_id = rp.id 
    AND se2.es_trampa = TRUE
);

-- Insertar preguntas trampa para Jefe de Planta
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    pregunta_texto,
    'abierta',
    ROW_NUMBER() OVER (ORDER BY pregunta_texto),
    TRUE,
    TRUE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN roles_personal rp ON se.rol_personal_id = rp.id
CROSS JOIN (
    SELECT 'Pregunta trampa 1: ¿Cuál es la resistencia mínima del concreto para estructuras críticas?' as pregunta_texto
    UNION ALL SELECT 'Pregunta trampa 2: ¿Qué normativa rige el control de calidad en plantas de concreto?'
    UNION ALL SELECT 'Pregunta trampa 3: ¿Cuál es el tiempo máximo de mezclado para concreto convencional?'
    UNION ALL SELECT 'Pregunta trampa 4: ¿Qué porcentaje de humedad debe tener el agregado fino?'
    UNION ALL SELECT 'Pregunta trampa 5: ¿Cuál es la temperatura máxima permitida para el concreto fresco?'
    UNION ALL SELECT 'Pregunta trampa 6: ¿Qué aditivo se usa para acelerar el fraguado en clima frío?'
    UNION ALL SELECT 'Pregunta trampa 7: ¿Cuál es el revenimiento estándar para concreto bombeado?'
    UNION ALL SELECT 'Pregunta trampa 8: ¿Qué prueba determina la trabajabilidad del concreto?'
    UNION ALL SELECT 'Pregunta trampa 9: ¿Cuál es el contenido de aire recomendado para concreto expuesto a hielo?'
    UNION ALL SELECT 'Pregunta trampa 10: ¿Qué relación agua/cemento es crítica para la durabilidad?'
    UNION ALL SELECT 'Pregunta trampa 11: ¿Cuál es la granulometría ideal para agregado grueso?'
    UNION ALL SELECT 'Pregunta trampa 12: ¿Qué método se usa para determinar la densidad del concreto?'
    UNION ALL SELECT 'Pregunta trampa 13: ¿Cuál es el tiempo de curado mínimo para concreto estructural?'
    UNION ALL SELECT 'Pregunta trampa 14: ¿Qué aditivo reduce la permeabilidad del concreto?'
    UNION ALL SELECT 'Pregunta trampa 15: ¿Cuál es la resistencia a compresión a 7 días vs 28 días?'
    UNION ALL SELECT 'Pregunta trampa 16: ¿Qué factor afecta más la resistencia del concreto?'
    UNION ALL SELECT 'Pregunta trampa 17: ¿Cuál es el módulo de elasticidad típico del concreto?'
    UNION ALL SELECT 'Pregunta trampa 18: ¿Qué prueba evalúa la segregación del concreto?'
    UNION ALL SELECT 'Pregunta trampa 19: ¿Cuál es el contenido óptimo de cemento por m³?'
    UNION ALL SELECT 'Pregunta trampa 20: ¿Qué normativa regula el transporte de concreto premezclado?'
) preguntas_trampa
WHERE te.codigo = 'personal' 
AND rp.codigo = 'jefe_planta' 
AND se.es_trampa = TRUE
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.seccion_id = se.id 
    AND p2.pregunta = pregunta_texto
);

-- Insertar configuración de ponderación para Jefe de Planta
INSERT INTO configuracion_ponderacion (tipo_evaluacion_id, rol_personal_id, total_preguntas_trampa, preguntas_trampa_por_seccion)
SELECT 
    te.id,
    rp.id,
    20,
    1
FROM tipos_evaluacion te
JOIN roles_personal rp ON rp.codigo = 'jefe_planta'
WHERE te.codigo = 'personal'
AND NOT EXISTS (
    SELECT 1 FROM configuracion_ponderacion cp 
    WHERE cp.tipo_evaluacion_id = te.id 
    AND cp.rol_personal_id = rp.id
);

-- Actualizar preguntas trampa por sección para secciones normales
UPDATE secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN roles_personal rp ON se.rol_personal_id = rp.id
SET se.preguntas_trampa_por_seccion = 1
WHERE te.codigo = 'personal' 
AND rp.codigo = 'jefe_planta' 
AND se.es_trampa = FALSE;

-- Crear vista para obtener preguntas con ponderación
CREATE OR REPLACE VIEW vista_preguntas_ponderadas AS
SELECT 
    p.id,
    p.seccion_id,
    p.pregunta,
    p.tipo_pregunta,
    p.opcion_a,
    p.opcion_b,
    p.opcion_c,
    p.respuesta_correcta,
    p.orden,
    p.activo,
    p.es_trampa,
    p.ponderacion_individual,
    se.nombre as seccion_nombre,
    se.ponderacion as seccion_ponderacion,
    se.es_trampa as seccion_es_trampa,
    se.preguntas_trampa_por_seccion,
    te.codigo as tipo_evaluacion,
    rp.codigo as rol_personal,
    -- Calcular ponderación automática si no está definida individualmente
    CASE 
        WHEN p.ponderacion_individual > 0 THEN p.ponderacion_individual
        WHEN se.es_trampa = TRUE THEN 0.00
        ELSE ROUND(se.ponderacion / (
            SELECT COUNT(*) 
            FROM preguntas p2 
            WHERE p2.seccion_id = se.id 
            AND p2.activo = TRUE 
            AND p2.es_trampa = FALSE
        ), 2)
    END as ponderacion_calculada
FROM preguntas p
JOIN secciones_evaluacion se ON p.seccion_id = se.id
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
LEFT JOIN roles_personal rp ON se.rol_personal_id = rp.id
WHERE p.activo = TRUE AND se.activo = TRUE;

-- Crear función para obtener preguntas con trampa aleatoria
DELIMITER //
CREATE OR REPLACE FUNCTION obtener_preguntas_con_trampa(
    p_tipo_evaluacion VARCHAR(50),
    p_rol_personal VARCHAR(50),
    p_preguntas_por_seccion INT DEFAULT 5
) RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultado JSON DEFAULT JSON_ARRAY();
    DECLARE done INT DEFAULT FALSE;
    DECLARE seccion_id INT;
    DECLARE seccion_nombre VARCHAR(200);
    DECLARE seccion_ponderacion DECIMAL(5,2);
    DECLARE trampa_por_seccion INT;
    
    DECLARE seccion_cursor CURSOR FOR
        SELECT se.id, se.nombre, se.ponderacion, se.preguntas_trampa_por_seccion
        FROM secciones_evaluacion se
        JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
        LEFT JOIN roles_personal rp ON se.rol_personal_id = rp.id
        WHERE te.codigo = p_tipo_evaluacion
        AND (p_rol_personal IS NULL OR rp.codigo = p_rol_personal)
        AND se.activo = TRUE
        AND se.es_trampa = FALSE
        ORDER BY se.orden;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN seccion_cursor;
    
    read_loop: LOOP
        FETCH seccion_cursor INTO seccion_id, seccion_nombre, seccion_ponderacion, trampa_por_seccion;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Aquí se construiría el JSON con las preguntas normales + trampa
        -- (La lógica completa se implementará en el backend PHP)
        
    END LOOP;
    
    CLOSE seccion_cursor;
    
    RETURN resultado;
END //
DELIMITER ;