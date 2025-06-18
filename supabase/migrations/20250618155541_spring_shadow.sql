-- =====================================================
-- IMCYC - Sistema de Evaluación de Plantas de Concreto
-- Base de Datos MySQL - Esquema Completo
-- =====================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS imcyc_evaluaciones 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE imcyc_evaluaciones;

-- =====================================================
-- Tabla de usuarios
-- =====================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    email VARCHAR(150) UNIQUE,
    rol ENUM('admin', 'evaluador', 'supervisor') DEFAULT 'evaluador',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_rol (rol)
);

-- =====================================================
-- Tabla de tipos de evaluación
-- =====================================================
CREATE TABLE tipos_evaluacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo)
);

-- =====================================================
-- Tabla de roles de personal
-- =====================================================
CREATE TABLE roles_personal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_codigo (codigo)
);

-- =====================================================
-- Tabla de secciones de evaluación
-- =====================================================
CREATE TABLE secciones_evaluacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evaluacion_id INT NOT NULL,
    rol_personal_id INT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tipo_evaluacion_id) REFERENCES tipos_evaluacion(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE SET NULL,
    
    INDEX idx_tipo_evaluacion (tipo_evaluacion_id),
    INDEX idx_rol_personal (rol_personal_id),
    INDEX idx_orden (orden)
);

-- =====================================================
-- Tabla de preguntas
-- =====================================================
CREATE TABLE preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seccion_id INT NOT NULL,
    pregunta TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seccion_id) REFERENCES secciones_evaluacion(id) ON DELETE CASCADE,
    
    INDEX idx_seccion (seccion_id),
    INDEX idx_orden (orden)
);

-- =====================================================
-- Tabla de evaluaciones realizadas
-- =====================================================
CREATE TABLE evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_evaluacion_id INT NOT NULL,
    rol_personal_id INT NULL,
    puntuacion_total DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_preguntas INT NOT NULL DEFAULT 0,
    respuestas_si INT NOT NULL DEFAULT 0,
    respuestas_no INT NOT NULL DEFAULT 0,
    respuestas_na INT NOT NULL DEFAULT 0,
    estado ENUM('en_progreso', 'completada', 'cancelada') DEFAULT 'en_progreso',
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion TIMESTAMP NULL,
    observaciones TEXT,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_evaluacion_id) REFERENCES tipos_evaluacion(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_personal_id) REFERENCES roles_personal(id) ON DELETE SET NULL,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo_evaluacion (tipo_evaluacion_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_inicio (fecha_inicio)
);

-- =====================================================
-- Tabla de respuestas de evaluación
-- =====================================================
CREATE TABLE respuestas_evaluacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluacion_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    respuesta ENUM('si', 'no', 'na') NOT NULL,
    observacion TEXT,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_evaluacion_pregunta (evaluacion_id, pregunta_id),
    INDEX idx_evaluacion (evaluacion_id),
    INDEX idx_pregunta (pregunta_id),
    INDEX idx_respuesta (respuesta)
);

-- =====================================================
-- Tabla de reportes generados
-- =====================================================
CREATE TABLE reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluacion_id INT NOT NULL,
    tipo_reporte ENUM('pdf', 'excel', 'json') NOT NULL,
    ruta_archivo VARCHAR(500),
    tamaño_archivo INT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE,
    
    INDEX idx_evaluacion (evaluacion_id),
    INDEX idx_tipo_reporte (tipo_reporte)
);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar tipos de evaluación
INSERT INTO tipos_evaluacion (codigo, nombre, descripcion) VALUES
('personal', 'Evaluación de Personal', 'Evaluación de competencias y conocimientos del personal'),
('equipo', 'Evaluación de Equipo', 'Evaluación del estado y funcionamiento de equipos'),
('operacion', 'Evaluación de Operación', 'Evaluación de procesos operativos y procedimientos');

