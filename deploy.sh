#!/bin/bash

# Script de despliegue para Planta de Concreto - IMCYC
# Este script construye la aplicación y la despliega en /var/www/html/plantaconcreto

echo "🏭 Iniciando despliegue de Planta de Concreto - IMCYC"
echo "=================================================="

# Variables
PROJECT_DIR="/home/david/Descargas/Planta/Planta_de_concreto"
DEPLOY_DIR="/var/www/html/plantaconcreto"
BACKUP_DIR="/var/backups/plantaconcreto"
APACHE_USER="www-data"

# Función para mostrar errores y salir
error_exit() {
    echo "❌ Error: $1" >&2
    exit 1
}

# Función para mostrar éxito
success() {
    echo "✅ $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error_exit "No se encontró package.json. Ejecuta este script desde el directorio del proyecto."
fi

echo "📂 Directorio del proyecto: $(pwd)"

# Verificar permisos de sudo
echo "🔐 Verificando permisos administrativos..."
if ! sudo -n true 2>/dev/null; then
    echo "Se requieren permisos de administrador para el despliegue."
    sudo -v || error_exit "No se pudieron obtener permisos de administrador"
fi

# Crear backup del deploy actual
if [ -d "$DEPLOY_DIR" ]; then
    echo "💾 Creando backup del deploy actual..."
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)" || error_exit "No se pudo crear el backup"
    success "Backup creado exitosamente"
fi

# Limpiar instalaciones previas
echo "🧹 Limpiando instalaciones previas..."
rm -rf node_modules dist 2>/dev/null
success "Limpieza completada"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install || error_exit "Falló la instalación de dependencias"
success "Dependencias instaladas correctamente"

# Construir la aplicación para producción
echo "🔨 Construyendo aplicación para producción..."
npm run build || error_exit "Falló la construcción de la aplicación"
success "Aplicación construida exitosamente"

# Crear directorio de despliegue
echo "📁 Creando directorio de despliegue..."
sudo mkdir -p "$DEPLOY_DIR" || error_exit "No se pudo crear el directorio $DEPLOY_DIR"
sudo mkdir -p "$DEPLOY_DIR/api/admin" || error_exit "No se pudo crear el directorio API/admin"
sudo mkdir -p "$DEPLOY_DIR/api/auth" || error_exit "No se pudo crear el directorio API/auth"
sudo mkdir -p "$DEPLOY_DIR/api/config" || error_exit "No se pudo crear el directorio API/config"
sudo mkdir -p "$DEPLOY_DIR/api/evaluaciones" || error_exit "No se pudo crear el directorio API/evaluaciones"
sudo mkdir -p "$DEPLOY_DIR/api/evaluaciones-jefe" || error_exit "No se pudo crear el directorio API/evaluaciones-jefe"
sudo mkdir -p "$DEPLOY_DIR/api/reportes" || error_exit "No se pudo crear el directorio API/reportes"
success "Directorios creados"

# Copiar archivos de construcción (dist)
echo "📋 Copiando archivos de la aplicación React..."
sudo cp -r dist/* "$DEPLOY_DIR/" || error_exit "No se pudieron copiar los archivos de construcción"
success "Archivos React copiados"

# Copiar archivos PHP de la API (manteniendo estructura de directorios)
echo "🐘 Copiando archivos PHP de la API..."
sudo cp -r api/* "$DEPLOY_DIR/api/" || error_exit "No se pudieron copiar los archivos PHP"
success "Archivos PHP copiados"

# Copiar imágenes
echo "🖼️  Copiando imágenes..."
if [ -f "public/Fondo.png" ]; then
    sudo cp public/Fondo.png "$DEPLOY_DIR/" || error_exit "No se pudo copiar Fondo.png"
    success "Fondo.png copiado"
fi

if [ -f "public/Concreton.png" ]; then
    sudo cp public/Concreton.png "$DEPLOY_DIR/" || error_exit "No se pudo copiar Concreton.png"
    success "Concreton.png copiado"
fi

if [ -f "public/Logo_imcyc.png" ]; then
    sudo cp public/Logo_imcyc.png "$DEPLOY_DIR/" || error_exit "No se pudo copiar Logo_imcyc.png"
    success "Logo_imcyc.png copiado"
fi

# Copiar favicon si existe
if [ -f "public/favicon.ico" ]; then
    sudo cp public/favicon.ico "$DEPLOY_DIR/" || error_exit "No se pudo copiar favicon.ico"
    success "favicon.ico copiado"
fi

# Copiar archivo evaluacion-personal.html si existe
if [ -f "public/evaluacion-personal.html" ]; then
    sudo cp public/evaluacion-personal.html "$DEPLOY_DIR/" || error_exit "No se pudo copiar evaluacion-personal.html"
    success "evaluacion-personal.html copiado"
fi

# Configurar permisos
echo "🔐 Configurando permisos..."
sudo chown -R www-data:www-data "$DEPLOY_DIR" || error_exit "No se pudieron configurar los permisos"
sudo chmod -R 755 "$DEPLOY_DIR" || error_exit "No se pudieron configurar los permisos de archivos"

# Crear archivo .htaccess para React Router y PHP
echo "⚙️ Configurando Apache..."
sudo tee "$DEPLOY_DIR/.htaccess" > /dev/null <<'EOF'
Options -MultiViews
RewriteEngine On

# Permitir acceso a archivos PHP
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_FILENAME} \.php$
RewriteRule .* - [L]

# Permitir acceso a archivos estáticos
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule .* - [L]

# Redirigir todas las demás rutas a index.html (React Router)
RewriteRule ^ index.html [QSA,L]

# Configuración de PHP
<Files "*.php">
    SetHandler application/x-httpd-php
</Files>

# Headers de CORS para la API
<IfModule mod_headers.c>
    Header add Access-Control-Allow-Origin "*"
    Header add Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header add Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Manejar preflight requests para CORS
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>

# Configuración de seguridad
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
EOF

success "Configuración de Apache creada"

# Establecer permisos correctos
echo "🔒 Estableciendo permisos..."
sudo chown -R $APACHE_USER:$APACHE_USER "$DEPLOY_DIR" || error_exit "No se pudieron establecer los permisos de usuario"
sudo chmod -R 755 "$DEPLOY_DIR" || error_exit "No se pudieron establecer los permisos de archivos"
sudo chmod -R 644 "$DEPLOY_DIR"/*.html "$DEPLOY_DIR"/*.js "$DEPLOY_DIR"/*.css 2>/dev/null || true
sudo chmod -R 755 "$DEPLOY_DIR/api" || error_exit "No se pudieron establecer permisos para la API"
sudo chmod -R 644 "$DEPLOY_DIR/api"/*.php 2>/dev/null || true
sudo chmod -R 644 "$DEPLOY_DIR/api"/*/*.php 2>/dev/null || true
sudo chmod 755 "$DEPLOY_DIR/api/config" || true
success "Permisos establecidos correctamente"

