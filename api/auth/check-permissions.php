<?php
/**
 * API para verificar permisos de usuario expandida
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
    
    if (!isset($input['usuario_id'])) {
        handleError('ID de usuario es requerido', 400);
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_evaluacion = $input['tipo_evaluacion'] ?? null;
    $rol_codigo = $input['rol_codigo'] ?? null;
    
    // Verificar si el usuario existe y tiene permisos completos
    $user_query = "SELECT permisos_completos, rol FROM usuarios WHERE id = :usuario_id AND activo = 1";
    $user_stmt = $db->prepare($user_query);
    $user_stmt->execute([':usuario_id' => $usuario_id]);
    $user = $user_stmt->fetch();
    
    if (!$user) {
        handleError('Usuario no encontrado', 404);
    }
    
    // Log para debugging
    error_log("Verificando permisos para usuario ID: $usuario_id");
    error_log("Permisos completos: " . ($user['permisos_completos'] ? 'SÍ' : 'NO'));
    error_log("Tipo evaluación: " . ($tipo_evaluacion ?? 'NO_ESPECIFICADO'));
    error_log("Rol código: " . ($rol_codigo ?? 'NO_ESPECIFICADO'));
    
    // Si tiene permisos completos, puede hacer todo
    if ($user['permisos_completos']) {
        sendJsonResponse([
            'success' => true,
            'data' => [
                'puede_evaluar' => true,
                'permisos_completos' => true,
                'tipo_evaluacion' => $tipo_evaluacion,
                'rol_codigo' => $rol_codigo,
                'mensaje' => 'Usuario con permisos completos'
            ]
        ]);
        return;
    }
    
    // Verificar permisos específicos según el tipo de evaluación
    if ($tipo_evaluacion === 'personal') {
        if (!$rol_codigo) {
            handleError('rol_codigo es requerido para evaluación de personal', 400);
        }
        
        // Verificar que la tabla permisos_usuario existe
        $table_check = $db->query("SHOW TABLES LIKE 'permisos_usuario'");
        if ($table_check->rowCount() == 0) {
            error_log("Tabla permisos_usuario no existe");
            handleError('Sistema de permisos no configurado correctamente', 500);
        }
        
        $query = "SELECT pu.puede_evaluar, rp.nombre as rol_nombre
                  FROM permisos_usuario pu
                  JOIN roles_personal rp ON pu.rol_personal_id = rp.id
                  WHERE pu.usuario_id = :usuario_id AND rp.codigo = :rol_codigo AND rp.activo = 1";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':rol_codigo' => $rol_codigo
        ]);
        
        $result = $stmt->fetch();
        $puede_evaluar = $result ? (bool)$result['puede_evaluar'] : false;
        
        error_log("Permiso personal para rol $rol_codigo: " . ($puede_evaluar ? 'SÍ' : 'NO'));
        
    } elseif ($tipo_evaluacion === 'equipo') {
        // Verificar que la tabla permisos_equipo existe
        $table_check = $db->query("SHOW TABLES LIKE 'permisos_equipo'");
        if ($table_check->rowCount() == 0) {
            error_log("Tabla permisos_equipo no existe");
            handleError('Sistema de permisos de equipo no configurado', 500);
        }
        
        $query = "SELECT puede_evaluar FROM permisos_equipo WHERE usuario_id = :usuario_id";
        $stmt = $db->prepare($query);
        $stmt->execute([':usuario_id' => $usuario_id]);
        
        $result = $stmt->fetch();
        $puede_evaluar = $result ? (bool)$result['puede_evaluar'] : false;
        
        error_log("Permiso equipo: " . ($puede_evaluar ? 'SÍ' : 'NO'));
        
    } elseif ($tipo_evaluacion === 'operacion') {
        // Verificar que la tabla permisos_operacion existe
        $table_check = $db->query("SHOW TABLES LIKE 'permisos_operacion'");
        if ($table_check->rowCount() == 0) {
            error_log("Tabla permisos_operacion no existe");
            handleError('Sistema de permisos de operación no configurado', 500);
        }
        
        $query = "SELECT puede_evaluar FROM permisos_operacion WHERE usuario_id = :usuario_id";
        $stmt = $db->prepare($query);
        $stmt->execute([':usuario_id' => $usuario_id]);
        
        $result = $stmt->fetch();
        $puede_evaluar = $result ? (bool)$result['puede_evaluar'] : false;
        
        error_log("Permiso operación: " . ($puede_evaluar ? 'SÍ' : 'NO'));
        
    } else {
        // Si no se especifica tipo, obtener resumen de todos los permisos
        $permisos_resumen = [];
        
        // Permisos de personal
        $table_check = $db->query("SHOW TABLES LIKE 'permisos_usuario'");
        if ($table_check->rowCount() > 0) {
            $personal_query = "SELECT COUNT(*) as total FROM permisos_usuario WHERE usuario_id = :usuario_id AND puede_evaluar = 1";
            $personal_stmt = $db->prepare($personal_query);
            $personal_stmt->execute([':usuario_id' => $usuario_id]);
            $personal_result = $personal_stmt->fetch();
            $permisos_resumen['personal'] = (int)$personal_result['total'];
        } else {
            $permisos_resumen['personal'] = 0;
        }
        
        // Permisos de equipo
        $table_check = $db->query("SHOW TABLES LIKE 'permisos_equipo'");
        if ($table_check->rowCount() > 0) {
            $equipo_query = "SELECT puede_evaluar FROM permisos_equipo WHERE usuario_id = :usuario_id";
            $equipo_stmt = $db->prepare($equipo_query);
            $equipo_stmt->execute([':usuario_id' => $usuario_id]);
            $equipo_result = $equipo_stmt->fetch();
            $permisos_resumen['equipo'] = $equipo_result ? (bool)$equipo_result['puede_evaluar'] : false;
        } else {
            $permisos_resumen['equipo'] = false;
        }
        
        // Permisos de operación
        $table_check = $db->query("SHOW TABLES LIKE 'permisos_operacion'");
        if ($table_check->rowCount() > 0) {
            $operacion_query = "SELECT puede_evaluar FROM permisos_operacion WHERE usuario_id = :usuario_id";
            $operacion_stmt = $db->prepare($operacion_query);
            $operacion_stmt->execute([':usuario_id' => $usuario_id]);
            $operacion_result = $operacion_stmt->fetch();
            $permisos_resumen['operacion'] = $operacion_result ? (bool)$operacion_result['puede_evaluar'] : false;
        } else {
            $permisos_resumen['operacion'] = false;
        }
        
        error_log("Resumen de permisos: " . json_encode($permisos_resumen));
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'permisos_completos' => false,
                'permisos_resumen' => $permisos_resumen,
                'total_permisos' => $permisos_resumen['personal'] + 
                                  ($permisos_resumen['equipo'] ? 1 : 0) + 
                                  ($permisos_resumen['operacion'] ? 1 : 0),
                'mensaje' => 'Permisos específicos verificados'
            ]
        ]);
        return;
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'puede_evaluar' => $puede_evaluar,
            'permisos_completos' => false,
            'tipo_evaluacion' => $tipo_evaluacion,
            'rol_codigo' => $rol_codigo,
            'mensaje' => $puede_evaluar ? 'Permiso concedido' : 'Permiso denegado'
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en check-permissions.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    handleError('Error al verificar permisos: ' . $e->getMessage());
}
?>