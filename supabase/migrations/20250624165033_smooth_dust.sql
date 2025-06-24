/*
  # Corrección de funciones MySQL y completar sistema de subsecciones

  1. Corregir sintaxis de funciones para MySQL
  2. Completar preguntas para todas las subsecciones
  3. Implementar función de cálculo de calidad de planta
  4. Verificar integridad del sistema
*/

-- Eliminar función si existe y recrear con sintaxis correcta de MySQL
DROP FUNCTION IF EXISTS calcular_calidad_planta;

DELIMITER //
CREATE FUNCTION calcular_calidad_planta(
    p_evaluacion_id INT
) RETURNS DECIMAL(5,2)
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
END //
DELIMITER ;

-- Completar preguntas para Subsección: Bandas Transportadoras
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Las bandas transportadoras operan sin deslizamientos, desalineaciones o daños en la superficie?' as pregunta_texto
    UNION ALL SELECT '¿Los motores y reductores de las bandas funcionan sin vibraciones anormales ni sobrecalentamiento?'
    UNION ALL SELECT '¿Los rodillos de soporte están alineados y giran libremente sin desgaste excesivo?'
    UNION ALL SELECT '¿Los sistemas de limpieza de bandas (raspadores) funcionan correctamente?'
    UNION ALL SELECT '¿Las protecciones de seguridad de las bandas están instaladas y en buen estado?'
    UNION ALL SELECT '¿Los sensores de velocidad y detección de materiales funcionan correctamente?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Producción y Mezclado'
AND sub.nombre = 'Bandas Transportadoras'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Completar preguntas para Subsección: Tolvas y Silos
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Los silos de cemento mantienen hermeticidad y están libres de grietas o corrosión?' as pregunta_texto
    UNION ALL SELECT '¿Las tolvas de agregados están libres de obstrucciones y sus compuertas operan correctamente?'
    UNION ALL SELECT '¿Los sistemas de descarga de silos funcionan sin obstrucciones ni fugas de aire?'
    UNION ALL SELECT '¿Los sensores de nivel en silos y tolvas proporcionan lecturas precisas y confiables?'
    UNION ALL SELECT '¿Los sistemas de aireación de silos operan correctamente para mantener fluidez del cemento?'
    UNION ALL SELECT '¿Las estructuras de soporte de silos y tolvas están en condiciones seguras?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Producción y Mezclado'
AND sub.nombre = 'Tolvas y Silos'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Completar preguntas para Subsección: Sistema de Agua
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿El sistema de agua cuenta con medidores calibrados y válvulas en buen estado?' as pregunta_texto
    UNION ALL SELECT '¿Las bombas de agua operan sin fugas y mantienen la presión adecuada?'
    UNION ALL SELECT '¿Los tanques de almacenamiento de agua están limpios y libres de contaminación?'
    UNION ALL SELECT '¿Los sistemas de dosificación de aditivos funcionan con precisión y están calibrados?'
    UNION ALL SELECT '¿Las tuberías y conexiones están libres de fugas y corrosión?'
    UNION ALL SELECT '¿Los filtros de agua están limpios y funcionan correctamente?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Producción y Mezclado'
AND sub.nombre = 'Sistema de Agua'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Completar preguntas para Subsección: Sistema de Control
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿El sistema de control automatizado responde correctamente a los comandos programados?' as pregunta_texto
    UNION ALL SELECT '¿Los paneles de control están en buenas condiciones y son fácilmente legibles?'
    UNION ALL SELECT '¿Los sistemas de seguridad (paros de emergencia) funcionan correctamente?'
    UNION ALL SELECT '¿El software de control está actualizado y opera sin errores?'
    UNION ALL SELECT '¿Los sistemas de respaldo (UPS, generadores) están operativos?'
    UNION ALL SELECT '¿Los registros de producción se generan automáticamente y son precisos?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Producción y Mezclado'
AND sub.nombre = 'Sistema de Control'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Completar preguntas para Subsección: Bombas de Concreto
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Las bombas de concreto funcionan sin obstrucciones y mantienen el caudal especificado?' as pregunta_texto
    UNION ALL SELECT '¿Las mangueras y conexiones están libres de desgaste excesivo y fugas?'
    UNION ALL SELECT '¿El sistema hidráulico de las bombas opera sin fugas y con presión adecuada?'
    UNION ALL SELECT '¿Los sistemas de limpieza de tuberías funcionan correctamente?'
    UNION ALL SELECT '¿Las válvulas de cambio (S-valve) operan suavemente sin obstrucciones?'
    UNION ALL SELECT '¿Los sistemas de control remoto de las bombas funcionan correctamente?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Transporte y Entrega'
