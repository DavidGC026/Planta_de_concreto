# Guía de Despliegue - IMCYC Sistema de Evaluación

## 📋 Requisitos del Servidor

### Sistema Operativo
- Debian 11/12 o Ubuntu 20.04/22.04 LTS
- Mínimo 2GB RAM, 20GB disco
- Acceso root o sudo

### Software Requerido
- Apache 2.4+ o Nginx 1.18+
- PHP 8.1+
- MySQL 8.0+
- Certificado SSL (recomendado)

## 🚀 Instalación Paso a Paso

### 1. Preparar el Servidor

```bash
# Ejecutar como root
sudo bash deploy/install.sh
```

### 2. Configurar la Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar script de configuración
source deploy/database-setup.sql

# Importar esquema completo
source supabase/migrations/20250618155541_spring_shadow.sql
source supabase/migrations/20250618161300_sweet_torch.sql
```

### 3. Configurar Credenciales

Editar `/var/www/html/imcyc-api/config/database.php`:

```php
private $host = 'localhost';
private $db_name = 'imcyc_evaluaciones';
private $username = 'imcyc_user';
private $password = 'TU_CONTRASEÑA_SEGURA'; // CAMBIAR
```

### 4. Configurar Servidor Web

#### Para Apache:
```bash
# Copiar configuración
cp deploy/apache-vhost.conf /etc/apache2/sites-available/imcyc.conf

# Editar dominio en el archivo
nano /etc/apache2/sites-available/imcyc.conf

# Habilitar sitio
a2ensite imcyc.conf
a2dissite 000-default.conf
systemctl reload apache2
```

#### Para Nginx:
```bash
# Copiar configuración
cp deploy/nginx.conf /etc/nginx/sites-available/imcyc

# Editar dominio en el archivo
nano /etc/nginx/sites-available/imcyc

# Habilitar sitio
ln -s /etc/nginx/sites-available/imcyc /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl reload nginx
```

### 5. Desplegar Aplicación

```bash
# Construir aplicación
npm run build

# Desplegar
sudo bash deploy/deploy.sh
```

## 🔒 Configuración de Seguridad

### 1. Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. SSL con Let's Encrypt
```bash
# Instalar Certbot
apt install certbot python3-certbot-apache  # Para Apache
# o
apt install certbot python3-certbot-nginx   # Para Nginx

# Obtener certificado
certbot --apache -d tu-dominio.com          # Para Apache
# o
certbot --nginx -d tu-dominio.com           # Para Nginx
```

### 3. Configuración MySQL Segura
```bash
mysql_secure_installation
```

### 4. Permisos de Archivos
```bash
# Configurar permisos restrictivos
chmod 600 /var/www/html/imcyc-api/config/database.php
chown -R www-data:www-data /var/www/html/imcyc-*
```

## 📊 Monitoreo y Mantenimiento

### Logs Importantes
- Apache: `/var/log/apache2/imcyc_*.log`
- Nginx: `/var/log/nginx/imcyc_*.log`
- PHP: `/var/log/php8.1-fpm.log`
- MySQL: `/var/log/mysql/error.log`
- Aplicación: `/var/log/imcyc/`

### Comandos de Monitoreo
```bash
# Estado de servicios
systemctl status apache2 mysql php8.1-fpm

# Uso de recursos
htop
df -h
free -h

# Logs en tiempo real
tail -f /var/log/apache2/imcyc_error.log
```

### Backup Automático
```bash
# Agregar a crontab (crontab -e)
0 2 * * * /usr/local/bin/backup-imcyc.sh
```

## 🔧 Solución de Problemas

### Error 500 - Internal Server Error
1. Verificar logs de Apache/Nginx
2. Verificar permisos de archivos
3. Verificar configuración PHP
4. Verificar conexión a base de datos

### Error de Conexión a Base de Datos
1. Verificar credenciales en `database.php`
2. Verificar que MySQL esté ejecutándose
3. Verificar permisos de usuario de base de datos

### Problemas de CORS
1. Verificar configuración de dominios permitidos
2. Verificar headers en servidor web
3. Verificar configuración de API

## 📱 Acceso a la Aplicación

Una vez desplegada, la aplicación estará disponible en:
- **Frontend**: `https://tu-dominio.com`
- **API**: `https://tu-dominio.com/api`

### Credenciales por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin123`

**⚠️ IMPORTANTE: Cambiar estas credenciales inmediatamente en producción**

## 🔄 Actualizaciones

Para actualizar la aplicación:

```bash
# 1. Hacer backup
sudo bash deploy/deploy.sh

# 2. Actualizar código
git pull origin main
npm run build

# 3. Redesplegar
sudo bash deploy/deploy.sh
```

## 📞 Soporte

Para soporte técnico:
- Revisar logs del sistema
- Verificar configuración de red
- Contactar al equipo de desarrollo IMCYC