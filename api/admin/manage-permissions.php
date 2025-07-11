<?php
/**
 * API para gestionar permisos de usuarios (solo para administradores)
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
            obtenerPermisos($db);
            break;
        case 'POST':
            asignarPermisos($db);
            break;
        case 'DELETE':
            eliminarPermisos($db);
            break;
        default:
            handleError('Método no permitido', 405);
    }
    
} catch (Exception $e) {
    error_log("Error en manage-permissions.php: " . $e->getMessage());
    handleError('Error interno del servidor: ' . $e->getMessage());
}

/**
 * Obtener permisos de usuarios
 */
function obtenerPermisos($db) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    
    if ($usuario_id) {
        // Obtener permisos de un usuario específico
        $query = "SELECT * FROM vista_permisos_usuarios WHERE usuario_id = :usuario_id";
        $stmt = $db->prepare($query);
        $stmt->execute([':usuario_id' => $usuario_id]);
        $permisos = $stmt->fetchAll();
    } else {
        // Obtener todos los permisos
        $query = "SELECT * FROM vista_permisos_usuarios ORDER BY username, rol_nombre";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $permisos = $stmt->fetchAll();
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => $permisos
    ]);
}

/**
 * Asignar permisos a un usuario
 */
function asignarPermisos($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        handleError('Datos JSON inválidos', 400);
    }
    
    $required_fields = ['usuario_id', 'rol_codigo', 'puede_evaluar'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $rol_codigo = $input['rol_codigo'];
    $puede_evaluar = (bool)$input['puede_evaluar'];
    $puede_ver_resultados = $input['puede_ver_resultados'] ?? true;
    
    try {
        // Llamar al procedimiento almacenado
        $stmt = $db->prepare("CALL AsignarPermisosUsuario(?, ?, ?, ?)");
        $stmt->execute([
            $usuario_id,
            $rol_codigo,
            $puede_evaluar,
            $puede_ver_resultados
        ]);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Permisos asignados exitosamente',
            'data' => [
                'usuario_id' => $usuario_id,
                'rol_codigo' => $rol_codigo,
                'puede_evaluar' => $puede_evaluar,
                'puede_ver_resultados' => $puede_ver_resultados
            ]
        ]);
        
    } catch (Exception $e) {
        handleError('Error al asignar permisos: ' . $e->getMessage());
    }
}

/**
 * Eliminar permisos de un usuario
 */
function eliminarPermisos($db) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $rol_codigo = $_GET['rol_codigo'] ?? null;
    
    if (!$usuario_id || !$rol_codigo) {
        handleError('usuario_id y rol_codigo son requeridos', 400);
    }
    
    try {
        // Obtener ID del rol
        $rol_query = "SELECT id FROM roles_personal WHERE codigo = :rol_codigo";
        $rol_stmt = $db->prepare($rol_query);
        $rol_stmt->execute([':rol_codigo' => $rol_codigo]);
        $rol = $rol_stmt->fetch();
        
        if (!$rol) {
            handleError('Rol no encontrado', 404);
        }
        
        // Eliminar permisos
        $delete_query = "DELETE FROM permisos_usuario WHERE usuario_id = :usuario_id AND rol_personal_id = :rol_id";
        $delete_stmt = $db->prepare($delete_query);
        $delete_stmt->execute([
            ':usuario_id' => $usuario_id,
            ':rol_id' => $rol['id']
        ]);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Permisos eliminados exitosamente',
            'data' => [
                'usuario_id' => $usuario_id,
                'rol_codigo' => $rol_codigo
            ]
        ]);
        
    } catch (Exception $e) {
        handleError('Error al eliminar permisos: ' . $e->getMessage());
    }
}
?>