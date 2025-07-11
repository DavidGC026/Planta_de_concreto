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
    
    // Verificar que el usuario existe
    $user_check = $db->prepare("SELECT id, username, permisos_completos FROM usuarios WHERE id = :usuario_id AND activo = 1");
    $user_check->execute([':usuario_id' => $usuario_id]);
    $user = $user_check->fetch();
    
    if (!$user) {
        handleError('Usuario no encontrado', 404);
    }
    
    // Obtener roles permitidos usando la función de base de datos
    $query = "SELECT ObtenerRolesPermitidos(:usuario_id) as roles_permitidos";
    $stmt = $db->prepare($query);
    $stmt->execute([':usuario_id' => $usuario_id]);
    
    $result = $stmt->fetch();
    $roles_permitidos = [];
    
    if ($result && $result['roles_permitidos']) {
        $decoded = json_decode($result['roles_permitidos'], true);
        if (is_array($decoded)) {
            $roles_permitidos = $decoded;
        }
    }
    
    // Log para debugging
    error_log("Usuario {$user['username']} - Permisos completos: " . ($user['permisos_completos'] ? 'SÍ' : 'NO'));
    error_log("Roles permitidos: " . json_encode($roles_permitidos));
    
    sendJsonResponse([
        'success' => true,
        'data' => $roles_permitidos,
        'meta' => [
            'usuario_id' => (int)$usuario_id,
            'username' => $user['username'],
            'permisos_completos' => (bool)$user['permisos_completos'],
            'total_roles_permitidos' => count($roles_permitidos)
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en roles-permitidos.php: " . $e->getMessage());
    handleError('Error al obtener roles permitidos: ' . $e->getMessage());
}
?>