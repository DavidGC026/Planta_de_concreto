<?php
/**
 * Configuración de la base de datos MySQL - Jefe de Planta
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'plantas_concreto'; // Ajustar según tu BD
    private $username = 'root'; // Ajustar según tu configuración
    private $password = ''; // Ajustar según tu configuración
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
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            $this->conn->exec("SET time_zone = '-06:00'");
            
        } catch(PDOException $exception) {
            error_log("Error de conexión DB: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }

        return $this->conn;
    }
}

function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function sendJsonResponse($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function handleError($message, $status_code = 500) {
    error_log("Jefe Planta API Error: " . $message);
    
    sendJsonResponse([
        'success' => false,
        'error' => $message
    ], $status_code);
}
?>