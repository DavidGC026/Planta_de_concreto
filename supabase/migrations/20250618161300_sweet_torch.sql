/*
# Agregar soporte para preguntas de selección múltiple

1. Modificaciones a la tabla de preguntas
   - Agregar tipo de pregunta (abierta o selección múltiple)
   - Agregar opciones de respuesta para selección múltiple
   - Agregar respuesta correcta para selección múltiple

2. Modificaciones a respuestas
   - Permitir respuestas de selección múltiple (a, b, c)

3. Datos de ejemplo
   - Agregar preguntas de selección múltiple para demostración
*/

-- Agregar columnas a la tabla de preguntas para soporte de selección múltiple
ALTER TABLE preguntas 
ADD COLUMN tipo_pregunta ENUM('abierta', 'seleccion_multiple') DEFAULT 'abierta' AFTER pregunta,
ADD COLUMN opcion_a TEXT NULL AFTER tipo_pregunta,
ADD COLUMN opcion_b TEXT NULL AFTER opcion_a,
ADD COLUMN opcion_c TEXT NULL AFTER opcion_b,
ADD COLUMN respuesta_correcta ENUM('a', 'b', 'c') NULL AFTER opcion_c;

-- Modificar la tabla de respuestas para incluir opciones de selección múltiple
ALTER TABLE respuestas_evaluacion 
MODIFY COLUMN respuesta ENUM('si', 'no', 'na', 'a', 'b', 'c') NOT NULL;

-- Agregar índices para optimizar consultas
ALTER TABLE preguntas ADD INDEX idx_tipo_pregunta (tipo_pregunta);

-- Insertar algunas preguntas de selección múltiple como ejemplo
-- Obtener ID de la sección de "Gestión de la producción" para Jefe de Planta
SET @seccion_gestion_id = (
    SELECT p.seccion_id 
    FROM preguntas p 
    JOIN secciones_evaluacion s ON p.seccion_id = s.id 
    JOIN roles_personal rp ON s.rol_personal_id = rp.id 
    WHERE rp.codigo = 'jefe_planta' 
    AND s.nombre = 'Gestión de la producción' 
    LIMIT 1
);

-- Agregar preguntas de selección múltiple para Jefe de Planta
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, opcion_a, opcion_b, opcion_c, respuesta_correcta, orden) VALUES
(@seccion_gestion_id, '¿Cuál es el tiempo máximo recomendado para el transporte de concreto desde la planta hasta la obra?', 'seleccion_multiple', '30 minutos', '90 minutos', '120 minutos', 'b', 16),
(@seccion_gestion_id, '¿Cuál es la resistencia mínima que debe alcanzar el concreto a los 28 días para uso estructural?', 'seleccion_multiple', '150 kg/cm²', '200 kg/cm²', '250 kg/cm²', 'c', 17),
(@seccion_gestion_id, '¿Qué porcentaje de tolerancia se permite en el peso de los agregados durante la dosificación?', 'seleccion_multiple', '±1%', '±2%', '±3%', 'b', 18);

-- Obtener ID de la sección de "Control de calidad" para Jefe de Planta
SET @seccion_calidad_id = (
    SELECT p.seccion_id 
    FROM preguntas p 
    JOIN secciones_evaluacion s ON p.seccion_id = s.id 
    JOIN roles_personal rp ON s.rol_personal_id = rp.id 
    WHERE rp.codigo = 'jefe_planta' 
    AND s.nombre = 'Control de calidad' 
    LIMIT 1
);

-- Agregar preguntas de selección múltiple para Control de calidad
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, opcion_a, opcion_b, opcion_c, respuesta_correcta, orden) VALUES
(@seccion_calidad_id, '¿Cuál es la frecuencia mínima recomendada para realizar pruebas de revenimiento en concreto?', 'seleccion_multiple', 'Cada 50 m³', 'Cada 100 m³', 'Cada 150 m³', 'a', 16),
(@seccion_calidad_id, '¿A qué temperatura se deben curar los cilindros de concreto para pruebas de laboratorio?', 'seleccion_multiple', '20°C ± 2°C', '23°C ± 2°C', '25°C ± 2°C', 'b', 17),
(@seccion_calidad_id, '¿Cuántos cilindros se deben elaborar como mínimo para cada muestra de concreto?', 'seleccion_multiple', '2 cilindros', '3 cilindros', '4 cilindros', 'b', 18);

-- Obtener ID de la sección de "Seguridad y normatividad" para Jefe de Planta
SET @seccion_seguridad_id = (
    SELECT p.seccion_id 
    FROM preguntas p 
    JOIN secciones_evaluacion s ON p.seccion_id = s.id 
    JOIN roles_personal rp ON s.rol_personal_id = rp.id 
    WHERE rp.codigo = 'jefe_planta' 
    AND s.nombre = 'Seguridad y normatividad' 
    LIMIT 1
);

-- Agregar preguntas de selección múltiple para Seguridad
INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, opcion_a, opcion_b, opcion_c, respuesta_correcta, orden) VALUES
(@seccion_seguridad_id, '¿Cuál es la distancia mínima de seguridad que se debe mantener de líneas eléctricas aéreas?', 'seleccion_multiple', '3 metros', '5 metros', '10 metros', 'c', 16),
(@seccion_seguridad_id, '¿Qué tipo de extintor se debe usar para combatir fuegos de origen eléctrico?', 'seleccion_multiple', 'Agua', 'CO2', 'Espuma', 'b', 17),
(@seccion_seguridad_id, '¿Con qué frecuencia se deben realizar simulacros de emergencia en la planta?', 'seleccion_multiple', 'Cada 3 meses', 'Cada 6 meses', 'Cada año', 'b', 18);

-- Agregar preguntas de selección múltiple para Laboratorista
SET @laboratorista_id = (SELECT id FROM roles_personal WHERE codigo = 'laboratorista');
SET @seccion_lab_pruebas_id = (
    SELECT s.id 
    FROM secciones_evaluacion s 
    WHERE s.rol_personal_id = @laboratorista_id 
    AND s.nombre = 'Pruebas de laboratorio'
);

INSERT INTO preguntas (seccion_id, pregunta, tipo_pregunta, opcion_a, opcion_b, opcion_c, respuesta_correcta, orden) VALUES
(@seccion_lab_pruebas_id, '¿Cuál es la norma mexicana que rige la prueba de revenimiento del concreto?', 'seleccion_multiple', 'NMX-C-156', 'NMX-C-162', 'NMX-C-128', 'a', 16),
(@seccion_lab_pruebas_id, '¿Cuál es la velocidad de carga recomendada para la prueba de compresión en cilindros de concreto?', 'seleccion_multiple', '0.15 a 0.35 MPa/s', '0.25 a 0.50 MPa/s', '0.35 a 0.70 MPa/s', 'a', 17),
(@seccion_lab_pruebas_id, '¿Cuál es el diámetro estándar de los cilindros para pruebas de resistencia a la compresión?', 'seleccion_multiple', '10 cm', '15 cm', '20 cm', 'b', 18);