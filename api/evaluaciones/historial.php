<?php
/**
 * API para obtener historial de evaluaciones
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
    $usuario_id = $_GET['usuario_id'] ?? null;
    $tipo_evaluacion = $_GET['tipo'] ?? null;
    $limite = $_GET['limite'] ?? 50;
    $pagina = $_GET['pagina'] ?? 1;
    
    // Calcular offset
    $offset = ($pagina - 1) * $limite;
    
    // Construir query
    $where_conditions = ["e.estado = 'completada'"];
    $params = [];
    
    if ($usuario_id) {
        $where_conditions[] = "e.usuario_id = :usuario_id";
        $params[':usuario_id'] = $usuario_id;
    }
    
    if ($tipo_evaluacion) {
        $where_conditions[] = "te.codigo = :tipo_evaluacion";
        $params[':tipo_evaluacion'] = $tipo_evaluacion;
    }
    
    $where_clause = implode(' AND ', $where_conditions);
    
    // Query principal
    $query = "SELECT 
                e.id,
                e.puntuacion_total,
                e.total_preguntas,
                e.respuestas_si,
                e.respuestas_no,
                e.respuestas_na,
                e.fecha_inicio,
                e.fecha_finalizacion,
                e.observaciones,
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
              WHERE $where_clause
              ORDER BY e.fecha_finalizacion DESC
              LIMIT :limite OFFSET :offset";
    
    $stmt = $db->prepare($query);
    
    // Bind parámetros
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limite', (int)$limite, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $evaluaciones = $stmt->fetchAll();
    
    // Contar total de registros
    $count_query = "SELECT COUNT(*) 
                    FROM evaluaciones e
                    JOIN usuarios u ON e.usuario_id = u.id
                    JOIN tipos_evaluacion te ON e.tipo_evaluacion_id = te.id
                    LEFT JOIN roles_personal rp ON e.rol_personal_id = rp.id
                    WHERE $where_clause";
    
    $count_stmt = $db->prepare($count_query);
    foreach ($params as $key => $value) {
        $count_stmt->bindValue($key, $value);
    }
    $count_stmt->execute();
    $total_registros = $count_stmt->fetchColumn();
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'evaluaciones' => $evaluaciones,
            'paginacion' => [
                'pagina_actual' => (int)$pagina,
                'limite' => (int)$limite,
                'total_registros' => (int)$total_registros,
                'total_paginas' => ceil($total_registros / $limite)
            ]
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener historial: ' . $e->getMessage());
}
?>