# Verificar que Apache esté ejecutándose
echo "🌐 Verificando estado de Apache..."
if systemctl is-active --quiet apache2; then
    success "Apache está ejecutándose"
else
    echo "⚠️  Apache no está ejecutándose. Intentando iniciar..."
    sudo systemctl start apache2 || error_exit "No se pudo iniciar Apache"
    success "Apache iniciado"
fi

# Habilitar módulos necesarios de Apache
echo "🔧 Configurando módulos de Apache..."
sudo a2enmod rewrite > /dev/null 2>&1 || true
sudo a2enmod headers > /dev/null 2>&1 || true
sudo a2enmod expires > /dev/null 2>&1 || true
sudo a2enmod php8.1 > /dev/null 2>&1 || sudo a2enmod php8.0 > /dev/null 2>&1 || sudo a2enmod php7.4 > /dev/null 2>&1 || true

# Verificar configuración de Apache
echo "🔍 Verificando configuración de Apache..."
if sudo apache2ctl configtest 2>/dev/null | grep -q "OK"; then
    success "Configuración de Apache válida"
else
    echo "⚠️  Advertencia: Posibles problemas en la configuración de Apache"
fi

# Recargar Apache para aplicar cambios
sudo systemctl reload apache2 || error_exit "No se pudo recargar Apache"
success "Apache reconfigurado"

# Verificar que el sitio esté funcionando
echo "🧪 Verificando el deploy..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/plantaconcreto/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    success "Deploy exitoso! El sitio está funcionando correctamente."
else
    echo "⚠️ Advertencia: El sitio no responde correctamente (HTTP $HTTP_STATUS)"
fi

# Mostrar información de despliegue
echo ""
echo "🎉 ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!"
echo "======================================="
echo "📍 Ubicación: $DEPLOY_DIR"
echo "🌐 URL local: http://localhost/plantaconcreto"
echo "🌐 URL IP: http://$(hostname -I | awk '{print $1}')/plantaconcreto"
echo ""
echo "📊 Archivos desplegados:"
echo "   • Aplicación React (HTML, CSS, JS)"
echo "   • API PHP completa con estructura de directorios:"
echo "     - /api/admin/ (gestión de usuarios y permisos)"
echo "     - /api/auth/ (autenticación)"
echo "     - /api/config/ (configuración de base de datos)"
echo "     - /api/evaluaciones/ (evaluaciones principales)"
echo "     - /api/evaluaciones-jefe/ (evaluaciones para jefe de planta)"
echo "     - /api/reportes/ (generación de reportes)"
echo "   • Imágenes (Fondo.png, Concreton.png, Logo_imcyc.png)"
echo "   • Configuración Apache (.htaccess) con CORS y seguridad"
echo ""
echo "🔍 Para verificar el despliegue:"
echo "   curl http://localhost/plantaconcreto"
echo ""
echo "🔧 APIs disponibles:"
echo "   • http://localhost/plantaconcreto/api/auth/login.php"
echo "   • http://localhost/plantaconcreto/api/evaluaciones/preguntas.php"
echo "   • http://localhost/plantaconcreto/api/evaluaciones/guardar.php"
echo "   • http://localhost/plantaconcreto/api/reportes/generar.php"
echo ""
echo "📝 Logs de Apache:"
echo "   sudo tail -f /var/log/apache2/access.log"
echo "   sudo tail -f /var/log/apache2/error.log"
echo ""
echo "📋 Notas importantes:"
echo "   • Verifica la configuración de la base de datos en /api/config/database.php"
echo "   • Las rutas React funcionan con HTML5 History API"
echo "   • CORS configurado para permitir requests desde cualquier origen"
echo "   • Archivos estáticos optimizados para caché de 1 año"
echo "   • Backups automáticos guardados en: $BACKUP_DIR"
echo ""
echo "✨ ¡La aplicación está lista para usar en producción!"
