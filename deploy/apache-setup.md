# Guía de Deploy para Apache - IMCYC Sistema de Evaluación

## 📋 Requisitos Previos

### Software Necesario
- **Apache 2.4+**
- **PHP 8.0+** con extensiones:
  - php-mysql
  - php-json
  - php-curl
  - php-mbstring
  - php-xml
- **MySQL 8.0+**
- **Certificado SSL** (recomendado para producción)

## 🚀 Pasos de Instalación

### 1. Preparar el Servidor

```bash
# Actualizar sistema (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Instalar Apache
sudo apt install apache2 -y

# Instalar PHP y extensiones
sudo apt install php8.1 php8.1-mysql php8.1-json php8.1-curl php8.1-mbstring php8.1-xml libapache2-mod-php8.1 -y

# Instalar MySQL
sudo apt install mysql-server -y

# Habilitar módulos de Apache necesarios
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
```

### 2. Configurar MySQL

```bash
# Configurar MySQL de forma segura
sudo mysql_secure_installation

# Conectar a MySQL
sudo mysql -u root -p

# Crear base de datos y usuario
CREATE DATABASE imcyc_evaluaciones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'imcyc_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura_aqui';
GRANT ALL PRIVILEGES ON imcyc_evaluaciones.* TO 'imcyc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar esquema de base de datos
mysql -u imcyc_user -p imcyc_evaluaciones < supabase/migrations/20250618155541_spring_shadow.sql
mysql -u imcyc_user -p imcyc_evaluaciones < supabase/migrations/20250618161300_sweet_torch.sql
mysql -u imcyc_user -p imcyc_evaluaciones < supabase/migrations/20250618161701_azure_flower.sql
```

### 3. Crear Directorios de la Aplicación

```bash
# Crear directorios
sudo mkdir -p /var/www/html/imcyc-frontend
sudo mkdir -p /var/www/html/imcyc-api
sudo mkdir -p /var/log/imcyc

# Configurar permisos
sudo chown -R www-data:www-data /var/www/html/imcyc-frontend
sudo chown -R www-data:www-data /var/www/html/imcyc-api
sudo chmod -R 755 /var/www/html/imcyc-frontend
sudo chmod -R 755 /var/www/html/imcyc-api
```

### 4. Construir y Copiar Frontend

```bash
# En tu máquina local, construir la aplicación
npm run build

# Copiar archivos al servidor (usando scp o rsync)
scp -r dist/* usuario@tu-servidor:/var/www/html/imcyc-frontend/

# O si tienes acceso directo al servidor
cp -r dist/* /var/www/html/imcyc-frontend/
```

### 5. Copiar y Configurar Backend

```bash
# Copiar archivos de la API
cp -r api/* /var/www/html/imcyc-api/

# Configurar permisos especiales para archivos sensibles
sudo chmod 600 /var/www/html/imcyc-api/config/database.php
```

### 6. Configurar Credenciales de Base de Datos

Edita el archivo `/var/www/html/imcyc-api/config/database.php`:

```php
<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'imcyc_evaluaciones';
    private $username = 'imcyc_user';
    private $password = 'tu_contraseña_segura_aqui'; // CAMBIAR
    private $charset = 'utf8mb4';
    // ... resto del código
}
?>
```

## ⚙️ Configuración de Apache

### Crear Virtual Host

Crea el archivo `/etc/apache2/sites-available/imcyc.conf`:

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    ServerAlias www.tu-dominio.com
    DocumentRoot /var/www/html/imcyc-frontend
    
    # Configuración para el frontend React
    <Directory "/var/www/html/imcyc-frontend">
        AllowOverride All
        Require all granted
        
        # Configuración para SPA (Single Page Application)
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API PHP
    Alias /api /var/www/html/imcyc-api
    <Directory "/var/www/html/imcyc-api">
        AllowOverride All
        Require all granted
        
        # Configuración PHP
        <FilesMatch \.php$>
            SetHandler "proxy:unix:/var/run/php/php8.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>
    
    # Configuración de seguridad
    <Files ".env">
        Order allow,deny
        Deny from all
    </Files>
    
    <Files "*.sql">
        Order allow,deny
        Deny from all
    </Files>
    
    # Configuración de compresión
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
        ExpiresByType image/ico "access plus 1 month"
        ExpiresByType image/icon "access plus 1 month"
        ExpiresByType text/html "access plus 1 hour"
    </IfModule>
    
    # Headers de seguridad
    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options nosniff
        Header always set X-Frame-Options DENY
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Referrer-Policy "strict-origin-when-cross-origin"
        
        # CORS para API
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    </IfModule>
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/imcyc_error.log
    CustomLog ${APACHE_LOG_DIR}/imcyc_access.log combined
</VirtualHost>
```

### Habilitar el Sitio

```bash
# Habilitar el sitio
sudo a2ensite imcyc.conf

# Deshabilitar sitio por defecto
sudo a2dissite 000-default.conf

# Reiniciar Apache
sudo systemctl restart apache2
```

## 🔒 Configuración HTTPS (Recomendado)

### Usando Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-apache -y

# Obtener certificado SSL
sudo certbot --apache -d tu-dominio.com -d www.tu-dominio.com

# El certificado se renovará automáticamente
```

### Configuración HTTPS Manual

Si tienes tu propio certificado, agrega esto a `/etc/apache2/sites-available/imcyc-ssl.conf`:

