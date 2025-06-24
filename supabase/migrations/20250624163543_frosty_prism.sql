/*
  # Preguntas de Evaluación de Equipo

  1. Nuevas secciones para evaluación de equipo
    - Equipos de producción y mezclado
    - Equipos de transporte y entrega
    - Equipos de control de calidad
    - Equipos de mantenimiento
    - Equipos de seguridad y medio ambiente

  2. Preguntas específicas para cada categoría
    - Todas las preguntas son tipo abierta (Sí/No/N.A)
    - Ponderación distribuida equitativamente
    - Enfoque en integridad estructural, funcionamiento y seguridad
*/

-- Insertar secciones para evaluación de equipo
INSERT INTO secciones_evaluacion (tipo_evaluacion_id, nombre, descripcion, orden, activo, ponderacion, es_trampa, preguntas_trampa_por_seccion)
SELECT 
    te.id,
    seccion_nombre,
    seccion_descripcion,
    seccion_orden,
    TRUE,
    seccion_ponderacion,
    FALSE,
    1
FROM tipos_evaluacion te
CROSS JOIN (
    SELECT 'Equipos de Producción y Mezclado' as seccion_nombre, 
           'Evaluación de mezcladora, dosificación, bandas, tolvas y silos' as seccion_descripcion,
           1 as seccion_orden,
           25.00 as seccion_ponderacion
    UNION ALL
    SELECT 'Equipos de Transporte y Entrega',
           'Evaluación de camiones revolvedores, bombas de concreto y sistemas de carga',
           2,
           25.00
    UNION ALL
    SELECT 'Equipos de Control de Calidad',
           'Evaluación de equipos de laboratorio, instrumentos de medición y calibración',
           3,
           20.00
    UNION ALL
    SELECT 'Equipos de Mantenimiento',
           'Evaluación de herramientas, equipos de diagnóstico y sistemas de lubricación',
           4,
           15.00
    UNION ALL
    SELECT 'Equipos de Seguridad y Medio Ambiente',
           'Evaluación de equipos de protección, sistemas contra incendios y control ambiental',
           5,
           15.00
) secciones_data
WHERE te.codigo = 'equipo'
AND NOT EXISTS (
    SELECT 1 FROM secciones_evaluacion se2 
    WHERE se2.tipo_evaluacion_id = te.id 
    AND se2.nombre = seccion_nombre
);

-- Insertar preguntas para Equipos de Producción y Mezclado
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿La mezcladora principal se encuentra estructuralmente íntegra, sin fugas, grietas visibles ni desgaste severo en las paletas?' as pregunta_texto
    UNION ALL SELECT '¿El sistema de dosificación de cemento funciona correctamente y mantiene la precisión requerida?'
    UNION ALL SELECT '¿Las básculas de agregados están calibradas y funcionan dentro de los parámetros de tolerancia?'
    UNION ALL SELECT '¿Las bandas transportadoras operan sin deslizamientos, desalineaciones o daños en la superficie?'
    UNION ALL SELECT '¿Los silos de cemento mantienen hermeticidad y los sistemas de descarga funcionan adecuadamente?'
    UNION ALL SELECT '¿Las tolvas de agregados están libres de obstrucciones y sus compuertas operan correctamente?'
    UNION ALL SELECT '¿El sistema de agua cuenta con medidores calibrados y válvulas en buen estado?'
    UNION ALL SELECT '¿El compresor de aire mantiene la presión adecuada y está libre de fugas significativas?'
    UNION ALL SELECT '¿El sistema eléctrico de la planta opera sin interrupciones y cuenta con protecciones adecuadas?'
    UNION ALL SELECT '¿Los motores y reductores de la mezcladora operan sin vibraciones anormales ni sobrecalentamiento?'
    UNION ALL SELECT '¿El sistema de control automatizado responde correctamente a los comandos programados?'
    UNION ALL SELECT '¿Los sensores de nivel en silos y tolvas funcionan correctamente y proporcionan lecturas precisas?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Equipos de Producción y Mezclado'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.seccion_id = se.id 
    AND p2.pregunta = pregunta_texto
);

