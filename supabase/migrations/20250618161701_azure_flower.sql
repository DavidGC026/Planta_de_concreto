-- =====================================================
-- IMCYC - Sistema de Evaluación de Plantas de Concreto
-- Script de configuración para producción
-- =====================================================

-- Crear usuario específico para la aplicación
CREATE USER IF NOT EXISTS 'imcyc_user'@'localhost' IDENTIFIED BY 'imcyc_secure_password_2024';

-- Otorgar permisos específicos (principio de menor privilegio)
GRANT SELECT, INSERT, UPDATE, DELETE ON imcyc_evaluaciones.* TO 'imcyc_user'@'localhost';
GRANT CREATE TEMPORARY TABLES ON imcyc_evaluaciones.* TO 'imcyc_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Configurar variables de MySQL para optimización
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL max_connections = 100;
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL query_cache_type = 1;

-- Crear índices adicionales para optimización
USE imcyc_evaluaciones;

-- Índices para mejorar rendimiento de consultas frecuentes
CREATE INDEX idx_evaluaciones_fecha_usuario ON evaluaciones(fecha_inicio, usuario_id);
CREATE INDEX idx_respuestas_evaluacion_fecha ON respuestas_evaluacion(fecha_respuesta);
CREATE INDEX idx_usuarios_activo_rol ON usuarios(activo, rol);

-- Vista optimizada para dashboard
CREATE VIEW vista_dashboard_estadisticas AS
SELECT 
    DATE(e.fecha_inicio) as fecha,
    te.nombre as tipo_evaluacion,
    COUNT(e.id) as total_evaluaciones,
    AVG(e.puntuacion_total) as promedio_puntuacion,
    SUM(CASE WHEN e.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
    SUM(CASE WHEN e.puntuacion_total >= 70 THEN 1 ELSE 0 END) as aprobadas
FROM evaluaciones e
JOIN tipos_evaluacion te ON e.tipo_evaluacion_id = te.id
WHERE e.fecha_inicio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(e.fecha_inicio), te.id, te.nombre
ORDER BY fecha DESC;

-- Procedimiento para limpiar datos antiguos (opcional)
DELIMITER //
CREATE PROCEDURE LimpiarDatosAntiguos()
BEGIN
    -- Eliminar evaluaciones incompletas de más de 7 días
    DELETE FROM evaluaciones 
    WHERE estado = 'en_progreso' 
    AND fecha_inicio < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Eliminar reportes de más de 1 año
    DELETE FROM reportes 
    WHERE fecha_generacion < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END //
DELIMITER ;

-- Configurar evento para limpieza automática (ejecutar semanalmente)
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evento_limpieza_semanal
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
  CALL LimpiarDatosAntiguos();