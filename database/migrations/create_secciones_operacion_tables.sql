-- Migración: Crear tablas para secciones de operación navegables
-- Fecha: 2025-01-04
-- Descripción: Reemplaza el sistema de seguimiento por secciones navegables con flechas

-- 1. Crear tabla de secciones de operación
CREATE TABLE IF NOT EXISTS secciones_operacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL DEFAULT 1,
    icono VARCHAR(50) DEFAULT 'settings',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Secciones de evaluación de operación navegables con flechas';

-- 2. Crear tabla de parámetros de operación
CREATE TABLE IF NOT EXISTS parametros_operacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seccion_operacion_id INT NOT NULL,
    parametro VARCHAR(255) NOT NULL,
    frecuencia_sugerida VARCHAR(255) NOT NULL,
    observaciones TEXT,
    referencia_normativa VARCHAR(255),
    orden INT NOT NULL DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seccion_operacion_id) REFERENCES secciones_operacion(id) ON DELETE CASCADE,
    INDEX idx_seccion (seccion_operacion_id),
    INDEX idx_orden (orden),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Parámetros de evaluación de operación relacionados con secciones';

-- 3. Insertar secciones de operación predeterminadas
INSERT INTO secciones_operacion (nombre, descripcion, orden, icono) VALUES
('Control de Calidad', 'Parámetros de control de calidad del concreto y materiales', 1, 'clipboard-check'),
('Operación de Equipos', 'Parámetros de funcionamiento y mantenimiento de equipos', 2, 'settings'),
('Proceso de Producción', 'Parámetros del proceso productivo y dosificación', 3, 'play'),
('Seguridad y Medio Ambiente', 'Parámetros de seguridad industrial y cuidado ambiental', 4, 'shield'),
('Gestión de Materiales', 'Parámetros de almacenamiento y manejo de materiales', 5, 'package'),
('Control de Documentación', 'Parámetros de documentación y registros operativos', 6, 'file-text');

-- 4. Insertar parámetros de ejemplo para cada sección
-- Sección 1: Control de Calidad
INSERT INTO parametros_operacion (seccion_operacion_id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, orden) VALUES
(1, 'Resistencia a la compresión del concreto', 'Cada lote de producción', 'Verificar cumplimiento con especificaciones del proyecto', 'NMX-C-083-ONNCCE', 1),
(1, 'Revenimiento (slump) del concreto', 'Cada camión', 'Control de consistencia y trabajabilidad', 'NMX-C-156-ONNCCE', 2),
(1, 'Temperatura del concreto fresco', 'Cada camión', 'Evitar segregación y agrietamiento', 'ACI 305R', 3),
(1, 'Tiempo de fraguado', 'Diario', 'Control de tiempos de colocación', 'NMX-C-177-ONNCCE', 4),
(1, 'Contenido de aire', 'Cada lote', 'Para concretos con aditivo inclusor de aire', 'NMX-C-157-ONNCCE', 5);

-- Sección 2: Operación de Equipos
INSERT INTO parametros_operacion (seccion_operacion_id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, orden) VALUES
(2, 'Calibración de básculas de dosificación', 'Mensual', 'Verificar precisión en dosificación de materiales', 'NOM-010-SCFI', 1),
(2, 'Estado de las aspas mezcladoras', 'Semanal', 'Revisar desgaste y efectividad de mezclado', 'Manual del fabricante', 2),
(2, 'Presión y caudal de agua', 'Diario', 'Control de la relación agua/cemento', 'Procedimiento interno', 3),
(2, 'Funcionamiento de sistemas de transporte', 'Diario', 'Bandas transportadoras y elevadores', 'Manual de operación', 4),
(2, 'Mantenimiento preventivo de equipos', 'Según programa', 'Seguir cronograma de mantenimiento', 'ISO 55000', 5);

-- Sección 3: Proceso de Producción
INSERT INTO parametros_operacion (seccion_operacion_id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, orden) VALUES
(3, 'Dosificación de materiales', 'Cada lote', 'Verificar proporciones según diseño de mezcla', 'ACI 211.1', 1),
(3, 'Tiempo de mezclado', 'Cada ciclo', 'Asegurar homogeneidad de la mezcla', 'ASTM C94', 2),
(3, 'Secuencia de carga de materiales', 'Cada lote', 'Seguir procedimiento establecido', 'Procedimiento interno', 3),
(3, 'Control de humedad de agregados', 'Cada turno', 'Ajustar agua de mezclado según humedad', 'ASTM C566', 4),
(3, 'Limpieza de equipos de mezclado', 'Al cambio de mezcla', 'Evitar contaminación entre diferentes mezclas', 'Procedimiento interno', 5);

