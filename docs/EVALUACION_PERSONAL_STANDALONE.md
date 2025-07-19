# Evaluación de Personal - Componente Independiente

## 📋 Descripción

El componente `PersonalEvaluationStandalone` es una página independiente para realizar evaluaciones de personal sin necesidad de inicio de sesión. Los datos del usuario se obtienen a través de un embed de otra página.

## 🎯 Características

- ✅ **Sin inicio de sesión**: No requiere autenticación previa
- ✅ **Datos por embed**: Recibe información del usuario desde otra página
- ✅ **Roles dinámicos**: Carga roles desde la base de datos
- ✅ **Ponderación por secciones**: Sistema de evaluación con pesos específicos
- ✅ **Interfaz completa**: Selección de roles, evaluación y resultados
- ✅ **Gráficos interactivos**: Visualización de resultados con radar charts
- ✅ **Responsive**: Adaptable a diferentes tamaños de pantalla

## 📁 Archivos Creados

### 1. Componente Principal
- **Archivo**: `src/components/EvaluationPersonalPage.jsx`
- **Función**: Componente React completo con toda la lógica de evaluación

### 2. Página de Demostración
- **Archivo**: `public/evaluacion-personal.html`
- **Función**: Página HTML de ejemplo mostrando cómo implementar el componente

### 3. Documentación
- **Archivo**: `docs/EVALUACION_PERSONAL_STANDALONE.md`
- **Función**: Documentación completa del componente

## 🔧 Uso del Componente

### Importación y Uso Básico

```jsx
import PersonalEvaluationStandalone from './components/EvaluationPersonalPage';

// Datos del usuario embebido
const embedUser = {
    id: 123,
    nombre: "Juan Pérez",
    username: "jperez",
    email: "juan.perez@empresa.com"
};

// Implementación
function App() {
    return (
        <div>
            <PersonalEvaluationStandalone embedUser={embedUser} />
        </div>
    );
}
```

### Estructura del Objeto embedUser

```javascript
const embedUser = {
    id: number,           // ID único del usuario (requerido)
    nombre: string,       // Nombre completo (opcional)
    username: string,     // Nombre de usuario (opcional)
    email: string         // Correo electrónico (opcional)
};
```

## 🗄️ Base de Datos

### Tablas Utilizadas

#### 1. roles_personal
```sql
CREATE TABLE roles_personal (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Datos de ejemplo:**
- `jefe_planta` - Jefe de Planta
- `laboratorista` - Laboratorista
- `operador_camion` - Operador de Camión Revolvedor
- `operador_bombas` - Operador de Bombas de Concreto

#### 2. secciones_evaluacion
```sql
CREATE TABLE secciones_evaluacion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_evaluacion_id INT NOT NULL,
    rol_personal_id INT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 1,
    ponderacion DECIMAL(5,2) DEFAULT 0.00,
    p_minimo_aprobacion DECIMAL(5,2) DEFAULT 90.00,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Secciones de ejemplo:**
- Conocimiento técnico y operativo (15%)
- Gestión de la producción (20%)
- Mantenimiento del equipo (10%)
- Gestión del personal (10%)
- Seguridad y cumplimiento normativo (10%)

#### 3. preguntas
```sql
CREATE TABLE preguntas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seccion_id INT NOT NULL,
    pregunta TEXT NOT NULL,
    tipo_pregunta ENUM('abierta', 'seleccion_multiple') DEFAULT 'abierta',
    es_trampa TINYINT(1) DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Funcionalidades

### 1. Selección de Roles
- Muestra roles disponibles para el usuario
- Interfaz visual con tarjetas animadas
- Información del usuario embebido

### 2. Evaluación por Secciones
- Navegación secuencial por secciones
- Preguntas tipo Sí/No/No Aplica
- Barra de progreso visual
- Validación de respuestas completas

### 3. Resultados
- Gráfico radar con anillos de color
- Sistema de calificación personalizado para personal (≥91% aprobado)
- Estadísticas detalladas por sección
- Opción de nueva evaluación

## 📊 Sistema de Calificación

### Escala de Colores para Personal
- 🔴 **Rojo (0-90%)**: Reprobado
- 🟢 **Verde (91-100%)**: Aprobado

### Cálculo de Puntuación
1. Cada respuesta "Sí" = 10 puntos
2. Cada respuesta "No" = 0 puntos
3. Cada respuesta "No Aplica" = 0 puntos
4. Puntuación final = (Respuestas correctas / Total preguntas) × 100

## 🔄 Flujo de la Aplicación

1. **Inicialización**: Se carga con datos del usuario embebido
2. **Selección de Rol**: Usuario selecciona el rol a evaluar
3. **Carga de Datos**: Se obtienen las secciones y preguntas
4. **Evaluación**: Usuario responde preguntas por sección
5. **Cálculo**: Se procesa la puntuación con ponderación
6. **Resultados**: Se muestran los resultados con gráficos

## 🚀 Implementación en Producción

### Paso 1: Integración con Base de Datos Real

Reemplazar la función `createStandaloneApiService` por llamadas reales a la API:

```javascript
// Reemplazar estas funciones simuladas con llamadas reales
const apiService = {
    getUserAllowedRoles: async (userId) => {
        const response = await fetch(`/api/users/${userId}/roles`);
        return await response.json();
    },
    
    getPreguntas: async (params) => {
        const response = await fetch(`/api/evaluaciones/preguntas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return await response.json();
    },
    
    guardarEvaluacion: async (evaluacionData) => {
        const response = await fetch('/api/evaluaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(evaluacionData)
        });
        return await response.json();
    }
};
```

### Paso 2: Configuración del Embed

```html
<!-- Página padre -->
<iframe 
    src="https://tu-dominio.com/evaluacion-personal" 
    width="100%" 
    height="800"
    frameborder="0">
</iframe>

<script>
// Enviar datos del usuario al iframe
const iframe = document.querySelector('iframe');
iframe.onload = function() {
    iframe.contentWindow.postMessage({
        type: 'USER_DATA',
        user: {
            id: 123,
            nombre: "Juan Pérez",
            username: "jperez",
            email: "juan.perez@empresa.com"
        }
    }, '*');
};
</script>
```

## 📱 Responsive Design

El componente está diseñado para funcionar en:
- 📱 Móviles (320px+)
- 📱 Tabletas (768px+)
- 💻 Escritorio (1024px+)

## 🔒 Seguridad

- Validación de datos del usuario embebido
- Sanitización de respuestas
- Protección contra inyección de código
- Validación de permisos por rol

## 🎯 Próximos Pasos

1. **Conectar con API real**: Reemplazar datos simulados
2. **Implementar autenticación**: Validar token del usuario embebido
3. **Añadir analytics**: Seguimiento de uso y estadísticas
4. **Optimizar rendimiento**: Lazy loading y cache
5. **Añadir más tipos de pregunta**: Selección múltiple, escalas, etc.

---

## 📞 Soporte

Para dudas o soporte técnico, contactar al equipo de desarrollo.

**© 2024 IMCYC - Instituto Mexicano del Cemento y del Concreto A.C.**
