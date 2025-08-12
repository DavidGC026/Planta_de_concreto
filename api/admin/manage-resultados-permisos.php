<?php
/**
 * API Admin - Gestionar permisos en la BD "resultados" (plataforma externa)
 * - GET: listar usuarios (id, nombre, email, permiso)
 * - PATCH: actualizar permiso por usuario { usuario_id, permiso }
 */

require_once '../config/database_resultados.php';
require_once '../config/database.php'; // para setCorsHeaders/handlers

setCorsHeaders();

try {
    $db2 = (new DatabaseResultados())->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $db2->query("SELECT id, nombre, email, empresa, permiso FROM usuarios ORDER BY nombre");
        $rows = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $rows]);
    } elseif ($method === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true);
        $usuarioId = isset($input['usuario_id']) ? intval($input['usuario_id']) : null;
        $permiso = isset($input['permiso']) ? intval($input['permiso']) : null; // 0/1
        if (!$usuarioId || $permiso === null) {
            handleError('usuario_id y permiso son requeridos', 400);
        }
        $stmt = $db2->prepare("UPDATE usuarios SET permiso = :p WHERE id = :id");
        $stmt->bindParam(':p', $permiso, PDO::PARAM_INT);
        $stmt->bindParam(':id', $usuarioId, PDO::PARAM_INT);
        $stmt->execute();
        sendJsonResponse(['success' => true, 'data' => ['usuario_id' => $usuarioId, 'permiso' => $permiso]]);
    } else {
        handleError('Método no permitido', 405);
    }
} catch (Exception $e) {
    handleError('Error externo: ' . $e->getMessage());
}

?>


