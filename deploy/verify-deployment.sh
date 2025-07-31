#!/bin/bash

# Script para verificar que el deploy de IMCYC funcione correctamente

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "🧪 Verificando deploy de IMCYC..."
echo ""

# Verificar que Apache esté ejecutándose
if systemctl is-active --quiet apache2; then
    log_info "Apache2 está ejecutándose"
else
    log_error "Apache2 no está ejecutándose"
    exit 1
fi

# Verificar que MySQL esté ejecutándose
if systemctl is-active --quiet mysql; then
    log_info "MySQL está ejecutándose"
else
    log_error "MySQL no está ejecutándose"
    exit 1
fi

# Verificar archivos del frontend
if [ -f "/var/www/html/imcyc/index.html" ]; then
    log_info "Frontend desplegado correctamente"
else
    log_error "Frontend no encontrado en /var/www/html/imcyc/"
    exit 1
fi

# Verificar archivos de la API
if [ -f "/var/www/html/imcyc/api/config/database.php" ]; then
    log_info "API desplegada correctamente"
else
    log_error "API no encontrada en /var/www/html/imcyc/api/"
    exit 1
fi

# Verificar permisos
OWNER=$(stat -c '%U' /var/www/html/imcyc)
if [ "$OWNER" = "www-data" ]; then
    log_info "Permisos configurados correctamente"
else
    log_warning "Los archivos no pertenecen a www-data (actual: $OWNER)"
fi

# Verificar conectividad HTTP
echo ""
echo "🌐 Verificando conectividad HTTP..."

# Verificar frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost/imcyc/ | grep -q "200"; then
    log_info "Frontend accesible en http://localhost/imcyc/"
else
    log_error "Frontend no accesible"
fi

# Verificar API
API_RESPONSE=$(curl -s http://localhost/imcyc/api/evaluaciones/tipos 2>/dev/null || echo "error")
if echo "$API_RESPONSE" | grep -q "success"; then
    log_info "API funcionando correctamente"
    echo "   Respuesta: $(echo "$API_RESPONSE" | head -c 100)..."
else
    log_error "API no responde correctamente"
    echo "   Respuesta: $API_RESPONSE"
fi

# Verificar base de datos
echo ""
echo "🗄️ Verificando base de datos..."

# Verificar que la base de datos existe
if mysql -u imcyc_user -p -e "USE imcyc_evaluaciones; SHOW TABLES;" 2>/dev/null | grep -q "usuarios"; then
    log_info "Base de datos configurada correctamente"
else
    log_error "Problema con la base de datos"
fi

echo ""
echo "✅ Verificación completada"
echo ""
echo "📱 Información de acceso:"
echo "   🌐 URL: http://localhost/imcyc/"
echo "   👤 Usuario: admin"
echo "   🔑 Contraseña: admin123"