-- Insertar roles de personal
INSERT INTO roles_personal (codigo, nombre, descripcion) VALUES
('jefe_planta', 'Jefe de Planta', 'Responsable general de la operación de la planta'),
('laboratorista', 'Laboratorista', 'Encargado del control de calidad y pruebas de laboratorio'),
('operador_camion', 'Operador de Camión Revolvedor', 'Operador de vehículos de transporte de concreto'),
('operador_bombas', 'Operador de Bombas de Concreto', 'Operador de equipos de bombeo de concreto');

-- Insertar usuario administrador por defecto (password: admin123)
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador IMCYC', 'admin@imcyc.org', 'admin');

-- =====================================================
-- SECCIONES Y PREGUNTAS PARA JEFE DE PLANTA
-- =====================================================

-- Obtener IDs necesarios
SET @tipo_personal_id = (SELECT id FROM tipos_evaluacion WHERE codigo = 'personal');
SET @jefe_planta_id = (SELECT id FROM roles_personal WHERE codigo = 'jefe_planta');

-- Secciones para Jefe de Planta
INSERT INTO secciones_evaluacion (tipo_evaluacion_id, rol_personal_id, nombre, descripcion, orden) VALUES
(@tipo_personal_id, @jefe_planta_id, 'Gestión de la producción', 'Conocimientos sobre gestión y control de la producción de concreto', 1),
(@tipo_personal_id, @jefe_planta_id, 'Mantenimiento del equipo', 'Conocimientos sobre mantenimiento preventivo y correctivo', 2),
(@tipo_personal_id, @jefe_planta_id, 'Control de calidad', 'Procedimientos de control de calidad y pruebas', 3),
(@tipo_personal_id, @jefe_planta_id, 'Seguridad y normatividad', 'Normas de seguridad y cumplimiento regulatorio', 4),
(@tipo_personal_id, @jefe_planta_id, 'Gestión administrativa', 'Administración y documentación de procesos', 5);

-- Preguntas para Gestión de la producción
SET @seccion_gestion_id = (SELECT id FROM secciones_evaluacion WHERE nombre = 'Gestión de la producción' AND rol_personal_id = @jefe_planta_id);

INSERT INTO preguntas (seccion_id, pregunta, orden) VALUES
(@seccion_gestion_id, '¿Qué acciones se toman si un cliente solicita un cambio en su pedido con menos de 2 horas de anticipación?', 1),
(@seccion_gestion_id, '¿Cuál debe ser el porcentaje mínimo de desperdicios sobre la producción mensual?', 2),
(@seccion_gestion_id, '¿Cuál es el tiempo máximo permitido para la descarga de concreto?', 3),
(@seccion_gestion_id, '¿Qué documentación debe acompañar cada entrega de concreto?', 4),
(@seccion_gestion_id, '¿Cuál es la tolerancia máxima en el revenimiento del concreto?', 5),
(@seccion_gestion_id, '¿Cada cuánto se debe calibrar la báscula de cemento?', 6),
(@seccion_gestion_id, '¿Qué se debe verificar antes de iniciar la producción diaria?', 7),
(@seccion_gestion_id, '¿Cuál es el procedimiento cuando se detecta una no conformidad en el concreto?', 8),
(@seccion_gestion_id, '¿Qué registro se debe mantener de cada bachada producida?', 9),
(@seccion_gestion_id, '¿Cuál es la temperatura máxima recomendada para el concreto fresco?', 10),
(@seccion_gestion_id, '¿Qué se debe hacer si la humedad de los agregados varía significativamente?', 11),
(@seccion_gestion_id, '¿Con qué frecuencia se debe limpiar el equipo de mezclado?', 12),
(@seccion_gestion_id, '¿Qué información debe contener la etiqueta de identificación de materiales?', 13),
(@seccion_gestion_id, '¿Cuál es el procedimiento para el control de inventarios de materiales?', 14),
(@seccion_gestion_id, '¿Qué medidas se toman para garantizar la trazabilidad del producto?', 15);

