<?php
/**
 * API para guardar evaluación completa con sistema simplificado
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 * Sistema simplificado: puntuación por preguntas correctas + filtro de preguntas trampa
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
        // Verificar y agregar columna puntuacion_ponderada (ahora será puntuación simple)
        $check_column = $db->query("SHOW COLUMNS FROM evaluaciones LIKE 'puntuacion_ponderada'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE evaluaciones ADD COLUMN puntuacion_ponderada DECIMAL(5,2) DEFAULT 0.00");
        }
        
        // Verificar y agregar columna preguntas_trampa_respondidas
        $check_column = $db->query("SHOW COLUMNS FROM evaluaciones LIKE 'preguntas_trampa_respondidas'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE evaluaciones ADD COLUMN preguntas_trampa_respondidas INT DEFAULT 0");
        }
        
        // Verificar y agregar columna preguntas_trampa_incorrectas
        $check_column = $db->query("SHOW COLUMNS FROM evaluaciones LIKE 'preguntas_trampa_incorrectas'");
        if ($check_column->rowCount() == 0) {
            $db->exec("ALTER TABLE evaluaciones ADD COLUMN preguntas_trampa_incorrectas INT DEFAULT 0");
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
    
    // Calcular puntuación simplificada
    $puntuacion_total = 0;
    $puntuacion_simple = 0; // Puntuación basada solo en preguntas normales
    $respuestas_si = 0;
    $respuestas_no = 0;
    $respuestas_na = 0;
    $respuestas_a = 0;
    $respuestas_b = 0;
    $respuestas_c = 0;
    $total_preguntas_normales = 0;
    $preguntas_trampa_respondidas = 0;
    $preguntas_trampa_incorrectas = 0;
    
    foreach ($respuestas as $respuesta) {
        $pregunta_id = $respuesta['pregunta_id'] ?? null;
        $respuesta_valor = $respuesta['respuesta'];
        
        // Obtener información de la pregunta
        if ($pregunta_id) {
            $query = "SELECT 
                        p.es_trampa,
                        p.tipo_pregunta,
                        p.respuesta_correcta,
                        p.subseccion_id,
                        s.id as seccion_id,
                        s.nombre as seccion_nombre
                      FROM preguntas p
                      JOIN secciones_evaluacion s ON p.seccion_id = s.id
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
                
                // Si es pregunta trampa, verificar si es incorrecta
                if ($pregunta_info['es_trampa']) {
                    $preguntas_trampa_respondidas++;
                    
                    // Verificar si la respuesta trampa es incorrecta
                    $es_incorrecta = false;
                    if ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple') {
                        $es_incorrecta = ($respuesta_valor !== $pregunta_info['respuesta_correcta']);
                    } else {
                        // Para preguntas abiertas, "no" se considera incorrecto
                        $es_incorrecta = ($respuesta_valor === 'no');
                    }
                    
                    if ($es_incorrecta) {
                        $preguntas_trampa_incorrectas++;
                    }
                    
                    continue; // No contar preguntas trampa en puntuación
                }
                
                // Solo contar preguntas normales
                $total_preguntas_normales++;
                
                // Calcular puntos para preguntas normales (10 puntos por respuesta correcta)
                if ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple') {
                    // Para preguntas de selección múltiple, verificar respuesta correcta
                    if ($respuesta_valor === $pregunta_info['respuesta_correcta']) {
                        $puntuacion_simple += 10;
                        $puntuacion_total += 10;
                    }
                } else {
                    // Para preguntas abiertas (Sí/No/NA)
                    if ($respuesta_valor === 'si') {
                        $puntuacion_simple += 10;
                        $puntuacion_total += 10;
                    }
                    // 'no' = 0 puntos, 'na' no cuenta para el total
                    if ($respuesta_valor === 'na') {
                        $total_preguntas_normales--; // No contar preguntas N/A en el total
                    }
                }
            }
        }
    }
    
    // Calcular porcentaje final (solo preguntas normales)
    $porcentaje_final = $total_preguntas_normales > 0 ? 
        round(($puntuacion_simple / ($total_preguntas_normales * 10)) * 100, 2) : 0;
    
    // Determinar si reprueba por preguntas trampa
    $reprobado_por_trampa = $preguntas_trampa_incorrectas >= 2;
    
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
        ':puntuacion_ponderada' => $porcentaje_final, // Ahora es porcentaje simple
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
        
        // Determinar si es trampa y calcular ponderación obtenida
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
                
                // Solo calcular ponderación para preguntas normales
                if (!$es_trampa) {
                    if ($pregunta_info['tipo_pregunta'] === 'seleccion_multiple') {
                        if ($respuesta_valor === $pregunta_info['respuesta_correcta']) {
                            $ponderacion_obtenida = 10; // Puntuación estándar
                        }
                    } else {
                        if ($respuesta_valor === 'si') {
                            $ponderacion_obtenida = 10; // Puntuación estándar
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
        $resulta = 'REPROBADO POR PREGUNTAS TRAMPA';
    } elseif ($tipo_evaluacion === 'operacion') {
        // Para evaluación de operación, usar escala diferente
        if ($porcentaje_final >= 80) $resultado = 'EXCELENTE';
        elseif ($porcentaje_final >= 60) $resultado = 'BUENO';
        elseif ($porcentaje_final >= 40) $resultado = 'REGULAR';
        else $resultado = 'DEFICIENTE';
    } elseif ($tipo_evaluacion === 'personal') {
        // Para evaluación de personal, usar criterio de 90%
        $resultado = $porcentaje_final >= 90 ? 'APROBADO' : 'REPROBADO';
    } else {
        // Para evaluaciones de equipo y otras
        $resultado = $porcentaje_final >= 70 ? 'APROBADO' : 'REPROBADO';
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'evaluacion_id' => $evaluacion_id,
            'puntuacion_total' => $puntuacion_total,
            'puntuacion_ponderada' => $porcentaje_final, // Ahora es porcentaje simple
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