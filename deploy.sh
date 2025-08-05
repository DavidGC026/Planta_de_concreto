#!/bin/bash

# Script de Deploy para Planta de Concreto
# IMCYC - Sistema de Evaluación de Plantas de Concreto

echo "🚀 Iniciando deploy de Planta de Concreto..."

# Variables
PROJECT_DIR="/home/david/Descargas/Planta/Planta_de_concreto"
DEPLOY_DIR="/var/www/html/plantaconcreto"
BACKUP_DIR="/var/backups/plantaconcreto"

# Función para mostrar errores
error_exit() {
    echo "❌ Error: $1" >&2
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error_exit "No se encontró package.json. Ejecuta este script desde el directorio del proyecto."
fi

echo "📂 Directorio del proyecto: $(pwd)"

# Crear backup del deploy actual
if [ -d "$DEPLOY_DIR" ]; then
    echo "💾 Creando backup del deploy actual..."
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)" || error_exit "No se pudo crear el backup"
    echo "✅ Backup creado exitosamente"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install || error_exit "Falló la instalación de dependencias"

# Generar build de producción
echo "🔨 Generando build de producción..."
npm run build || error_exit "Falló la generación del build"

# Crear directorio de deploy si no existe
echo "📁 Preparando directorio de deploy..."
sudo mkdir -p "$DEPLOY_DIR" || error_exit "No se pudo crear el directorio de deploy"

# Copiar archivos del build
echo "📋 Copiando archivos del build..."
sudo cp -r dist/* "$DEPLOY_DIR/" || error_exit "No se pudieron copiar los archivos del build"

# Copiar API
echo "🔧 Copiando API..."
sudo cp -r api "$DEPLOY_DIR/" || error_exit "No se pudo copiar la API"

# Configurar permisos
echo "🔐 Configurando permisos..."
sudo chown -R www-data:www-data "$DEPLOY_DIR" || error_exit "No se pudieron configurar los permisos"
sudo chmod -R 755 "$DEPLOY_DIR" || error_exit "No se pudieron configurar los permisos de archivos"

# Crear/actualizar .htaccess
echo "⚙️ Configurando .htaccess..."
sudo tee "$DEPLOY_DIR/.htaccess" > /dev/null << 'EOF'
RewriteEngine On

# Handle Angular/React Router - redirect all requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]

# Set CORS headers for API requests
<IfModule mod_headers.c>
    SetEnvIf Origin "http(s)?://(www\.)?(localhost|127\.0\.0\.1)(:[0-9]+)?$" AccessControlAllowOrigin=$0
    Header always set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header always set Access-Control-Max-Age "3600"
</IfModule>

# Handle preflight OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
EOF

# Recargar Apache
echo "🔄 Recargando Apache..."
sudo systemctl reload apache2 || error_exit "No se pudo recargar Apache"

# Verificar que el sitio esté funcionando
echo "🧪 Verificando el deploy..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/plantaconcreto/)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Deploy exitoso! El sitio está funcionando correctamente."
    echo "🌐 URL: http://localhost/plantaconcreto/"
    echo "🔗 API: http://localhost/plantaconcreto/api/"
else
    echo "⚠️ Advertencia: El sitio no responde correctamente (HTTP $HTTP_STATUS)"
fi

echo "🎉 Deploy completado!"
echo ""
echo "📄 Logs de Apache:"
echo "   - Error: /var/log/apache2/plantaconcreto_error.log"
echo "   - Access: /var/log/apache2/plantaconcreto_access.log"
echo ""
echo "🔧 Para ver los logs en tiempo real:"
echo "   sudo tail -f /var/log/apache2/plantaconcreto_error.log"
