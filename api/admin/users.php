<?php
/**
 * API para obtener usuarios del sistema (solo para administradores)
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
    
    // Obtener todos los usuarios activos
    $query = "SELECT 
                id,
                username,
                nombre_completo,
                email,
                rol,
                permisos_completos,
                activo,
                fecha_creacion
              FROM usuarios 
              WHERE activo = 1 
              ORDER BY nombre_completo";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $usuarios = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'data' => $usuarios
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener usuarios: ' . $e->getMessage());
}
?>