-- Preguntas para Mantenimiento del equipo
SET @seccion_mantenimiento_id = (SELECT id FROM secciones_evaluacion WHERE nombre = 'Mantenimiento del equipo' AND rol_personal_id = @jefe_planta_id);

INSERT INTO preguntas (seccion_id, pregunta, orden) VALUES
(@seccion_mantenimiento_id, '¿Qué tipo de inspecciones se realizan a los equipos de planta?', 1),
(@seccion_mantenimiento_id, '¿Con qué frecuencia se hacen pruebas de funcionamiento?', 2),
(@seccion_mantenimiento_id, '¿Cuál es el intervalo recomendado para el mantenimiento preventivo de la mezcladora?', 3),
(@seccion_mantenimiento_id, '¿Qué se debe verificar en las bandas transportadoras diariamente?', 4),
(@seccion_mantenimiento_id, '¿Cuándo se debe cambiar el aceite hidráulico de los equipos?', 5),
(@seccion_mantenimiento_id, '¿Qué herramientas son esenciales para el mantenimiento básico?', 6),
(@seccion_mantenimiento_id, '¿Cómo se debe almacenar las refacciones de repuesto?', 7),
(@seccion_mantenimiento_id, '¿Qué registro se debe llevar del mantenimiento realizado?', 8),
(@seccion_mantenimiento_id, '¿Cuál es la presión de trabajo normal en el sistema neumático?', 9),
(@seccion_mantenimiento_id, '¿Qué se debe hacer antes de realizar mantenimiento en equipos eléctricos?', 10),
(@seccion_mantenimiento_id, '¿Con qué frecuencia se debe revisar el sistema de lubricación automática?', 11),
(@seccion_mantenimiento_id, '¿Qué componentes se deben inspeccionar en las básculas?', 12),
(@seccion_mantenimiento_id, '¿Cuál es la vida útil promedio de las aspas de la mezcladora?', 13),
(@seccion_mantenimiento_id, '¿Qué se debe verificar en el sistema de aire comprimido?', 14),
(@seccion_mantenimiento_id, '¿Cómo se debe limpiar el interior de la mezcladora?', 15);

-- Preguntas para Control de calidad
SET @seccion_calidad_id = (SELECT id FROM secciones_evaluacion WHERE nombre = 'Control de calidad' AND rol_personal_id = @jefe_planta_id);

INSERT INTO preguntas (seccion_id, pregunta, orden) VALUES
(@seccion_calidad_id, '¿Cuál es la frecuencia mínima para realizar pruebas de revenimiento?', 1),
(@seccion_calidad_id, '¿Qué resistencia debe alcanzar el concreto a los 7 días?', 2),
(@seccion_calidad_id, '¿Cuántos cilindros se deben elaborar por cada muestra?', 3),
(@seccion_calidad_id, '¿A qué edad se rompen los cilindros para control de calidad?', 4),
(@seccion_calidad_id, '¿Cuál es la temperatura de curado de los especímenes?', 5),
(@seccion_calidad_id, '¿Qué se debe verificar en los agregados antes de su uso?', 6),
(@seccion_calidad_id, '¿Con qué frecuencia se debe calibrar la balanza del laboratorio?', 7),
(@seccion_calidad_id, '¿Cuál es el tiempo máximo para transportar una muestra al laboratorio?', 8),
(@seccion_calidad_id, '¿Qué información debe contener el reporte de pruebas?', 9),
(@seccion_calidad_id, '¿Cuál es la tolerancia en peso para los cilindros de prueba?', 10),
(@seccion_calidad_id, '¿Qué se debe hacer si una muestra no cumple con la resistencia especificada?', 11),
(@seccion_calidad_id, '¿Cuál es el contenido de aire máximo permitido en concreto normal?', 12),
(@seccion_calidad_id, '¿Qué equipo se utiliza para medir el contenido de aire?', 13),
(@seccion_calidad_id, '¿Cuánto tiempo se debe vibrar un cilindro de prueba?', 14),
(@seccion_calidad_id, '¿Qué se debe verificar en el cemento antes de su uso?', 15);

