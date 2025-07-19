# Sistema de Porcentaje Mínimo de Aprobación por Sección

## Descripción

El sistema de porcentaje mínimo de aprobación por sección permite establecer un criterio específico de aprobación para cada sección de la evaluación. Esto significa que cada sección debe cumplir con un porcentaje mínimo individual para que la evaluación sea considerada aprobada.

## Implementación

### 1. Estructura de Base de Datos

Se agregó la columna `p_minimo_aprobacion` a la tabla `secciones_evaluacion`:

```sql
ALTER TABLE secciones_evaluacion 
ADD COLUMN p_minimo_aprobacion DECIMAL(5,2) DEFAULT 90.00 
COMMENT 'Porcentaje mínimo de aprobación de cuestionario individual por sección';
```

### 2. Funcionalidad

#### Cálculo por Sección
- Cada sección se evalúa individualmente
- Se calcula el porcentaje de respuestas correctas: `(respuestas_correctas / total_preguntas) * 100`
- Se compara contra el valor de `p_minimo_aprobacion` de esa sección

#### Criterios de Aprobación
- **Sección Aprobada**: `porcentaje_obtenido >= p_minimo_aprobacion`
- **Sección Reprobada**: `porcentaje_obtenido < p_minimo_aprobacion`

#### Resultado Final
La evaluación se considera:
- **REPROBADO POR SECCIONES INSUFICIENTES**: Si al menos una sección no cumple con el porcentaje mínimo
- **REPROBADO POR PREGUNTAS TRAMPA**: Si se equivoca en 2 o más preguntas trampa
- **APROBADO/REPROBADO**: Según el criterio general si todas las secciones cumplen el mínimo

## Ejemplo Práctico

### Caso: Jefe de Plantas - Sección 1

**Configuración:**
- Sección: "Conocimientos Técnicos"
- Total preguntas: 5
- Porcentaje mínimo: 90%
- Preguntas correctas permitidas fallar: 0 (máximo 1 para mantener 90%)

**Escenarios:**
1. **5/5 correctas = 100%** → ✅ APROBADA
2. **4/5 correctas = 80%** → ❌ REPROBADA (no alcanza el 90%)
3. **3/5 correctas = 60%** → ❌ REPROBADA (no alcanza el 90%)

### Lógica de Cálculo

```php
// Ejemplo con 5 preguntas y 90% mínimo
$total_preguntas = 5;
$respuestas_correctas = 4;
$porcentaje_obtenido = ($respuestas_correctas / $total_preguntas) * 100; // 80%
$p_minimo_aprobacion = 90.00;

$seccion_aprobada = $porcentaje_obtenido >= $p_minimo_aprobacion; // false
```

## Configuración

### Valores Predeterminados
- **Por defecto**: 90.00%
- **Modificable**: Sí, por sección individual

### Configuración por Sección
```sql
-- Configurar porcentaje mínimo específico para una sección
UPDATE secciones_evaluacion 
SET p_minimo_aprobacion = 85.00 
WHERE id = 123;

-- Ver configuración actual
SELECT 
    id,
    nombre,
    p_minimo_aprobacion,
    ponderacion
FROM secciones_evaluacion 
WHERE activo = 1;
```

## Respuesta de API

### Información Adicional en la Respuesta

```json
{
  "success": true,
  "data": {
    "evaluacion_id": 456,
    "resultado": "REPROBADO POR SECCIONES INSUFICIENTES",
    "reprobado_por_secciones": true,
    "secciones_reprobadas": [
      {
        "seccion_nombre": "Conocimientos Técnicos",
        "porcentaje_obtenido": 80.00,
        "porcentaje_minimo_requerido": 90.00,
        "preguntas_correctas": 4,
        "total_preguntas": 5
      }
    ],
    "detalle_secciones": [
      {
        "seccion_id": 123,
        "seccion_nombre": "Conocimientos Técnicos",
        "porcentaje_obtenido": 80.00,
        "porcentaje_minimo_requerido": 90.00,
        "aprobada": false,
        "preguntas_normales": 5,
        "respuestas_correctas": 4,
        "ponderacion": 25.00
      }
    ],
    "estadisticas": {
      "total_secciones": 4,
      "secciones_aprobadas": 3,
      "secciones_reprobadas": 1
    },
    "configuracion": {
      "criterio_aprobacion": "Porcentaje mínimo por sección definido en p_minimo_aprobacion"
    }
  }
}
```

## Consideraciones Importantes

### 1. Precedencia de Criterios
1. **Preguntas Trampa**: Mayor prioridad - Si falla 2+ preguntas trampa, reprueba inmediatamente
2. **Secciones Insuficientes**: Segunda prioridad - Si alguna sección no cumple el mínimo
3. **Porcentaje Global**: Última prioridad - Criterio general de aprobación

### 2. Aplicabilidad
- **Evaluaciones de Personal**: ✅ Aplica el sistema de porcentaje mínimo por sección
- **Evaluaciones de Equipo**: ❌ Usa cálculo simple global
- **Evaluaciones de Operación**: ❌ Usa cálculo simple global

### 3. Flexibilidad
- Cada sección puede tener un porcentaje mínimo diferente
- Se puede ajustar según la importancia de la sección
- Compatible con el sistema de ponderación existente

## Ejemplos de Uso

### Configuración Recomendada

```sql
-- Secciones críticas (requieren excelencia)
UPDATE secciones_evaluacion 
SET p_minimo_aprobacion = 95.00 
WHERE nombre LIKE '%Seguridad%';

-- Secciones importantes (requieren dominio)
UPDATE secciones_evaluacion 
SET p_minimo_aprobacion = 90.00 
WHERE nombre LIKE '%Técnico%';

-- Secciones generales (requieren competencia)
UPDATE secciones_evaluacion 
SET p_minimo_aprobacion = 80.00 
WHERE nombre LIKE '%Administrativo%';
```

### Monitoreo y Reportes

```sql
-- Ver estadísticas de secciones reprobadas
SELECT 
    se.nombre as seccion_nombre,
    se.p_minimo_aprobacion,
    COUNT(*) as total_evaluaciones,
    SUM(CASE WHEN calcular_porcentaje_seccion(e.id, se.id) < se.p_minimo_aprobacion THEN 1 ELSE 0 END) as secciones_reprobadas
FROM secciones_evaluacion se
JOIN evaluaciones e ON se.tipo_evaluacion_id = e.tipo_evaluacion_id
WHERE se.activo = 1
GROUP BY se.id, se.nombre, se.p_minimo_aprobacion;
```

## Migración y Compatibilidad

### Retrocompatibilidad
- Evaluaciones existentes no se ven afectadas
- Valor por defecto de 90% para secciones sin configurar
- Sistema opcional - puede desactivarse estableciendo p_minimo_aprobacion = 0

### Migración de Datos
```sql
-- Ejecutar migración
SOURCE database/migrations/add_p_minimo_aprobacion.sql;

-- Verificar migración
SELECT COUNT(*) FROM secciones_evaluacion WHERE p_minimo_aprobacion IS NOT NULL;
```
