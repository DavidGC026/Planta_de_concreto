<?php
/**
 * API de autenticación simplificada - Jefe de Planta
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        handleError('Usuario y contraseña son requeridos', 400);
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    
    // Verificación simple para demo
    if ($username === 'admin' && $password === 'admin123') {
        $user = [
            'id' => 1,
            'username' => 'admin',
            'nombre_completo' => 'Administrador Jefe de Planta',
            'email' => 'admin@imcyc.org',
            'rol' => 'admin'
        ];
        
        $token = base64_encode($user['id'] . ':' . time() . ':' . $user['username']);
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ]);
    } else {
        handleError('Credenciales inválidas', 401);
    }
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}
?>