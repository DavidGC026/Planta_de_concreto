<?php
/**
 * API de administración - Lista de usuarios
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
    
    // Consultar todos los usuarios activos
    $query = "SELECT 
                id,
                username,
                nombre_completo,
                email,
                rol,
                activo,
                fecha_creacion,
                fecha_actualizacion,
                CASE 
                    WHEN rol = 'admin' OR rol = 'superadmin' THEN 1 
                    ELSE permisos_completos 
                END as permisos_completos
              FROM usuarios 
              WHERE activo = 1
              ORDER BY nombre_completo ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $users = $stmt->fetchAll();
    
    // Respuesta exitosa
    sendJsonResponse([
        'success' => true,
        'data' => $users
    ]);
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}
?>
