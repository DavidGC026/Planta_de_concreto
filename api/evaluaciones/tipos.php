<?php
/**
 * API para obtener tipos de evaluación
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
    
    // Obtener tipos de evaluación activos
    $query = "SELECT id, codigo, nombre, descripcion 
              FROM tipos_evaluacion 
              WHERE activo = 1 
              ORDER BY nombre";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $tipos = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'data' => $tipos
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener tipos de evaluación: ' . $e->getMessage());
}
?>