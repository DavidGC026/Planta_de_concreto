<?php
/**
 * API para obtener preguntas de evaluación con sistema de ponderación y preguntas trampa
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
    $preguntas_por_seccion = intval($_GET['preguntas_por_seccion'] ?? 5);
    
    if (!$tipo_evaluacion) {
        handleError('Tipo de evaluación es requerido', 400);
    }
    
    // Obtener configuración de ponderación
    $config_query = "SELECT cp.*, te.nombre as tipo_nombre, rp.nombre as rol_nombre
                     FROM configuracion_ponderacion cp
                     JOIN tipos_evaluacion te ON cp.tipo_evaluacion_id = te.id
                     LEFT JOIN roles_personal rp ON cp.rol_personal_id = rp.id
                     WHERE te.codigo = :tipo_evaluacion 
                     AND (cp.rol_personal_id IS NULL OR rp.codigo = :rol_personal)
                     AND cp.activo = 1
                     LIMIT 1";
    
    $config_stmt = $db->prepare($config_query);
    $config_stmt->execute([
        ':tipo_evaluacion' => $tipo_evaluacion,
        ':rol_personal' => $rol_personal
    ]);
    $configuracion = $config_stmt->fetch();
    
    // Obtener secciones normales (no trampa)
    $secciones_query = "SELECT 
                          s.id as seccion_id,
                          s.nombre as seccion_nombre,
                          s.orden as seccion_orden,
                          s.ponderacion as seccion_ponderacion,
                          s.preguntas_trampa_por_seccion,
                          te.codigo as tipo_codigo,
                          rp.codigo as rol_codigo
                        FROM secciones_evaluacion s
                        JOIN tipos_evaluacion te ON s.tipo_evaluacion_id = te.id
                        LEFT JOIN roles_personal rp ON s.rol_personal_id = rp.id
                        WHERE te.codigo = :tipo_evaluacion 
                          AND s.activo = 1 
                          AND s.es_trampa = 0";
    
    $params = [':tipo_evaluacion' => $tipo_evaluacion];
    
    if ($tipo_evaluacion === 'personal' && $rol_personal) {
        $secciones_query .= " AND rp.codigo = :rol_personal";
        $params[':rol_personal'] = $rol_personal;
    }
    
    $secciones_query .= " ORDER BY s.orden";
    
    $secciones_stmt = $db->prepare($secciones_query);
    $secciones_stmt->execute($params);
    $secciones_data = $secciones_stmt->fetchAll();
    
    // Obtener preguntas trampa disponibles
    $trampa_query = "SELECT p.id, p.pregunta, p.tipo_pregunta, p.opcion_a, p.opcion_b, p.opcion_c, p.respuesta_correcta
                     FROM preguntas p
                     JOIN secciones_evaluacion s ON p.seccion_id = s.id
                     JOIN tipos_evaluacion te ON s.tipo_evaluacion_id = te.id
                     LEFT JOIN roles_personal rp ON s.rol_personal_id = rp.id
                     WHERE te.codigo = :tipo_evaluacion 
                       AND p.activo = 1 
                       AND p.es_trampa = 1
                       AND s.es_trampa = 1";
    
    if ($tipo_evaluacion === 'personal' && $rol_personal) {
        $trampa_query .= " AND rp.codigo = :rol_personal";
    }
    
    $trampa_query .= " ORDER BY RAND()"; // Aleatorizar preguntas trampa
    
    $trampa_stmt = $db->prepare($trampa_query);
    $trampa_stmt->execute($params);
    $preguntas_trampa = $trampa_stmt->fetchAll();
    
    // Construir respuesta con preguntas mezcladas
    $secciones_resultado = [];
    $total_ponderacion = 0;
    $trampa_usadas = 0;
    
    foreach ($secciones_data as $seccion) {
        // Obtener preguntas normales de la sección
        $preguntas_query = "SELECT 
                              p.id as pregunta_id,
                              p.pregunta,
                              p.tipo_pregunta,
                              p.opcion_a,
                              p.opcion_b,
                              p.opcion_c,
                              p.respuesta_correcta,
                              p.orden as pregunta_orden,
                              p.ponderacion_individual,
                              p.es_trampa
                            FROM preguntas p
                            WHERE p.seccion_id = :seccion_id
                              AND p.activo = 1 
                              AND p.es_trampa = 0
                            ORDER BY RAND()"; // Aleatorizar preguntas normales también
        
        $preguntas_stmt = $db->prepare($preguntas_query);
        $preguntas_stmt->bindParam(':seccion_id', $seccion['seccion_id']);
        $preguntas_stmt->execute();
        $preguntas_normales = $preguntas_stmt->fetchAll();
        
        // Limitar preguntas normales según parámetro
        if (count($preguntas_normales) > $preguntas_por_seccion) {
            $preguntas_normales = array_slice($preguntas_normales, 0, $preguntas_por_seccion);
        }
        
        // Agregar preguntas trampa aleatorias
        $preguntas_finales = $preguntas_normales;
        $trampa_por_seccion = intval($seccion['preguntas_trampa_por_seccion'] ?? 0);
        
        if ($trampa_por_seccion > 0 && !empty($preguntas_trampa) && $trampa_usadas < count($preguntas_trampa)) {
            $trampa_disponibles = array_slice($preguntas_trampa, $trampa_usadas, $trampa_por_seccion);
            
            foreach ($trampa_disponibles as $pregunta_trampa) {
                $pregunta_trampa['es_trampa'] = true;
                $pregunta_trampa['pregunta_id'] = $pregunta_trampa['id'];
                $pregunta_trampa['pregunta_orden'] = 999; // Orden alto para identificar
                $pregunta_trampa['ponderacion_individual'] = 0; // Las trampa no suman puntos
                $preguntas_finales[] = $pregunta_trampa;
                $trampa_usadas++;
            }
        }
        
        // Mezclar preguntas para que las trampa aparezcan aleatoriamente
        shuffle($preguntas_finales);
        
        // Recalcular ponderación individual para preguntas normales
        $preguntas_normales_count = count($preguntas_normales);
        $ponderacion_por_pregunta = $preguntas_normales_count > 0 ? 
            round($seccion['seccion_ponderacion'] / $preguntas_normales_count, 2) : 0;
        
        // Asignar ponderación calculada a preguntas que no la tienen
        foreach ($preguntas_finales as &$pregunta) {
            if (!isset($pregunta['es_trampa']) || !$pregunta['es_trampa']) {
                if ($pregunta['ponderacion_individual'] <= 0) {
                    $pregunta['ponderacion_individual'] = $ponderacion_por_pregunta;
                }
            }
        }
        
        $secciones_resultado[] = [
            'id' => $seccion['seccion_id'],
            'nombre' => $seccion['seccion_nombre'],
            'orden' => $seccion['seccion_orden'],
            'ponderacion' => $seccion['seccion_ponderacion'],
            'preguntas' => $preguntas_finales
        ];
        
        $total_ponderacion += $seccion['seccion_ponderacion'];
    }
    
    // Preparar respuesta
    $respuesta = [
        'tipo_evaluacion' => $tipo_evaluacion,
        'rol_personal' => $rol_personal,
        'configuracion' => $configuracion,
        'total_ponderacion' => $total_ponderacion,
        'secciones' => $secciones_resultado,
        'estadisticas' => [
            'total_secciones' => count($secciones_resultado),
            'total_preguntas_trampa_disponibles' => count($preguntas_trampa),
            'preguntas_trampa_utilizadas' => $trampa_usadas,
            'preguntas_por_seccion_configuradas' => $preguntas_por_seccion,
            'ponderacion_valida' => abs($total_ponderacion - 100.0) < 0.01
        ]
    ];
    
    sendJsonResponse([
        'success' => true,
        'data' => $respuesta
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener preguntas: ' . $e->getMessage());
}
?>