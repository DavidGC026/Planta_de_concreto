<?php
require_once '../config/database.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Solo permitir actualización de observaciones
        if (!$input || !isset($input['id'], $input['observaciones'])) {
            handleError('Se requiere ID del parámetro y observaciones', 400);
        }
        
        $id = (int) $input['id'];
        $observaciones = sanitizeInput($input['observaciones']);
        
        try {
            $query = "UPDATE parametros_seguimiento SET observaciones = :observaciones, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':observaciones', $observaciones);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                sendJsonResponse(['success' => true, 'id' => $id, 'action' => 'updated']);
            } else {
                handleError('No se encontró el parámetro para actualizar', 404);
            }
        } catch (Exception $e) {
            handleError('Error al actualizar observaciones: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'GET':
        try {
            // Obtener sección específica si se proporciona
            $seccion_id = isset($_GET['seccion_id']) ? (int) $_GET['seccion_id'] : null;
            
            if ($seccion_id) {
                // Obtener parámetros de una sección específica
                $query = "SELECT p.id, p.parametro, p.frecuencia_sugerida, p.observaciones, p.referencia_normativa, 
                                s.nombre as seccion_nombre, s.descripcion as seccion_descripcion
                         FROM parametros_seguimiento p 
                         INNER JOIN secciones_operacion s ON p.seccion_id = s.id 
                         WHERE p.seccion_id = :seccion_id AND p.activo = 1 AND s.activa = 1
                         ORDER BY p.orden_en_seccion ASC";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':seccion_id', $seccion_id);
                $stmt->execute();
            } else {
                // Obtener todas las secciones con sus parámetros
                $query = "SELECT s.id as seccion_id, s.nombre as seccion_nombre, s.descripcion as seccion_descripcion,
                                p.id, p.parametro, p.frecuencia_sugerida, p.observaciones, p.referencia_normativa
                         FROM secciones_operacion s 
                         LEFT JOIN parametros_seguimiento p ON s.id = p.seccion_id AND p.activo = 1
                         WHERE s.activa = 1
                         ORDER BY s.orden_visualizacion ASC, p.orden_en_seccion ASC";
                $stmt = $db->query($query);
            }
            
            $result = $stmt->fetchAll();
            sendJsonResponse(['success' => true, 'data' => $result]);
        } catch (Exception $e) {
            handleError('Error al obtener datos: ' . $e->getMessage(), 500);
        }
        break;
        
    default:
        handleError('Método no permitido', 405);
}
?>
