#!/bin/bash

# Script de deploy simple para IMCYC en Debian
# Funciona con Apache2 y MySQL ya instalados
# No requiere modificar configuraciones del servidor

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

log_info "🚀 Iniciando deploy de IMCYC para Debian..."

# Variables de configuración
WEB_DIR="/var/www/html/imcyc"
DB_NAME="imcyc_evaluaciones"
DB_USER="imcyc_user"

# Solicitar información de MySQL
echo ""
log_info "📊 Configuración de MySQL"
read -p "Usuario root de MySQL: " MYSQL_ROOT_USER
read -s -p "Contraseña root de MySQL: " MYSQL_ROOT_PASSWORD
echo ""
read -p "Contraseña para usuario imcyc_user (nueva): " IMCYC_PASSWORD
echo ""

# Verificar conexión a MySQL
log_info "🔍 Verificando conexión a MySQL..."
if ! mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    log_error "No se puede conectar a MySQL. Verifica las credenciales."
    exit 1
fi

log_info "✅ Conexión a MySQL exitosa"

# Construir frontend
log_info "🔨 Construyendo frontend..."
npm run build

# Configurar la base de datos
log_info "🗄️ Configurando base de datos MySQL..."

# Crear base de datos y usuario
mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$IMCYC_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Importar esquema de base de datos
log_info "📊 Importando esquema de base de datos..."
mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < supabase/migrations/20250618155541_spring_shadow.sql
mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < supabase/migrations/20250618161300_sweet_torch.sql
mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < supabase/migrations/20250618161701_azure_flower.sql

log_info "✅ Base de datos configurada exitosamente"

# Crear directorio web y copiar archivos
log_info "📂 Copiando archivos al servidor web..."
sudo rm -rf "$WEB_DIR"
sudo mkdir -p "$WEB_DIR"
sudo cp -r dist/* "$WEB_DIR/"

# Crear directorio de API
sudo mkdir -p "$WEB_DIR/api"
sudo cp -r api/* "$WEB_DIR/api/"

# Crear configuración de base de datos personalizada
log_info "⚙️ Configurando archivo de base de datos..."
sudo tee "$WEB_DIR/api/config/database.php" > /dev/null << EOF
<?php
class Database {
    private \$host = 'localhost';
    private \$db_name = '$DB_NAME';
    private \$username = '$DB_USER';
    private \$password = '$IMCYC_PASSWORD';
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

log_info "🎉 Deploy completado exitosamente!"
echo ""
log_info "📱 Información de acceso:"
echo "   🌐 URL: http://localhost/imcyc/"
echo "   👤 Usuario: admin"
echo "   🔑 Contraseña: admin123"
echo ""
log_info "🧪 Para verificar:"
echo "   API: curl http://localhost/imcyc/api/evaluaciones/tipos"
echo "   Frontend: Abre http://localhost/imcyc/ en tu navegador"