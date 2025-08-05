<?php
/**
 * API de autenticación - Login
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
    
    if (!isset($input['username']) || !isset($input['password'])) {
        handleError('Usuario/email y contraseña son requeridos', 400);
    }
    
    $loginField = trim($input['username']); // Puede ser username o email
    $password = $input['password'];
    
    // Buscar usuario en la base de datos por username o email
    $query = "SELECT id, username, password_hash, nombre_completo, email, rol, activo, puede_hacer_examen 
              FROM usuarios 
              WHERE (username = :username OR email = :email) AND activo = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $loginField);
    $stmt->bindParam(':email', $loginField);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    if (!$user) {
        handleError('Credenciales inválidas', 401);
    }
    
    // Verificar contraseña
    if (!password_verify($password, $user['password_hash'])) {
        handleError('Credenciales inválidas', 401);
    }
    
    // Generar token simple (en producción usar JWT)
    $token = base64_encode($user['id'] . ':' . time() . ':' . $user['username']);
    
    // Respuesta exitosa
    sendJsonResponse([
        'success' => true,
        'data' => [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'nombre_completo' => $user['nombre_completo'],
                'email' => $user['email'],
                'rol' => $user['rol'],
                'puede_hacer_examen' => $user['puede_hacer_examen']
            ],
            'token' => $token
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}
?>