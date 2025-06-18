<?php
/**
 * Configuración de la base de datos MySQL
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'imcyc_evaluaciones';
    private $username = 'root'; // Cambiar por usuario de producción
    private $password = '';     // Cambiar por contraseña de producción
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
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            error_log("Error de conexión: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return $this->conn;
    }
}

/**
 * Configuración de CORS para permitir peticiones desde el frontend
 */
function setCorsHeaders() {
    // Permitir origen específico en producción
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Manejar preflight requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Función para enviar respuesta JSON
 */
function sendJsonResponse($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Función para manejar errores
 */
function handleError($message, $status_code = 500) {
    error_log($message);
    sendJsonResponse([
        'success' => false,
        'error' => $message
    ], $status_code);
}
?>