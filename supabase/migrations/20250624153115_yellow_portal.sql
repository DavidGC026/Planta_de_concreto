/*
  # Corrección del Sistema de Ponderación y Preguntas Trampa

  1. Correcciones de sintaxis MySQL
  2. Implementación completa del sistema de ponderación
  3. Configuración de preguntas trampa
  4. Funciones auxiliares corregidas
*/

-- Primero, eliminar la función problemática si existe
DROP FUNCTION IF EXISTS obtener_preguntas_con_trampa;

-- Agregar campos faltantes a las tablas (con verificación de existencia)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'secciones_evaluacion' 
     AND COLUMN_NAME = 'ponderacion' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE secciones_evaluacion ADD COLUMN ponderacion DECIMAL(5,2) DEFAULT 0.00 COMMENT "Porcentaje de ponderación de la sección";',
    'SELECT "Column ponderacion already exists" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'secciones_evaluacion' 
     AND COLUMN_NAME = 'es_trampa' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE secciones_evaluacion ADD COLUMN es_trampa BOOLEAN DEFAULT FALSE COMMENT "Indica si es una sección de preguntas trampa";',
    'SELECT "Column es_trampa already exists" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'secciones_evaluacion' 
     AND COLUMN_NAME = 'preguntas_trampa_por_seccion' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE secciones_evaluacion ADD COLUMN preguntas_trampa_por_seccion INT DEFAULT 0 COMMENT "Número de preguntas trampa a mostrar por sección normal";',
    'SELECT "Column preguntas_trampa_por_seccion already exists" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'preguntas' 
     AND COLUMN_NAME = 'es_trampa' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE preguntas ADD COLUMN es_trampa BOOLEAN DEFAULT FALSE COMMENT "Indica si es una pregunta trampa";',
    'SELECT "Column es_trampa already exists" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'preguntas' 
     AND COLUMN_NAME = 'ponderacion_individual' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE preguntas ADD COLUMN ponderacion_individual DECIMAL(5,2) DEFAULT 0.00 COMMENT "Ponderación individual de la pregunta";',
    'SELECT "Column ponderacion_individual already exists" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla de configuración de ponderación
CREATE TABLE IF NOT EXISTS configuracion_ponderacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evaluacion_id INT NOT NULL,
    rol_personal_id INT NULL,
    total_preguntas_trampa INT DEFAULT 0 COMMENT 'Total de preguntas trampa disponibles',
    preguntas_trampa_por_seccion INT DEFAULT 1 COMMENT 'Preguntas trampa a mostrar por sección',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_evaluacion_id) REFERENCES tipos_evaluacion(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE SET NULL,
    UNIQUE KEY unique_config (tipo_evaluacion_id, rol_personal_id)
);

-- Actualizar ponderaciones para Jefe de Planta
UPDATE secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN roles_personal rp ON se.rol_personal_id = rp.id
SET se.ponderacion = CASE 
    WHEN se.nombre LIKE '%Conocimiento técnico%' OR se.nombre LIKE '%conocimiento técnico%' THEN 15.00
    WHEN se.nombre LIKE '%Gestión de la producción%' OR se.nombre LIKE '%gestión de la producción%' THEN 20.00
    WHEN se.nombre LIKE '%Mantenimiento%' OR se.nombre LIKE '%mantenimiento%' THEN 10.00
    WHEN se.nombre LIKE '%Seguridad%' OR se.nombre LIKE '%seguridad%' THEN 10.00
    WHEN se.nombre LIKE '%Control de calidad%' OR se.nombre LIKE '%control de calidad%' THEN 10.00
    WHEN se.nombre LIKE '%Gestión del personal%' OR se.nombre LIKE '%gestión del personal%' THEN 10.00
    WHEN se.nombre LIKE '%Documentación%' OR se.nombre LIKE '%documentación%' THEN 5.00
    WHEN se.nombre LIKE '%Coordinación%' OR se.nombre LIKE '%coordinación%' THEN 5.00
    WHEN se.nombre LIKE '%Resolución%' OR se.nombre LIKE '%resolución%' THEN 7.50
    WHEN se.nombre LIKE '%Mejora continua%' OR se.nombre LIKE '%mejora continua%' THEN 7.50
    ELSE 10.00
END,
se.preguntas_trampa_por_seccion = 1
WHERE te.codigo = 'personal' AND rp.codigo = 'jefe_planta' AND se.es_trampa = FALSE;

-- Crear sección de preguntas trampa para Jefe de Planta
INSERT IGNORE INTO secciones_evaluacion (tipo_evaluacion_id, rol_personal_id, nombre, descripcion, orden, activo, es_trampa, ponderacion)
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
WHERE te.codigo = 'personal';

