<?php
/**
 * API para guardar progreso de sección individual
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Método no permitido', 405);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Obtener datos del request
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    $required_fields = ['usuario_id', 'tipo_evaluacion', 'seccion_nombre', 'seccion_orden'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_evaluacion = $input['tipo_evaluacion'];
    $seccion_nombre = $input['seccion_nombre'];
    $seccion_orden = $input['seccion_orden'];
    $puntaje_seccion = $input['puntaje_seccion'] ?? 0;
    $puntaje_porcentaje = $input['puntaje_porcentaje'] ?? 0;
    $respuestas_correctas = $input['respuestas_correctas'] ?? 0;
    $total_preguntas = $input['total_preguntas'] ?? 0;
    $tipo_planta = $input['tipo_planta'] ?? null;
    $categoria = $input['categoria'] ?? null;
    
    // Crear tabla si no existe
    $create_table_query = "
        CREATE TABLE IF NOT EXISTS progreso_secciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            tipo_evaluacion VARCHAR(50) NOT NULL,
            seccion_nombre VARCHAR(200) NOT NULL,
            seccion_orden INT NOT NULL,
            puntaje_seccion DECIMAL(5,2) DEFAULT 0.00,
            puntaje_porcentaje DECIMAL(5,2) DEFAULT 0.00,
            respuestas_correctas INT DEFAULT 0,
            total_preguntas INT DEFAULT 0,
            tipo_planta VARCHAR(50) NULL,
            categoria VARCHAR(50) NULL,
            fecha_completada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE KEY unique_progreso (usuario_id, tipo_evaluacion, seccion_orden, tipo_planta, categoria)
        )
    ";
    
    $db->exec($create_table_query);
    
    // Insertar o actualizar progreso de sección
    $query = "INSERT INTO progreso_secciones 
              (usuario_id, tipo_evaluacion, seccion_nombre, seccion_orden, 
               puntaje_seccion, puntaje_porcentaje, respuestas_correctas, total_preguntas,
               tipo_planta, categoria, fecha_completada)
              VALUES 
              (:usuario_id, :tipo_evaluacion, :seccion_nombre, :seccion_orden,
               :puntaje_seccion, :puntaje_porcentaje, :respuestas_correctas, :total_preguntas,
               :tipo_planta, :categoria, NOW())
              ON DUPLICATE KEY UPDATE
              seccion_nombre = VALUES(seccion_nombre),
              puntaje_seccion = VALUES(puntaje_seccion),
              puntaje_porcentaje = VALUES(puntaje_porcentaje),
              respuestas_correctas = VALUES(respuestas_correctas),
              total_preguntas = VALUES(total_preguntas),
              fecha_actualizacion = NOW()";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':tipo_evaluacion' => $tipo_evaluacion,
        ':seccion_nombre' => $seccion_nombre,
        ':seccion_orden' => $seccion_orden,
        ':puntaje_seccion' => $puntaje_seccion,
        ':puntaje_porcentaje' => $puntaje_porcentaje,
        ':respuestas_correctas' => $respuestas_correctas,
        ':total_preguntas' => $total_preguntas,
        ':tipo_planta' => $tipo_planta,
        ':categoria' => $categoria
    ]);
    
    $progreso_id = $db->lastInsertId() ?: $db->query("SELECT id FROM progreso_secciones WHERE usuario_id = $usuario_id AND tipo_evaluacion = '$tipo_evaluacion' AND seccion_orden = $seccion_orden")->fetchColumn();
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'progreso_id' => $progreso_id,
            'seccion_nombre' => $seccion_nombre,
            'puntaje_seccion' => $puntaje_seccion,
            'puntaje_porcentaje' => $puntaje_porcentaje,
            'mensaje' => 'Progreso de sección guardado exitosamente'
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error al guardar progreso de sección: ' . $e->getMessage());
}
?>