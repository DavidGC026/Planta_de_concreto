#!/bin/bash

# Script de despliegue para IMCYC
# Ejecutar desde el directorio raíz del proyecto

set -e

# Configuración
FRONTEND_DIR="/var/www/html/imcyc-frontend"
API_DIR="/var/www/html/imcyc-api"
BACKUP_DIR="/var/backups/imcyc"
DATE=$(date +%Y%m%d_%H%M%S)

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

log_info "🚀 Iniciando despliegue de IMCYC..."

# Crear backup de la versión actual
log_info "Creando backup de la versión actual..."
mkdir -p "$BACKUP_DIR"

if [ -d "$FRONTEND_DIR" ]; then
    tar -czf "$BACKUP_DIR/frontend_backup_$DATE.tar.gz" -C "$FRONTEND_DIR" .
fi

if [ -d "$API_DIR" ]; then
    tar -czf "$BACKUP_DIR/api_backup_$DATE.tar.gz" -C "$API_DIR" .
fi

# Verificar que existe el build
if [ ! -d "dist" ]; then
    log_error "No se encontró el directorio 'dist'. Ejecuta 'npm run build' primero."
    exit 1
fi

# Desplegar frontend
log_info "Desplegando frontend..."
rm -rf "$FRONTEND_DIR"/*
cp -r dist/* "$FRONTEND_DIR/"

# Desplegar API
log_info "Desplegando API..."
rm -rf "$API_DIR"/*
cp -r api/* "$API_DIR/"

# Configurar permisos
log_info "Configurando permisos..."
chown -R www-data:www-data "$FRONTEND_DIR"
chown -R www-data:www-data "$API_DIR"
chmod -R 755 "$FRONTEND_DIR"
chmod -R 755 "$API_DIR"

# Configurar permisos especiales para archivos de configuración
chmod 600 "$API_DIR/config/database.php"

# Reiniciar servicios
log_info "Reiniciando servicios..."
if systemctl is-active --quiet apache2; then
    systemctl reload apache2
    log_info "Apache recargado"
elif systemctl is-active --quiet nginx; then
    systemctl reload nginx
    log_info "Nginx recargado"
fi

if systemctl is-active --quiet php8.1-fpm; then
    systemctl reload php8.1-fpm
    log_info "PHP-FPM recargado"
fi

# Verificar despliegue
log_info "Verificando despliegue..."

# Verificar frontend
if [ -f "$FRONTEND_DIR/index.html" ]; then
    log_info "✅ Frontend desplegado correctamente"
else
    log_error "❌ Error en despliegue del frontend"
    exit 1
fi

# Verificar API
if [ -f "$API_DIR/config/database.php" ]; then
    log_info "✅ API desplegada correctamente"
else
    log_error "❌ Error en despliegue de la API"
    exit 1
fi

# Limpiar backups antiguos (mantener solo los últimos 5)
log_info "Limpiando backups antiguos..."
cd "$BACKUP_DIR"
ls -t frontend_backup_*.tar.gz | tail -n +6 | xargs -r rm
ls -t api_backup_*.tar.gz | tail -n +6 | xargs -r rm

log_info "🎉 Despliegue completado exitosamente!"
log_info "Frontend: $FRONTEND_DIR"
log_info "API: $API_DIR"
log_info "Backup: $BACKUP_DIR/backup_$DATE.tar.gz"

# Mostrar información del sistema
log_info "📊 Estado del sistema:"
echo "Espacio en disco:"
df -h | grep -E "/$|/var"
echo ""
echo "Memoria:"
free -h
echo ""
echo "Servicios:"
systemctl is-active apache2 nginx mysql php8.1-fpm 2>/dev/null || true