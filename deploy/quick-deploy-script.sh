#!/bin/bash

# Script rápido de deploy para subpágina IMCYC
# Ejecutar desde el directorio raíz del proyecto

echo "🚀 Iniciando deploy de IMCYC como subpágina..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Crear directorio de deploy
DEPLOY_DIR="deploy-ready"
mkdir -p "$DEPLOY_DIR"

echo "📦 Construyendo aplicación..."
npm run build

echo "📁 Preparando archivos para deploy..."

# Copiar frontend construido
cp -r dist/* "$DEPLOY_DIR/"

# Crear directorio de API
mkdir -p "$DEPLOY_DIR/api"
cp -r api/* "$DEPLOY_DIR/api/"

# Crear .htaccess para subpágina
cat > "$DEPLOY_DIR/.htaccess" << 'EOF'
# Configuración para subpágina IMCYC
RewriteEngine On
RewriteBase /imcyc/

# Configuración CORS para la API
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# Manejar preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Rutas de la API
RewriteRule ^api/login/?$ api/auth/login.php [L,QSA]
RewriteRule ^api/evaluaciones/tipos/?$ api/evaluaciones/tipos.php [L,QSA]
RewriteRule ^api/evaluaciones/roles/?$ api/evaluaciones/roles.php [L,QSA]
RewriteRule ^api/evaluaciones/preguntas/?$ api/evaluaciones/preguntas.php [L,QSA]
RewriteRule ^api/evaluaciones/guardar/?$ api/evaluaciones/guardar.php [L,QSA]
RewriteRule ^api/evaluaciones/historial/?$ api/evaluaciones/historial.php [L,QSA]
RewriteRule ^api/reportes/generar/?$ api/reportes/generar.php [L,QSA]

# Configuración para SPA (Single Page Application)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/imcyc/api/
RewriteRule ^(.*)$ index.html [L]

# Seguridad - Ocultar archivos sensibles
<Files "*.sql">
    Order deny,allow
    Deny from all
</Files>

<Files "database.php">
    Order deny,allow
    Deny from all
</Files>
EOF

# Crear archivo de instrucciones
cat > "$DEPLOY_DIR/INSTRUCCIONES_DEPLOY.txt" << 'EOF'
INSTRUCCIONES DE DEPLOY - IMCYC

1. CONFIGURAR BASE DE DATOS:
   - Ejecuta los scripts SQL en tu MySQL en este orden:
     a) supabase/migrations/20250618155541_spring_shadow.sql
     b) supabase/migrations/20250618161300_sweet_torch.sql
     c) supabase/migrations/20250618161701_azure_flower.sql

2. CONFIGURAR API:
   - Edita api/config/database.php
   - Cambia las credenciales de MySQL por las de tu servidor

3. SUBIR ARCHIVOS:
   - Sube TODO el contenido de esta carpeta a public_html/imcyc/
   - Asegúrate de que la estructura sea:
     public_html/imcyc/index.html
     public_html/imcyc/api/
     public_html/imcyc/.htaccess

4. VERIFICAR:
   - Visita: https://tu-dominio.com/imcyc/api/evaluaciones/tipos
   - Visita: https://tu-dominio.com/imcyc/
   - Login: admin / admin123

5. CAMBIAR CONTRASEÑA:
   - Cambia la contraseña por defecto inmediatamente

¡Listo! Tu aplicación IMCYC estará funcionando.
EOF

echo "✅ Deploy preparado en la carpeta '$DEPLOY_DIR'"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tu base de datos MySQL"
echo "2. Edita $DEPLOY_DIR/api/config/database.php con tus credenciales"
echo "3. Sube todo el contenido de '$DEPLOY_DIR' a tu servidor"
echo "4. Visita tu sitio web"
echo ""
echo "📁 Archivos listos para subir en: $DEPLOY_DIR/"