AND sub.nombre = 'Bombas de Concreto'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Completar preguntas para Subsección: Sistemas de Carga
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Los sistemas de carga de camiones operan eficientemente sin derrames ni desperdicios?' as pregunta_texto
    UNION ALL SELECT '¿Las canaletas de carga están en buenas condiciones y permiten flujo controlado?'
    UNION ALL SELECT '¿Los sistemas de posicionamiento de camiones funcionan correctamente?'
    UNION ALL SELECT '¿Las básculas de camiones están calibradas y proporcionan lecturas precisas?'
    UNION ALL SELECT '¿Los sistemas de control de tráfico en la planta operan adecuadamente?'
    UNION ALL SELECT '¿Las señalizaciones y semáforos de carga funcionan correctamente?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Transporte y Entrega'
AND sub.nombre = 'Sistemas de Carga'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Completar preguntas para Subsección: Equipos de Limpieza
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Los sistemas de limpieza de camiones funcionan adecuadamente y cuentan con drenaje apropiado?' as pregunta_texto
    UNION ALL SELECT '¿Las hidrolavadoras mantienen presión adecuada y funcionan sin interrupciones?'
    UNION ALL SELECT '¿Los sistemas de reciclaje de agua de lavado operan correctamente?'
    UNION ALL SELECT '¿Las áreas de lavado tienen drenajes funcionales y sistemas de contención?'
    UNION ALL SELECT '¿Los equipos de limpieza de mezcladora están completos y operativos?'
    UNION ALL SELECT '¿Los sistemas de aspiración de residuos funcionan eficientemente?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Transporte y Entrega'
AND sub.nombre = 'Equipos de Limpieza'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Agregar preguntas para las subsecciones de Control de Calidad
INSERT INTO preguntas (seccion_id, subseccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    sub.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿La prensa de compresión está calibrada y opera dentro de los parámetros de precisión requeridos?' as pregunta_texto
    UNION ALL SELECT '¿Los moldes para especímenes están en buenas condiciones y libres de deformaciones?'
    UNION ALL SELECT '¿La balanza de laboratorio mantiene la precisión requerida y está debidamente calibrada?'
    UNION ALL SELECT '¿Los equipos de curado mantienen temperatura y humedad controladas?'
    UNION ALL SELECT '¿Los instrumentos de medición están calibrados y certificados?'
    UNION ALL SELECT '¿Los equipos de muestreo están completos y en buenas condiciones?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Control de Calidad'
AND sub.nombre = 'Equipos de Laboratorio'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.subseccion_id = sub.id 
    AND p2.pregunta = pregunta_texto
);

-- Crear procedimiento para obtener estructura completa de evaluación de equipo
DROP PROCEDURE IF EXISTS obtener_estructura_evaluacion_equipo;

DELIMITER //
CREATE PROCEDURE obtener_estructura_evaluacion_equipo()
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
END //
DELIMITER ;

-- Actualizar API para manejar subsecciones
-- (Esto se hará en el archivo PHP correspondiente)

-- Verificación final del sistema
SELECT 
    'RESUMEN SISTEMA DE SUBSECCIONES' as titulo,
    COUNT(DISTINCT se.id) as total_secciones,
    COUNT(DISTINCT sub.id) as total_subsecciones,
    COUNT(p.id) as total_preguntas,
    SUM(DISTINCT se.ponderacion) as ponderacion_total,
    CASE 
        WHEN ABS(SUM(DISTINCT se.ponderacion) - 100.00) < 0.01 THEN 'CORRECTO ✓'
        ELSE 'ERROR EN PONDERACIÓN ✗'
    END as estado_ponderacion
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
LEFT JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id AND sub.activo = TRUE
LEFT JOIN preguntas p ON p.subseccion_id = sub.id AND p.activo = TRUE
WHERE te.codigo = 'equipo' AND se.activo = TRUE AND se.es_trampa = FALSE;

-- Mostrar estructura detallada
SELECT 
    CONCAT('SECCIÓN ', se.orden, ': ', se.nombre) as seccion,
    CONCAT(se.ponderacion, '%') as ponderacion_seccion,
    CONCAT('  └─ Subsección ', sub.orden, ': ', sub.nombre) as subseccion,
    CONCAT(sub.ponderacion_subseccion, '%') as ponderacion_subseccion,
    COUNT(p.id) as preguntas
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
LEFT JOIN subsecciones_evaluacion sub ON sub.seccion_id = se.id AND sub.activo = TRUE
LEFT JOIN preguntas p ON p.subseccion_id = sub.id AND p.activo = TRUE
WHERE te.codigo = 'equipo' AND se.activo = TRUE AND se.es_trampa = FALSE
GROUP BY se.id, se.orden, se.nombre, se.ponderacion, sub.id, sub.orden, sub.nombre, sub.ponderacion_subseccion
ORDER BY se.orden, sub.orden;