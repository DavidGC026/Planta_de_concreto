<?php
/**
 * API para guardar evaluación completa con sistema de ponderación y subsecciones
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 * Actualizado para nueva estructura de BD con subsecciones
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
    
    // Verificar si las tablas tienen las columnas necesarias y agregarlas si no existen
    try {
        // Verificar y agregar columna puntuacion_ponderada
        $check_column = $db->query("SHOW COLUMNS FROM evaluaciones LIKE 'puntuacion_ponderada'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE evaluaciones ADD COLUMN puntuacion_ponderada DECIMAL(5,2) DEFAULT 0.00");
        }
        
        // Verificar y agregar columna preguntas_trampa_respondidas
        $check_column = $db->query("SHOW COLUMNS FROM evaluaciones LIKE 'preguntas_trampa_respondidas'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE evaluaciones ADD COLUMN preguntas_trampa_respondidas INT DEFAULT 0");
        }
        
        // Verificar y agregar columnas en respuestas_evaluacion
        $check_column = $db->query("SHOW COLUMNS FROM respuestas_evaluacion LIKE 'es_trampa'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE respuestas_evaluacion ADD COLUMN es_trampa BOOLEAN DEFAULT FALSE");
        }
        
        $check_column = $db->query("SHOW COLUMNS FROM respuestas_evaluacion LIKE 'ponderacion_obtenida'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE respuestas_evaluacion ADD COLUMN ponderacion_obtenida DECIMAL(5,2) DEFAULT 0.00");
        }
        
        $check_column = $db->query("SHOW COLUMNS FROM respuestas_evaluacion LIKE 'subseccion_id'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE respuestas_evaluacion ADD COLUMN subseccion_id INT NULL");
        }
        
    } catch (Exception $e) {
        // Las columnas ya existen o hay un error, continuar
        error_log("Error verificando/agregando columnas: " . $e->getMessage());
    }
    
    // Calcular puntuación ponderada
    $puntuacion_total = 0;
    $puntuacion_ponderada = 0;
    $respuestas_si = 0;
    $respuestas_no = 0;
    $respuestas_na = 0;
    $respuestas_a = 0;
    $respuestas_b = 0;
    $respuestas_c = 0;
    $total_preguntas = 0;
    $preguntas_trampa_respondidas = 0;
    
    foreach ($respuestas as $respuesta) {
        $pregunta_id = $respuesta['pregunta_id'] ?? null;
        $respuesta_valor = $respuesta['respuesta'];
        
        // Obtener información de la pregunta y su ponderación
        if ($pregunta_id) {
            // Query actualizada para manejar subsecciones
            $query = "SELECT 
                        p.es_trampa,
                        p.ponderacion_individual,
                        COALESCE(sub.ponderacion_subseccion, s.ponderacion) as seccion_ponderacion,
                        p.tipo_pregunta,
                        p.respuesta_correcta,
                        p.subseccion_id,
                        s.id as seccion_id,
                        s.nombre as seccion_nombre,
                        sub.nombre as subseccion_nombre,
                        (SELECT COUNT(*) FROM preguntas p2 
                         WHERE (p2.subseccion_id = p.subseccion_id OR (p2.subseccion_id IS NULL AND p2.seccion_id = s.id))
                         AND p2.activo = 1 
                         AND p2.es_trampa = 0) as preguntas_normales_seccion
                      FROM preguntas p
                      JOIN secciones_evaluacion s ON p.seccion_id = s.id
                      LEFT JOIN subsecciones_evaluacion sub ON p.subseccion_id = sub.id
                      WHERE p.id = :pregunta_id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':pregunta_id', $pregunta_id);
            $stmt->execute();
            $pregunta_info = $stmt->fetch();
            
            if ($pregunta_info) {
                // Contar respuestas por tipo
                switch ($respuesta_valor) {
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
                
                // Si es pregunta trampa, solo contar pero no sumar puntos
                if ($pregunta_info['es_trampa']) {
                    $preguntas_trampa_respondidas++;
                    continue;
                }
                
                $total_preguntas++;
                
                // Calcular ponderación de la pregunta
                $ponderacion_pregunta = $pregunta_info['ponderacion_individual'];
                if ($ponderacion_pregunta <= 0 && $pregunta_info['preguntas_normales_seccion'] > 0) {
                    $ponderacion_pregunta = $pregunta_info['seccion_ponderacion'] / $pregunta_info['preguntas_normales_seccion'];
                }
                
                // Calcular puntos según tipo de pregunta
                $puntos_pregunta = 0;
                
                if ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple') {
                    // Para preguntas de selección múltiple, verificar respuesta correcta
                    if ($respuesta_valor === $pregunta_info['respuesta_correcta']) {
                        $puntos_pregunta = $ponderacion_pregunta;
                    }
                } else {
                    // Para preguntas abiertas (Sí/No/NA)
                    if ($respuesta_valor === 'si') {
                        $puntos_pregunta = $ponderacion_pregunta;
                    }
                    // 'no' = 0 puntos, 'na' no cuenta para el total
                    if ($respuesta_valor === 'na') {
                        $total_preguntas--; // No contar preguntas N/A en el total
                    }
                }
                
                $puntuacion_ponderada += $puntos_pregunta;
                $puntuacion_total += ($respuesta_valor === 'si' || 
                                    ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple' && 
                                     $respuesta_valor === $pregunta_info['respuesta_correcta'])) ? 10 : 0;
            }
        }
    }
    
    // Insertar evaluación
    $query = "INSERT INTO evaluaciones 
              (usuario_id, tipo_evaluacion_id, rol_personal_id, puntuacion_total, puntuacion_ponderada,
               total_preguntas, respuestas_si, respuestas_no, respuestas_na, 
               preguntas_trampa_respondidas, estado, fecha_finalizacion, observaciones)
              VALUES 
              (:usuario_id, :tipo_evaluacion_id, :rol_personal_id, :puntuacion_total, :puntuacion_ponderada,
               :total_preguntas, :respuestas_si, :respuestas_no, :respuestas_na,
               :preguntas_trampa_respondidas, 'completada', NOW(), :observaciones)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':usuario_id' => $usuario_id,
        ':tipo_evaluacion_id' => $tipo_evaluacion_id,
        ':rol_personal_id' => $rol_personal_id,
        ':puntuacion_total' => $puntuacion_total,
        ':puntuacion_ponderada' => $puntuacion_ponderada,
        ':total_preguntas' => $total_preguntas,
        ':respuestas_si' => $respuestas_si,
        ':respuestas_no' => $respuestas_no,
        ':respuestas_na' => $respuestas_na,
        ':preguntas_trampa_respondidas' => $preguntas_trampa_respondidas,
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
        
        // Determinar si es trampa y calcular ponderación obtenida
        $es_trampa = false;
        $ponderacion_obtenida = 0;
        $subseccion_id = null;
        
        if ($pregunta_id) {
            $query_info = "SELECT 
                            p.es_trampa,
                            p.ponderacion_individual,
                            p.subseccion_id,
                            COALESCE(sub.ponderacion_subseccion, s.ponderacion) as seccion_ponderacion,
                            p.tipo_pregunta,
                            p.respuesta_correcta,
                            (SELECT COUNT(*) FROM preguntas p2 
                             WHERE (p2.subseccion_id = p.subseccion_id OR (p2.subseccion_id IS NULL AND p2.seccion_id = s.id))
                             AND p2.activo = 1 
                             AND p2.es_trampa = 0) as preguntas_normales_seccion
                          FROM preguntas p
                          JOIN secciones_evaluacion s ON p.seccion_id = s.id
                          LEFT JOIN subsecciones_evaluacion sub ON p.subseccion_id = sub.id
                          WHERE p.id = :pregunta_id";
            
            $stmt_info = $db->prepare($query_info);
            $stmt_info->bindParam(':pregunta_id', $pregunta_id);
            $stmt_info->execute();
            $pregunta_info = $stmt_info->fetch();
            
            if ($pregunta_info) {
                $es_trampa = $pregunta_info['es_trampa'];
                $subseccion_id = $pregunta_info['subseccion_id'];
                
                if (!$es_trampa) {
                    $ponderacion_pregunta = $pregunta_info['ponderacion_individual'];
                    if ($ponderacion_pregunta <= 0 && $pregunta_info['preguntas_normales_seccion'] > 0) {
                        $ponderacion_pregunta = $pregunta_info['seccion_ponderacion'] / $pregunta_info['preguntas_normales_seccion'];
                    }
                    
                    if ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple') {
                        if ($respuesta_valor === $pregunta_info['respuesta_correcta']) {
                            $ponderacion_obtenida = $ponderacion_pregunta;
                        }
                    } else {
                        if ($respuesta_valor === 'si') {
                            $ponderacion_obtenida = $ponderacion_pregunta;
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
    
    // Determinar resultado basado en puntuación ponderada
    $resultado = 'REPROBADO';
    if ($tipo_evaluacion === 'operacion') {
        // Para evaluación de operación, usar escala diferente
        if ($puntuacion_ponderada >= 80) $resultado = 'EXCELENTE';
        elseif ($puntuacion_ponderada >= 60) $resultado = 'BUENO';
        elseif ($puntuacion_ponderada >= 40) $resultado = 'REGULAR';
        else $resultado = 'DEFICIENTE';
    } elseif ($tipo_evaluacion === 'personal') {
        // Para evaluación de personal, usar criterio de 90%
        $resultado = $puntuacion_ponderada >= 90 ? 'APROBADO' : 'REPROBADO';
    } else {
        // Para evaluaciones de equipo y otras
        $resultado = $puntuacion_ponderada >= 70 ? 'APROBADO' : 'REPROBADO';
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'evaluacion_id' => $evaluacion_id,
            'puntuacion_total' => $puntuacion_total,
            'puntuacion_ponderada' => round($puntuacion_ponderada, 2),
            'resultado' => $resultado,
            'tipo_evaluacion' => $tipo_evaluacion,
            'estadisticas' => [
                'total_preguntas' => $total_preguntas,
                'preguntas_trampa_respondidas' => $preguntas_trampa_respondidas,
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
                'rol_personal' => $rol_personal
            ]
        ]
    ]);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if ($db->inTransaction()) {
        $db->rollback();
    }
    
    // Log del error para debugging
    error_log("Error en guardar.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    handleError('Error al guardar evaluación: ' . $e->getMessage());
}
?>