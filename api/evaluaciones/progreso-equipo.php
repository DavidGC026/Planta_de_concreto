<?php
/**
 * API para manejar el progreso de evaluaciones de equipo
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            obtenerProgreso($db);
            break;
        case 'POST':
            guardarProgreso($db);
            break;
        case 'DELETE':
            limpiarProgreso($db);
            break;
        default:
            handleError('Método no permitido', 405);
    }
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}

/**
 * Obtener progreso de evaluación de equipo
 */
function obtenerProgreso($db) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $tipo_planta = $_GET['tipo_planta'] ?? null;
    
    if (!$usuario_id || !$tipo_planta) {
        handleError('usuario_id y tipo_planta son requeridos', 400);
    }
    
    try {
        // Llamar al procedimiento almacenado
        $stmt = $db->prepare("CALL ObtenerProgresoEquipoUsuario(?, ?)");
        $stmt->execute([$usuario_id, $tipo_planta]);
        
        $progreso = $stmt->fetchAll();
        
        // Procesar los datos para el frontend
        $resultado = [];
        foreach ($progreso as $seccion) {
            $subsecciones = [];
            
            // Procesar el detalle de subsecciones si existe
            if ($seccion['subsecciones_detalle']) {
                $subsecciones_raw = explode('|', $seccion['subsecciones_detalle']);
                foreach ($subsecciones_raw as $sub_raw) {
                    $parts = explode(':', $sub_raw);
                    if (count($parts) >= 4) {
                        $subsecciones[] = [
                            'subseccion_id' => (int)$parts[0],
                            'nombre' => $parts[1],
                            'completada' => (bool)$parts[2],
                            'puntaje_porcentaje' => (float)$parts[3]
                        ];
                    }
                }
            }
            
            $resultado[] = [
                'seccion_id' => (int)$seccion['seccion_id'],
                'seccion_nombre' => $seccion['seccion_nombre'],
                'completada' => (bool)$seccion['seccion_completada'],
                'puntaje_obtenido' => (float)$seccion['seccion_puntaje'],
                'puntaje_porcentaje' => (float)$seccion['seccion_porcentaje'],
                'total_subsecciones' => (int)$seccion['total_subsecciones'],
                'subsecciones_completadas' => (int)$seccion['subsecciones_completadas'],
                'respuestas_correctas' => (int)$seccion['seccion_respuestas_correctas'],
                'total_preguntas' => (int)$seccion['seccion_total_preguntas'],
                'fecha_completada' => $seccion['seccion_fecha_completada'],
                'subsecciones' => $subsecciones
            ];
        }
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'usuario_id' => (int)$usuario_id,
                'tipo_planta' => $tipo_planta,
                'secciones' => $resultado,
                'total_secciones' => count($resultado),
                'secciones_completadas' => count(array_filter($resultado, function($s) { return $s['completada']; }))
            ]
        ]);
        
    } catch (Exception $e) {
        handleError('Error al obtener progreso: ' . $e->getMessage());
    }
}

/**
 * Guardar progreso de sección o subsección
 */
function guardarProgreso($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required_fields = ['usuario_id', 'tipo_planta', 'tipo_progreso'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_planta = $input['tipo_planta'];
    $tipo_progreso = $input['tipo_progreso']; // 'seccion' o 'subseccion'
    
    try {
        if ($tipo_progreso === 'subseccion') {
            // Guardar progreso de subsección
            $required_subsection_fields = ['seccion_id', 'subseccion_id', 'subseccion_nombre', 'puntaje_obtenido', 'puntaje_porcentaje', 'respuestas_correctas', 'total_preguntas'];
            foreach ($required_subsection_fields as $field) {
                if (!isset($input[$field])) {
                    handleError("Campo requerido para subsección: $field", 400);
                }
            }
            
            $stmt = $db->prepare("CALL MarcarSubseccionEquipoCompletada(?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $usuario_id,
                $tipo_planta,
                $input['seccion_id'],
                $input['subseccion_id'],
                $input['subseccion_nombre'],
                $input['puntaje_obtenido'],
                $input['puntaje_porcentaje'],
                $input['respuestas_correctas'],
                $input['total_preguntas']
            ]);
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Progreso de subsección guardado exitosamente',
                'data' => [
                    'tipo_progreso' => 'subseccion',
                    'subseccion_id' => $input['subseccion_id'],
                    'subseccion_nombre' => $input['subseccion_nombre']
                ]
            ]);
            
        } elseif ($tipo_progreso === 'seccion') {
            // Guardar progreso de sección completa
            $required_section_fields = ['seccion_id', 'seccion_nombre', 'puntaje_obtenido', 'puntaje_porcentaje', 'total_subsecciones', 'subsecciones_completadas', 'respuestas_correctas', 'total_preguntas'];
            foreach ($required_section_fields as $field) {
                if (!isset($input[$field])) {
                    handleError("Campo requerido para sección: $field", 400);
                }
            }
            
            $stmt = $db->prepare("CALL MarcarSeccionEquipoCompletada(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $usuario_id,
                $tipo_planta,
                $input['seccion_id'],
                $input['seccion_nombre'],
                $input['puntaje_obtenido'],
                $input['puntaje_porcentaje'],
                $input['total_subsecciones'],
                $input['subsecciones_completadas'],
                $input['respuestas_correctas'],
                $input['total_preguntas']
            ]);
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Progreso de sección guardado exitosamente',
                'data' => [
                    'tipo_progreso' => 'seccion',
                    'seccion_id' => $input['seccion_id'],
                    'seccion_nombre' => $input['seccion_nombre']
                ]
            ]);
            
        } else {
            handleError('tipo_progreso debe ser "seccion" o "subseccion"', 400);
        }
        
    } catch (Exception $e) {
        handleError('Error al guardar progreso: ' . $e->getMessage());
    }
}

/**
 * Limpiar progreso de un usuario (útil para testing)
 */
function limpiarProgreso($db) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $tipo_planta = $_GET['tipo_planta'] ?? null;
    
    if (!$usuario_id || !$tipo_planta) {
        handleError('usuario_id y tipo_planta son requeridos', 400);
    }
    
    try {
        $stmt = $db->prepare("CALL LimpiarProgresoEquipoUsuario(?, ?)");
        $stmt->execute([$usuario_id, $tipo_planta]);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Progreso limpiado exitosamente',
            'data' => [
                'usuario_id' => (int)$usuario_id,
                'tipo_planta' => $tipo_planta
            ]
        ]);
        
    } catch (Exception $e) {
        handleError('Error al limpiar progreso: ' . $e->getMessage());
    }
}
?>