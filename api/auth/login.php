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
        handleError('Usuario y contraseña son requeridos', 400);
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    
    // Buscar usuario en la base de datos
    $query = "SELECT id, username, password_hash, nombre_completo, email, rol, activo 
              FROM usuarios 
              WHERE username = :username AND activo = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $username);
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
                'rol' => $user['rol']
            ],
            'token' => $token
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}
?>