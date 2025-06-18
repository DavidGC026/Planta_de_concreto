#!/bin/bash

# Script de restauración para IMCYC
# Uso: ./restore-script.sh backup_file.tar.gz

set -e

# Verificar parámetros
if [ $# -ne 1 ]; then
    echo "Uso: $0 <archivo_backup.tar.gz>"
    echo "Ejemplo: $0 /var/backups/imcyc/imcyc_complete_backup_20241218_140000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
MYSQL_USER="imcyc_user"
MYSQL_PASSWORD="tu_contraseña_aqui"  # CAMBIAR
MYSQL_DATABASE="imcyc_evaluaciones"
TEMP_DIR="/tmp/imcyc_restore_$$"

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

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "❌ El archivo de backup no existe: $BACKUP_FILE"
    exit 1
fi

log_info "🔄 Iniciando restauración desde: $BACKUP_FILE"

# Crear directorio temporal
mkdir -p "$TEMP_DIR"

# Extraer backup
log_info "📦 Extrayendo backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Buscar archivos de backup
DB_BACKUP=$(find "$TEMP_DIR" -name "db_backup_*.sql" | head -1)
APP_BACKUP=$(find "$TEMP_DIR" -name "app_backup_*.tar.gz" | head -1)

if [ -z "$DB_BACKUP" ] || [ -z "$APP_BACKUP" ]; then
    log_error "❌ No se encontraron archivos de backup válidos"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Confirmación
log_warning "⚠️  ADVERTENCIA: Esta operación sobrescribirá los datos actuales."
read -p "¿Continuar con la restauración? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Restauración cancelada"
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Crear backup de seguridad antes de restaurar
SAFETY_BACKUP="/tmp/safety_backup_$(date +%Y%m%d_%H%M%S)"
log_info "🛡️ Creando backup de seguridad en: $SAFETY_BACKUP"
mkdir -p "$SAFETY_BACKUP"

# Backup de BD actual
mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
    --single-transaction \
    "$MYSQL_DATABASE" > "$SAFETY_BACKUP/current_db.sql"

# Backup de archivos actuales
tar -czf "$SAFETY_BACKUP/current_app.tar.gz" \
    -C /var/www/html \
    imcyc-frontend \
    imcyc-api 2>/dev/null || true

# Restaurar base de datos
log_info "📊 Restaurando base de datos..."
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$DB_BACKUP"

if [ $? -eq 0 ]; then
    log_info "✅ Base de datos restaurada"
else
    log_error "❌ Error restaurando base de datos"
    log_info "🔙 Restaurando backup de seguridad..."
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$SAFETY_BACKUP/current_db.sql"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Parar Apache temporalmente
log_info "⏸️ Deteniendo Apache..."
sudo systemctl stop apache2

# Restaurar archivos de aplicación
log_info "📁 Restaurando archivos de aplicación..."

# Backup de configuración actual
sudo cp /var/www/html/imcyc-api/config/database.php /tmp/database.php.backup 2>/dev/null || true

# Limpiar directorios actuales
sudo rm -rf /var/www/html/imcyc-frontend/*
sudo rm -rf /var/www/html/imcyc-api/*

# Extraer archivos restaurados
sudo tar -xzf "$APP_BACKUP" -C /var/www/html/

# Restaurar configuración de BD
if [ -f "/tmp/database.php.backup" ]; then
    sudo cp /tmp/database.php.backup /var/www/html/imcyc-api/config/database.php
    rm -f /tmp/database.php.backup
fi

# Configurar permisos
log_info "🔐 Configurando permisos..."
sudo chown -R www-data:www-data /var/www/html/imcyc-frontend
sudo chown -R www-data:www-data /var/www/html/imcyc-api
sudo chmod -R 755 /var/www/html/imcyc-frontend
sudo chmod -R 755 /var/www/html/imcyc-api
sudo chmod 600 /var/www/html/imcyc-api/config/database.php

# Reiniciar Apache
log_info "▶️ Reiniciando Apache..."
sudo systemctl start apache2

# Verificar que Apache esté funcionando
if sudo systemctl is-active --quiet apache2; then
    log_info "✅ Apache reiniciado correctamente"
else
    log_error "❌ Error reiniciando Apache"
    sudo systemctl status apache2
fi

# Limpiar archivos temporales
rm -rf "$TEMP_DIR"

log_info "✅ Restauración completada exitosamente!"
log_info "🛡️ Backup de seguridad guardado en: $SAFETY_BACKUP"
log_warning "⚠️  Recuerda verificar que la aplicación funcione correctamente"

# Mostrar información de verificación
echo ""
echo "🧪 Para verificar la restauración:"
echo "   - Frontend: curl -I http://tu-dominio.com"
echo "   - API: curl http://tu-dominio.com/api/evaluaciones/tipos"
echo "   - Logs: sudo tail -f /var/log/apache2/imcyc_error.log"