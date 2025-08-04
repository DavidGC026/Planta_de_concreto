<?php
file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - INICIO SIMPLE\n", FILE_APPEND);

try {
    require_once 'api/config/database.php';
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Database incluido\n", FILE_APPEND);
    
    setCorsHeaders();
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - CORS establecido\n", FILE_APPEND);
    
    $database = new Database();
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Database creado\n", FILE_APPEND);
    
    $db = $database->getConnection();
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Conexión obtenida\n", FILE_APPEND);
    
    // Datos de prueba
    $usuario_id = 10;
    $tipo_evaluacion = 'equipo';
    $puede_evaluar = true;
    $puede_ver_resultados = true;
    
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Iniciando transacción\n", FILE_APPEND);
    $db->beginTransaction();
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Transacción iniciada\n", FILE_APPEND);
    
    // Crear tabla si no existe
    $create_table = "CREATE TABLE IF NOT EXISTS permisos_equipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        puede_evaluar BOOLEAN DEFAULT TRUE,
        puede_ver_resultados BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_equipo (usuario_id)
    )";
    $db->exec($create_table);
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Tabla creada/verificada\n", FILE_APPEND);
    
    // Insertar o actualizar permisos de equipo
    $query = "INSERT INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
              VALUES (:usuario_id, :puede_evaluar, :puede_ver_resultados)
              ON DUPLICATE KEY UPDATE
              puede_evaluar = VALUES(puede_evaluar),
              puede_ver_resultados = VALUES(puede_ver_resultados),
              fecha_actualizacion = NOW()";
    
    $stmt = $db->prepare($query);
    $result = $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':puede_evaluar' => $puede_evaluar,
        ':puede_ver_resultados' => $puede_ver_resultados
    ]);
    
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Query ejecutada: " . ($result ? 'éxito' : 'fallo') . "\n", FILE_APPEND);
    
    $db->commit();
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Commit realizado\n", FILE_APPEND);
    
    echo "SUCCESS: Permisos asignados correctamente\n";
    
} catch (Exception $e) {
    file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    
    if (isset($db) && $db->inTransaction()) {
        $db->rollback();
        file_put_contents('/tmp/debug_simple.log', date('Y-m-d H:i:s') . " - Rollback realizado\n", FILE_APPEND);
    }
    
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