-- Preguntas para Seguridad y normatividad
SET @seccion_seguridad_id = (SELECT id FROM secciones_evaluacion WHERE nombre = 'Seguridad y normatividad' AND rol_personal_id = @jefe_planta_id);

INSERT INTO preguntas (seccion_id, pregunta, orden) VALUES
(@seccion_seguridad_id, '¿Cuál es el equipo de protección personal mínimo requerido?', 1),
(@seccion_seguridad_id, '¿Con qué frecuencia se deben realizar simulacros de emergencia?', 2),
(@seccion_seguridad_id, '¿Qué distancia mínima debe mantenerse de líneas eléctricas aéreas?', 3),
(@seccion_seguridad_id, '¿Cuál es el procedimiento para reportar un accidente?', 4),
(@seccion_seguridad_id, '¿Qué tipo de extinguidor se debe usar para fuegos eléctricos?', 5),
(@seccion_seguridad_id, '¿Cuál es la señalización requerida en áreas de riesgo?', 6),
(@seccion_seguridad_id, '¿Con qué frecuencia se debe revisar el botiquín de primeros auxilios?', 7),
(@seccion_seguridad_id, '¿Qué se debe hacer antes de ingresar a un espacio confinado?', 8),
(@seccion_seguridad_id, '¿Cuál es la altura máxima para trabajar sin arnés?', 9),
(@seccion_seguridad_id, '¿Qué documentos de seguridad debe tener cada trabajador?', 10),
(@seccion_seguridad_id, '¿Cuál es el procedimiento para bloqueo y etiquetado (LOTO)?', 11),
(@seccion_seguridad_id, '¿Qué se debe verificar en las escaleras antes de usarlas?', 12),
(@seccion_seguridad_id, '¿Cuál es la velocidad máxima permitida dentro de la planta?', 13),
(@seccion_seguridad_id, '¿Qué se debe hacer con los residuos peligrosos?', 14),
(@seccion_seguridad_id, '¿Con qué frecuencia se debe capacitar al personal en seguridad?', 15);

-- Preguntas para Gestión administrativa
SET @seccion_admin_id = (SELECT id FROM secciones_evaluacion WHERE nombre = 'Gestión administrativa' AND rol_personal_id = @jefe_planta_id);

INSERT INTO preguntas (seccion_id, pregunta, orden) VALUES
(@seccion_admin_id, '¿Qué documentos se requieren para cada pedido de concreto?', 1),
(@seccion_admin_id, '¿Cuál es el tiempo de respuesta máximo para cotizaciones?', 2),
(@seccion_admin_id, '¿Qué información debe contener la remisión de entrega?', 3),
(@seccion_admin_id, '¿Con qué frecuencia se debe actualizar el inventario de materiales?', 4),
(@seccion_admin_id, '¿Cuál es el procedimiento para cambios en pedidos confirmados?', 5),
(@seccion_admin_id, '¿Qué registros se deben mantener de la producción diaria?', 6),
(@seccion_admin_id, '¿Cuál es el tiempo máximo de crédito estándar para clientes?', 7),
(@seccion_admin_id, '¿Qué se debe verificar antes de autorizar un pedido?', 8),
(@seccion_admin_id, '¿Con qué frecuencia se debe revisar la cartera de clientes?', 9),
(@seccion_admin_id, '¿Qué documentos se requieren para facturación?', 10),
(@seccion_admin_id, '¿Cuál es el procedimiento para devoluciones de concreto?', 11),
(@seccion_admin_id, '¿Qué información debe contener el reporte de ventas diario?', 12),
(@seccion_admin_id, '¿Con qué frecuencia se debe actualizar la lista de precios?', 13),
(@seccion_admin_id, '¿Qué se debe hacer con las quejas de clientes?', 14),
(@seccion_admin_id, '¿Cuál es el tiempo máximo para entregar certificados de calidad?', 15);

