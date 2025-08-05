<?php
/**
 * API de administración - Cambiar contraseña de usuario
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Método no permitido', 405);
}

try {
    // Log para debug
    error_log("change-password.php: Iniciando proceso");
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Obtener datos del request
    $input_raw = file_get_contents('php://input');
    error_log("change-password.php: Input raw: " . $input_raw);
    
    $input = json_decode($input_raw, true);
    
    if (!$input) {
        error_log("change-password.php: Error decodificando JSON: " . json_last_error_msg());
        handleError('Datos JSON inválidos', 400);
    }
    
    error_log("change-password.php: Input decodificado: " . json_encode($input));
    
    // Validar datos requeridos
    $requiredFields = ['user_id', 'new_password'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            handleError("El campo {$field} es requerido", 400);
        }
    }
    
    $userId = (int)$input['user_id'];
    $newPassword = $input['new_password'];
    
    // Validar longitud de contraseña
    if (strlen($newPassword) < 6) {
        handleError('La contraseña debe tener al menos 6 caracteres', 400);
    }
    
    // Verificar que el usuario existe
    $checkQuery = "SELECT id, username, nombre_completo FROM usuarios WHERE id = :user_id AND activo = 1";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $userId);
    $checkStmt->execute();
    
    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        handleError('Usuario no encontrado o inactivo', 404);
    }
    
    // Hash de la nueva contraseña
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Actualizar la contraseña (usar password_hash como nombre de columna)
    $updateQuery = "UPDATE usuarios SET password_hash = :password_hash WHERE id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':password_hash', $hashedPassword);
    $updateStmt->bindParam(':user_id', $userId);
    
    error_log("change-password.php: Ejecutando query: " . $updateQuery);
    error_log("change-password.php: Para usuario ID: " . $userId);
    
    if ($updateStmt->execute()) {
        // Respuesta exitosa
        sendJsonResponse([
            'success' => true,
            'message' => 'Contraseña actualizada exitosamente',
            'data' => [
                'user_id' => $userId,
                'username' => $user['username'],
                'nombre_completo' => $user['nombre_completo']
            ]
        ]);
    } else {
        handleError('Error al actualizar la contraseña', 500);
    }
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage(), 500);
}
?>
