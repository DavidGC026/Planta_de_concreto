<?php
require_once 'conexion_db.php';
require_once 'funciones_comunes.php';

// Establecer headers para CORS y tipo de contenido
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Función para obtener el estado de exámenes de todos los usuarios
function obtenerEstadoExamenesUsuarios($conexion) {
    try {
        $sql = "SELECT * FROM vista_estado_examenes_usuarios";
        $stmt = $conexion->prepare($sql);
        $stmt->execute();
        
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => $usuarios,
            'message' => 'Estado de exámenes obtenido exitosamente'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Error al obtener estado de exámenes: ' . $e->getMessage()
        ];
    }
}

// Función para obtener el estado de exámenes de un usuario específico
function obtenerEstadoExamenUsuario($conexion, $usuario_id) {
    try {
        $sql = "SELECT * FROM vista_estado_examenes_usuarios WHERE usuario_id = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$usuario_id]);
        
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            return [
                'success' => false,
                'error' => 'Usuario no encontrado'
            ];
        }
        
        return [
            'success' => true,
            'data' => $usuario,
            'message' => 'Estado de examen obtenido exitosamente'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Error al obtener estado de examen: ' . $e->getMessage()
        ];
    }
}

// Función para bloquear examen de un usuario
function bloquearExamenUsuario($conexion, $usuario_id, $motivo, $bloqueado_por_usuario_id) {
    try {
        // Verificar que el usuario que quiere bloquear tenga permisos
        $sql_permisos = "SELECT UsuarioPuedeGestionarEstadoExamenes(?) as puede_gestionar";
        $stmt_permisos = $conexion->prepare($sql_permisos);
        $stmt_permisos->execute([$bloqueado_por_usuario_id]);
        $permisos = $stmt_permisos->fetch(PDO::FETCH_ASSOC);
        
        if (!$permisos['puede_gestionar']) {
            return [
                'success' => false,
                'error' => 'No tiene permisos para bloquear exámenes'
            ];
        }
        
        // Llamar al procedimiento almacenado
        $sql = "CALL BloquearExamenUsuario(?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$usuario_id, $motivo, $bloqueado_por_usuario_id]);
        
        return [
            'success' => true,
            'message' => 'Examen bloqueado exitosamente'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Error al bloquear examen: ' . $e->getMessage()
        ];
    }
}

// Función para desbloquear examen de un usuario
function desbloquearExamenUsuario($conexion, $usuario_id, $motivo, $desbloqueado_por_usuario_id) {
    try {
        // Verificar que el usuario que quiere desbloquear tenga permisos
        $sql_permisos = "SELECT UsuarioPuedeGestionarEstadoExamenes(?) as puede_gestionar";
        $stmt_permisos = $conexion->prepare($sql_permisos);
        $stmt_permisos->execute([$desbloqueado_por_usuario_id]);
        $permisos = $stmt_permisos->fetch(PDO::FETCH_ASSOC);
        
        if (!$permisos['puede_gestionar']) {
            return [
                'success' => false,
                'error' => 'No tiene permisos para desbloquear exámenes'
            ];
        }
        
        // Llamar al procedimiento almacenado
        $sql = "CALL DesbloquearExamenUsuario(?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$usuario_id, $motivo, $desbloqueado_por_usuario_id]);
        
        return [
            'success' => true,
            'message' => 'Examen desbloqueado exitosamente'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Error al desbloquear examen: ' . $e->getMessage()
        ];
    }
}

// Función para obtener el historial de cambios de estado
function obtenerHistorialEstadoExamenes($conexion, $usuario_id = null) {
    try {
        if ($usuario_id) {
            $sql = "SELECT * FROM vista_historial_estado_examenes WHERE usuario_id = ? ORDER BY fecha_accion DESC";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([$usuario_id]);
        } else {
            $sql = "SELECT * FROM vista_historial_estado_examenes ORDER BY fecha_accion DESC LIMIT 100";
            $stmt = $conexion->prepare($sql);
            $stmt->execute();
        }
        
        $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => $historial,
            'message' => 'Historial obtenido exitosamente'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Error al obtener historial: ' . $e->getMessage()
        ];
    }
}

// Función para verificar si un usuario puede realizar exámenes
function verificarAccesoExamen($conexion, $usuario_id) {
    try {
        $sql = "SELECT UsuarioPuedeRealizarExamenes(?) as puede_realizar";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$usuario_id]);
        
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => [
                'usuario_id' => $usuario_id,
                'puede_realizar_examenes' => (bool)$resultado['puede_realizar']
            ],
            'message' => 'Verificación realizada exitosamente'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Error al verificar acceso: ' . $e->getMessage()
        ];
    }
}

// Manejo de las peticiones HTTP
try {
    $conexion = obtenerConexionDB();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '';
    
    // Obtener datos del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            if ($path === '/usuarios') {
                // Obtener estado de todos los usuarios
                $resultado = obtenerEstadoExamenesUsuarios($conexion);
            } elseif (preg_match('/^\/usuario\/(\d+)$/', $path, $matches)) {
                // Obtener estado de un usuario específico
                $usuario_id = $matches[1];
                $resultado = obtenerEstadoExamenUsuario($conexion, $usuario_id);
            } elseif ($path === '/historial') {
                // Obtener historial general
                $resultado = obtenerHistorialEstadoExamenes($conexion);
            } elseif (preg_match('/^\/historial\/(\d+)$/', $path, $matches)) {
                // Obtener historial de un usuario específico
                $usuario_id = $matches[1];
                $resultado = obtenerHistorialEstadoExamenes($conexion, $usuario_id);
            } elseif (preg_match('/^\/verificar\/(\d+)$/', $path, $matches)) {
                // Verificar si un usuario puede realizar exámenes
                $usuario_id = $matches[1];
                $resultado = verificarAccesoExamen($conexion, $usuario_id);
            } else {
                $resultado = [
                    'success' => false,
                    'error' => 'Endpoint no encontrado'
                ];
            }
            break;
            
        case 'POST':
            if ($path === '/bloquear') {
                // Bloquear examen
                $usuario_id = $input['usuario_id'] ?? null;
                $motivo = $input['motivo'] ?? '';
                $bloqueado_por_usuario_id = $input['bloqueado_por_usuario_id'] ?? null;
                
                if (!$usuario_id || !$bloqueado_por_usuario_id) {
                    $resultado = [
                        'success' => false,
                        'error' => 'Faltan parámetros requeridos'
                    ];
                } else {
                    $resultado = bloquearExamenUsuario($conexion, $usuario_id, $motivo, $bloqueado_por_usuario_id);
                }
            } elseif ($path === '/desbloquear') {
                // Desbloquear examen
                $usuario_id = $input['usuario_id'] ?? null;
                $motivo = $input['motivo'] ?? '';
                $desbloqueado_por_usuario_id = $input['desbloqueado_por_usuario_id'] ?? null;
                
                if (!$usuario_id || !$desbloqueado_por_usuario_id) {
                    $resultado = [
                        'success' => false,
                        'error' => 'Faltan parámetros requeridos'
                    ];
                } else {
                    $resultado = desbloquearExamenUsuario($conexion, $usuario_id, $motivo, $desbloqueado_por_usuario_id);
                }
            } else {
                $resultado = [
                    'success' => false,
                    'error' => 'Endpoint no encontrado'
                ];
            }
            break;
            
        default:
            $resultado = [
                'success' => false,
                'error' => 'Método no permitido'
            ];
            break;
    }
    
    // Determinar código de respuesta HTTP
    if ($resultado['success']) {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($resultado);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
