<?php
require_once '../config/database.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            // Obtener datos de volumen para la gráfica
            $query = "SELECT fecha, volumen, minimo, maximo, observaciones 
                     FROM datos_volumen_operacion 
                     ORDER BY fecha ASC";
            $stmt = $db->query($query);
            $result = $stmt->fetchAll();
            
            sendJsonResponse(['success' => true, 'data' => $result]);
        } catch (Exception $e) {
            handleError('Error al obtener datos de volumen: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['volumen'], $input['minimo'], $input['maximo'])) {
            handleError('Se requiere volumen, mínimo y máximo', 400);
        }
        
        $fecha = isset($input['fecha']) ? $input['fecha'] : date('Y-m-d');
        $volumen = (float) $input['volumen'];
        $minimo = (float) $input['minimo'];
        $maximo = (float) $input['maximo'];
        $observaciones = isset($input['observaciones']) ? sanitizeInput($input['observaciones']) : '';
        
        try {
            $query = "INSERT INTO datos_volumen_operacion (fecha, volumen, minimo, maximo, observaciones) 
                     VALUES (:fecha, :volumen, :minimo, :maximo, :observaciones)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':fecha', $fecha);
            $stmt->bindParam(':volumen', $volumen);
            $stmt->bindParam(':minimo', $minimo);
            $stmt->bindParam(':maximo', $maximo);
            $stmt->bindParam(':observaciones', $observaciones);
            $stmt->execute();
            
            $id = $db->lastInsertId();
            sendJsonResponse(['success' => true, 'id' => $id, 'action' => 'created']);
        } catch (Exception $e) {
            handleError('Error al insertar datos de volumen: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            handleError('Se requiere ID del registro', 400);
        }
        
        $id = (int) $input['id'];
        $updates = [];
        $params = [':id' => $id];
        
        if (isset($input['volumen'])) {
            $updates[] = "volumen = :volumen";
            $params[':volumen'] = (float) $input['volumen'];
        }
        if (isset($input['minimo'])) {
            $updates[] = "minimo = :minimo";
            $params[':minimo'] = (float) $input['minimo'];
        }
        if (isset($input['maximo'])) {
            $updates[] = "maximo = :maximo";
            $params[':maximo'] = (float) $input['maximo'];
        }
        if (isset($input['observaciones'])) {
            $updates[] = "observaciones = :observaciones";
            $params[':observaciones'] = sanitizeInput($input['observaciones']);
        }
        
        if (empty($updates)) {
            handleError('No hay campos para actualizar', 400);
        }
        
        try {
            $query = "UPDATE datos_volumen_operacion SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            if ($stmt->rowCount() > 0) {
                sendJsonResponse(['success' => true, 'id' => $id, 'action' => 'updated']);
            } else {
                handleError('No se encontró el registro para actualizar', 404);
            }
        } catch (Exception $e) {
            handleError('Error al actualizar datos de volumen: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            handleError('Se requiere ID del registro', 400);
        }
        
        $id = (int) $input['id'];
        
        try {
            $query = "DELETE FROM datos_volumen_operacion WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                sendJsonResponse(['success' => true, 'id' => $id, 'action' => 'deleted']);
            } else {
                handleError('No se encontró el registro para eliminar', 404);
            }
        } catch (Exception $e) {
            handleError('Error al eliminar datos de volumen: ' . $e->getMessage(), 500);
        }
        break;
        
    default:
        handleError('Método no permitido', 405);
}
