<?php
require_once '../config/database.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $query = "SELECT id, nombre, descripcion, orden, icono, mostrar_lectura 
                     FROM secciones_operacion 
                     WHERE activo = 1 
                     ORDER BY orden ASC";
            $stmt = $db->query($query);
            $result = $stmt->fetchAll();
            sendJsonResponse(['success' => true, 'data' => $result]);
        } catch (Exception $e) {
            handleError('Error al obtener secciones: ' . $e->getMessage(), 500);
        }
        break;
        
    default:
        handleError('Método no permitido', 405);
}
