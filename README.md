# IMCYC - Sistema de Evaluación de Plantas de Concreto

Sistema web para la evaluación de plantas de concreto del Instituto Mexicano del Cemento y del Concreto A.C.

## 🏗️ Arquitectura del Sistema

### Frontend
- **React 18** con Vite
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **Lucide React** para iconos

### Backend
- **PHP 8.0+** con APIs REST
- **MySQL 8.0+** como base de datos
- **Apache/Nginx** como servidor web

## 📋 Requisitos del Sistema

### Servidor Web
- PHP 8.0 o superior
- MySQL 8.0 o superior
- Apache 2.4+ o Nginx 1.18+
- Extensiones PHP requeridas:
  - PDO
  - PDO_MySQL
  - JSON
  - OpenSSL (para hashing de contraseñas)

### Desarrollo
- Node.js 18+
- npm o yarn

## 🚀 Instalación y Configuración

### 1. Configurar la Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar el script de creación
source database/schema.sql
```

### 2. Configurar el Backend (PHP)

```bash
# Copiar archivos de la API al servidor web
cp -r api/ /var/www/html/imcyc-api/

# Configurar permisos
chmod 755 /var/www/html/imcyc-api/
chmod 644 /var/www/html/imcyc-api/**/*.php
```

**Editar configuración de base de datos:**
```php
// api/config/database.php
private $host = 'localhost';
private $db_name = 'imcyc_evaluaciones';
private $username = 'tu_usuario_mysql';
private $password = 'tu_contraseña_mysql';
```

### 3. Configurar el Frontend

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Construir para producción
npm run build

# Copiar archivos al servidor web
cp -r dist/* /var/www/html/imcyc-frontend/
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **usuarios**: Gestión de usuarios del sistema
- **tipos_evaluacion**: Tipos de evaluación (Personal, Equipo, Operación)
- **roles_personal**: Roles específicos para evaluación de personal
- **secciones_evaluacion**: Secciones de cada tipo de evaluación
- **preguntas**: Preguntas específicas por sección
- **evaluaciones**: Evaluaciones realizadas
- **respuestas_evaluacion**: Respuestas individuales de cada evaluación
- **reportes**: Registro de reportes generados

### Datos Iniciales

El sistema incluye datos iniciales para:
- Tipos de evaluación predefinidos
- Roles de personal estándar
- Usuario administrador por defecto
- Preguntas de ejemplo para Jefe de Planta

## 🔌 API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión

### Evaluaciones
- `GET /api/evaluaciones/tipos` - Obtener tipos de evaluación
- `GET /api/evaluaciones/roles` - Obtener roles de personal
- `GET /api/evaluaciones/preguntas` - Obtener preguntas por tipo/rol
- `POST /api/evaluaciones/guardar` - Guardar evaluación completa
- `GET /api/evaluaciones/historial` - Obtener historial de evaluaciones

### Reportes
- `POST /api/reportes/generar` - Generar reporte de evaluación

## 🔧 Configuración de Producción

### Apache Virtual Host
```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /var/www/html/imcyc-frontend
    
    # API
    Alias /api /var/www/html/imcyc-api
    <Directory "/var/www/html/imcyc-api">
        AllowOverride All
        Require all granted
    </Directory>
    
    # Frontend
    <Directory "/var/www/html/imcyc-frontend">
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>
</VirtualHost>
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/html/imcyc-frontend;
    index index.html;

    # API
    location /api/ {
        alias /var/www/html/imcyc-api/;
        try_files $uri $uri/ @php;
    }
    
    location @php {
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/html/imcyc-api$fastcgi_script_name;
        include fastcgi_params;
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔐 Seguridad

### Configuraciones Recomendadas

1. **Cambiar credenciales por defecto**
2. **Usar HTTPS en producción**
3. **Configurar firewall para MySQL**
4. **Implementar rate limiting**
5. **Validar y sanitizar todas las entradas**

### Usuario Administrador por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin123`

**⚠️ IMPORTANTE: Cambiar estas credenciales inmediatamente en producción**

## 📊 Funcionalidades

### Tipos de Evaluación
1. **Evaluación de Personal**
   - Jefe de Planta
   - Laboratorista
   - Operador de Camión Revolvedor
   - Operador de Bombas de Concreto

2. **Evaluación de Equipo**
   - Estado de maquinaria
   - Mantenimiento preventivo
   - Seguridad industrial

3. **Evaluación de Operación**
   - Estado de equipos principales
   - Infraestructura y seguridad
   - Documentación y certificaciones

### Sistema de Puntuación
- **Respuesta SÍ**: 10 puntos
- **Respuesta NO**: 0 puntos
- **Respuesta N/A**: No cuenta para el total
- **Aprobación**: ≥ 70% de respuestas correctas

## 🚧 Desarrollo

### Comandos Útiles

```bash
# Desarrollo frontend
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

### Estructura de Archivos

```
├── api/                    # Backend PHP
│   ├── config/            # Configuración de BD
│   ├── auth/              # Autenticación
│   ├── evaluaciones/      # APIs de evaluaciones
│   └── reportes/          # APIs de reportes
├── database/              # Scripts de BD
│   └── schema.sql         # Esquema completo de BD
├── src/                   # Frontend React
│   ├── components/        # Componentes React
│   ├── services/          # Servicios de API
│   └── lib/              # Utilidades
└── public/               # Archivos estáticos
```

## 🔄 Flujo de Trabajo

1. **Login**: Usuario se autentica con credenciales
2. **Selección**: Elige tipo de evaluación
3. **Configuración**: Selecciona rol (si aplica)
4. **Evaluación**: Responde preguntas por secciones
5. **Resultados**: Ve puntuación y puede descargar reportes
6. **Almacenamiento**: Datos se guardan en MySQL

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a BD**: Verificar credenciales en `api/config/database.php`
2. **CORS errors**: Configurar headers en servidor web
3. **Permisos de archivos**: Verificar permisos 755/644
4. **API no responde**: Verificar configuración de rewrite rules

### Logs

- **PHP errors**: `/var/log/apache2/error.log` o `/var/log/nginx/error.log`
- **MySQL errors**: `/var/log/mysql/error.log`
- **Frontend errors**: Consola del navegador

## 📝 Licencia

© 2024 Instituto Mexicano del Cemento y del Concreto A.C. - Todos los derechos reservados.

## 🤝 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo de IMCYC.