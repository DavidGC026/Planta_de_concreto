<?php
/**
 * Conexión secundaria a la base de datos de Resultados (plataforma externa)
 * Usa variables de entorno DB2_HOST, DB2_NAME, DB2_USER, DB2_PASS
 */

class DatabaseResultados {
    private $conn;

    public function getConnection() {
        if ($this->conn) return $this->conn;

        $host = getenv('DB2_HOST') ?: '';
        $db   = getenv('DB2_NAME') ?: '';
        $user = getenv('DB2_USER') ?: '';
        $pass = getenv('DB2_PASS') ?: '';
        $charset = 'utf8mb4';

        if ($host === '' || $db === '' || $user === '') {
            throw new Exception('Conexión DB2 no configurada');
        }

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $this->conn = new PDO($dsn, $user, $pass, $options);
        return $this->conn;
    }
}

?>