-- Sección 4: Seguridad y Medio Ambiente
INSERT INTO parametros_operacion (seccion_operacion_id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, orden) VALUES
(4, 'Uso de equipo de protección personal', 'Permanente', 'Verificar uso correcto de EPP', 'NOM-017-STPS', 1),
(4, 'Control de emisiones de polvo', 'Diario', 'Funcionamiento de sistemas de control', 'NOM-043-SEMARNAT', 2),
(4, 'Manejo de materiales peligrosos', 'Según uso', 'Aditivos químicos y materiales especiales', 'NOM-018-STPS', 3),
(4, 'Señalización de seguridad', 'Semanal', 'Estado y visibilidad de señalética', 'NOM-026-STPS', 4),
(4, 'Plan de emergencias', 'Mensual', 'Revisión y actualización de protocolos', 'NOM-002-STPS', 5);

-- Sección 5: Gestión de Materiales
INSERT INTO parametros_operacion (seccion_operacion_id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, orden) VALUES
(5, 'Almacenamiento de cemento', 'Diario', 'Condiciones de almacenaje y rotación', 'NMX-C-414-ONNCCE', 1),
(5, 'Control de inventarios', 'Diario', 'Registro de entradas y salidas de materiales', 'Procedimiento interno', 2),
(5, 'Estado de agregados pétreos', 'Cada entrega', 'Limpieza y granulometría', 'NMX-C-111-ONNCCE', 3),
(5, 'Almacenamiento de aditivos', 'Semanal', 'Condiciones de temperatura y vencimiento', 'Especificaciones del fabricante', 4),
(5, 'Segregación de materiales', 'Diario', 'Evitar contaminación cruzada', 'Buenas prácticas', 5);

-- Sección 6: Control de Documentación
INSERT INTO parametros_operacion (seccion_operacion_id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, orden) VALUES
(6, 'Registros de producción', 'Cada lote', 'Documentar todas las entregas', 'Procedimiento interno', 1),
(6, 'Certificados de calidad de materiales', 'Cada entrega', 'Verificar documentación de proveedores', 'NMX-C-414-ONNCCE', 2),
(6, 'Reportes de ensayos de laboratorio', 'Según programa', 'Archivo de resultados de pruebas', 'Procedimiento interno', 3),
(6, 'Bitácoras de mantenimiento', 'Cada actividad', 'Registro de actividades de mantenimiento', 'ISO 55000', 4),
(6, 'Control de no conformidades', 'Cuando aplique', 'Registro y seguimiento de desviaciones', 'ISO 9001', 5);

-- 5. Crear tabla para el progreso del usuario en secciones de operación
CREATE TABLE IF NOT EXISTS progreso_secciones_operacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    seccion_operacion_id INT NOT NULL,
    parametros_completados INT DEFAULT 0,
    total_parametros INT DEFAULT 0,
    porcentaje_completado DECIMAL(5,2) DEFAULT 0.00,
    observaciones_generales TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seccion_operacion_id) REFERENCES secciones_operacion(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_seccion (usuario_id, seccion_operacion_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_seccion (seccion_operacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Progreso del usuario en las secciones de operación';

-- 6. Crear tabla para respuestas individuales de parámetros
CREATE TABLE IF NOT EXISTS respuestas_parametros_operacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    parametro_operacion_id INT NOT NULL,
    estado ENUM('cumple', 'no_cumple', 'no_aplica', 'observacion') NOT NULL,
    observaciones TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parametro_operacion_id) REFERENCES parametros_operacion(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_parametro (usuario_id, parametro_operacion_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_parametro (parametro_operacion_id),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Respuestas del usuario a parámetros individuales de operación';

-- 7. Comentarios de configuración
-- Para activar/desactivar el sistema de navegación por secciones:
-- UPDATE secciones_operacion SET activo = TRUE WHERE id > 0;

-- Para cambiar el orden de las secciones:
-- UPDATE secciones_operacion SET orden = nuevo_orden WHERE id = seccion_id;

-- Para agregar nuevos parámetros a una sección:
-- INSERT INTO parametros_operacion (seccion_operacion_id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, orden) 
-- VALUES (seccion_id, 'Nuevo parámetro', 'Frecuencia', 'Observaciones', 'Referencia', orden);

COMMIT;
