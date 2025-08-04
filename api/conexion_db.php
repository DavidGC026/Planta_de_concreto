<?php
/**
 * Conexión a base de datos para el API de gestión de estado de exámenes
 */

function obtenerConexionDB() {
    try {
        $host = 'localhost';
        $dbname = 'plantas_concreto';
        $username = 'admin';
        $password = 'Imc590923cz4#';
        
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $conexion = new PDO($dsn, $username, $password, $options);
        
        // Configurar zona horaria
        $conexion->exec("SET time_zone = '-06:00'");
        
        return $conexion;
    } catch (PDOException $e) {
        throw new Exception("Error de conexión: " . $e->getMessage());
    }
}
?>
