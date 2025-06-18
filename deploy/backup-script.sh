#!/bin/bash

# Script de backup automático para IMCYC
# Ejecutar diariamente via cron

set -e

# Configuración
BACKUP_DIR="/var/backups/imcyc"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="imcyc_user"
MYSQL_PASSWORD="tu_contraseña_aqui"  # CAMBIAR
MYSQL_DATABASE="imcyc_evaluaciones"
RETENTION_DAYS=30

# Colores para output
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

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"

log_info "🗄️ Iniciando backup de IMCYC - $DATE"

# Backup de base de datos
log_info "📊 Respaldando base de datos..."
mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    "$MYSQL_DATABASE" > "$BACKUP_DIR/db_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    log_info "✅ Backup de base de datos completado"
else
    log_error "❌ Error en backup de base de datos"
    exit 1
fi

# Backup de archivos de aplicación
log_info "📁 Respaldando archivos de aplicación..."
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
    -C /var/www/html \
    imcyc-frontend \
    imcyc-api \
    --exclude="imcyc-api/config/database.php"

if [ $? -eq 0 ]; then
    log_info "✅ Backup de archivos completado"
else
    log_error "❌ Error en backup de archivos"
    exit 1
fi

# Backup de configuración de Apache
log_info "⚙️ Respaldando configuración de Apache..."
cp /etc/apache2/sites-available/imcyc*.conf "$BACKUP_DIR/" 2>/dev/null || true

# Comprimir backup completo
log_info "🗜️ Comprimiendo backup completo..."
tar -czf "$BACKUP_DIR/imcyc_complete_backup_$DATE.tar.gz" \
    -C "$BACKUP_DIR" \
    "db_backup_$DATE.sql" \
    "app_backup_$DATE.tar.gz" \
    imcyc*.conf 2>/dev/null

# Limpiar archivos temporales
rm -f "$BACKUP_DIR/db_backup_$DATE.sql"
rm -f "$BACKUP_DIR/app_backup_$DATE.tar.gz"
rm -f "$BACKUP_DIR/imcyc"*.conf

# Limpiar backups antiguos
log_info "🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
find "$BACKUP_DIR" -name "imcyc_complete_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Mostrar estadísticas
BACKUP_SIZE=$(du -h "$BACKUP_DIR/imcyc_complete_backup_$DATE.tar.gz" | cut -f1)
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/imcyc_complete_backup_*.tar.gz | wc -l)

log_info "📈 Estadísticas del backup:"
echo "   - Tamaño: $BACKUP_SIZE"
echo "   - Total de backups: $TOTAL_BACKUPS"
echo "   - Ubicación: $BACKUP_DIR/imcyc_complete_backup_$DATE.tar.gz"

log_info "✅ Backup completado exitosamente!"

# Opcional: Enviar notificación por email
# echo "Backup de IMCYC completado - $DATE" | mail -s "Backup IMCYC" admin@tu-dominio.com