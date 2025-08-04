<?php
/**
 * API para gestionar permisos de usuarios (solo para administradores)
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 * Expandido para incluir permisos de equipo y operación
 */

require_once '../config/database.php';

setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Asegurar que las tablas existan
    inicializarTablas($db);
    
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
    
    $permisos = [];
    
    if ($usuario_id) {
        // Obtener permisos de un usuario específico
        $query = "SELECT 
                    u.id as usuario_id,
                    u.username,
                    u.nombre_completo,
                    u.rol as rol_sistema,
                    u.permisos_completos,
                    
                    -- Permisos de personal (roles específicos)
                    rp.id as rol_personal_id,
                    rp.codigo as rol_codigo,
                    rp.nombre as rol_nombre,
                    pu.puede_evaluar as puede_evaluar_personal,
                    pu.puede_ver_resultados as puede_ver_resultados_personal,
                    pu.fecha_creacion as fecha_asignacion_personal,
                    
                    -- Permisos de equipo
                    pe.puede_evaluar as puede_evaluar_equipo,
                    pe.puede_ver_resultados as puede_ver_resultados_equipo,
                    pe.fecha_creacion as fecha_asignacion_equipo,
                    
                    -- Permisos de operación
                    po.puede_evaluar as puede_evaluar_operacion,
                    po.puede_ver_resultados as puede_ver_resultados_operacion,
                    po.fecha_creacion as fecha_asignacion_operacion
                    
                  FROM usuarios u
                  LEFT JOIN permisos_usuario pu ON u.id = pu.usuario_id
                  LEFT JOIN roles_personal rp ON pu.rol_personal_id = rp.id
                  LEFT JOIN permisos_equipo pe ON u.id = pe.usuario_id
                  LEFT JOIN permisos_operacion po ON u.id = po.usuario_id
                  WHERE u.id = :usuario_id AND u.activo = 1
                  ORDER BY rp.nombre";
        
        $stmt = $db->prepare($query);
        $stmt->execute([':usuario_id' => $usuario_id]);
        $permisos = $stmt->fetchAll() ?: [];
    } else {
        // Obtener todos los permisos con información detallada
        $query = "SELECT 
                    u.id as usuario_id,
                    u.username,
                    u.nombre_completo,
                    u.rol as rol_sistema,
                    u.permisos_completos,
                    
                    -- Permisos de personal (roles específicos)
                    rp.id as rol_personal_id,
                    rp.codigo as rol_codigo,
                    rp.nombre as rol_nombre,
                    pu.puede_evaluar as puede_evaluar_personal,
                    pu.puede_ver_resultados as puede_ver_resultados_personal,
                    pu.fecha_creacion as fecha_asignacion_personal,
                    
                    -- Permisos de equipo
                    pe.puede_evaluar as puede_evaluar_equipo,
                    pe.puede_ver_resultados as puede_ver_resultados_equipo,
                    pe.fecha_creacion as fecha_asignacion_equipo,
                    
                    -- Permisos de operación
                    po.puede_evaluar as puede_evaluar_operacion,
                    po.puede_ver_resultados as puede_ver_resultados_operacion,
                    po.fecha_creacion as fecha_asignacion_operacion
                    
                  FROM usuarios u
                  LEFT JOIN permisos_usuario pu ON u.id = pu.usuario_id
                  LEFT JOIN roles_personal rp ON pu.rol_personal_id = rp.id
                  LEFT JOIN permisos_equipo pe ON u.id = pe.usuario_id
                  LEFT JOIN permisos_operacion po ON u.id = po.usuario_id
                  WHERE u.activo = 1
                  ORDER BY u.username, rp.nombre";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $permisos = $stmt->fetchAll() ?: [];
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
    
    $required_fields = ['usuario_id', 'tipo_evaluacion'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_evaluacion = $input['tipo_evaluacion'];
    $puede_evaluar = (bool)($input['puede_evaluar'] ?? true);
    $puede_ver_resultados = (bool)($input['puede_ver_resultados'] ?? true);
    
    try {
        error_log("DEBUG: Iniciando transacción");
        $db->beginTransaction();
        error_log("DEBUG: Transacción iniciada exitosamente");
        
        if ($tipo_evaluacion === 'personal') {
            // Para evaluación de personal, requiere rol_codigo
            $rol_codigo = $input['rol_codigo'] ?? null;
            if (!$rol_codigo) {
                throw new Exception('rol_codigo es requerido para evaluación de personal');
            }
            
            // Obtener ID del rol
            $rol_query = "SELECT id FROM roles_personal WHERE codigo = :rol_codigo AND activo = 1";
            $rol_stmt = $db->prepare($rol_query);
            $rol_stmt->execute([':rol_codigo' => $rol_codigo]);
            $rol = $rol_stmt->fetch();
            
            if (!$rol) {
                throw new Exception('Rol no encontrado');
            }
            
            // Insertar o actualizar permisos de personal
            $query = "INSERT INTO permisos_usuario (usuario_id, rol_personal_id, puede_evaluar, puede_ver_resultados)
                      VALUES (:usuario_id, :rol_personal_id, :puede_evaluar, :puede_ver_resultados)
                      ON DUPLICATE KEY UPDATE
                      puede_evaluar = VALUES(puede_evaluar),
                      puede_ver_resultados = VALUES(puede_ver_resultados),
                      fecha_actualizacion = NOW()";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                ':usuario_id' => $usuario_id,
                ':rol_personal_id' => $rol['id'],
                ':puede_evaluar' => $puede_evaluar,
                ':puede_ver_resultados' => $puede_ver_resultados
            ]);
            
        } elseif ($tipo_evaluacion === 'equipo') {
            // Insertar o actualizar permisos de equipo
            $query = "INSERT INTO permisos_equipo (usuario_id, puede_evaluar, puede_ver_resultados)
                      VALUES (:usuario_id, :puede_evaluar, :puede_ver_resultados)
                      ON DUPLICATE KEY UPDATE
                      puede_evaluar = VALUES(puede_evaluar),
                      puede_ver_resultados = VALUES(puede_ver_resultados),
                      fecha_actualizacion = NOW()";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                ':usuario_id' => $usuario_id,
                ':puede_evaluar' => $puede_evaluar,
                ':puede_ver_resultados' => $puede_ver_resultados
            ]);
            
        } elseif ($tipo_evaluacion === 'operacion') {
            // Insertar o actualizar permisos de operación
            $query = "INSERT INTO permisos_operacion (usuario_id, puede_evaluar, puede_ver_resultados)
                      VALUES (:usuario_id, :puede_evaluar, :puede_ver_resultados)
                      ON DUPLICATE KEY UPDATE
                      puede_evaluar = VALUES(puede_evaluar),
                      puede_ver_resultados = VALUES(puede_ver_resultados),
                      fecha_actualizacion = NOW()";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                ':usuario_id' => $usuario_id,
                ':puede_evaluar' => $puede_evaluar,
                ':puede_ver_resultados' => $puede_ver_resultados
            ]);
            
        } else {
            throw new Exception('Tipo de evaluación no válido');
        }
        
        $db->commit();
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Permisos asignados exitosamente',
            'data' => [
                'usuario_id' => $usuario_id,
                'tipo_evaluacion' => $tipo_evaluacion,
                'puede_evaluar' => $puede_evaluar,
                'puede_ver_resultados' => $puede_ver_resultados
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("DEBUG: Error capturado: " . $e->getMessage());
        // Solo hacer rollback si hay una transacción activa
        if ($db->inTransaction()) {
            error_log("DEBUG: Haciendo rollback de transacción");
            $db->rollback();
        } else {
            error_log("DEBUG: No hay transacción activa para rollback");
        }
        handleError('Error al asignar permisos: ' . $e->getMessage());
    }
}

