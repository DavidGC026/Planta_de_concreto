# API de Gestión de Estado de Exámenes

Esta API permite gestionar el sistema de bloqueo y desbloqueo de exámenes controlado por el jefe de planta y administradores.

## Endpoints Disponibles

### 1. Obtener Estado de Todos los Usuarios
**GET** `/gestion_estado_examenes.php/usuarios`

Retorna el estado de exámenes de todos los usuarios.

**Respuesta exitosa:**
```json
{
    "success": true,
    "data": [
        {
            "usuario_id": 1,
            "nombre_usuario": "Juan Pérez",
            "email": "juan@ejemplo.com",
            "estado": "desbloqueado",
            "motivo": "Estado inicial",
            "fecha_cambio": "2024-01-15 10:30:00",
            "nombre_quien_cambio": "Sistema"
        }
    ],
    "message": "Estado de exámenes obtenido exitosamente"
}
```

### 2. Obtener Estado de un Usuario Específico
**GET** `/gestion_estado_examenes.php/usuario/{usuario_id}`

Retorna el estado de exámenes de un usuario específico.

**Parámetros:**
- `usuario_id`: ID del usuario (en la URL)

**Respuesta exitosa:**
```json
{
    "success": true,
    "data": {
        "usuario_id": 1,
        "nombre_usuario": "Juan Pérez",
        "email": "juan@ejemplo.com",
        "estado": "desbloqueado",
        "motivo": "Estado inicial",
        "fecha_cambio": "2024-01-15 10:30:00",
        "nombre_quien_cambio": "Sistema"
    },
    "message": "Estado de examen obtenido exitosamente"
}
```

### 3. Bloquear Examen de un Usuario
**POST** `/gestion_estado_examenes.php/bloquear`

Bloquea el acceso a exámenes de un usuario específico.

**Cuerpo de la petición:**
```json
{
    "usuario_id": 1,
    "motivo": "Incumplimiento de normas de seguridad",
    "bloqueado_por_usuario_id": 2
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Examen bloqueado exitosamente"
}
```

### 4. Desbloquear Examen de un Usuario
**POST** `/gestion_estado_examenes.php/desbloquear`

Desbloquea el acceso a exámenes de un usuario específico.

**Cuerpo de la petición:**
```json
{
    "usuario_id": 1,
    "motivo": "Completó capacitación adicional",
    "desbloqueado_por_usuario_id": 2
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Examen desbloqueado exitosamente"
}
```

### 5. Obtener Historial General
**GET** `/gestion_estado_examenes.php/historial`

Retorna el historial de cambios de estado de todos los usuarios (últimos 100 registros).

**Respuesta exitosa:**
```json
{
    "success": true,
    "data": [
        {
            "historial_id": 1,
            "usuario_id": 1,
            "nombre_usuario": "Juan Pérez",
            "accion": "bloqueado",
            "motivo": "Incumplimiento de normas",
            "fecha_accion": "2024-01-15 14:30:00",
            "nombre_quien_cambio": "María García"
        }
    ],
    "message": "Historial obtenido exitosamente"
}
```

### 6. Obtener Historial de un Usuario Específico
**GET** `/gestion_estado_examenes.php/historial/{usuario_id}`

Retorna el historial de cambios de estado de un usuario específico.

**Parámetros:**
- `usuario_id`: ID del usuario (en la URL)

**Respuesta exitosa:**
```json
{
    "success": true,
    "data": [
        {
            "historial_id": 1,
            "usuario_id": 1,
            "nombre_usuario": "Juan Pérez",
            "accion": "bloqueado",
            "motivo": "Incumplimiento de normas",
            "fecha_accion": "2024-01-15 14:30:00",
            "nombre_quien_cambio": "María García"
        }
    ],
    "message": "Historial obtenido exitosamente"
}
```

### 7. Verificar Acceso a Exámenes
**GET** `/gestion_estado_examenes.php/verificar/{usuario_id}`

Verifica si un usuario puede realizar exámenes actualmente.

**Parámetros:**
- `usuario_id`: ID del usuario (en la URL)

**Respuesta exitosa:**
```json
{
    "success": true,
    "data": {
        "usuario_id": 1,
        "puede_realizar_examenes": true
    },
    "message": "Verificación realizada exitosamente"
}
```

## Códigos de Respuesta HTTP

- **200**: Operación exitosa
- **400**: Error en la petición (datos inválidos, permisos insuficientes, etc.)
- **500**: Error interno del servidor

## Respuestas de Error

Todas las respuestas de error siguen el siguiente formato:

```json
{
    "success": false,
    "error": "Descripción del error"
}
```

## Permisos Requeridos

Para usar los endpoints de bloqueo y desbloqueo, el usuario debe tener uno de los siguientes permisos:
- Permiso de administrador (admin)
- Permiso de jefe de planta (jefe_planta)

## Notas de Implementación

1. **Seguridad**: Todos los endpoints verifican permisos antes de ejecutar acciones.
2. **Auditoría**: Todas las acciones de bloqueo/desbloqueo se registran en el historial.
3. **Validación**: Se validan todos los parámetros requeridos antes de procesar las peticiones.
4. **CORS**: La API está configurada para aceptar peticiones desde cualquier origen.

## Ejemplos de Uso

### Bloquear un usuario usando cURL:
```bash
curl -X POST "http://localhost/api/gestion_estado_examenes.php/bloquear" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "motivo": "Incumplimiento de normas de seguridad",
    "bloqueado_por_usuario_id": 2
  }'
```

### Verificar estado de un usuario:
```bash
curl -X GET "http://localhost/api/gestion_estado_examenes.php/verificar/1"
```

### Obtener historial de un usuario:
```bash
curl -X GET "http://localhost/api/gestion_estado_examenes.php/historial/1"
```
