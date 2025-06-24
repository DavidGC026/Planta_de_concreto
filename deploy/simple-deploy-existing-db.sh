#!/bin/bash

# Script de deploy simple para IMCYC usando base de datos existente
# Usa base de datos 'plantas_concreto' existente
# Solo solicita credenciales de usuario existente

set -e

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

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Ejecuta este script desde el directorio raíz del proyecto IMCYC"
    exit 1
fi

log_info "🚀 Iniciando deploy de IMCYC para base de datos existente..."

# Variables de configuración
WEB_DIR="/var/www/html/imcyc"
DB_NAME="plantas_concreto"

# Solicitar información de MySQL
echo ""
log_info "📊 Configuración de MySQL para base de datos existente"
echo "Base de datos: $DB_NAME"
read -p "Usuario de MySQL existente: " DB_USER
read -s -p "Contraseña del usuario MySQL: " DB_PASSWORD
echo ""

# Verificar conexión a MySQL y base de datos
log_info "🔍 Verificando conexión a MySQL y base de datos..."
if ! mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1; then
    log_error "No se puede conectar a MySQL o la base de datos '$DB_NAME' no existe."
    log_error "Verifica que:"
    echo "  - El usuario '$DB_USER' existe"
    echo "  - La contraseña es correcta"
    echo "  - La base de datos '$DB_NAME' existe"
    echo "  - El usuario tiene permisos sobre la base de datos"
    exit 1
fi

log_info "✅ Conexión a MySQL y base de datos exitosa"

# Construir frontend
log_info "🔨 Construyendo frontend..."
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        log_info "Instalando dependencias..."
        npm install
    fi
    npm run build
else
    log_warning "No se encontró package.json, usando archivos dist existentes"
fi

# Verificar que existe el directorio dist
if [ ! -d "dist" ]; then
    log_error "No se encontró el directorio dist. Ejecuta 'npm run build' primero."
    exit 1
fi

# Crear directorio web y copiar archivos
log_info "📂 Copiando archivos al servidor web..."
sudo rm -rf "$WEB_DIR"
sudo mkdir -p "$WEB_DIR"