```apache
<VirtualHost *:443>
    ServerName tu-dominio.com
    ServerAlias www.tu-dominio.com
    DocumentRoot /var/www/html/imcyc-frontend
    
    # Certificados SSL
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/tu-dominio.com.crt
    SSLCertificateKeyFile /etc/ssl/private/tu-dominio.com.key
    SSLCertificateChainFile /etc/ssl/certs/ca-certificates.crt
    
    # Configuración SSL moderna
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off
    SSLSessionTickets off
    
    # Incluir la misma configuración del puerto 80
    Include /etc/apache2/sites-available/imcyc-common.conf
</VirtualHost>

# Redirección HTTP a HTTPS
<VirtualHost *:80>
    ServerName tu-dominio.com
    ServerAlias www.tu-dominio.com
    Redirect permanent / https://tu-dominio.com/
</VirtualHost>
```

## 🔧 Configuración de Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

## 📊 Monitoreo y Logs

### Ubicación de Logs
- **Apache Error**: `/var/log/apache2/imcyc_error.log`
- **Apache Access**: `/var/log/apache2/imcyc_access.log`
- **PHP Errors**: `/var/log/php8.1-fpm.log`
- **MySQL Errors**: `/var/log/mysql/error.log`

### Comandos Útiles de Monitoreo

```bash
# Ver logs en tiempo real
sudo tail -f /var/log/apache2/imcyc_error.log

# Estado de servicios
sudo systemctl status apache2
sudo systemctl status mysql
sudo systemctl status php8.1-fpm

# Verificar configuración de Apache
sudo apache2ctl configtest

# Recargar configuración sin reiniciar
sudo systemctl reload apache2
```

## 🔄 Script de Deploy Automatizado

Crea un script `/home/usuario/deploy-imcyc.sh`:

```bash
#!/bin/bash

# Script de deploy para IMCYC
set -e

echo "🚀 Iniciando deploy de IMCYC..."

# Backup de la versión actual
BACKUP_DIR="/var/backups/imcyc/$(date +%Y%m%d_%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"

if [ -d "/var/www/html/imcyc-frontend" ]; then
    sudo cp -r /var/www/html/imcyc-frontend "$BACKUP_DIR/"
fi

if [ -d "/var/www/html/imcyc-api" ]; then
    sudo cp -r /var/www/html/imcyc-api "$BACKUP_DIR/"
fi

# Construir frontend
echo "📦 Construyendo frontend..."
npm run build

# Deploy frontend
echo "🌐 Desplegando frontend..."
sudo rm -rf /var/www/html/imcyc-frontend/*
sudo cp -r dist/* /var/www/html/imcyc-frontend/

# Deploy API
echo "🔧 Desplegando API..."
sudo cp -r api/* /var/www/html/imcyc-api/

# Configurar permisos
echo "🔐 Configurando permisos..."
sudo chown -R www-data:www-data /var/www/html/imcyc-frontend
sudo chown -R www-data:www-data /var/www/html/imcyc-api
sudo chmod -R 755 /var/www/html/imcyc-frontend
sudo chmod -R 755 /var/www/html/imcyc-api
sudo chmod 600 /var/www/html/imcyc-api/config/database.php

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl reload apache2

echo "✅ Deploy completado exitosamente!"
echo "📁 Backup guardado en: $BACKUP_DIR"
```

```bash
# Hacer ejecutable el script
chmod +x /home/usuario/deploy-imcyc.sh
```

## 🧪 Verificación del Deploy

### 1. Verificar Frontend
```bash
curl -I http://tu-dominio.com
# Debe devolver 200 OK
```

### 2. Verificar API
```bash
curl -X GET http://tu-dominio.com/api/evaluaciones/tipos
# Debe devolver JSON con tipos de evaluación
```

### 3. Verificar Base de Datos
```bash
mysql -u imcyc_user -p -e "USE imcyc_evaluaciones; SHOW TABLES;"
# Debe mostrar todas las tablas del sistema
```

## 🚨 Solución de Problemas Comunes

### Error 500 - Internal Server Error
```bash
# Verificar logs de Apache
sudo tail -f /var/log/apache2/imcyc_error.log

# Verificar permisos
sudo chown -R www-data:www-data /var/www/html/imcyc-*
sudo chmod -R 755 /var/www/html/imcyc-*
```

### Error de Conexión a Base de Datos
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql

# Verificar credenciales en database.php
sudo nano /var/www/html/imcyc-api/config/database.php
```

### Problemas de CORS
```bash
# Verificar que mod_headers esté habilitado
sudo a2enmod headers
sudo systemctl restart apache2
```

## 📱 Acceso a la Aplicación

Una vez completado el deploy:

- **URL**: `https://tu-dominio.com`
- **Usuario por defecto**: `admin`
- **Contraseña por defecto**: `admin123`

**⚠️ IMPORTANTE**: Cambiar las credenciales por defecto inmediatamente en producción.

## 🔐 Seguridad Adicional

### Cambiar Contraseña del Usuario Admin

```sql
-- Conectar a MySQL
mysql -u imcyc_user -p imcyc_evaluaciones

-- Cambiar contraseña (reemplazar 'nueva_contraseña_segura')
UPDATE usuarios 
SET password_hash = '$2y$10$nueva_hash_aqui' 
WHERE username = 'admin';
```

### Configurar Backup Automático

```bash
# Agregar a crontab
crontab -e

# Backup diario a las 2 AM
0 2 * * * /usr/local/bin/backup-imcyc.sh
```

¡Tu aplicación IMCYC estará lista para producción siguiendo esta guía! 🎉