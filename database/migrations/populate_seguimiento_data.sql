-- ====================================================================
-- POBLADO DE DATOS: Seguimiento de Calibraciones
-- Descripción: Poblar tablas existentes con datos de calibraciones
-- Fecha: 2025-08-04
-- ====================================================================

USE plantas_concreto;

-- ====================================================================
-- 1. LIMPIAR TABLA ANTERIOR SI EXISTE
-- ====================================================================
DROP TABLE IF EXISTS seguimiento_calibraciones;

-- ====================================================================
-- 2. INSERTAR SECCIONES DE OPERACIÓN (usando campo 'orden' en lugar de 'orden_visualizacion')
-- ====================================================================
INSERT IGNORE INTO secciones_operacion (nombre, descripcion, orden) VALUES
('Calibraciones y Verificaciones', 'Parámetros de calibración y verificación de equipos de medición y control', 1),
('Mantenimiento Preventivo y Correctivo', 'Parámetros de mantenimiento programado y reparaciones de equipos', 2),
('Laboratorio y Control de Calidad', 'Parámetros de control de calidad del concreto y materiales', 3),
('Producción y Operación', 'Parámetros del proceso de producción y operación diaria', 4);

-- ====================================================================
-- 3. INSERTAR PARÁMETROS POR SECCIÓN
-- ====================================================================

-- Parámetros para "Calibraciones y Verificaciones" (ID = 1)
INSERT IGNORE INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(1, 'Balanza principal', 'Mensual', 'Manual del fabricante', 1),
(1, 'Balanza de aditivos', 'Mensual', 'Manual del fabricante', 2),
(1, 'Sensor de humedad agregados', 'Trimestral', 'ASTM C566', 3),
(1, 'Medidor de temperatura', 'Semestral', 'Norma técnica interna', 4),
(1, 'Caudalímetro de agua', 'Bimestral', 'Manual del fabricante', 5),
(1, 'Sistema de dosificación', 'Semanal', 'Procedimiento interno', 6);

-- Parámetros para "Mantenimiento Preventivo y Correctivo" (ID = 2)
INSERT IGNORE INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(2, 'Mezcladora principal', 'Semanal', 'Manual de mantenimiento', 1),
(2, 'Bandas transportadoras', 'Quincenal', 'Manual de mantenimiento', 2),
(2, 'Sistema hidráulico', 'Mensual', 'Manual de mantenimiento', 3),
(2, 'Compresores de aire', 'Mensual', 'Manual de mantenimiento', 4),
(2, 'Sistema eléctrico', 'Trimestral', 'NOM-001-SEDE', 5),
(2, 'Estructura y soportes', 'Semestral', 'Procedimiento interno', 6);

-- Parámetros para "Laboratorio y Control de Calidad" (ID = 3)
INSERT IGNORE INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(3, 'Revenimiento del concreto', 'Diario', 'ASTM C143', 1),
(3, 'Resistencia a compresión', 'Diario', 'ASTM C39', 2),
(3, 'Contenido de aire', 'Diario', 'ASTM C231', 3),
(3, 'Temperatura del concreto', 'Diario', 'ASTM C1064', 4),
(3, 'Granulometría agregados', 'Semanal', 'ASTM C136', 5),
(3, 'Densidad del concreto', 'Diario', 'ASTM C138', 6);

-- Parámetros para "Producción y Operación" (ID = 4)
INSERT IGNORE INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(4, 'Tiempo de mezclado', 'Diario', 'Procedimiento interno', 1),
(4, 'Consumo de materiales', 'Diario', 'Control de inventarios', 2),
(4, 'Volumen de producción', 'Diario', 'Registro de producción', 3),
(4, 'Limpieza de equipos', 'Diario', 'Manual de operación', 4),
(4, 'Condiciones ambientales', 'Diario', 'Procedimiento interno', 5),
(4, 'Eficiencia de producción', 'Semanal', 'KPIs de producción', 6);

-- ====================================================================
-- 4. VERIFICAR DATOS INSERTADOS
-- ====================================================================
SELECT 'Secciones insertadas:' as info;
SELECT id, nombre, descripcion FROM secciones_operacion ORDER BY orden;

SELECT 'Parámetros insertados:' as info;
SELECT COUNT(*) as total_parametros FROM parametros_seguimiento;

SELECT 'Parámetros por sección:' as info;
SELECT s.nombre as seccion, COUNT(p.id) as total_parametros 
FROM secciones_operacion s 
LEFT JOIN parametros_seguimiento p ON s.id = p.seccion_id 
GROUP BY s.id, s.nombre 
ORDER BY s.orden;