-- Insertar preguntas para Equipos de Transporte y Entrega
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Los camiones revolvedores mantienen la integridad estructural del tambor sin grietas ni deformaciones?' as pregunta_texto
    UNION ALL SELECT '¿El sistema hidráulico de los camiones revolvedores opera sin fugas y mantiene la presión adecuada?'
    UNION ALL SELECT '¿Las bombas de concreto funcionan sin obstrucciones y mantienen el caudal especificado?'
    UNION ALL SELECT '¿Los sistemas de carga de camiones operan eficientemente sin derrames ni desperdicios?'
    UNION ALL SELECT '¿Los equipos de descarga (canaletas, tolvas) están en condiciones seguras de operación?'
    UNION ALL SELECT '¿Los neumáticos y sistemas de frenos de los camiones están en condiciones óptimas?'
    UNION ALL SELECT '¿Los sistemas de limpieza de camiones funcionan adecuadamente y cuentan con drenaje apropiado?'
    UNION ALL SELECT '¿Las mangueras y conexiones de las bombas de concreto están libres de desgaste excesivo?'
    UNION ALL SELECT '¿Los sistemas de lubricación de tambores revolvedores operan correctamente?'
    UNION ALL SELECT '¿Los dispositivos de seguridad en equipos móviles (alarmas de reversa, luces) funcionan correctamente?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Equipos de Transporte y Entrega'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.seccion_id = se.id 
    AND p2.pregunta = pregunta_texto
);

-- Insertar preguntas para Equipos de Control de Calidad
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿La prensa de compresión está calibrada y opera dentro de los parámetros de precisión requeridos?' as pregunta_texto
    UNION ALL SELECT '¿Los moldes para especímenes de concreto están en buenas condiciones y libres de deformaciones?'
    UNION ALL SELECT '¿La balanza de laboratorio mantiene la precisión requerida y está debidamente calibrada?'
    UNION ALL SELECT '¿El cono de Abrams está en perfectas condiciones sin deformaciones ni óxido?'
    UNION ALL SELECT '¿Los termómetros y medidores de temperatura están calibrados y funcionan correctamente?'
    UNION ALL SELECT '¿El equipo de medición de aire incluido funciona adecuadamente y está calibrado?'
    UNION ALL SELECT '¿Los tamices para análisis granulométrico están completos y en buenas condiciones?'
    UNION ALL SELECT '¿La mesa de flujo para morteros opera correctamente y está nivelada?'
    UNION ALL SELECT '¿Los equipos de curado (cámara húmeda, tanques) mantienen las condiciones especificadas?'
    UNION ALL SELECT '¿Los instrumentos de medición de densidad están calibrados y operan correctamente?'
    UNION ALL SELECT '¿El equipo para prueba de resistencia a la flexión está en condiciones operativas?'
    UNION ALL SELECT '¿Los certificados de calibración de todos los equipos están vigentes y disponibles?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Equipos de Control de Calidad'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.seccion_id = se.id 
    AND p2.pregunta = pregunta_texto
);

-- Insertar preguntas para Equipos de Mantenimiento
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Las herramientas de mantenimiento están completas, organizadas y en buenas condiciones?' as pregunta_texto
    UNION ALL SELECT '¿Los equipos de diagnóstico (multímetros, manómetros) funcionan correctamente y están calibrados?'
    UNION ALL SELECT '¿El inventario de repuestos críticos está completo y actualizado?'
    UNION ALL SELECT '¿Los sistemas de lubricación automática operan según programación y sin obstrucciones?'
    UNION ALL SELECT '¿Los equipos de limpieza (hidrolavadoras, aspiradoras) funcionan adecuadamente?'
    UNION ALL SELECT '¿Las herramientas eléctricas están en condiciones seguras y con certificaciones vigentes?'
    UNION ALL SELECT '¿Los equipos de soldadura y corte están en condiciones operativas y seguras?'
    UNION ALL SELECT '¿Los sistemas de elevación (grúas, polipastos) operan correctamente y están certificados?'
    UNION ALL SELECT '¿Los compresores portátiles mantienen presión adecuada y están libres de fugas?'
    UNION ALL SELECT '¿Las herramientas de medición (calibradores, micrómetros) están calibradas y protegidas?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Equipos de Mantenimiento'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.seccion_id = se.id 
    AND p2.pregunta = pregunta_texto
);

