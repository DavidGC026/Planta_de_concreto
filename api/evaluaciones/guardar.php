<?php
/**
 * API para guardar evaluación completa
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
    $required_fields = ['usuario_id', 'tipo_evaluacion', 'respuestas', 'puntuacion_total'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_evaluacion = $input['tipo_evaluacion'];
    $rol_personal = $input['rol_personal'] ?? null;
    $respuestas = $input['respuestas'];
    $puntuacion_total = $input['puntuacion_total'];
    $observaciones = $input['observaciones'] ?? null;
    
    // Iniciar transacción
    $db->beginTransaction();
    
    // Obtener ID del tipo de evaluación
    $query = "SELECT id FROM tipos_evaluacion WHERE codigo = :codigo";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':codigo', $tipo_evaluacion);
    $stmt->execute();
    $tipo_evaluacion_id = $stmt->fetchColumn();
    
    if (!$tipo_evaluacion_id) {
        throw new Exception('Tipo de evaluación no válido');
    }
    
    // Obtener ID del rol de personal si aplica
    $rol_personal_id = null;
    if ($rol_personal) {
        $query = "SELECT id FROM roles_personal WHERE codigo = :codigo";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':codigo', $rol_personal);
        $stmt->execute();
        $rol_personal_id = $stmt->fetchColumn();
    }
    
    // Calcular estadísticas de respuestas
    $respuestas_si = 0;
    $respuestas_no = 0;
    $respuestas_na = 0;
    $respuestas_a = 0;
    $respuestas_b = 0;
    $respuestas_c = 0;
    $total_preguntas = count($respuestas);
    
    foreach ($respuestas as $respuesta) {
        switch ($respuesta['respuesta']) {
            case 'si':
                $respuestas_si++;
                break;
            case 'no':
                $respuestas_no++;
                break;
            case 'na':
                $respuestas_na++;
                break;
            case 'a':
                $respuestas_a++;
                break;
            case 'b':
                $respuestas_b++;
                break;
            case 'c':
                $respuestas_c++;
                break;
        }
    }
    
    // Insertar evaluación
    $query = "INSERT INTO evaluaciones 
              (usuario_id, tipo_evaluacion_id, rol_personal_id, puntuacion_total, 
               total_preguntas, respuestas_si, respuestas_no, respuestas_na, 
               estado, fecha_finalizacion, observaciones)
              VALUES 
              (:usuario_id, :tipo_evaluacion_id, :rol_personal_id, :puntuacion_total,
               :total_preguntas, :respuestas_si, :respuestas_no, :respuestas_na,
               'completada', NOW(), :observaciones)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':tipo_evaluacion_id' => $tipo_evaluacion_id,
        ':rol_personal_id' => $rol_personal_id,
        ':puntuacion_total' => $puntuacion_total,
        ':total_preguntas' => $total_preguntas,
        ':respuestas_si' => $respuestas_si,
        ':respuestas_no' => $respuestas_no,
        ':respuestas_na' => $respuestas_na,
        ':observaciones' => $observaciones
    ]);
    
    $evaluacion_id = $db->lastInsertId();
    
    // Insertar respuestas individuales
    $query = "INSERT INTO respuestas_evaluacion 
              (evaluacion_id, pregunta_id, respuesta, observacion)
              VALUES (:evaluacion_id, :pregunta_id, :respuesta, :observacion)";
    
    $stmt = $db->prepare($query);
    
    foreach ($respuestas as $respuesta) {
        // Para preguntas de selección múltiple, usar el ID real de la pregunta
        $pregunta_id = is_numeric($respuesta['pregunta_id']) ? 
                      $respuesta['pregunta_id'] : 
                      null; // Para evaluaciones de estado de planta
        
        $stmt->execute([
            ':evaluacion_id' => $evaluacion_id,
            ':pregunta_id' => $pregunta_id,
            ':respuesta' => $respuesta['respuesta'],
            ':observacion' => $respuesta['observacion'] ?? null
        ]);
    }
    
    // Confirmar transacción
    $db->commit();
    
    // Determinar resultado basado en el tipo de evaluación
    $resultado = 'REPROBADO';
    if ($tipo_evaluacion === 'operacion') {
        // Para evaluación de operación, usar escala diferente
        if ($puntuacion_total >= 80) $resultado = 'EXCELENTE';
        elseif ($puntuacion_total >= 60) $resultado = 'BUENO';
        elseif ($puntuacion_total >= 40) $resultado = 'REGULAR';
        else $resultado = 'DEFICIENTE';
    } else {
        // Para evaluaciones de personal y equipo
        $resultado = $puntuacion_total >= 70 ? 'APROBADO' : 'REPROBADO';
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'evaluacion_id' => $evaluacion_id,
            'puntuacion_total' => $puntuacion_total,
            'resultado' => $resultado,
            'estadisticas' => [
                'total_preguntas' => $total_preguntas,
                'respuestas_si' => $respuestas_si,
                'respuestas_no' => $respuestas_no,
                'respuestas_na' => $respuestas_na,
                'respuestas_a' => $respuestas_a,
                'respuestas_b' => $respuestas_b,
                'respuestas_c' => $respuestas_c
            ]
        ]
    ]);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if ($db->inTransaction()) {
        $db->rollback();
    }
    handleError('Error al guardar evaluación: ' . $e->getMessage());
}
?>