-- Insertar preguntas trampa para Jefe de Planta
INSERT IGNORE INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    TRUE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN roles_personal rp ON se.rol_personal_id = rp.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Cuál es la resistencia mínima del concreto para estructuras críticas según NMX-C-414?' as pregunta_texto
    UNION ALL SELECT '¿Qué normativa mexicana rige el control de calidad en plantas de concreto premezclado?'
    UNION ALL SELECT '¿Cuál es el tiempo máximo de mezclado para concreto convencional según especificaciones?'
    UNION ALL SELECT '¿Qué porcentaje de humedad debe tener el agregado fino para un mezclado óptimo?'
    UNION ALL SELECT '¿Cuál es la temperatura máxima permitida para el concreto fresco en clima cálido?'
    UNION ALL SELECT '¿Qué aditivo se usa para acelerar el fraguado en condiciones de clima frío?'
    UNION ALL SELECT '¿Cuál es el revenimiento estándar recomendado para concreto bombeado?'
    UNION ALL SELECT '¿Qué prueba de laboratorio determina la trabajabilidad del concreto fresco?'
    UNION ALL SELECT '¿Cuál es el contenido de aire recomendado para concreto expuesto a ciclos hielo-deshielo?'
    UNION ALL SELECT '¿Qué relación agua/cemento es crítica para garantizar la durabilidad del concreto?'
    UNION ALL SELECT '¿Cuál es la granulometría ideal para agregado grueso de 19mm según NMX?'
    UNION ALL SELECT '¿Qué método se utiliza para determinar la densidad del concreto fresco?'
    UNION ALL SELECT '¿Cuál es el tiempo de curado mínimo para concreto estructural de alta resistencia?'
    UNION ALL SELECT '¿Qué aditivo químico reduce efectivamente la permeabilidad del concreto?'
    UNION ALL SELECT '¿Cuál es la relación típica de resistencia a compresión a 7 días vs 28 días?'
    UNION ALL SELECT '¿Qué factor afecta más significativamente la resistencia final del concreto?'
    UNION ALL SELECT '¿Cuál es el módulo de elasticidad típico del concreto de 250 kg/cm²?'
    UNION ALL SELECT '¿Qué prueba de campo evalúa la segregación del concreto durante el transporte?'
    UNION ALL SELECT '¿Cuál es el contenido óptimo de cemento por m³ para concreto estructural?'
    UNION ALL SELECT '¿Qué normativa regula específicamente el transporte de concreto premezclado en México?'
) preguntas_trampa
WHERE te.codigo = 'personal' 
AND rp.codigo = 'jefe_planta' 
AND se.es_trampa = TRUE;

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
ON DUPLICATE KEY UPDATE 
    total_preguntas_trampa = 20,
    preguntas_trampa_por_seccion = 1;

-- Crear vista para consultas optimizadas
CREATE OR REPLACE VIEW vista_evaluacion_ponderada AS
SELECT 
    se.id as seccion_id,
    se.nombre as seccion_nombre,
    se.orden as seccion_orden,
    se.ponderacion as seccion_ponderacion,
    se.es_trampa as seccion_es_trampa,
    se.preguntas_trampa_por_seccion,
    te.codigo as tipo_evaluacion,
    te.nombre as tipo_nombre,
    rp.codigo as rol_codigo,
    rp.nombre as rol_nombre,
    COUNT(p.id) as total_preguntas,
    COUNT(CASE WHEN p.es_trampa = FALSE THEN 1 END) as preguntas_normales,
    COUNT(CASE WHEN p.es_trampa = TRUE THEN 1 END) as preguntas_trampa
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
LEFT JOIN roles_personal rp ON se.rol_personal_id = rp.id
LEFT JOIN preguntas p ON se.id = p.seccion_id AND p.activo = TRUE
WHERE se.activo = TRUE
GROUP BY se.id, se.nombre, se.orden, se.ponderacion, se.es_trampa, 
         se.preguntas_trampa_por_seccion, te.codigo, te.nombre, rp.codigo, rp.nombre
ORDER BY te.codigo, rp.codigo, se.orden;

-- Función auxiliar para validar ponderación total
DELIMITER //
CREATE OR REPLACE FUNCTION validar_ponderacion_total(
    p_tipo_evaluacion VARCHAR(50),
    p_rol_personal VARCHAR(50)
) RETURNS DECIMAL(5,2)
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
END //
DELIMITER ;

-- Procedimiento para obtener estadísticas de evaluación
DELIMITER //
CREATE OR REPLACE PROCEDURE obtener_estadisticas_evaluacion(
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
END //
DELIMITER ;

-- Insertar datos de ejemplo para otros roles si no existen
INSERT IGNORE INTO configuracion_ponderacion (tipo_evaluacion_id, rol_personal_id, total_preguntas_trampa, preguntas_trampa_por_seccion)
SELECT 
    te.id,
    rp.id,
    10,
    1
FROM tipos_evaluacion te
CROSS JOIN roles_personal rp
WHERE te.codigo = 'personal' 
AND rp.codigo IN ('laboratorista', 'operador_camion', 'operador_bombas');

-- Configurar ponderaciones básicas para otros roles
UPDATE secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN roles_personal rp ON se.rol_personal_id = rp.id
SET se.ponderacion = 20.00,
    se.preguntas_trampa_por_seccion = 1
WHERE te.codigo = 'personal' 
AND rp.codigo IN ('laboratorista', 'operador_camion', 'operador_bombas')
AND se.es_trampa = FALSE
AND se.ponderacion = 0.00;

-- Verificar integridad de datos
SELECT 
    'Verificación de ponderaciones' as verificacion,
    tipo_evaluacion,
    rol_personal,
    total_secciones,
    ponderacion_total,
    CASE 
        WHEN ponderacion_total = 100.00 THEN 'CORRECTO'
        WHEN ponderacion_total < 100.00 THEN 'FALTA PONDERACIÓN'
        ELSE 'EXCESO DE PONDERACIÓN'
    END as estado
FROM (
    SELECT 
        te.codigo as tipo_evaluacion,
        COALESCE(rp.codigo, 'SIN_ROL') as rol_personal,
        COUNT(DISTINCT se.id) as total_secciones,
        SUM(CASE WHEN se.es_trampa = FALSE THEN se.ponderacion ELSE 0 END) as ponderacion_total
    FROM tipos_evaluacion te
    LEFT JOIN secciones_evaluacion se ON se.tipo_evaluacion_id = te.id AND se.activo = TRUE
    LEFT JOIN roles_personal rp ON se.rol_personal_id = rp.id
    WHERE te.codigo IN ('personal', 'equipo')
    GROUP BY te.codigo, rp.codigo
    HAVING total_secciones > 0
) verificacion_data;