-- =====================================================
-- SECCIONES Y PREGUNTAS PARA LABORATORISTA
-- =====================================================

SET @laboratorista_id = (SELECT id FROM roles_personal WHERE codigo = 'laboratorista');

-- Secciones para Laboratorista
INSERT INTO secciones_evaluacion (tipo_evaluacion_id, rol_personal_id, nombre, descripcion, orden) VALUES
(@tipo_personal_id, @laboratorista_id, 'Pruebas de laboratorio', 'Procedimientos y técnicas de laboratorio', 1),
(@tipo_personal_id, @laboratorista_id, 'Control de calidad', 'Estándares y procedimientos de calidad', 2),
(@tipo_personal_id, @laboratorista_id, 'Equipos de laboratorio', 'Manejo y mantenimiento de equipos', 3),
(@tipo_personal_id, @laboratorista_id, 'Normatividad técnica', 'Normas y especificaciones técnicas', 4);

-- Preguntas para Laboratorista - Pruebas de laboratorio
SET @seccion_lab_pruebas_id = (SELECT id FROM secciones_evaluacion WHERE nombre = 'Pruebas de laboratorio' AND rol_personal_id = @laboratorista_id);

INSERT INTO preguntas (seccion_id, pregunta, orden) VALUES
(@seccion_lab_pruebas_id, '¿Cuál es el procedimiento correcto para tomar una muestra de concreto fresco?', 1),
(@seccion_lab_pruebas_id, '¿Qué norma rige la prueba de revenimiento del concreto?', 2),
(@seccion_lab_pruebas_id, '¿Cuál es la temperatura estándar para el curado de cilindros?', 3),
(@seccion_lab_pruebas_id, '¿Cada cuánto tiempo se debe verificar la calibración de la prensa?', 4),
(@seccion_lab_pruebas_id, '¿Qué información debe registrarse en cada prueba de resistencia?', 5),
(@seccion_lab_pruebas_id, '¿Cuál es el procedimiento para la prueba de contenido de aire?', 6),
(@seccion_lab_pruebas_id, '¿Qué se debe hacer si un cilindro presenta defectos visibles?', 7),
(@seccion_lab_pruebas_id, '¿Cuál es la velocidad de carga correcta para la prueba de compresión?', 8),
(@seccion_lab_pruebas_id, '¿Qué factores pueden afectar los resultados de las pruebas?', 9),
(@seccion_lab_pruebas_id, '¿Cómo se debe preparar la superficie de los cilindros antes de la prueba?', 10),
(@seccion_lab_pruebas_id, '¿Qué procedimiento se sigue para la prueba de peso unitario?', 11),
(@seccion_lab_pruebas_id, '¿Cuál es el tiempo límite para elaborar cilindros después del muestreo?', 12),
(@seccion_lab_pruebas_id, '¿Qué se debe verificar en los moldes antes de su uso?', 13),
(@seccion_lab_pruebas_id, '¿Cómo se calcula el factor de corrección por edad?', 14),
(@seccion_lab_pruebas_id, '¿Qué documentación debe acompañar cada reporte de laboratorio?', 15);

-- =====================================================
-- SECCIONES PARA EVALUACIÓN DE EQUIPO
-- =====================================================

SET @tipo_equipo_id = (SELECT id FROM tipos_evaluacion WHERE codigo = 'equipo');

INSERT INTO secciones_evaluacion (tipo_evaluacion_id, rol_personal_id, nombre, descripcion, orden) VALUES
(@tipo_equipo_id, NULL, 'Equipos de mezclado', 'Estado y funcionamiento de mezcladoras', 1),
(@tipo_equipo_id, NULL, 'Sistemas de pesaje', 'Básculas y sistemas de dosificación', 2),
(@tipo_equipo_id, NULL, 'Equipos auxiliares', 'Compresores, bandas, silos', 3),
(@tipo_equipo_id, NULL, 'Sistemas eléctricos', 'Instalaciones y controles eléctricos', 4);

