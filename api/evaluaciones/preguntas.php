<?php
/**
 * API para obtener preguntas de evaluación con sistema de ponderación y subsecciones
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
    $tipo_planta = $_GET['tipo_planta'] ?? null;
    $preguntas_por_seccion = intval($_GET['preguntas_por_seccion'] ?? 5);
    
    if (!$tipo_evaluacion) {
        handleError('Tipo de evaluación es requerido', 400);
    }
    
    // Log para debugging
    error_log("=== API PREGUNTAS ===");
    error_log("Tipo: $tipo_evaluacion, Rol: $rol_personal, Tipo planta: $tipo_planta");
    
    if ($tipo_evaluacion === 'equipo') {
        // Para evaluación de equipo, usar subsecciones
        $secciones_query = "SELECT 
                              s.id as seccion_id,
                              s.nombre as seccion_nombre,
                              s.orden as seccion_orden,
                              s.ponderacion as seccion_ponderacion,
                              te.codigo as tipo_codigo
                            FROM secciones_evaluacion s
                            JOIN tipos_evaluacion te ON s.tipo_evaluacion_id = te.id
                            WHERE te.codigo = :tipo_evaluacion 
                              AND s.activo = 1 
                              AND s.es_trampa = 0
                            ORDER BY s.orden";
        
        $secciones_stmt = $db->prepare($secciones_query);
        $secciones_stmt->execute([':tipo_evaluacion' => $tipo_evaluacion]);
        $secciones_data = $secciones_stmt->fetchAll();
        
        $secciones_resultado = [];
        
        foreach ($secciones_data as $seccion) {
            // Obtener subsecciones para esta sección
            $subsecciones_query = "SELECT 
                                     sub.id as subseccion_id,
                                     sub.nombre as subseccion_nombre,
                                     sub.orden as subseccion_orden,
                                     sub.ponderacion_subseccion
                                   FROM subsecciones_evaluacion sub
                                   WHERE sub.seccion_id = :seccion_id
                                     AND sub.activo = 1
                                   ORDER BY sub.orden";
            
            $subsecciones_stmt = $db->prepare($subsecciones_query);
            $subsecciones_stmt->execute([':seccion_id' => $seccion['seccion_id']]);
            $subsecciones_data = $subsecciones_stmt->fetchAll();
            
            $subsecciones_resultado = [];
            
            foreach ($subsecciones_data as $subseccion) {
                // Obtener preguntas para esta subsección
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
                                    WHERE p.subseccion_id = :subseccion_id
                                      AND p.activo = 1
                                    ORDER BY p.orden";
                
                $preguntas_stmt = $db->prepare($preguntas_query);
                $preguntas_stmt->execute([':subseccion_id' => $subseccion['subseccion_id']]);
                $preguntas_data = $preguntas_stmt->fetchAll();
                
                // Si no hay preguntas en la BD, generar preguntas de ejemplo
                if (empty($preguntas_data)) {
                    $preguntas_data = generateSampleQuestions($subseccion['subseccion_nombre']);
                }
                
                $subsecciones_resultado[] = [
                    'id' => $subseccion['subseccion_id'],
                    'nombre' => $subseccion['subseccion_nombre'],
                    'orden' => $subseccion['subseccion_orden'],
                    'ponderacion_subseccion' => $subseccion['ponderacion_subseccion'],
                    'preguntas' => $preguntas_data
                ];
            }
            
            $secciones_resultado[] = [
                'id' => $seccion['seccion_id'],
                'nombre' => $seccion['seccion_nombre'],
                'orden' => $seccion['seccion_orden'],
                'ponderacion' => $seccion['seccion_ponderacion'],
                'subsecciones' => $subsecciones_resultado
            ];
        }
        
        // Preparar respuesta para evaluación de equipo
        $respuesta = [
            'tipo_evaluacion' => $tipo_evaluacion,
            'tipo_planta' => $tipo_planta,
            'secciones' => $secciones_resultado,
            'estadisticas' => [
                'total_secciones' => count($secciones_resultado),
                'total_subsecciones' => array_sum(array_map(function($s) { return count($s['subsecciones']); }, $secciones_resultado)),
                'sistema' => 'Evaluación por subsecciones'
            ]
        ];
        
    } else {
        // Para evaluación de personal y operación, usar el sistema original
        $secciones_query = "SELECT 
                              s.id as seccion_id,
                              s.nombre as seccion_nombre,
                              s.orden as seccion_orden,
                              s.ponderacion as seccion_ponderacion,
                              s.preguntas_trampa_por_seccion,
                              s.p_minimo_aprobacion,
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
        
        $trampa_query .= " ORDER BY RAND()";
        
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
                                ORDER BY RAND()";
            
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
                    $pregunta_trampa['pregunta_orden'] = 999;
                    $pregunta_trampa['ponderacion_individual'] = 0;
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
                'p_minimo_aprobacion' => $seccion['p_minimo_aprobacion'] ?? 90.00,
                'preguntas' => $preguntas_finales
            ];
            
            $total_ponderacion += $seccion['seccion_ponderacion'];
        }
        
        // Preparar respuesta para evaluación de personal/operación
        $respuesta = [
            'tipo_evaluacion' => $tipo_evaluacion,
            'rol_personal' => $rol_personal,
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
    }
    
    error_log("Respuesta preparada con " . count($respuesta['secciones']) . " secciones");
    
    sendJsonResponse([
        'success' => true,
        'data' => $respuesta
    ]);
    
} catch (Exception $e) {
    error_log("Error en preguntas.php: " . $e->getMessage());
    handleError('Error al obtener preguntas: ' . $e->getMessage());
}

/**
 * Función para generar preguntas de ejemplo cuando no hay en la BD
 */
function generateSampleQuestions($subseccion_nombre) {
    $preguntas_ejemplo = [
        [
            'pregunta_id' => 'sample_1',
            'pregunta' => "¿El equipo de {$subseccion_nombre} está en buen estado general?",
            'tipo_pregunta' => 'abierta',
            'opcion_a' => null,
            'opcion_b' => null,
            'opcion_c' => null,
            'respuesta_correcta' => null,
            'pregunta_orden' => 1,
            'ponderacion_individual' => 0,
            'es_trampa' => false
        ],
        [
            'pregunta_id' => 'sample_2',
            'pregunta' => "¿Los componentes de {$subseccion_nombre} funcionan correctamente?",
            'tipo_pregunta' => 'abierta',
            'opcion_a' => null,
            'opcion_b' => null,
            'opcion_c' => null,
            'respuesta_correcta' => null,
            'pregunta_orden' => 2,
            'ponderacion_individual' => 0,
            'es_trampa' => false
        ],
        [
            'pregunta_id' => 'sample_3',
            'pregunta' => "¿Se realiza mantenimiento preventivo en {$subseccion_nombre}?",
            'tipo_pregunta' => 'abierta',
            'opcion_a' => null,
            'opcion_b' => null,
            'opcion_c' => null,
            'respuesta_correcta' => null,
            'pregunta_orden' => 3,
            'ponderacion_individual' => 0,
            'es_trampa' => false
        ]
    ];
    
    return $preguntas_ejemplo;
}
?>