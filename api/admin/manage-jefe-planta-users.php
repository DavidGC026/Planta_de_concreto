<?php
/**
 * API para gestionar usuarios de evaluación de jefe de planta
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

try {
    // Conectar a la base de datos resultados
    $host = 'localhost';
    $dbname = 'resultados';
    $username = 'admin';
    $password = 'Imc590923cz4#';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            obtenerUsuariosJefePlanta($pdo);
            break;
        case 'POST':
            actualizarPermisoUsuario($pdo);
            break;
        default:
            handleError('Método no permitido', 405);
    }
    
} catch (Exception $e) {
    error_log("Error en manage-jefe-planta-users.php: " . $e->getMessage());
    handleError('Error interno del servidor: ' . $e->getMessage());
}

/**
 * Obtener usuarios que han realizado evaluaciones de jefe de planta
 */
function obtenerUsuariosJefePlanta($pdo) {
    try {
        $query = "SELECT 
                    u.id,
                    u.nombre,
                    u.email,
                    u.empresa,
                    u.oportunidades,
                    u.permiso,
                    u.created_at,
                    u.updated_at,
                    COUNT(ep.id) as total_evaluaciones,
                    MAX(ep.created_at) as ultima_evaluacion,
                    MAX(ep.total_obtenido) as mejor_calificacion,
                    MAX(ep.pass_status) as ultimo_estado
                  FROM usuarios u
                  LEFT JOIN evaluaciones_personal ep ON u.email = ep.nombre
                  WHERE u.email IS NOT NULL
                  GROUP BY u.id, u.nombre, u.email, u.empresa, u.oportunidades, u.permiso, u.created_at, u.updated_at
                  ORDER BY u.created_at DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatear los datos
        $usuarios_formateados = [];
        foreach ($usuarios as $usuario) {
            $usuarios_formateados[] = [
                'id' => (int)$usuario['id'],
                'nombre' => $usuario['nombre'],
                'email' => $usuario['email'],
                'empresa' => $usuario['empresa'],
                'oportunidades' => (int)$usuario['oportunidades'],
                'permiso' => (int)$usuario['permiso'],
                'puede_hacer_examen' => (int)$usuario['permiso'] === 0,
                'total_evaluaciones' => (int)$usuario['total_evaluaciones'],
                'ultima_evaluacion' => $usuario['ultima_evaluacion'],
                'mejor_calificacion' => $usuario['mejor_calificacion'] ? (float)$usuario['mejor_calificacion'] : null,
                'ultimo_estado' => $usuario['ultimo_estado'],
                'created_at' => $usuario['created_at'],
                'updated_at' => $usuario['updated_at']
            ];
        }
        
        sendJsonResponse([
            'success' => true,
            'data' => $usuarios_formateados,
            'total' => count($usuarios_formateados)
        ]);
        
    } catch (Exception $e) {
        handleError('Error al obtener usuarios: ' . $e->getMessage());
    }
}

/**
 * Actualizar permiso de usuario
 */
function actualizarPermisoUsuario($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            handleError('Datos JSON inválidos', 400);
        }
        
        $required_fields = ['usuario_id'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field])) {
                handleError("Campo requerido: $field", 400);
            }
        }
        
        $usuario_id = (int)$input['usuario_id'];
        
        // Construir query dinámicamente basado en los campos proporcionados
        $updates = [];
        $params = [':usuario_id' => $usuario_id];
        
        // Actualizar permiso si se proporciona
        if (isset($input['puede_hacer_examen'])) {
            $puede_hacer_examen = (bool)$input['puede_hacer_examen'];
            $permiso = $puede_hacer_examen ? 0 : 1;
            $updates[] = "permiso = :permiso";
            $params[':permiso'] = $permiso;
        }
        
        // Actualizar nombre si se proporciona
        if (isset($input['nombre']) && !empty(trim($input['nombre']))) {
            $updates[] = "nombre = :nombre";
            $params[':nombre'] = trim($input['nombre']);
        }
        
        // Actualizar empresa si se proporciona
        if (isset($input['empresa']) && !empty(trim($input['empresa']))) {
            $updates[] = "empresa = :empresa";
            $params[':empresa'] = trim($input['empresa']);
        }
        
        if (empty($updates)) {
            handleError('No hay campos para actualizar', 400);
        }
        
        // Actualizar los campos en la base de datos
        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $query = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id = :usuario_id";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            handleError('Usuario no encontrado o no se pudo actualizar', 404);
        }
        
        // Obtener los datos actualizados del usuario
        $user_query = "SELECT id, nombre, email, empresa, oportunidades, permiso, created_at, updated_at FROM usuarios WHERE id = :usuario_id";
        $user_stmt = $pdo->prepare($user_query);
        $user_stmt->execute([':usuario_id' => $usuario_id]);
        $updated_user = $user_stmt->fetch(PDO::FETCH_ASSOC);
        
        $response_data = [
            'usuario_id' => $usuario_id,
            'updated_fields' => array_keys($params)
        ];
        
        if (isset($permiso)) {
            $response_data['permiso'] = $permiso;
            $response_data['puede_hacer_examen'] = $puede_hacer_examen;
        }
        
        if ($updated_user) {
            $response_data['usuario_actualizado'] = [
                'id' => (int)$updated_user['id'],
                'nombre' => $updated_user['nombre'],
                'email' => $updated_user['email'],
                'empresa' => $updated_user['empresa'],
                'oportunidades' => (int)$updated_user['oportunidades'],
                'permiso' => (int)$updated_user['permiso'],
                'puede_hacer_examen' => (int)$updated_user['permiso'] === 0,
                'updated_at' => $updated_user['updated_at']
            ];
        }
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'data' => $response_data
        ]);
        
    } catch (Exception $e) {
        handleError('Error al actualizar permiso: ' . $e->getMessage());
    }
}


?>
