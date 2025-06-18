#!/bin/bash

# Script de instalación para servidor Debian
# IMCYC - Sistema de Evaluación de Plantas de Concreto

set -e

echo "🚀 Iniciando instalación de IMCYC en servidor Debian..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# Actualizar sistema
log_info "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
log_info "Instalando dependencias básicas..."
apt install -y curl wget unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Apache/Nginx (elegir uno)
read -p "¿Qué servidor web deseas instalar? (apache/nginx): " webserver

if [ "$webserver" = "apache" ]; then
    log_info "Instalando Apache..."
    apt install -y apache2
    systemctl enable apache2
    
    # Habilitar módulos necesarios
    a2enmod rewrite
    a2enmod ssl
    a2enmod headers
    a2enmod expires
    a2enmod deflate
    
elif [ "$webserver" = "nginx" ]; then
    log_info "Instalando Nginx..."
    apt install -y nginx
    systemctl enable nginx
else
    log_error "Opción no válida. Usa 'apache' o 'nginx'"
    exit 1
fi

# Instalar PHP 8.1
log_info "Instalando PHP 8.1..."
apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-json php8.1-curl php8.1-mbstring php8.1-xml php8.1-zip

# Instalar MySQL
log_info "Instalando MySQL..."
apt install -y mysql-server

# Configurar MySQL
log_info "Configurando MySQL..."
mysql_secure_installation

# Crear base de datos
log_info "Creando base de datos IMCYC..."
read -p "Ingresa el nombre de usuario de MySQL: " mysql_user
read -s -p "Ingresa la contraseña de MySQL: " mysql_password
echo

mysql -u "$mysql_user" -p"$mysql_password" << EOF
CREATE DATABASE IF NOT EXISTS imcyc_evaluaciones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'imcyc_user'@'localhost' IDENTIFIED BY 'imcyc_secure_password_2024';
GRANT ALL PRIVILEGES ON imcyc_evaluaciones.* TO 'imcyc_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Crear directorios
log_info "Creando directorios de aplicación..."
mkdir -p /var/www/html/imcyc-frontend
mkdir -p /var/www/html/imcyc-api
mkdir -p /var/log/imcyc

# Configurar permisos
log_info "Configurando permisos..."
chown -R www-data:www-data /var/www/html/imcyc-frontend
chown -R www-data:www-data /var/www/html/imcyc-api
chmod -R 755 /var/www/html/imcyc-frontend
chmod -R 755 /var/www/html/imcyc-api

# Configurar firewall
log_info "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log_info "✅ Instalación base completada!"
log_warning "Pasos siguientes:"
echo "1. Copia los archivos del build a /var/www/html/imcyc-frontend"
echo "2. Copia los archivos de la API a /var/www/html/imcyc-api"
echo "3. Configura el virtual host de Apache/Nginx"
echo "4. Importa el esquema de la base de datos"
echo "5. Configura las credenciales de la base de datos en api/config/database.php"