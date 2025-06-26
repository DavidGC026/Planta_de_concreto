<?php
/**
 * API para guardar evaluación completa con sistema de ponderación por secciones
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 * Sistema: ponderación por secciones de la tabla secciones_evaluacion
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
    $required_fields = ['usuario_id', 'tipo_evaluacion', 'respuestas'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_evaluacion = $input['tipo_evaluacion'];
    $rol_personal = $input['rol_personal'] ?? null;
    $tipo_planta = $input['tipo_planta'] ?? null;
    $categoria = $input['categoria'] ?? null;
    $respuestas = $input['respuestas'];
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
    
    // Obtener secciones con su ponderación
    $query = "SELECT 
                s.id as seccion_id,
                s.nombre as seccion_nombre,
                s.ponderacion,
                s.es_trampa
              FROM secciones_evaluacion s
              WHERE s.tipo_evaluacion_id = :tipo_evaluacion_id
                AND s.activo = 1
                AND (s.rol_personal_id IS NULL OR s.rol_personal_id = :rol_personal_id)
              ORDER BY s.orden";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':tipo_evaluacion_id' => $tipo_evaluacion_id,
        ':rol_personal_id' => $rol_personal_id
    ]);
    $secciones = $stmt->fetchAll();
    
    // Calcular puntuación por secciones usando ponderación
    $puntuacion_total = 0;
    $puntuacion_ponderada = 0;
    $respuestas_si = 0;
    $respuestas_no = 0;
    $respuestas_na = 0;
    $respuestas_a = 0;
    $respuestas_b = 0;
    $respuestas_c = 0;
    $total_preguntas_normales = 0;
    $preguntas_trampa_respondidas = 0;
    $preguntas_trampa_incorrectas = 0;
    
    // Log para debugging
    error_log("=== CÁLCULO DE PONDERACIÓN POR SECCIONES ===");
    
    foreach ($secciones as $seccion) {
        if ($seccion['es_trampa']) {
            continue; // Saltar secciones trampa para el cálculo principal
        }
        
        // Obtener preguntas de esta sección
        $query_preguntas = "SELECT id, tipo_pregunta, respuesta_correcta, es_trampa 
                           FROM preguntas 
                           WHERE seccion_id = :seccion_id AND activo = 1";
        $stmt_preguntas = $db->prepare($query_preguntas);
        $stmt_preguntas->bindParam(':seccion_id', $seccion['seccion_id']);
        $stmt_preguntas->execute();
        $preguntas_seccion = $stmt_preguntas->fetchAll();
        
        $preguntas_normales_seccion = 0;
        $respuestas_correctas_seccion = 0;
        
        foreach ($preguntas_seccion as $pregunta) {
            // Buscar la respuesta para esta pregunta
            $respuesta_encontrada = null;
            foreach ($respuestas as $respuesta) {
                if ($respuesta['pregunta_id'] == $pregunta['id']) {
                    $respuesta_encontrada = $respuesta['respuesta'];
                    break;
                }
            }
            
            if ($respuesta_encontrada === null) {
                continue; // Pregunta no respondida
            }
            
            // Contar respuestas por tipo
            switch ($respuesta_encontrada) {
                case 'si': $respuestas_si++; break;
                case 'no': $respuestas_no++; break;
                case 'na': $respuestas_na++; break;
                case 'a': $respuestas_a++; break;
                case 'b': $respuestas_b++; break;
                case 'c': $respuestas_c++; break;
            }
            
            // Si es pregunta trampa, verificar si es incorrecta
            if ($pregunta['es_trampa']) {
                $preguntas_trampa_respondidas++;
                
                $es_incorrecta = false;
                if ($pregunta['tipo_pregunta'] === 'seleccion_multiple') {
                    $es_incorrecta = ($respuesta_encontrada !== $pregunta['respuesta_correcta']);
                } else {
                    $es_incorrecta = ($respuesta_encontrada === 'no');
                }
                
                if ($es_incorrecta) {
                    $preguntas_trampa_incorrectas++;
                }
                
                continue; // No contar preguntas trampa en puntuación de sección
            }
            
            // Solo contar preguntas normales
            $preguntas_normales_seccion++;
            $total_preguntas_normales++;
            
            // Verificar si es correcta
            $es_correcta = false;
            if ($pregunta['tipo_pregunta'] === 'seleccion_multiple') {
                $es_correcta = ($respuesta_encontrada === $pregunta['respuesta_correcta']);
            } else {
                $es_correcta = ($respuesta_encontrada === 'si');
                // 'na' no cuenta como incorrecta, pero tampoco como correcta
                if ($respuesta_encontrada === 'na') {
                    $preguntas_normales_seccion--; // No contar N/A en el total
                    $total_preguntas_normales--;
                }
            }
            
            if ($es_correcta) {
                $respuestas_correctas_seccion++;
            }
        }
        
        // Calcular porcentaje de la sección
        $porcentaje_seccion = $preguntas_normales_seccion > 0 ? 
            ($respuestas_correctas_seccion / $preguntas_normales_seccion) * 100 : 0;
        
        // Calcular contribución ponderada de esta sección
        $contribucion_ponderada = ($porcentaje_seccion * $seccion['ponderacion']) / 100;
        $puntuacion_ponderada += $contribucion_ponderada;
        
        // Log para debugging
        error_log("Sección: {$seccion['seccion_nombre']}");
        error_log("  - Ponderación: {$seccion['ponderacion']}%");
        error_log("  - Preguntas normales: {$preguntas_normales_seccion}");
        error_log("  - Respuestas correctas: {$respuestas_correctas_seccion}");
        error_log("  - Porcentaje sección: " . round($porcentaje_seccion, 2) . "%");
        error_log("  - Contribución ponderada: " . round($contribucion_ponderada, 2));
    }
    
    // La puntuación total es la suma de puntos (10 por respuesta correcta)
    $puntuacion_total = 0;
    foreach ($respuestas as $respuesta) {
        $pregunta_id = $respuesta['pregunta_id'] ?? null;
        $respuesta_valor = $respuesta['respuesta'];
        
        if ($pregunta_id) {
            $query = "SELECT tipo_pregunta, respuesta_correcta, es_trampa
                      FROM preguntas 
                      WHERE id = :pregunta_id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':pregunta_id', $pregunta_id);
            $stmt->execute();
            $pregunta_info = $stmt->fetch();
            
            if ($pregunta_info && !$pregunta_info['es_trampa']) {
                if ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple') {
                    if ($respuesta_valor === $pregunta_info['respuesta_correcta']) {
                        $puntuacion_total += 10;
                    }
                } else {
                    if ($respuesta_valor === 'si') {
                        $puntuacion_total += 10;
                    }
                }
            }
        }
    }
    
    // Determinar si reprueba por preguntas trampa
    $reprobado_por_trampa = $preguntas_trampa_incorrectas >= 2;
    
    error_log("=== RESULTADO FINAL ===");
    error_log("Puntuación ponderada final: " . round($puntuacion_ponderada, 2) . "%");
    error_log("Preguntas trampa incorrectas: {$preguntas_trampa_incorrectas}");
    error_log("Reprobado por trampa: " . ($reprobado_por_trampa ? 'SÍ' : 'NO'));
    
    // Insertar evaluación
    $query = "INSERT INTO evaluaciones 
              (usuario_id, tipo_evaluacion_id, rol_personal_id, puntuacion_total, puntuacion_ponderada,
               total_preguntas, respuestas_si, respuestas_no, respuestas_na, 
               preguntas_trampa_respondidas, preguntas_trampa_incorrectas, estado, fecha_finalizacion, observaciones)
              VALUES 
              (:usuario_id, :tipo_evaluacion_id, :rol_personal_id, :puntuacion_total, :puntuacion_ponderada,
               :total_preguntas, :respuestas_si, :respuestas_no, :respuestas_na,
               :preguntas_trampa_respondidas, :preguntas_trampa_incorrectas, 'completada', NOW(), :observaciones)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':tipo_evaluacion_id' => $tipo_evaluacion_id,
        ':rol_personal_id' => $rol_personal_id,
        ':puntuacion_total' => $puntuacion_total,
        ':puntuacion_ponderada' => $puntuacion_ponderada,
        ':total_preguntas' => $total_preguntas_normales,
        ':respuestas_si' => $respuestas_si,
        ':respuestas_no' => $respuestas_no,
        ':respuestas_na' => $respuestas_na,
        ':preguntas_trampa_respondidas' => $preguntas_trampa_respondidas,
        ':preguntas_trampa_incorrectas' => $preguntas_trampa_incorrectas,
        ':observaciones' => $observaciones
    ]);
    
    $evaluacion_id = $db->lastInsertId();
    
    // Insertar respuestas individuales
    $query = "INSERT INTO respuestas_evaluacion 
              (evaluacion_id, pregunta_id, respuesta, observacion, es_trampa, ponderacion_obtenida, subseccion_id)
              VALUES (:evaluacion_id, :pregunta_id, :respuesta, :observacion, :es_trampa, :ponderacion_obtenida, :subseccion_id)";
    
    $stmt = $db->prepare($query);
    
    foreach ($respuestas as $respuesta) {
        $pregunta_id = $respuesta['pregunta_id'] ?? null;
        $respuesta_valor = $respuesta['respuesta'];
        $observacion = $respuesta['observacion'] ?? null;
        
        $es_trampa = false;
        $ponderacion_obtenida = 0;
        $subseccion_id = null;
        
        if ($pregunta_id) {
            $query_info = "SELECT 
                            p.es_trampa,
                            p.subseccion_id,
                            p.tipo_pregunta,
                            p.respuesta_correcta
                          FROM preguntas p
                          WHERE p.id = :pregunta_id";
            
            $stmt_info = $db->prepare($query_info);
            $stmt_info->bindParam(':pregunta_id', $pregunta_id);
            $stmt_info->execute();
            $pregunta_info = $stmt_info->fetch();
            
            if ($pregunta_info) {
                $es_trampa = $pregunta_info['es_trampa'];
                $subseccion_id = $pregunta_info['subseccion_id'];
                
                if (!$es_trampa) {
                    if ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple') {
                        if ($respuesta_valor === $pregunta_info['respuesta_correcta']) {
                            $ponderacion_obtenida = 10;
                        }
                    } else {
                        if ($respuesta_valor === 'si') {
                            $ponderacion_obtenida = 10;
                        }
                    }
                }
            }
        }
        
        $stmt->execute([
            ':evaluacion_id' => $evaluacion_id,
            ':pregunta_id' => $pregunta_id,
            ':respuesta' => $respuesta_valor,
            ':observacion' => $observacion,
            ':es_trampa' => $es_trampa ? 1 : 0,
            ':ponderacion_obtenida' => $ponderacion_obtenida,
            ':subseccion_id' => $subseccion_id
        ]);
    }
    
    // Confirmar transacción
    $db->commit();
    
    // Determinar resultado
    $resultado = 'REPROBADO';
    
    if ($reprobado_por_trampa) {
        $resultado = 'REPROBADO POR PREGUNTAS TRAMPA';
    } elseif ($tipo_evaluacion === 'operacion') {
        if ($puntuacion_ponderada >= 80) $resultado = 'EXCELENTE';
        elseif ($puntuacion_ponderada >= 60) $resultado = 'BUENO';
        elseif ($puntuacion_ponderada >= 40) $resultado = 'REGULAR';
        else $resultado = 'DEFICIENTE';
    } elseif ($tipo_evaluacion === 'personal') {
        $resultado = $puntuacion_ponderada >= 91 ? 'APROBADO' : 'REPROBADO';
    } else {
        $resultado = $puntuacion_ponderada >= 70 ? 'APROBADO' : 'REPROBADO';
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'evaluacion_id' => $evaluacion_id,
            'puntuacion_total' => $puntuacion_total,
            'puntuacion_ponderada' => $puntuacion_ponderada,
            'resultado' => $resultado,
            'tipo_evaluacion' => $tipo_evaluacion,
            'reprobado_por_trampa' => $reprobado_por_trampa,
            'estadisticas' => [
                'total_preguntas' => $total_preguntas_normales,
                'preguntas_trampa_respondidas' => $preguntas_trampa_respondidas,
                'preguntas_trampa_incorrectas' => $preguntas_trampa_incorrectas,
                'respuestas_si' => $respuestas_si,
                'respuestas_no' => $respuestas_no,
                'respuestas_na' => $respuestas_na,
                'respuestas_a' => $respuestas_a,
                'respuestas_b' => $respuestas_b,
                'respuestas_c' => $respuestas_c
            ],
            'configuracion' => [
                'tipo_planta' => $tipo_planta,
                'categoria' => $categoria,
                'rol_personal' => $rol_personal,
                'sistema_ponderacion' => 'Por secciones de tabla secciones_evaluacion'
            ]
        ]
    ]);
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollback();
    }
    
    error_log("Error en guardar.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    handleError('Error al guardar evaluación: ' . $e->getMessage());
}
?>