-- Insertar preguntas para Equipos de Seguridad y Medio Ambiente
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
SELECT 
    se.id,
    pregunta_texto,
    'abierta',
    (@row_number := @row_number + 1),
    TRUE,
    FALSE,
    0.00
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿Los extintores están ubicados estratégicamente, cargados y con inspecciones vigentes?' as pregunta_texto
    UNION ALL SELECT '¿El sistema de control de polvo (aspersores, colectores) opera eficientemente?'
    UNION ALL SELECT '¿Los equipos de protección personal están disponibles, completos y en buenas condiciones?'
    UNION ALL SELECT '¿El sistema de tratamiento de aguas residuales funciona correctamente?'
    UNION ALL SELECT '¿Los sistemas de alarma y detección de emergencias operan adecuadamente?'
    UNION ALL SELECT '¿Los equipos de primeros auxilios están completos, organizados y accesibles?'
    UNION ALL SELECT '¿Las duchas de emergencia y lavaojos funcionan correctamente y están señalizadas?'
    UNION ALL SELECT '¿Los sistemas de ventilación en áreas cerradas operan eficientemente?'
    UNION ALL SELECT '¿Los contenedores para gestión de residuos están identificados y en buenas condiciones?'
    UNION ALL SELECT '¿Los equipos de monitoreo ambiental (ruido, polvo) funcionan y están calibrados?'
    UNION ALL SELECT '¿Las barreras y señalización de seguridad están completas y visibles?'
    UNION ALL SELECT '¿Los sistemas de iluminación de emergencia operan correctamente?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.nombre = 'Equipos de Seguridad y Medio Ambiente'
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.seccion_id = se.id 
    AND p2.pregunta = pregunta_texto
);

-- Crear sección de preguntas trampa para evaluación de equipo
INSERT INTO secciones_evaluacion (tipo_evaluacion_id, nombre, descripcion, orden, activo, es_trampa, ponderacion)
SELECT 
    te.id,
    'Preguntas Trampa - Evaluación de Equipo',
    'Preguntas trampa para evaluar conocimiento técnico específico de equipos',
    999,
    TRUE,
    TRUE,
    0.00
FROM tipos_evaluacion te
WHERE te.codigo = 'equipo'
AND NOT EXISTS (
    SELECT 1 FROM secciones_evaluacion se2 
    WHERE se2.tipo_evaluacion_id = te.id 
    AND se2.es_trampa = TRUE
);

-- Insertar preguntas trampa para evaluación de equipo
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, orden, activo, es_trampa, ponderacion_individual)
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
CROSS JOIN (SELECT @row_number := 0) r
CROSS JOIN (
    SELECT '¿La presión de operación de la mezcladora debe mantenerse entre 6-8 bar según especificaciones técnicas?' as pregunta_texto
    UNION ALL SELECT '¿El tiempo de mezclado óptimo para concreto convencional es de 90 segundos según normas internacionales?'
    UNION ALL SELECT '¿La tolerancia de pesaje para cemento debe ser ±1% según especificaciones de planta?'
    UNION ALL SELECT '¿La velocidad de rotación del tambor revolvedor debe mantenerse entre 2-6 RPM durante el transporte?'
    UNION ALL SELECT '¿La presión hidráulica de las bombas de concreto debe operar entre 200-300 bar para flujo óptimo?'
    UNION ALL SELECT '¿El contenido de humedad en agregados debe controlarse con precisión de ±0.5% para dosificación exacta?'
    UNION ALL SELECT '¿La temperatura del concreto fresco no debe exceder 32°C para mantener propiedades adecuadas?'
    UNION ALL SELECT '¿Los silos de cemento deben mantener presión negativa para evitar emisiones de polvo?'
    UNION ALL SELECT '¿La calibración de básculas debe realizarse mensualmente con pesas certificadas?'
    UNION ALL SELECT '¿El sistema de aire incluido debe mantener presión constante de 0.5 bar para dosificación precisa?'
) preguntas_data
WHERE te.codigo = 'equipo' 
AND se.es_trampa = TRUE
AND NOT EXISTS (
    SELECT 1 FROM preguntas p2 
    WHERE p2.seccion_id = se.id 
    AND p2.pregunta = pregunta_texto
);

-- Insertar configuración de ponderación para evaluación de equipo
INSERT INTO configuracion_ponderacion (tipo_evaluacion_id, rol_personal_id, total_preguntas_trampa, preguntas_trampa_por_seccion)
SELECT 
    te.id,
    NULL,
    10,
    1
FROM tipos_evaluacion te
WHERE te.codigo = 'equipo'
ON DUPLICATE KEY UPDATE 
    total_preguntas_trampa = 10,
    preguntas_trampa_por_seccion = 1;

-- Verificar que las ponderaciones sumen 100%
SELECT 
    'Verificación Evaluación de Equipo' as verificacion,
    SUM(se.ponderacion) as total_ponderacion,
    COUNT(se.id) as total_secciones,
    CASE 
        WHEN SUM(se.ponderacion) = 100.00 THEN 'CORRECTO'
        WHEN SUM(se.ponderacion) < 100.00 THEN 'FALTA PONDERACIÓN'
        ELSE 'EXCESO DE PONDERACIÓN'
    END as estado
FROM secciones_evaluacion se
JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
WHERE te.codigo = 'equipo' 
AND se.activo = TRUE 
AND se.es_trampa = FALSE;