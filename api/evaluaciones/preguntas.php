<?php
/**
 * API para obtener preguntas de evaluación
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
    
    // Obtener parámetros
    $tipo_evaluacion = $_GET['tipo'] ?? null;
    $rol_personal = $_GET['rol'] ?? null;
    
    if (!$tipo_evaluacion) {
        handleError('Tipo de evaluación es requerido', 400);
    }
    
    // Construir query base
    $query = "SELECT 
                s.id as seccion_id,
                s.nombre as seccion_nombre,
                s.orden as seccion_orden,
                p.id as pregunta_id,
                p.pregunta,
                p.tipo_pregunta,
                p.opcion_a,
                p.opcion_b,
                p.opcion_c,
                p.respuesta_correcta,
                p.orden as pregunta_orden
              FROM secciones_evaluacion s
              JOIN preguntas p ON s.id = p.seccion_id
              JOIN tipos_evaluacion te ON s.tipo_evaluacion_id = te.id
              WHERE te.codigo = :tipo_evaluacion 
                AND s.activo = 1 
                AND p.activo = 1";
    
    $params = [':tipo_evaluacion' => $tipo_evaluacion];
    
    // Agregar filtro por rol si es evaluación de personal
    if ($tipo_evaluacion === 'personal' && $rol_personal) {
        $query .= " AND EXISTS (
                      SELECT 1 FROM roles_personal rp 
                      WHERE rp.id = s.rol_personal_id 
                      AND rp.codigo = :rol_personal
                    )";
        $params[':rol_personal'] = $rol_personal;
    }
    
    $query .= " ORDER BY s.orden, p.orden";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    $resultados = $stmt->fetchAll();
    
    // Organizar por secciones
    $secciones = [];
    foreach ($resultados as $row) {
        $seccion_id = $row['seccion_id'];
        
        if (!isset($secciones[$seccion_id])) {
            $secciones[$seccion_id] = [
                'id' => $seccion_id,
                'nombre' => $row['seccion_nombre'],
                'orden' => $row['seccion_orden'],
                'preguntas' => []
            ];
        }
        
        $pregunta = [
            'id' => $row['pregunta_id'],
            'pregunta' => $row['pregunta'],
            'tipo_pregunta' => $row['tipo_pregunta'],
            'orden' => $row['pregunta_orden']
        ];
        
        // Agregar opciones de selección múltiple si existen
        if ($row['tipo_pregunta'] === 'seleccion_multiple') {
            $pregunta['opcion_a'] = $row['opcion_a'];
            $pregunta['opcion_b'] = $row['opcion_b'];
            $pregunta['opcion_c'] = $row['opcion_c'];
            $pregunta['respuesta_correcta'] = $row['respuesta_correcta'];
        }
        
        $secciones[$seccion_id]['preguntas'][] = $pregunta;
    }
    
    // Convertir a array indexado
    $secciones_array = array_values($secciones);
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'tipo_evaluacion' => $tipo_evaluacion,
            'rol_personal' => $rol_personal,
            'secciones' => $secciones_array
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener preguntas: ' . $e->getMessage());
}
?>