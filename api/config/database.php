<?php
/**
 * Configuración de la base de datos MySQL - PRODUCCIÓN
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

class Database {
    // Configuración para base de datos existente
    private $host = 'localhost';
    private $db_name = 'plantas_concreto'; // Base de datos fija
    private $username = 'admin'; // Se actualizará por el script de deploy
    private $password = 'Imc590923cz4#'; // Se actualizará por el script de deploy
    private $charset = 'utf8mb4';
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_PERSISTENT         => true, // Conexiones persistentes para mejor rendimiento
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Configurar zona horaria
            $this->conn->exec("SET time_zone = '-06:00'"); // Hora de México
            
        } catch(PDOException $exception) {
            // En producción, no mostrar detalles del error
            error_log("Error de conexión DB: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return $this->conn;
    }
    
    /**
     * Verificar estado de la conexión
     */
    public function checkConnection() {
        try {
            $this->getConnection();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}

/**
 * Configuración de CORS para producción
 */
function setCorsHeaders() {
    // Para desarrollo, permitir todos los orígenes
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Headers de seguridad adicionales
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");
    header("X-XSS-Protection: 1; mode=block");
    
    // Manejar preflight requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Función para enviar respuesta JSON con logging
 */
function sendJsonResponse($data, $status_code = 200) {
    // Log para auditoría en producción
    if ($status_code >= 400) {
        error_log("API Error Response: " . json_encode($data));
    }
    
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Función para manejar errores con logging mejorado
 */
function handleError($message, $status_code = 500) {
    // Log detallado para debugging
    $log_data = [
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => $message,
        'status_code' => $status_code,
        'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
    ];
    
    error_log("IMCYC API Error: " . json_encode($log_data));
    
    // En producción, no mostrar detalles internos
    $public_message = $status_code >= 500 ? 'Error interno del servidor' : $message;
    
    sendJsonResponse([
        'success' => false,
        'error' => $public_message
    ], $status_code);
}

/**
 * Función para validar y sanitizar entrada
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Función para validar token de autenticación
 */
function validateAuthToken($token) {
    if (empty($token)) {
        return false;
    }
    
    // Implementar validación de token JWT o similar
    // Por ahora, validación básica
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    
    return count($parts) >= 3;
}
?>