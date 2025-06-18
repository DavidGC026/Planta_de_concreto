-- =====================================================
-- IMCYC - Sistema de Evaluación de Plantas de Concreto
-- Base de Datos MySQL
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

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador IMCYC', 'admin@imcyc.org', 'admin');

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