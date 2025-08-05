<?php
/**
 * API de administración - Crear nuevo usuario
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
    
    if (!$input) {
        handleError('Datos JSON inválidos', 400);
    }
    
    // Validar datos requeridos
    $requiredFields = ['username', 'password', 'nombre_completo', 'email'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            handleError("El campo {$field} es requerido", 400);
        }
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    $nombre_completo = trim($input['nombre_completo']);
    $email = trim($input['email']);
    $rol = isset($input['rol']) ? trim($input['rol']) : 'usuario';
    
    // Validar formato de email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        handleError('El formato del email no es válido', 400);
    }
    
    // Validar longitud de contraseña
    if (strlen($password) < 6) {
        handleError('La contraseña debe tener al menos 6 caracteres', 400);
    }
    
    // Verificar si el username ya existe
    $checkQuery = "SELECT id FROM usuarios WHERE username = :username";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':username', $username);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        handleError('El nombre de usuario ya existe', 409);
    }
    
    // Verificar si el email ya existe
    $checkEmailQuery = "SELECT id FROM usuarios WHERE email = :email";
    $checkEmailStmt = $db->prepare($checkEmailQuery);
    $checkEmailStmt->bindParam(':email', $email);
    $checkEmailStmt->execute();
    
    if ($checkEmailStmt->fetch()) {
        handleError('El email ya está registrado', 409);
    }
    
    // Hash de la contraseña
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Validar rol permitido
    $rolesPermitidos = ['admin', 'evaluador', 'supervisor'];
    if (!in_array($rol, $rolesPermitidos)) {
        $rol = 'evaluador'; // Valor por defecto
    }
    
    // Insertar nuevo usuario (usar password_hash como nombre de columna)
    $insertQuery = "INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo) 
                    VALUES (:username, :password_hash, :nombre_completo, :email, :rol, 1)";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':username', $username);
    $insertStmt->bindParam(':password_hash', $hashedPassword);
    $insertStmt->bindParam(':nombre_completo', $nombre_completo);
    $insertStmt->bindParam(':email', $email);
    $insertStmt->bindParam(':rol', $rol);
    
    if ($insertStmt->execute()) {
        $userId = $db->lastInsertId();
        
        // Respuesta exitosa
        sendJsonResponse([
            'success' => true,
            'message' => 'Usuario creado exitosamente',
            'data' => [
                'user_id' => $userId,
                'username' => $username,
                'nombre_completo' => $nombre_completo,
                'email' => $email,
                'rol' => $rol
            ]
        ]);
    } else {
        handleError('Error al crear el usuario', 500);
    }
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage(), 500);
}
?>
