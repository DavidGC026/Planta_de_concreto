<?php
/**
 * API para verificar permisos de usuario
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
    $rol_codigo = $input['rol_codigo'] ?? null;
    
    // Si se especifica un rol, verificar permisos específicos
    if ($rol_codigo) {
        $query = "SELECT UsuarioPuedeEvaluarRol(:usuario_id, :rol_codigo) as puede_evaluar";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':rol_codigo' => $rol_codigo
        ]);
        
        $result = $stmt->fetch();
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'puede_evaluar' => (bool)$result['puede_evaluar'],
                'rol_codigo' => $rol_codigo
            ]
        ]);
    } else {
        // Obtener todos los roles permitidos para el usuario
        $query = "SELECT ObtenerRolesPermitidos(:usuario_id) as roles_permitidos";
        $stmt = $db->prepare($query);
        $stmt->execute([':usuario_id' => $usuario_id]);
        
        $result = $stmt->fetch();
        $roles_permitidos = json_decode($result['roles_permitidos'], true) ?? [];
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'roles_permitidos' => $roles_permitidos,
                'total_roles' => count($roles_permitidos)
            ]
        ]);
    }
    
} catch (Exception $e) {
    handleError('Error al verificar permisos: ' . $e->getMessage());
}
?>