-- =====================================================
-- SECCIONES PARA EVALUACIÓN DE OPERACIÓN
-- =====================================================

SET @tipo_operacion_id = (SELECT id FROM tipos_evaluacion WHERE codigo = 'operacion');

INSERT INTO secciones_evaluacion (tipo_evaluacion_id, rol_personal_id, nombre, descripcion, orden) VALUES
(@tipo_operacion_id, NULL, 'Estado de Equipos Principales', 'Evaluación del estado de equipos críticos', 1),
(@tipo_operacion_id, NULL, 'Infraestructura y Seguridad', 'Estado de instalaciones y medidas de seguridad', 2),
(@tipo_operacion_id, NULL, 'Documentación y Certificaciones', 'Documentos y certificaciones requeridas', 3);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de evaluaciones con información completa
CREATE VIEW vista_evaluaciones_completas AS
SELECT 
    e.id,
    e.puntuacion_total,
    e.total_preguntas,
    e.estado,
    e.fecha_inicio,
    e.fecha_finalizacion,
    u.username,
    u.nombre_completo,
    te.nombre AS tipo_evaluacion,
    rp.nombre AS rol_personal,
    CASE 
        WHEN e.puntuacion_total >= 120 THEN 'APROBADO'
        ELSE 'REPROBADO'
    END AS resultado
FROM evaluaciones e
JOIN usuarios u ON e.usuario_id = u.id
JOIN tipos_evaluacion te ON e.tipo_evaluacion_id = te.id
LEFT JOIN roles_personal rp ON e.rol_personal_id = rp.id;

-- Vista de estadísticas por tipo de evaluación
CREATE VIEW vista_estadisticas_evaluacion AS
SELECT 
    te.nombre AS tipo_evaluacion,
    COUNT(e.id) AS total_evaluaciones,
    AVG(e.puntuacion_total) AS promedio_puntuacion,
    SUM(CASE WHEN e.puntuacion_total >= 120 THEN 1 ELSE 0 END) AS aprobados,
    SUM(CASE WHEN e.puntuacion_total < 120 THEN 1 ELSE 0 END) AS reprobados
FROM tipos_evaluacion te
LEFT JOIN evaluaciones e ON te.id = e.tipo_evaluacion_id AND e.estado = 'completada'
GROUP BY te.id, te.nombre;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

DELIMITER //

-- Procedimiento para obtener preguntas aleatorias
CREATE PROCEDURE GetPreguntasAleatorias(
    IN p_tipo_evaluacion VARCHAR(50),
    IN p_rol_personal VARCHAR(50),
    IN p_limite INT DEFAULT 10
)
BEGIN
    DECLARE v_tipo_id INT;
    DECLARE v_rol_id INT;
    
    SELECT id INTO v_tipo_id FROM tipos_evaluacion WHERE codigo = p_tipo_evaluacion;
    
    IF p_rol_personal IS NOT NULL THEN
        SELECT id INTO v_rol_id FROM roles_personal WHERE codigo = p_rol_personal;
    END IF;
    
    SELECT 
        s.id as seccion_id,
        s.nombre as seccion_nombre,
        s.orden as seccion_orden,
        p.id as pregunta_id,
        p.pregunta,
        p.orden as pregunta_orden
    FROM secciones_evaluacion s
    JOIN preguntas p ON s.id = p.seccion_id
    WHERE s.tipo_evaluacion_id = v_tipo_id 
        AND (v_rol_id IS NULL OR s.rol_personal_id = v_rol_id)
        AND s.activo = 1 
        AND p.activo = 1
    ORDER BY s.orden, RAND()
    LIMIT p_limite;
END //

DELIMITER ;