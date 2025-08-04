<?php
/**
 * API para obtener resultados de evaluaciones de personal
 * Solo para administradores
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    handleError('Método no permitido', 405);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // === DEBUGGING: Verificar token y usuario ===
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? (getallheaders()['Authorization'] ?? '');
    
    if (empty($authHeader)) {
        handleError('DEBUG: No se recibió el header de autorización', 401);
        exit();
    }

    $token = str_replace('Bearer ', '', $authHeader);
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);

    if (count($parts) < 3) {
        handleError('DEBUG: El formato del token es inválido', 401);
        exit();
    }
    
    // El token tiene formato: id:timestamp:username
    $userId = $parts[0];
    $timestamp = $parts[1];
    $username = $parts[2];
    
    // Verificar que el token no haya expirado (opcional)
    // $tokenAge = time() - $timestamp;
    // if ($tokenAge > 86400) { // 24 horas
    //     handleError('Token expirado', 401);
    //     exit();
    // }
    
    $query = "SELECT id, rol, nombre_completo, activo FROM usuarios WHERE id = :user_id AND username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        handleError('DEBUG: Usuario no encontrado en la BD: ' . $username, 404);
        exit();
    }

    if ($user['rol'] !== 'admin') {
        handleError('DEBUG: El usuario existe pero no es admin. Rol encontrado: ' . $user['rol'], 403);
        exit();
    }

    // Si la validación es exitosa, proceder a obtener los datos
    // ... (el resto del código para obtener los resultados sigue aquí)
    
    // Obtener evaluaciones de personal completadas
    $query = "SELECT 
                e.id,
                e.usuario_id,
                u.username,
                u.nombre_completo,
                r.codigo as rol_codigo,
                r.nombre as rol_nombre,
                e.puntuacion_total,
                e.puntuacion_ponderada,
                e.estado,
                e.fecha_inicio,
                e.fecha_finalizacion,
                e.observaciones,
                e.total_preguntas,
                e.respuestas_si,
                e.respuestas_no,
                e.respuestas_na,
                e.preguntas_trampa_respondidas,
                e.preguntas_trampa_incorrectas
              FROM evaluaciones e
              JOIN usuarios u ON e.usuario_id = u.id
              LEFT JOIN roles_personal r ON e.rol_personal_id = r.id
              JOIN tipos_evaluacion t ON e.tipo_evaluacion_id = t.id
              WHERE t.codigo = 'personal'
                AND e.estado = 'completada'
              ORDER BY e.fecha_inicio DESC
              LIMIT 50";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $evaluaciones = $stmt->fetchAll();
    
    // Para cada evaluación, obtener el detalle de secciones
    $resultados = [];
    
    foreach ($evaluaciones as $evaluacion) {
        // Obtener resultados por sección
        $query_secciones = "SELECT 
                              s.id as seccion_id,
                              s.nombre as seccion_nombre,
                              s.ponderacion,
                              s.p_minimo_aprobacion,
                              COUNT(CASE WHEN p.es_trampa = 0 THEN 1 END) as total_preguntas_normales,
                              COUNT(CASE WHEN p.es_trampa = 0 AND re.respuesta = p.respuesta_correcta THEN 1 END) as respuestas_correctas
                            FROM secciones_evaluacion s
                            LEFT JOIN preguntas p ON s.id = p.seccion_id AND p.activo = 1
                            LEFT JOIN respuestas_evaluacion re ON p.id = re.pregunta_id AND re.evaluacion_id = :evaluacion_id
                            WHERE s.tipo_evaluacion_id = (
                              SELECT id FROM tipos_evaluacion WHERE codigo = 'personal'
                            )
                            AND s.rol_personal_id = (
                              SELECT rol_personal_id FROM evaluaciones WHERE id = :evaluacion_id2
                            )
                            AND s.activo = 1
                            AND s.es_trampa = 0
                            GROUP BY s.id, s.nombre, s.ponderacion, s.p_minimo_aprobacion
                            ORDER BY s.orden";
        
        $stmt_secciones = $db->prepare($query_secciones);
        $stmt_secciones->bindParam(':evaluacion_id', $evaluacion['id']);
        $stmt_secciones->bindParam(':evaluacion_id2', $evaluacion['id']);
        $stmt_secciones->execute();
        $secciones = $stmt_secciones->fetchAll();
        
        // Calcular puntuación por sección
        $secciones_detalle = [];
        foreach ($secciones as $seccion) {
            $porcentaje = $seccion['total_preguntas_normales'] > 0 
                ? ($seccion['respuestas_correctas'] / $seccion['total_preguntas_normales']) * 100 
                : 0;
            
            $secciones_detalle[] = [
                'nombre' => $seccion['seccion_nombre'],
                'ponderacion' => floatval($seccion['ponderacion']),
                'puntuacion' => round($porcentaje * $seccion['ponderacion'] / 100, 1),
                'porcentaje' => round($porcentaje, 1),
                'p_minimo_aprobacion' => floatval($seccion['p_minimo_aprobacion']),
                'total_preguntas' => intval($seccion['total_preguntas_normales']),
                'respuestas_correctas' => intval($seccion['respuestas_correctas'])
            ];
        }
        
        $resultados[] = [
            'id' => intval($evaluacion['id']),
            'username' => $evaluacion['username'],
            'nombre_completo' => $evaluacion['nombre_completo'],
            'rol' => $evaluacion['rol_nombre'] ?: 'Sin rol especificado',
            'rol_codigo' => $evaluacion['rol_codigo'],
            'puntuacion_total' => floatval($evaluacion['puntuacion_total']),
            'puntuacion_ponderada' => floatval($evaluacion['puntuacion_ponderada']),
            'estado' => $evaluacion['estado'],
            'fecha_inicio' => $evaluacion['fecha_inicio'],
            'fecha_finalizacion' => $evaluacion['fecha_finalizacion'],
            'observaciones' => $evaluacion['observaciones'],
            'estadisticas' => [
                'total_preguntas' => intval($evaluacion['total_preguntas']),
                'respuestas_si' => intval($evaluacion['respuestas_si']),
                'respuestas_no' => intval($evaluacion['respuestas_no']),
                'respuestas_na' => intval($evaluacion['respuestas_na']),
                'preguntas_trampa_respondidas' => intval($evaluacion['preguntas_trampa_respondidas']),
                'preguntas_trampa_incorrectas' => intval($evaluacion['preguntas_trampa_incorrectas'])
            ],
            'secciones' => $secciones_detalle
        ];
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => $resultados,
        'total' => count($resultados),
        'mensaje' => 'Resultados de evaluaciones de personal obtenidos exitosamente'
    ]);
    
} catch (Exception $e) {
    error_log("Error en resultados-personal.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    handleError('Error al obtener resultados de evaluaciones: ' . $e->getMessage());
}
?>
