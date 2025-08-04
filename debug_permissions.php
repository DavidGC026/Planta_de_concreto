<?php
/**
 * Script de debug para probar la asignación de permisos
 */

require_once 'api/config/database.php';

// Simular la solicitud que está fallando
$test_data = [
    'usuario_id' => 10,
    'tipo_evaluacion' => 'equipo',
    'puede_evaluar' => true
];

echo "=== DEBUG: Asignación de Permisos ===\n";
echo "Datos de prueba: " . json_encode($test_data) . "\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "✓ Conexión a la base de datos exitosa\n";
    
    // Verificar si el usuario existe
    $user_check = "SELECT id, username FROM usuarios WHERE id = :usuario_id";
    $stmt = $db->prepare($user_check);
    $stmt->execute([':usuario_id' => $test_data['usuario_id']]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo "✓ Usuario encontrado: " . $user['username'] . " (ID: " . $user['id'] . ")\n";
    } else {
        echo "✗ Usuario no encontrado con ID: " . $test_data['usuario_id'] . "\n";
        exit(1);
    }
    
    // Verificar si la tabla permisos_equipo existe
    $table_check = "SHOW TABLES LIKE 'permisos_equipo'";
    $stmt = $db->prepare($table_check);
    $stmt->execute();
    $table_exists = $stmt->fetch();
    
    if ($table_exists) {
        echo "✓ Tabla permisos_equipo existe\n";
    } else {
        echo "⚠ Tabla permisos_equipo no existe, se creará automáticamente\n";
    }
    
    // Intentar crear la tabla si no existe
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
    echo "✓ Tabla permisos_equipo verificada/creada\n";
    
    // Intentar insertar permisos
    $db->beginTransaction();
    
    $query = "INSERT INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
              VALUES (:usuario_id, :puede_evaluar, :puede_ver_resultados)
              ON DUPLICATE KEY UPDATE
              puede_evaluar = VALUES(puede_evaluar),
              puede_ver_resultados = VALUES(puede_ver_resultados),
              fecha_actualizacion = NOW()";
    
    $stmt = $db->prepare($query);
    $result = $stmt->execute([
        ':usuario_id' => $test_data['usuario_id'],
        ':puede_evaluar' => $test_data['puede_evaluar'],
        ':puede_ver_resultados' => true
    ]);
    
    if ($result) {
        echo "✓ Permisos de equipo asignados exitosamente\n";
        $db->commit();
        
        // Verificar la inserción
        $verify_query = "SELECT * FROM permisos_equipo WHERE usuario_id = :usuario_id";
        $verify_stmt = $db->prepare($verify_query);
        $verify_stmt->execute([':usuario_id' => $test_data['usuario_id']]);
        $permission = $verify_stmt->fetch();
        
        echo "Permisos verificados: " . json_encode($permission) . "\n";
    } else {
        echo "✗ Error al asignar permisos\n";
        $db->rollback();
    }
    
} catch (Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DEBUG ===\n";
?>
