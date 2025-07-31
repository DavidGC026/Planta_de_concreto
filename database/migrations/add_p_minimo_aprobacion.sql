-- Migración: Agregar porcentaje mínimo de aprobación por sección
-- Fecha: 2025-01-18
-- Descripción: Agrega la columna p_minimo_aprobacion a la tabla secciones_evaluacion
--              para establecer el porcentaje mínimo requerido para aprobar cada sección

-- Verificar si la columna ya existe
SET @column_exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'secciones_evaluacion' 
    AND column_name = 'p_minimo_aprobacion'
);

-- Agregar columna si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE secciones_evaluacion ADD COLUMN p_minimo_aprobacion DECIMAL(5,2) DEFAULT 90.00 COMMENT "Porcentaje mínimo de aprobación de cuestionario individual por sección"',
    'SELECT "La columna p_minimo_aprobacion ya existe" as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar valores por defecto para secciones existentes (opcional)
-- UPDATE secciones_evaluacion 
-- SET p_minimo_aprobacion = 90.00 
-- WHERE p_minimo_aprobacion IS NULL;

-- Mostrar resultado
SELECT 
    'Migración completada' as estado,
    'p_minimo_aprobacion agregada con valor por defecto 90.00%' as descripcion;

-- Verificar la estructura final
DESCRIBE secciones_evaluacion;
