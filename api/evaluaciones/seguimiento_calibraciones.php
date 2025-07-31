<?php
require_once '../config/database.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['parametro'], $input['frecuencia_sugerida'])) {
            handleError('Faltan campos obligatorios', 400);
        }
        $parametro = sanitizeInput($input['parametro']);
        $frecuencia = sanitizeInput($input['frecuencia_sugerida']);
        $observaciones = isset($input['observaciones']) ? sanitizeInput($input['observaciones']) : null;
        $referencia = isset($input['referencia_normativa']) ? sanitizeInput($input['referencia_normativa']) : null;
        
        try {
            // Si se proporciona un ID, actualizar; si no, crear nuevo
            if (isset($input['id']) && !empty($input['id'])) {
                $id = (int) $input['id'];
                $query = "UPDATE seguimiento_calibraciones SET parametro = :parametro, frecuencia_sugerida = :frecuencia, observaciones = :observaciones, referencia_normativa = :referencia WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':parametro', $parametro);
                $stmt->bindParam(':frecuencia', $frecuencia);
                $stmt->bindParam(':observaciones', $observaciones);
                $stmt->bindParam(':referencia', $referencia);
                $stmt->bindParam(':id', $id);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(['success' => true, 'id' => $id, 'action' => 'updated']);
                } else {
                    handleError('No se encontró el registro para actualizar', 404);
                }
            } else {
                // Crear nuevo registro
                $query = "INSERT INTO seguimiento_calibraciones (parametro, frecuencia_sugerida, observaciones, referencia_normativa) VALUES (:parametro, :frecuencia, :observaciones, :referencia)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':parametro', $parametro);
                $stmt->bindParam(':frecuencia', $frecuencia);
                $stmt->bindParam(':observaciones', $observaciones);
                $stmt->bindParam(':referencia', $referencia);
                $stmt->execute();
                sendJsonResponse(['success' => true, 'id' => $db->lastInsertId(), 'action' => 'created']);
            }
        } catch (Exception $e) {
            handleError('Error al guardar calibración: ' . $e->getMessage(), 500);
        }
        break;
    case 'GET':
        try {
            $query = "SELECT id, parametro, frecuencia_sugerida, observaciones, referencia_normativa, created_at FROM seguimiento_calibraciones ORDER BY created_at DESC";
            $stmt = $db->query($query);
            $result = $stmt->fetchAll();
            sendJsonResponse(['success' => true, 'data' => $result]);
        } catch (Exception $e) {
            handleError('Error al obtener calibraciones: ' . $e->getMessage(), 500);
        }
        break;
    default:
        handleError('Método no permitido', 405);
}