/**
 * Eliminar permisos de un usuario
 */
function eliminarPermisos($db) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $tipo_evaluacion = $_GET['tipo_evaluacion'] ?? null;
    $rol_codigo = $_GET['rol_codigo'] ?? null;
    
    if (!$usuario_id || !$tipo_evaluacion) {
        handleError('usuario_id y tipo_evaluacion son requeridos', 400);
    }
    
    try {
        $db->beginTransaction();
        
        if ($tipo_evaluacion === 'personal') {
            if (!$rol_codigo) {
                throw new Exception('rol_codigo es requerido para eliminar permisos de personal');
            }
            
            // Obtener ID del rol
            $rol_query = "SELECT id FROM roles_personal WHERE codigo = :rol_codigo";
            $rol_stmt = $db->prepare($rol_query);
            $rol_stmt->execute([':rol_codigo' => $rol_codigo]);
            $rol = $rol_stmt->fetch();
            
            if (!$rol) {
                throw new Exception('Rol no encontrado');
            }
            
            // Eliminar permisos de personal
            $delete_query = "DELETE FROM permisos_usuario WHERE usuario_id = :usuario_id AND rol_personal_id = :rol_id";
            $delete_stmt = $db->prepare($delete_query);
            $delete_stmt->execute([
                ':usuario_id' => $usuario_id,
                ':rol_id' => $rol['id']
            ]);
            
        } elseif ($tipo_evaluacion === 'equipo') {
            // Eliminar permisos de equipo
            $delete_query = "DELETE FROM permisos_equipo WHERE usuario_id = :usuario_id";
            $delete_stmt = $db->prepare($delete_query);
            $delete_stmt->execute([':usuario_id' => $usuario_id]);
            
        } elseif ($tipo_evaluacion === 'operacion') {
            // Eliminar permisos de operación
            $delete_query = "DELETE FROM permisos_operacion WHERE usuario_id = :usuario_id";
            $delete_stmt = $db->prepare($delete_query);
            $delete_stmt->execute([':usuario_id' => $usuario_id]);
            
        } else {
            throw new Exception('Tipo de evaluación no válido');
        }
        
        $db->commit();
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Permisos eliminados exitosamente',
            'data' => [
                'usuario_id' => $usuario_id,
                'tipo_evaluacion' => $tipo_evaluacion,
                'rol_codigo' => $rol_codigo
            ]
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        handleError('Error al eliminar permisos: ' . $e->getMessage());
    }
}

/**
 * Inicializar tablas necesarias para el sistema de permisos
 */
function inicializarTablas($db) {
    // Crear tabla permisos_equipo si no existe
    $create_equipo = "CREATE TABLE IF NOT EXISTS permisos_equipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        puede_evaluar BOOLEAN DEFAULT TRUE,
        puede_ver_resultados BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_equipo (usuario_id)
    )";
    $db->exec($create_equipo);
    
    // Crear tabla permisos_operacion si no existe
    $create_operacion = "CREATE TABLE IF NOT EXISTS permisos_operacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        puede_evaluar BOOLEAN DEFAULT TRUE,
        puede_ver_resultados BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_operacion (usuario_id)
    )";
    $db->exec($create_operacion);
}
?>
