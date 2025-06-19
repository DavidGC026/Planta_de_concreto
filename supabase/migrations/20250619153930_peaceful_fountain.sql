-- =====================================================
-- IMCYC - Script de corrección para errores de sintaxis
-- =====================================================

USE imcyc_evaluaciones;

-- Eliminar el procedimiento si existe (para evitar conflictos)
DROP PROCEDURE IF EXISTS GetPreguntasAleatorias;

-- Recrear el procedimiento con sintaxis corregida
DELIMITER //

CREATE PROCEDURE GetPreguntasAleatorias(
    IN p_tipo_evaluacion VARCHAR(50),
    IN p_rol_personal VARCHAR(50),
    IN p_limite INT DEFAULT 10
)
BEGIN
    DECLARE v_tipo_id INT DEFAULT NULL;
    DECLARE v_rol_id INT DEFAULT NULL;
    
    -- Obtener ID del tipo de evaluación
    SELECT id INTO v_tipo_id 
    FROM tipos_evaluacion 
    WHERE codigo = p_tipo_evaluacion 
    LIMIT 1;
    
    -- Obtener ID del rol si se proporciona
    IF p_rol_personal IS NOT NULL THEN
        SELECT id INTO v_rol_id 
        FROM roles_personal 
        WHERE codigo = p_rol_personal 
        LIMIT 1;
    END IF;
    
    -- Consulta principal
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

-- Verificar que el procedimiento se creó correctamente
SHOW PROCEDURE STATUS WHERE Name = 'GetPreguntasAleatorias';