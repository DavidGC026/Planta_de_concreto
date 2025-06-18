# Guía de Deploy - IMCYC como Subpágina

## 📋 Requisitos Previos

- Acceso FTP/SFTP al servidor
- MySQL configurado en el servidor
- PHP 8.0+ habilitado
- Carpeta en `/public_html/` o similar donde puedas subir archivos

## 🚀 Pasos de Instalación

### 1. Preparar la Base de Datos

Conecta a tu MySQL y ejecuta los scripts en este orden:

```sql
-- 1. Ejecutar el esquema principal
-- Contenido del archivo: supabase/migrations/20250618155541_spring_shadow.sql

-- 2. Ejecutar las mejoras de selección múltiple  
-- Contenido del archivo: supabase/migrations/20250618161300_sweet_torch.sql

-- 3. Ejecutar configuración de producción
-- Contenido del archivo: supabase/migrations/20250618161701_azure_flower.sql
```

### 2. Configurar la API PHP

#### A. Crear estructura de carpetas en tu servidor:
```
public_html/
├── imcyc/                    # Carpeta principal de tu subpágina
│   ├── index.html           # Frontend construido
│   ├── assets/              # Archivos CSS/JS
│   ├── api/                 # Backend PHP
│   │   ├── config/
│   │   ├── auth/
│   │   ├── evaluaciones/
│   │   └── reportes/
│   └── .htaccess           # Configuración de reescritura
```

#### B. Subir archivos de la API
Sube todo el contenido de la carpeta `api/` a `public_html/imcyc/api/`

#### C. Configurar la base de datos
Edita el archivo `public_html/imcyc/api/config/database.php`:

```php
<?php
class Database {
    // Configuración para tu servidor
    private $host = 'localhost';  // o la IP de tu MySQL
    private $db_name = 'imcyc_evaluaciones';
    private $username = 'tu_usuario_mysql';
    private $password = 'tu_contraseña_mysql';
    private $charset = 'utf8mb4';
    // ... resto del código sin cambios
}
?>
```

### 3. Configurar el Frontend

#### A. Modificar la configuración de la API
Antes de construir, necesitas ajustar la URL base de la API.

Edita `src/services/api.js`:

```javascript
// Cambiar esta línea:
const API_BASE_URL = '/api';

// Por esta (ajusta la ruta según tu subpágina):
const API_BASE_URL = '/imcyc/api';
```

#### B. Construir la aplicación
```bash
npm run build
```

#### C. Subir el frontend
Sube todo el contenido de la carpeta `dist/` a `public_html/imcyc/`

### 4. Configurar .htaccess para la Subpágina

Crea el archivo `public_html/imcyc/.htaccess`:

```apache
# Configuración para subpágina IMCYC
RewriteEngine On
RewriteBase /imcyc/

# Configuración CORS para la API
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# Manejar preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Rutas de la API
RewriteRule ^api/login/?$ api/auth/login.php [L,QSA]
RewriteRule ^api/evaluaciones/tipos/?$ api/evaluaciones/tipos.php [L,QSA]
RewriteRule ^api/evaluaciones/roles/?$ api/evaluaciones/roles.php [L,QSA]
RewriteRule ^api/evaluaciones/preguntas/?$ api/evaluaciones/preguntas.php [L,QSA]
RewriteRule ^api/evaluaciones/guardar/?$ api/evaluaciones/guardar.php [L,QSA]
RewriteRule ^api/evaluaciones/historial/?$ api/evaluaciones/historial.php [L,QSA]
RewriteRule ^api/reportes/generar/?$ api/reportes/generar.php [L,QSA]

# Configuración para SPA (Single Page Application)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/imcyc/api/
RewriteRule ^(.*)$ index.html [L]

# Seguridad - Ocultar archivos sensibles
<Files "*.sql">
    Order deny,allow
    Deny from all
</Files>

<Files "database.php">
    Order deny,allow
    Deny from all
</Files>

# Configuración de compresión (si está disponible)
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Configuración de caché
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>
```

### 5. Verificar Permisos

Asegúrate de que los permisos sean correctos:
- Carpetas: 755
- Archivos PHP: 644
- Archivo de configuración de BD: 600 (si es posible)

### 6. Probar la Instalación

#### A. Verificar la API
Visita: `https://tu-dominio.com/imcyc/api/evaluaciones/tipos`
Deberías ver una respuesta JSON con los tipos de evaluación.

#### B. Verificar el Frontend
Visita: `https://tu-dominio.com/imcyc/`
Deberías ver la pantalla de login de IMCYC.

#### C. Probar el login
- Usuario: `admin`
- Contraseña: `admin123`

## 🔧 Solución de Problemas Comunes

### Error 500 - Internal Server Error
1. Verifica los logs de error de Apache
2. Revisa que PHP esté habilitado
3. Verifica permisos de archivos
4. Comprueba la configuración de la base de datos

### Error de CORS
1. Verifica que mod_headers esté habilitado
2. Asegúrate de que el .htaccess esté en la carpeta correcta
3. Revisa que la configuración CORS esté aplicándose

### Error de conexión a la base de datos
1. Verifica las credenciales en `api/config/database.php`
2. Asegúrate de que MySQL esté ejecutándose
3. Verifica que el usuario tenga permisos en la base de datos

### Rutas no funcionan (404)
1. Verifica que mod_rewrite esté habilitado
2. Asegúrate de que el .htaccess esté configurado correctamente
3. Revisa que RewriteBase apunte a la carpeta correcta

## 📱 Acceso Final

Una vez completado el deploy:
- **URL**: `https://tu-dominio.com/imcyc/`
- **Usuario**: `admin`
- **Contraseña**: `admin123`

**⚠️ IMPORTANTE**: Cambia las credenciales por defecto inmediatamente.

## 🔐 Seguridad Adicional

1. **Cambiar contraseña del admin**:
```sql
UPDATE usuarios 
SET password_hash = PASSWORD('nueva_contraseña_segura') 
WHERE username = 'admin';
```

2. **Restringir acceso a archivos sensibles**:
El .htaccess ya incluye protección para archivos .sql y database.php

3. **Configurar HTTPS**:
Si tu servidor soporta SSL, asegúrate de que la aplicación se acceda vía HTTPS.

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de error de Apache
2. Verifica la configuración de PHP
3. Comprueba la conectividad a MySQL
4. Asegúrate de que todas las rutas sean correctas