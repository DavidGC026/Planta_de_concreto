# Sistema de Progreso para Evaluación de Equipo

Este sistema permite guardar y recuperar el progreso de las evaluaciones de equipo, manteniendo el estado de las secciones y subsecciones completadas entre sesiones.

## 📊 Estructura de Base de Datos

### Tablas Principales

1. **`progreso_secciones_equipo`**
   - Almacena el progreso de las secciones principales
   - Incluye información de completado, puntajes y estadísticas
   - Clave única por usuario, tipo de planta y sección

2. **`progreso_subsecciones_equipo`**
   - Almacena el progreso detallado de cada subsección
   - Se relaciona con la tabla de secciones
   - Permite rastreo granular del progreso

### Procedimientos Almacenados

1. **`MarcarSeccionEquipoCompletada`**
   - Marca una sección completa como terminada
   - Actualiza puntajes y estadísticas

2. **`MarcarSubseccionEquipoCompletada`**
   - Marca una subsección como completada
   - Actualiza automáticamente el progreso de la sección padre
   - Marca la sección como completada si todas las subsecciones están terminadas

3. **`ObtenerProgresoEquipoUsuario`**
   - Recupera todo el progreso de un usuario para un tipo de planta
   - Incluye detalles de secciones y subsecciones

4. **`LimpiarProgresoEquipoUsuario`**
   - Limpia todo el progreso de un usuario (útil para testing)

### Vista

- **`vista_progreso_equipo_usuario`**: Vista consolidada del progreso con información detallada

## 🔌 API Endpoints

### GET `/api/evaluaciones/progreso-equipo`
Obtiene el progreso de un usuario para un tipo de planta específico.

**Parámetros:**
- `usuario_id`: ID del usuario
- `tipo_planta`: Tipo de planta (pequena, mediana, grande)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "usuario_id": 1,
    "tipo_planta": "mediana",
    "secciones": [
      {
        "seccion_id": 1014,
        "seccion_nombre": "Producción y Mezclado",
        "completada": true,
        "puntaje_obtenido": 85.5,
        "puntaje_porcentaje": 85.5,
        "total_subsecciones": 6,
        "subsecciones_completadas": 6,
        "respuestas_correctas": 102,
        "total_preguntas": 120,
        "fecha_completada": "2024-01-15 14:30:00",
        "subsecciones": [
          {
            "subseccion_id": 1,
            "nombre": "Mezcladora Principal",
            "completada": true,
            "puntaje_porcentaje": 90.0
          }
        ]
      }
    ],
    "total_secciones": 6,
    "secciones_completadas": 1
  }
}
```

### POST `/api/evaluaciones/progreso-equipo`
Guarda el progreso de una sección o subsección.

**Para subsección:**
```json
{
  "usuario_id": 1,
  "tipo_planta": "mediana",
  "tipo_progreso": "subseccion",
  "seccion_id": 1014,
  "subseccion_id": 1,
  "subseccion_nombre": "Mezcladora Principal",
  "puntaje_obtenido": 85.5,
  "puntaje_porcentaje": 85.5,
  "respuestas_correctas": 17,
  "total_preguntas": 20
}
```

**Para sección completa:**
```json
{
  "usuario_id": 1,
  "tipo_planta": "mediana",
  "tipo_progreso": "seccion",
  "seccion_id": 1014,
  "seccion_nombre": "Producción y Mezclado",
  "puntaje_obtenido": 85.5,
  "puntaje_porcentaje": 85.5,
  "total_subsecciones": 6,
  "subsecciones_completadas": 6,
  "respuestas_correctas": 102,
  "total_preguntas": 120
}
```

### DELETE `/api/evaluaciones/progreso-equipo`
Limpia todo el progreso de un usuario para un tipo de planta.

**Parámetros:**
- `usuario_id`: ID del usuario
- `tipo_planta`: Tipo de planta

## 🛠️ Servicio Frontend

El archivo `equipmentProgressService.js` proporciona una interfaz JavaScript para interactuar con la API:

```javascript
import equipmentProgressService from '@/services/equipmentProgressService';

// Obtener progreso
const progress = await equipmentProgressService.getProgress(userId, plantType);

// Guardar progreso de subsección
await equipmentProgressService.saveSubsectionProgress({
  usuario_id: 1,
  tipo_planta: 'mediana',
  seccion_id: 1014,
  subseccion_id: 1,
  subseccion_nombre: 'Mezcladora Principal',
  puntaje_obtenido: 85.5,
  puntaje_porcentaje: 85.5,
  respuestas_correctas: 17,
  total_preguntas: 20
});

// Verificar si una sección está completada
const isCompleted = equipmentProgressService.isSectionCompleted(progress, 1014);
```

## 🚀 Instalación

1. **Ejecutar la migración:**
   ```sql
   SOURCE database/migrations/add_equipment_section_progress.sql;
   ```

2. **Actualizar el .htaccess:**
   El archivo ya incluye la nueva ruta para el progreso de equipo.

3. **Integrar en el frontend:**
   El servicio está listo para usar en los componentes de React.

## 🧪 Testing

Para probar el sistema:

```sql
-- Marcar una subsección como completada
CALL MarcarSubseccionEquipoCompletada(
    1, 'mediana', 1014, 1, 'Mezcladora Principal', 
    85.50, 85.50, 17, 20
);

-- Ver el progreso
CALL ObtenerProgresoEquipoUsuario(1, 'mediana');

-- Limpiar progreso para testing
CALL LimpiarProgresoEquipoUsuario(1, 'mediana');
```

## 📝 Notas Importantes

- El sistema mantiene automáticamente la consistencia entre secciones y subsecciones
- Una sección se marca como completada automáticamente cuando todas sus subsecciones están terminadas
- Los puntajes de sección se calculan como promedio de las subsecciones completadas
- El sistema es específico para evaluaciones de equipo y no interfiere con otros tipos de evaluación