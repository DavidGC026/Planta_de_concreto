<?php
/**
 * API para guardar progreso de subsección individual (específico para evaluación de equipo)
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
    $required_fields = ['usuario_id', 'tipo_evaluacion', 'subseccion_nombre', 'subseccion_orden'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_evaluacion = $input['tipo_evaluacion'];
    $subseccion_nombre = $input['subseccion_nombre'];
    $subseccion_orden = $input['subseccion_orden'];
    $puntaje_subseccion = $input['puntaje_subseccion'] ?? 0;
    $puntaje_porcentaje = $input['puntaje_porcentaje'] ?? 0;
    $respuestas_correctas = $input['respuestas_correctas'] ?? 0;
    $total_preguntas = $input['total_preguntas'] ?? 0;
    $tipo_planta = $input['tipo_planta'] ?? null;
    $categoria = $input['categoria'] ?? null;
    $rol_personal = $input['rol_personal'] ?? null;
    
    // Crear tabla si no existe (versión mejorada para subsecciones)
    $create_table_query = "
        CREATE TABLE IF NOT EXISTS progreso_subsecciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            tipo_evaluacion VARCHAR(50) NOT NULL,
            subseccion_nombre VARCHAR(200) NOT NULL,
            subseccion_orden INT NOT NULL,
            puntaje_subseccion DECIMAL(5,2) DEFAULT 0.00,
            puntaje_porcentaje DECIMAL(5,2) DEFAULT 0.00,
            respuestas_correctas INT DEFAULT 0,
            total_preguntas INT DEFAULT 0,
            tipo_planta VARCHAR(50) NULL,
            categoria VARCHAR(50) NULL,
            rol_personal VARCHAR(50) NULL,
            fecha_completada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE KEY unique_progreso_subseccion (usuario_id, tipo_evaluacion, subseccion_orden, tipo_planta, categoria, rol_personal)
        )
    ";
    
    $db->exec($create_table_query);
    
    // Insertar o actualizar progreso de subsección
    $query = "INSERT INTO progreso_subsecciones 
              (usuario_id, tipo_evaluacion, subseccion_nombre, subseccion_orden, 
               puntaje_subseccion, puntaje_porcentaje, respuestas_correctas, total_preguntas,
               tipo_planta, categoria, rol_personal, fecha_completada)
              VALUES 
              (:usuario_id, :tipo_evaluacion, :subseccion_nombre, :subseccion_orden,
               :puntaje_subseccion, :puntaje_porcentaje, :respuestas_correctas, :total_preguntas,
               :tipo_planta, :categoria, :rol_personal, NOW())
              ON DUPLICATE KEY UPDATE
              subseccion_nombre = VALUES(subseccion_nombre),
              puntaje_subseccion = VALUES(puntaje_subseccion),
              puntaje_porcentaje = VALUES(puntaje_porcentaje),
              respuestas_correctas = VALUES(respuestas_correctas),
              total_preguntas = VALUES(total_preguntas),
              fecha_actualizacion = NOW()";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':tipo_evaluacion' => $tipo_evaluacion,
        ':subseccion_nombre' => $subseccion_nombre,
        ':subseccion_orden' => $subseccion_orden,
        ':puntaje_subseccion' => $puntaje_subseccion,
        ':puntaje_porcentaje' => $puntaje_porcentaje,
        ':respuestas_correctas' => $respuestas_correctas,
        ':total_preguntas' => $total_preguntas,
        ':tipo_planta' => $tipo_planta,
        ':categoria' => $categoria,
        ':rol_personal' => $rol_personal
    ]);
    
    $progreso_id = $db->lastInsertId() ?: $db->query("SELECT id FROM progreso_subsecciones WHERE usuario_id = $usuario_id AND tipo_evaluacion = '$tipo_evaluacion' AND subseccion_orden = $subseccion_orden")->fetchColumn();
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'progreso_id' => $progreso_id,
            'subseccion_nombre' => $subseccion_nombre,
            'puntaje_subseccion' => $puntaje_subseccion,
            'puntaje_porcentaje' => $puntaje_porcentaje,
            'mensaje' => 'Progreso de subsección guardado exitosamente'
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error al guardar progreso de subsección: ' . $e->getMessage());
}
?>