-- ====================================================================
-- MIGRACIÓN: Tablas para Seguimiento de Calibraciones
-- Descripción: Sistema de secciones de operación y sus parámetros
-- Fecha: 2025-08-04
-- ====================================================================

USE plantas_concreto;

-- ====================================================================
-- LIMPIEZA: Eliminar tabla anterior si existe
-- ====================================================================
DROP TABLE IF EXISTS seguimiento_calibraciones;

-- ====================================================================
-- 1. TABLA: secciones_operacion
-- Descripción: Secciones principales del sistema de operación
-- ====================================================================
CREATE TABLE IF NOT EXISTS secciones_operacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    orden_visualizacion INT DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_orden (orden_visualizacion),
    INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 2. TABLA: parametros_seguimiento
-- Descripción: Parámetros específicos para cada sección de operación
-- ====================================================================
CREATE TABLE IF NOT EXISTS parametros_seguimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seccion_id INT NOT NULL,
    parametro VARCHAR(255) NOT NULL,
    frecuencia_sugerida VARCHAR(255) NOT NULL,
    observaciones TEXT,
    referencia_normativa VARCHAR(255),
    orden_en_seccion INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seccion_id) REFERENCES secciones_operacion(id) ON DELETE CASCADE,
    INDEX idx_seccion (seccion_id),
    INDEX idx_orden_seccion (seccion_id, orden_en_seccion),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 3. DATOS INICIALES: Secciones de Operación
-- ====================================================================
INSERT INTO secciones_operacion (nombre, descripcion, orden_visualizacion) VALUES
('Calibraciones y Verificaciones', 'Parámetros de calibración y verificación de equipos de medición y control', 1),
('Mantenimiento Preventivo y Correctivo', 'Parámetros de mantenimiento programado y reparaciones de equipos', 2),
('Laboratorio y Control de Calidad', 'Parámetros de control de calidad del concreto y materiales', 3),
('Producción y Operación', 'Parámetros del proceso de producción y operación diaria', 4);

-- ====================================================================
-- 4. DATOS INICIALES: Parámetros por Sección
-- ====================================================================

-- Parámetros para "Calibraciones y Verificaciones"
INSERT INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(1, 'Balanza principal', 'Mensual', 'Manual del fabricante', 1),
(1, 'Balanza de aditivos', 'Mensual', 'Manual del fabricante', 2),
(1, 'Sensor de humedad agregados', 'Trimestral', 'ASTM C566', 3),
(1, 'Medidor de temperatura', 'Semestral', 'Norma técnica interna', 4),
(1, 'Caudalímetro de agua', 'Bimestral', 'Manual del fabricante', 5),
(1, 'Sistema de dosificación', 'Semanal', 'Procedimiento interno', 6);

-- Parámetros para "Mantenimiento Preventivo y Correctivo"
INSERT INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(2, 'Mezcladora principal', 'Semanal', 'Manual de mantenimiento', 1)
ON DUPLICATE KEY UPDATE frecuencia_sugerida='Semanal', referencia_normativa = 'Manual de mantenimiento';

-- Parámetros para "Laboratorio y Control de Calidad"
INSERT INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(3, 'Revenimiento del concreto', 'Diario', 'ASTM C143', 1),
(3, 'Resistencia a compresión', 'Diario', 'ASTM C39', 2),
(3, 'Contenido de aire', 'Diario', 'ASTM C231', 3),
(3, 'Temperatura del concreto', 'Diario', 'ASTM C1064', 4),
(3, 'Granulometría agregados', 'Semanal', 'ASTM C136', 5),
(3, 'Densidad del concreto', 'Diario', 'ASTM C138', 6);

-- Parámetros para "Producción y Operación"
INSERT INTO parametros_seguimiento (seccion_id, parametro, frecuencia_sugerida, referencia_normativa, orden_en_seccion) VALUES
(4, 'Tiempo de mezclado', 'Diario', 'Procedimiento interno', 1),
(4, 'Consumo de materiales', 'Diario', 'Control de inventarios', 2),
(4, 'Volumen de producción', 'Diario', 'Registro de producción', 3),
(4, 'Limpieza de equipos', 'Diario', 'Manual de operación', 4),
(4, 'Condiciones ambientales', 'Diario', 'Procedimiento interno', 5),
(4, 'Eficiencia de producción', 'Semanal', 'KPIs de producción', 6);

-- ====================================================================
-- 5. COMENTARIOS FINALES
-- ====================================================================
-- Las tablas están listas para:
-- 1. Gestionar secciones de operación de forma dinámica
-- 2. Asociar parámetros específicos a cada sección
-- 3. Mantener orden de visualización tanto en secciones como en parámetros
-- 4. Permitir activar/desactivar elementos sin eliminarlos
-- 5. Mantener integridad referencial entre tablas
-- 6. Optimización con índices para consultas frecuentes
-- ====================================================================
