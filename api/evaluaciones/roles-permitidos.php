<?php
/**
 * API para obtener roles de personal permitidos para un usuario específico
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
    
    // Obtener parámetros
    $usuario_id = $_GET['usuario_id'] ?? null;
    
    if (!$usuario_id) {
        handleError('ID de usuario es requerido', 400);
    }
    
    // Verificar que el usuario existe y obtener información completa
    $user_check = $db->prepare("SELECT id, username, nombre_completo, rol, permisos_completos FROM usuarios WHERE id = :usuario_id AND activo = 1");
    $user_check->execute([':usuario_id' => $usuario_id]);
    $user = $user_check->fetch();
    
    if (!$user) {
        handleError('Usuario no encontrado', 404);
    }
    
    // Log para debugging
    error_log("Obteniendo roles para usuario: {$user['username']} (ID: $usuario_id)");
    error_log("Permisos completos: " . ($user['permisos_completos'] ? 'SÍ' : 'NO'));
    
    $roles_permitidos = [];
    
    // Si tiene permisos completos, devolver todos los roles
    if ($user['permisos_completos']) {
        $query = "SELECT id, codigo, nombre, descripcion FROM roles_personal WHERE activo = 1 ORDER BY nombre";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $all_roles = $stmt->fetchAll();
        
        foreach ($all_roles as $role) {
            $roles_permitidos[] = [
                'id' => $role['id'],
                'codigo' => $role['codigo'],
                'nombre' => $role['nombre'],
                'descripcion' => $role['descripcion'] ?? '',
                'puede_evaluar' => true,
                'puede_ver_resultados' => true
            ];
        }
        
        error_log("Usuario con permisos completos - devolviendo " . count($roles_permitidos) . " roles");
        
    } else {
        // Verificar que la tabla permisos_usuario existe
        $table_check = $db->query("SHOW TABLES LIKE 'permisos_usuario'");
        if ($table_check->rowCount() == 0) {
            error_log("Tabla permisos_usuario no existe");
            // Si no existe la tabla, devolver array vacío
            $roles_permitidos = [];
        } else {
            // Obtener roles específicos permitidos
            $query = "SELECT rp.id, rp.codigo, rp.nombre, rp.descripcion, 
                            pu.puede_evaluar, pu.puede_ver_resultados
                     FROM permisos_usuario pu
                     JOIN roles_personal rp ON pu.rol_personal_id = rp.id
                     WHERE pu.usuario_id = :usuario_id 
                       AND rp.activo = 1
                       AND pu.puede_evaluar = TRUE
                     ORDER BY rp.nombre";
            
            $stmt = $db->prepare($query);
            $stmt->execute([':usuario_id' => $usuario_id]);
            $user_roles = $stmt->fetchAll();
            
            foreach ($user_roles as $role) {
                $roles_permitidos[] = [
                    'id' => $role['id'],
                    'codigo' => $role['codigo'],
                    'nombre' => $role['nombre'],
                    'descripcion' => $role['descripcion'] ?? '',
                    'puede_evaluar' => (bool)$role['puede_evaluar'],
                    'puede_ver_resultados' => (bool)$role['puede_ver_resultados']
                ];
            }
            
            error_log("Usuario con permisos específicos - devolviendo " . count($roles_permitidos) . " roles");
        }
    }
    
    // Log final
    error_log("Roles finales para {$user['username']}: " . json_encode(array_column($roles_permitidos, 'codigo')));
    
    sendJsonResponse([
        'success' => true,
        'data' => $roles_permitidos,
        'meta' => [
            'usuario_id' => (int)$usuario_id,
            'username' => $user['username'],
            'nombre_completo' => $user['nombre_completo'],
            'rol_sistema' => $user['rol'],
            'permisos_completos' => (bool)$user['permisos_completos'],
            'total_roles_permitidos' => count($roles_permitidos),
            'sistema_permisos' => $user['permisos_completos'] ? 'completos' : 'específicos'
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en roles-permitidos.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    handleError('Error al obtener roles permitidos: ' . $e->getMessage());
}
?>