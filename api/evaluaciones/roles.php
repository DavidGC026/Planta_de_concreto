<?php
/**
 * API para obtener roles de personal
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
    
    // Obtener roles de personal activos
    $query = "SELECT id, codigo, nombre, descripcion 
              FROM roles_personal 
              WHERE activo = 1 
              ORDER BY nombre";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $roles = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'data' => $roles
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener roles de personal: ' . $e->getMessage());
}
?>