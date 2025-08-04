<?php
/**
 * API para generar reportes de evaluación
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
    
    $evaluacion_id = $input['evaluacion_id'] ?? null;
    $tipo_reporte = $input['tipo_reporte'] ?? 'json';
    
    if (!$evaluacion_id) {
        handleError('ID de evaluación es requerido', 400);
    }
    
    // Obtener datos completos de la evaluación
    $query = "SELECT 
                e.*,
                u.username,
                u.nombre_completo,
                te.nombre AS tipo_evaluacion,
                te.codigo AS tipo_codigo,
                rp.nombre AS rol_personal,
                rp.codigo AS rol_codigo,
                CASE 
                    WHEN e.puntuacion_total >= 120 THEN 'APROBADO'
                    ELSE 'REPROBADO'
                END AS resultado
              FROM evaluaciones e
              JOIN usuarios u ON e.usuario_id = u.id
              JOIN tipos_evaluacion te ON e.tipo_evaluacion_id = te.id
              LEFT JOIN roles_personal rp ON e.rol_personal_id = rp.id
              WHERE e.id = :evaluacion_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':evaluacion_id', $evaluacion_id);
    $stmt->execute();
    
    $evaluacion = $stmt->fetch();
    
    if (!$evaluacion) {
        handleError('Evaluación no encontrada', 404);
    }
    
    // Obtener respuestas detalladas
    $query = "SELECT 
                re.respuesta,
                re.observacion,
                p.pregunta,
                s.nombre AS seccion_nombre,
                s.orden AS seccion_orden,
                p.orden AS pregunta_orden
              FROM respuestas_evaluacion re
              JOIN preguntas p ON re.pregunta_id = p.id
              JOIN secciones_evaluacion s ON p.seccion_id = s.id
              WHERE re.evaluacion_id = :evaluacion_id
              ORDER BY s.orden, p.orden";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':evaluacion_id', $evaluacion_id);
    $stmt->execute();
    
    $respuestas = $stmt->fetchAll();
    
    // Organizar respuestas por sección
    $secciones = [];
    foreach ($respuestas as $respuesta) {
        $seccion_nombre = $respuesta['seccion_nombre'];
        
        if (!isset($secciones[$seccion_nombre])) {
            $secciones[$seccion_nombre] = [
                'nombre' => $seccion_nombre,
                'orden' => $respuesta['seccion_orden'],
                'preguntas' => []
            ];
        }
        
        $secciones[$seccion_nombre]['preguntas'][] = [
            'pregunta' => $respuesta['pregunta'],
            'respuesta' => $respuesta['respuesta'],
            'observacion' => $respuesta['observacion'],
            'orden' => $respuesta['pregunta_orden']
        ];
    }
    
    // Convertir a array indexado y ordenar
    $secciones_array = array_values($secciones);
    usort($secciones_array, function($a, $b) {
        return $a['orden'] - $b['orden'];
    });
    
    // Preparar datos del reporte
    $reporte_data = [
        'evaluacion' => $evaluacion,
        'secciones' => $secciones_array,
        'estadisticas' => [
            'total_preguntas' => $evaluacion['total_preguntas'],
            'respuestas_si' => $evaluacion['respuestas_si'],
            'respuestas_no' => $evaluacion['respuestas_no'],
            'respuestas_na' => $evaluacion['respuestas_na'],
            'porcentaje_aprobacion' => round(($evaluacion['respuestas_si'] / $evaluacion['total_preguntas']) * 100, 2)
        ],
        'fecha_generacion' => date('Y-m-d H:i:s')
    ];
    
    // Generar reporte según el tipo
    switch ($tipo_reporte) {
        case 'json':
            $contenido = json_encode($reporte_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            $nombre_archivo = "evaluacion_{$evaluacion_id}_" . date('Y-m-d_H-i-s') . ".json";
            break;
            
        case 'csv':
            $contenido = generateCSV($reporte_data);
            $nombre_archivo = "evaluacion_{$evaluacion_id}_" . date('Y-m-d_H-i-s') . ".csv";
            break;
            
        default:
            handleError('Tipo de reporte no soportado', 400);
    }
    
    // Guardar registro del reporte en la base de datos
    $query = "INSERT INTO reportes (evaluacion_id, tipo_reporte, ruta_archivo, tamaño_archivo)
              VALUES (:evaluacion_id, :tipo_reporte, :ruta_archivo, :tamaño_archivo)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':evaluacion_id' => $evaluacion_id,
        ':tipo_reporte' => $tipo_reporte,
        ':ruta_archivo' => $nombre_archivo,
        ':tamaño_archivo' => strlen($contenido)
    ]);
    
    // Enviar respuesta con el contenido del reporte
    sendJsonResponse([
        'success' => true,
        'data' => [
            'reporte' => $reporte_data,
            'nombre_archivo' => $nombre_archivo,
            'tipo_reporte' => $tipo_reporte,
            'tamaño' => strlen($contenido)
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error al generar reporte: ' . $e->getMessage());
}

/**
 * Función para generar CSV
 */
function generateCSV($data) {
    $output = fopen('php://temp', 'r+');
    
    // Encabezados del CSV
    fputcsv($output, [
        'Evaluación ID',
        'Usuario',
        'Tipo Evaluación',
        'Rol Personal',
        'Puntuación Total',
        'Resultado',
        'Fecha'
    ]);
    
    // Datos de la evaluación
    fputcsv($output, [
        $data['evaluacion']['id'],
        $data['evaluacion']['nombre_completo'],
        $data['evaluacion']['tipo_evaluacion'],
        $data['evaluacion']['rol_personal'] ?? 'N/A',
        $data['evaluacion']['puntuacion_total'],
        $data['evaluacion']['resultado'],
        $data['evaluacion']['fecha_finalizacion']
    ]);
    
    // Línea vacía
    fputcsv($output, []);
    
    // Encabezados de preguntas
    fputcsv($output, ['Sección', 'Pregunta', 'Respuesta', 'Observación']);
    
    // Datos de preguntas
    foreach ($data['secciones'] as $seccion) {
        foreach ($seccion['preguntas'] as $pregunta) {
            fputcsv($output, [
                $seccion['nombre'],
                $pregunta['pregunta'],
                strtoupper($pregunta['respuesta']),
                $pregunta['observacion'] ?? ''
            ]);
        }
    }
    
    rewind($output);
    $csv_content = stream_get_contents($output);
    fclose($output);
    
    return $csv_content;
}
?>