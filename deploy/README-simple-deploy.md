# Deploy Simple para IMCYC en Debian

Esta guía te permite desplegar IMCYC en cualquier máquina virtual Debian con Apache2 y MySQL ya instalados, sin necesidad de modificar configuraciones del servidor.

## 📋 Requisitos Previos

- Debian/Ubuntu con Apache2 y MySQL instalados
- Acceso sudo
- Node.js y npm (para construir el frontend)
- Usuario root de MySQL

## 🚀 Instalación Rápida

### 1. Preparar el proyecto
```bash
# Clonar o descargar el proyecto IMCYC
cd /ruta/al/proyecto/imcyc

# Instalar dependencias
npm install
```

### 2. Ejecutar el deploy
```bash
# Hacer ejecutable el script
chmod +x deploy/simple-deploy.sh

# Ejecutar deploy
sudo ./deploy/simple-deploy.sh
```

El script te pedirá:
- Usuario root de MySQL
- Contraseña root de MySQL  
- Nueva contraseña para el usuario `imcyc_user`

### 3. Verificar instalación
```bash
# Ejecutar verificación
chmod +x deploy/verify-deployment.sh
./deploy/verify-deployment.sh
```

## 📱 Acceso a la Aplicación

Una vez completado el deploy:

- **URL**: `http://localhost/imcyc/` o `http://tu-ip/imcyc/`
- **Usuario**: `admin`
- **Contraseña**: `admin123`

## 🔧 Lo que hace el script

1. **Construye el frontend** con `npm run build`
2. **Configura la base de datos**:
   - Crea la base de datos `imcyc_evaluaciones`
   - Crea el usuario `imcyc_user`
   - Importa el esquema completo
3. **Despliega los archivos**:
   - Frontend en `/var/www/html/imcyc/`
   - API PHP en `/var/www/html/imcyc/api/`
4. **Configura permisos** para Apache
5. **Crea .htaccess** básicos para routing

## 🗂️ Estructura después del deploy

```
/var/www/html/imcyc/
├── index.html              # Frontend React
├── assets/                 # CSS, JS, imágenes
├── api/                    # Backend PHP
│   ├── config/
│   │   └── database.php    # Configuración de BD
│   ├── auth/
│   ├── evaluaciones/
│   └── reportes/
└── .htaccess              # Configuración Apache
```

## 🧪 Verificación Manual

### Verificar API
```bash
curl http://localhost/imcyc/api/evaluaciones/tipos
```

Debe devolver:
```json
{
  "success": true,
  "data": [...]
}
```

### Verificar Frontend
Abre `http://localhost/imcyc/` en tu navegador y deberías ver la pantalla de login.

### Verificar Base de Datos
```bash
mysql -u imcyc_user -p
USE imcyc_evaluaciones;
SHOW TABLES;
```

## 🔧 Solución de Problemas

### Error 500 en la API
```bash
# Verificar logs de Apache
sudo tail -f /var/log/apache2/error.log

# Verificar permisos
sudo chown -R www-data:www-data /var/www/html/imcyc
```

### Error de conexión a BD
```bash
# Verificar configuración
sudo nano /var/www/html/imcyc/api/config/database.php

# Probar conexión
mysql -u imcyc_user -p imcyc_evaluaciones
```

### Frontend no carga
```bash
# Verificar que mod_rewrite esté habilitado
sudo a2enmod rewrite
sudo systemctl reload apache2
```

## 📝 Notas Importantes

- **Seguridad**: Este deploy es básico, sin configuraciones de seguridad avanzadas
- **Contraseña**: Cambiar la contraseña por defecto (`admin123`) inmediatamente
- **Permisos**: Los archivos pertenecen a `www-data` para que Apache pueda accederlos
- **Base de datos**: Se crea con el usuario `imcyc_user` con permisos completos

## 🔄 Actualizar la Aplicación

Para actualizar:
```bash
# Hacer cambios en el código
# Ejecutar nuevamente el deploy
sudo ./deploy/simple-deploy.sh
```

El script sobrescribirá los archivos pero mantendrá la configuración de la base de datos.