# Copiar archivos del frontend
sudo cp -r dist/* "$WEB_DIR/"

# Crear directorio de API
sudo mkdir -p "$WEB_DIR/api"
sudo cp -r api/* "$WEB_DIR/api/"

# Crear configuración de base de datos personalizada
log_info "⚙️ Configurando archivo de base de datos..."
sudo tee "$WEB_DIR/api/config/database.php" > /dev/null << EOF
<?php
/**
 * Configuración de la base de datos MySQL - PRODUCCIÓN
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

class Database {
    private \$host = 'localhost';
    private \$db_name = '$DB_NAME';
    private \$username = '$DB_USER';
    private \$password = '$DB_PASSWORD';
    private \$charset = 'utf8mb4';
    private \$conn;

    public function getConnection() {
        \$this->conn = null;
        
        try {
            \$dsn = "mysql:host=" . \$this->host . ";dbname=" . \$this->db_name . ";charset=" . \$this->charset;
            \$options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            \$this->conn = new PDO(\$dsn, \$this->username, \$this->password, \$options);
            \$this->conn->exec("SET time_zone = '-06:00'");
            
        } catch(PDOException \$exception) {
            error_log("Error de conexión DB: " . \$exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return \$this->conn;
    }
    
    public function checkConnection() {
        try {
            \$this->getConnection();
            return true;
        } catch (Exception \$e) {
            return false;
        }
    }
}

function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    if (\$_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function sendJsonResponse(\$data, \$status_code = 200) {
    http_response_code(\$status_code);
    echo json_encode(\$data, JSON_UNESCAPED_UNICODE);
    exit();
}

function handleError(\$message, \$status_code = 500) {
    error_log("IMCYC API Error: " . \$message);
    
    sendJsonResponse([
        'success' => false,
        'error' => \$message
    ], \$status_code);
}

function sanitizeInput(\$data) {
    if (is_array(\$data)) {
        return array_map('sanitizeInput', \$data);
    }
    
    return htmlspecialchars(strip_tags(trim(\$data)), ENT_QUOTES, 'UTF-8');
}

function validateAuthToken(\$token) {
    if (empty(\$token)) {
        return false;
    }
    
    \$decoded = base64_decode(\$token);
    \$parts = explode(':', \$decoded);
    
    return count(\$parts) >= 3;
}
?>
EOF

# Crear .htaccess básico para el frontend
sudo tee "$WEB_DIR/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /imcyc/

# Manejar rutas de la API
RewriteRule ^api/(.*)$ api/$1 [L,QSA]

# Configuración para Single Page Application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/imcyc/api/
RewriteRule ^(.*)$ index.html [L]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header set X-Powered-By "IMCYC - Sistema de Evaluación de Plantas de Concreto"
</IfModule>
EOF

# Crear .htaccess para la API
sudo tee "$WEB_DIR/api/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /imcyc/api/

# Rutas de autenticación
RewriteRule ^login/?$ auth/login.php [L,QSA]

# Rutas de evaluaciones
RewriteRule ^evaluaciones/tipos/?$ evaluaciones/tipos.php [L,QSA]
RewriteRule ^evaluaciones/roles/?$ evaluaciones/roles.php [L,QSA]
RewriteRule ^evaluaciones/preguntas/?$ evaluaciones/preguntas.php [L,QSA]
RewriteRule ^evaluaciones/guardar/?$ evaluaciones/guardar.php [L,QSA]
RewriteRule ^evaluaciones/historial/?$ evaluaciones/historial.php [L,QSA]
RewriteRule ^evaluaciones/progreso-seccion/?$ evaluaciones/progreso-seccion.php [L,QSA]
RewriteRule ^evaluaciones/progreso-secciones/?$ evaluaciones/progreso-secciones.php [L,QSA]

# Rutas de reportes
RewriteRule ^reportes/generar/?$ reportes/generar.php [L,QSA]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
EOF

# Configurar permisos
log_info "🔐 Configurando permisos..."
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"
sudo chmod 644 "$WEB_DIR/api/config/database.php"

# Verificar y habilitar mod_rewrite si es necesario
log_info "🔍 Verificando mod_rewrite..."
if ! apache2ctl -M | grep -q rewrite_module; then
    log_warning "Habilitando mod_rewrite..."
    sudo a2enmod rewrite
    sudo systemctl reload apache2
fi

# Verificar que Apache esté ejecutándose
if ! systemctl is-active --quiet apache2; then
    log_warning "Iniciando Apache2..."
    sudo systemctl start apache2
fi

# Verificar conectividad final
log_info "🧪 Verificando conectividad final..."

# Probar conexión a base de datos desde PHP
TEST_RESULT=$(php -r "
try {
    \$pdo = new PDO('mysql:host=localhost;dbname=$DB_NAME;charset=utf8mb4', '$DB_USER', '$DB_PASSWORD');
    echo 'SUCCESS';
} catch (Exception \$e) {
    echo 'ERROR: ' . \$e->getMessage();
}
")

if [[ $TEST_RESULT == "SUCCESS" ]]; then
    log_info "✅ Conexión PHP-MySQL verificada"
else
    log_warning "⚠️ Problema con conexión PHP-MySQL: $TEST_RESULT"
fi

# Verificar estructura de tablas básicas
log_info "🔍 Verificando estructura de base de datos..."
TABLES_CHECK=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'usuarios';" 2>/dev/null | wc -l)

if [ "$TABLES_CHECK" -gt 1 ]; then
    log_info "✅ Tabla 'usuarios' encontrada en la base de datos"
else
    log_warning "⚠️ Tabla 'usuarios' no encontrada. Asegúrate de que la base de datos esté correctamente configurada."
fi

log_info "🎉 Deploy completado exitosamente!"
echo ""
log_info "📱 Información de acceso:"
echo "   🌐 URL: http://localhost/imcyc/"
echo "   👤 Usuario: admin (o el configurado en tu base de datos)"
echo "   🔑 Contraseña: admin123 (o la configurada en tu base de datos)"
echo ""
log_info "📋 Estructura desplegada:"
echo "   Frontend: $WEB_DIR/"
echo "   API: $WEB_DIR/api/"
echo "   Base de datos: $DB_NAME"
echo "   Usuario DB: $DB_USER"
echo ""
log_info "🧪 Para verificar:"
echo "   API: curl http://localhost/imcyc/api/evaluaciones/tipos"
echo "   Frontend: Abre http://localhost/imcyc/ en tu navegador"
echo ""
log_info "📝 Notas importantes:"
echo "   - La base de datos '$DB_NAME' debe estar previamente configurada"
echo "   - Asegúrate de que las tablas necesarias existan"
echo "   - El usuario '$DB_USER' debe tener permisos completos sobre '$DB_NAME'"