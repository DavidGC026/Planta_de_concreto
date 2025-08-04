<?php
/**
 * API para guardar evaluación de Jefe de Planta
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Método no permitido', 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Datos JSON inválidos', 400);
    }
    
    // Validar datos requeridos
    $required_fields = ['usuario_id', 'tipo_evaluacion', 'respuestas'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_evaluacion = $input['tipo_evaluacion'];
    $respuestas = $input['respuestas'];
    
    // Calcular puntuación
    $puntuacion_total = 0;
    $respuestas_si = 0;
    $respuestas_no = 0;
    $respuestas_na = 0;
    $total_preguntas = count($respuestas);
    
    foreach ($respuestas as $respuesta) {
        $respuesta_valor = $respuesta['respuesta'];
        
        switch ($respuesta_valor) {
            case 'si': 
                $respuestas_si++; 
                $puntuacion_total += 10;
                break;
            case 'no': 
                $respuestas_no++; 
                break;
            case 'na': 
                $respuestas_na++; 
                break;
        }
    }
    
    // Calcular porcentaje (solo contar preguntas respondidas con sí/no)
    $preguntas_evaluadas = $respuestas_si + $respuestas_no;
    $puntuacion_ponderada = $preguntas_evaluadas > 0 ? 
        ($respuestas_si / $preguntas_evaluadas) * 100 : 0;
    
    // Determinar resultado
    $resultado = $puntuacion_ponderada >= 91 ? 'APROBADO' : 'REPROBADO';
    
    // Simular guardado en base de datos
    $evaluacion_id = time(); // ID simulado
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'evaluacion_id' => $evaluacion_id,
            'puntuacion_total' => $puntuacion_total,
            'puntuacion_ponderada' => $puntuacion_ponderada,
            'resultado' => $resultado,
            'tipo_evaluacion' => $tipo_evaluacion,
            'estadisticas' => [
                'total_preguntas' => $total_preguntas,
                'respuestas_si' => $respuestas_si,
                'respuestas_no' => $respuestas_no,
                'respuestas_na' => $respuestas_na
            ]
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en guardar.php: " . $e->getMessage());
    handleError('Error al guardar evaluación: ' . $e->getMessage());
}
?>