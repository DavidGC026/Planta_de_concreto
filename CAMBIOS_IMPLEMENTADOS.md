# Cambios Implementados: Sistema de Porcentaje Mínimo de Aprobación por Sección

## Fecha: 2025-01-18

## Resumen
Se implementó un sistema de porcentaje mínimo de aprobación por sección que permite establecer criterios específicos de aprobación para cada sección de la evaluación. Esto significa que cada sección debe cumplir con un porcentaje mínimo individual para que la evaluación sea considerada aprobada.

## Cambios Realizados

### 1. Base de Datos
- ✅ **Agregada columna `p_minimo_aprobacion`** a la tabla `secciones_evaluacion`
  - Tipo: `DECIMAL(5,2)`
  - Valor por defecto: `90.00`
  - Comentario: "Porcentaje mínimo de aprobación de cuestionario individual por sección"

### 2. Migración
- ✅ **Archivo de migración**: `database/migrations/add_p_minimo_aprobacion.sql`
- ✅ **Migración ejecutada** en la base de datos `plantas_concreto`
- ✅ **Verificación**: 10 secciones activas con valor por defecto de 90.00%

### 3. Lógica de Evaluación
- ✅ **Actualizada API**: `api/evaluaciones/guardar.php`
- ✅ **Nueva lógica de cálculo**: Evaluación individual por sección
- ✅ **Nuevos criterios de reprobación**:
  - `REPROBADO POR SECCIONES INSUFICIENTES`: Si alguna sección no cumple el mínimo
  - `REPROBADO POR PREGUNTAS TRAMPA`: Si falla 2+ preguntas trampa
  - Criterios existentes mantienen su funcionalidad

### 4. Respuesta de API Mejorada
- ✅ **Nuevos campos en respuesta**:
  - `reprobado_por_secciones`: boolean
  - `secciones_reprobadas`: array con detalles de secciones que no cumplen el mínimo
  - `detalle_secciones`: array con información detallada de todas las secciones
  - `estadisticas.total_secciones`: número total de secciones
  - `estadisticas.secciones_aprobadas`: número de secciones aprobadas
  - `estadisticas.secciones_reprobadas`: número de secciones reprobadas
  - `configuracion.criterio_aprobacion`: descripción del criterio aplicado

### 5. Documentación
- ✅ **Documentación completa**: `docs/sistema_porcentaje_minimo_aprobacion.md`
- ✅ **Ejemplos de uso**: Casos prácticos y configuración
- ✅ **Guías de migración**: Instrucciones para implementación

## Ejemplo de Funcionamiento

### Caso: Sección "Conocimientos Técnicos"
```
- Total preguntas: 5
- Porcentaje mínimo: 90%
- Respuestas correctas: 4
- Porcentaje obtenido: 80%
- Resultado: ❌ REPROBADA (no alcanza el 90%)
```

### Respuesta de API
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
    ]
  }
}
```

## Configuración Actual

### Secciones Existentes
Todas las secciones activas tienen configurado el valor por defecto de 90.00%:

| ID | Nombre | Porcentaje Mínimo | Ponderación |
|----|--------|-------------------|-------------|
| 1001 | Conocimiento técnico y operativo | 90.00% | 15.00% |
| 1002 | Gestión de la producción | 90.00% | 20.00% |
| 1003 | Mantenimiento del equipo | 90.00% | 10.00% |
| 1004 | Gestión del personal | 90.00% | 10.00% |
| 1005 | Seguridad y cumplimiento normativo | 90.00% | 10.00% |
| 1006 | Control de calidad | 90.00% | 10.00% |
| 1007 | Documentación y control administrativo | 90.00% | 5.00% |
| 1008 | Mejora continua y enfoque a resultados | 90.00% | 7.50% |
| 1009 | Coordinación con logística y clientes | 90.00% | 5.00% |
| 1010 | Resolución de problemas | 90.00% | 7.50% |

## Personalización

### Ajustar Porcentaje por Sección
```sql
-- Secciones de seguridad requieren 95%
UPDATE secciones_evaluacion 
SET p_minimo_aprobacion = 95.00 
WHERE nombre LIKE '%Seguridad%';

-- Secciones administrativas requieren 80%
UPDATE secciones_evaluacion 
SET p_minimo_aprobacion = 80.00 
WHERE nombre LIKE '%Documentación%';
```

### Verificar Configuración
```sql
SELECT 
    id,
    nombre,
    p_minimo_aprobacion,
    ponderacion
FROM secciones_evaluacion 
WHERE activo = 1
ORDER BY p_minimo_aprobacion DESC;
```

## Compatibilidad

### ✅ Retrocompatibilidad
- Evaluaciones existentes no se ven afectadas
- Sistema opcional - puede desactivarse estableciendo `p_minimo_aprobacion = 0`
- Funciona solo para evaluaciones de tipo "personal"

### ✅ Aplicabilidad
- **Evaluaciones de Personal**: ✅ Aplica el sistema de porcentaje mínimo por sección
- **Evaluaciones de Equipo**: ❌ Usa cálculo simple global (sin cambios)
- **Evaluaciones de Operación**: ❌ Usa cálculo simple global (sin cambios)

## Logs y Debugging

### Información en Logs
```
=== CÁLCULO DE PUNTUACIÓN ===
Sección: Conocimientos Técnicos
  - Ponderación: 15.00%
  - Preguntas normales: 5
  - Respuestas correctas: 4
  - Porcentaje sección: 80.00%
  - Porcentaje mínimo requerido: 90.00%
  - Sección aprobada: NO
  - Contribución ponderada: 12.00

=== RESULTADO FINAL ===
Secciones reprobadas: 1
Detalles de secciones reprobadas: [{"seccion_nombre":"Conocimientos Técnicos"...}]
Resultado final: REPROBADO POR SECCIONES INSUFICIENTES
```

## Archivos Modificados

1. **Base de Datos**
   - Tabla `secciones_evaluacion` (nueva columna)

2. **Migración**
   - `database/migrations/add_p_minimo_aprobacion.sql`

3. **API**
   - `api/evaluaciones/guardar.php` (lógica actualizada)

4. **Documentación**
   - `docs/sistema_porcentaje_minimo_aprobacion.md`
   - `CAMBIOS_IMPLEMENTADOS.md`

## Próximos Pasos Sugeridos

1. **Configurar porcentajes específicos** según la importancia de cada sección
2. **Crear interfaz de administración** para ajustar porcentajes desde el frontend
3. **Implementar reportes** de secciones más problemáticas
4. **Agregar notificaciones** específicas para secciones reprobadas
5. **Considerar implementar** el sistema para evaluaciones de equipo si es necesario

## Validación

✅ **Migración ejecutada correctamente**
✅ **Lógica de evaluación actualizada**
✅ **Respuesta de API enriquecida**
✅ **Documentación completa**
✅ **Retrocompatibilidad mantenida**
✅ **Sistema funcional y listo para uso**
