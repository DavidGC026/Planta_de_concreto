<?php
/**
 * API Admin - Gestión de tokens permanentes SSO
 * Acciones:
 * - GET: listar tokens
 * - POST: crear token { page_slug, tipo_evaluacion? }
 * - DELETE: desactivar token ?token=...
 */

require_once '../config/database.php';

setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();

    // Asegurar tabla
    $db->exec("CREATE TABLE IF NOT EXISTS sso_permanent_tokens (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(128) NOT NULL UNIQUE,
        page_slug VARCHAR(150) NOT NULL,
        tipo_evaluacion VARCHAR(50) DEFAULT NULL,
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Agregar columna expires_at si no existe
    try { $db->exec("ALTER TABLE sso_permanent_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL DEFAULT NULL"); } catch (Exception $e) { /* ignorar */ }

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $db->query("SELECT token, page_slug, tipo_evaluacion, activo, fecha_creacion, expires_at FROM sso_permanent_tokens ORDER BY id DESC");
        $rows = $stmt->fetchAll();
        sendJsonResponse(['success' => true, 'data' => $rows]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $page = isset($input['page_slug']) ? trim($input['page_slug']) : null;
        $tipo = isset($input['tipo_evaluacion']) ? trim($input['tipo_evaluacion']) : null;
        $expiresInDays = isset($input['expires_in_days']) ? intval($input['expires_in_days']) : null;
        $expiresAtParam = isset($input['expires_at']) ? trim($input['expires_at']) : null;
        if (!$page) {
            handleError('page_slug es requerido', 400);
        }
        $token = bin2hex(random_bytes(24));
        $expiresAt = null;
        if ($expiresAtParam) {
            $expiresAt = date('Y-m-d H:i:s', strtotime($expiresAtParam));
        } elseif ($expiresInDays && $expiresInDays > 0) {
            $expiresAt = date('Y-m-d H:i:s', time() + ($expiresInDays * 86400));
        }
        $stmt = $db->prepare("INSERT INTO sso_permanent_tokens (token, page_slug, tipo_evaluacion, activo, expires_at) VALUES (:t, :p, :te, 1, :ea)");
        $stmt->bindParam(':t', $token);
        $stmt->bindParam(':p', $page);
        $stmt->bindParam(':te', $tipo);
        $stmt->bindParam(':ea', $expiresAt);
        $stmt->execute();
        sendJsonResponse(['success' => true, 'data' => ['token' => $token, 'page_slug' => $page, 'tipo_evaluacion' => $tipo, 'expires_at' => $expiresAt]]);
    } elseif ($method === 'DELETE') {
        $token = $_GET['token'] ?? null;
        if (!$token) {
            handleError('token es requerido', 400);
        }
        $stmt = $db->prepare("UPDATE sso_permanent_tokens SET activo = 0 WHERE token = :t");
        $stmt->bindParam(':t', $token);
        $stmt->execute();
        sendJsonResponse(['success' => true, 'data' => ['token' => $token, 'activo' => 0]]);
    } else {
        handleError('Método no permitido', 405);
    }
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}

?>


