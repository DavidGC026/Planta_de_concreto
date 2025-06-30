<?php
/**
 * API para obtener progreso de subsecciones (específico para evaluación de equipo)
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
    $tipo_evaluacion = $_GET['tipo_evaluacion'] ?? null;
    $tipo_planta = $_GET['tipo_planta'] ?? null;
    $categoria = $_GET['categoria'] ?? null;
    $rol_personal = $_GET['rol_personal'] ?? null;
    $limite = $_GET['limite'] ?? 50;
    $pagina = $_GET['pagina'] ?? 1;
    
    // Calcular offset
    $offset = ($pagina - 1) * $limite;
    
    // Construir query
    $where_conditions = [];
    $params = [];
    
    if ($usuario_id) {
        $where_conditions[] = "ps.usuario_id = :usuario_id";
        $params[':usuario_id'] = $usuario_id;
    }
    
    if ($tipo_evaluacion) {
        $where_conditions[] = "ps.tipo_evaluacion = :tipo_evaluacion";
        $params[':tipo_evaluacion'] = $tipo_evaluacion;
    }
    
    if ($tipo_planta) {
        $where_conditions[] = "ps.tipo_planta = :tipo_planta";
        $params[':tipo_planta'] = $tipo_planta;
    }
    
    if ($categoria) {
        $where_conditions[] = "ps.categoria = :categoria";
        $params[':categoria'] = $categoria;
    }
    
    if ($rol_personal) {
        $where_conditions[] = "ps.rol_personal = :rol_personal";
        $params[':rol_personal'] = $rol_personal;
    }
    
    $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
    
    // Verificar si la tabla existe
    $table_exists = $db->query("SHOW TABLES LIKE 'progreso_subsecciones'")->fetch();
    
    if (!$table_exists) {
        sendJsonResponse([
            'success' => true,
            'data' => [
                'progreso_secciones' => [], // Mantener compatibilidad con el frontend
                'paginacion' => [
                    'pagina_actual' => (int)$pagina,
                    'limite' => (int)$limite,
                    'total_registros' => 0,
                    'total_paginas' => 0
                ]
            ]
        ]);
        return;
    }
    
    // Query principal
    $query = "SELECT 
                ps.id,
                ps.usuario_id,
                ps.tipo_evaluacion,
                ps.subseccion_nombre as seccion_nombre,
                ps.subseccion_orden as seccion_orden,
                ps.puntaje_subseccion as puntaje_seccion,
                ps.puntaje_porcentaje,
                ps.respuestas_correctas,
                ps.total_preguntas,
                ps.tipo_planta,
                ps.categoria,
                ps.rol_personal,
                ps.fecha_completada,
                ps.fecha_actualizacion,
                u.username,
                u.nombre_completo
              FROM progreso_subsecciones ps
              JOIN usuarios u ON ps.usuario_id = u.id
              $where_clause
              ORDER BY ps.fecha_completada DESC, ps.subseccion_orden ASC
              LIMIT :limite OFFSET :offset";
    
    $stmt = $db->prepare($query);
    
    // Bind parámetros
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limite', (int)$limite, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $progreso_subsecciones = $stmt->fetchAll();
    
    // Contar total de registros
    $count_query = "SELECT COUNT(*) 
                    FROM progreso_subsecciones ps
                    JOIN usuarios u ON ps.usuario_id = u.id
                    $where_clause";
    
    $count_stmt = $db->prepare($count_query);
    foreach ($params as $key => $value) {
        $count_stmt->bindValue($key, $value);
    }
    $count_stmt->execute();
    $total_registros = $count_stmt->fetchColumn();
    
    // Calcular estadísticas adicionales si se especifica usuario y tipo
    $estadisticas = null;
    if ($usuario_id && $tipo_evaluacion) {
        $stats_query = "SELECT 
                          COUNT(*) as total_subsecciones_completadas,
                          AVG(puntaje_porcentaje) as promedio_porcentaje,
                          SUM(puntaje_subseccion) as puntaje_total_acumulado,
                          MAX(fecha_completada) as ultima_subseccion_completada
                        FROM progreso_subsecciones ps
                        WHERE ps.usuario_id = :usuario_id 
                        AND ps.tipo_evaluacion = :tipo_evaluacion";
        
        $stats_params = [':usuario_id' => $usuario_id, ':tipo_evaluacion' => $tipo_evaluacion];
        
        if ($tipo_planta) {
            $stats_query .= " AND ps.tipo_planta = :tipo_planta";
            $stats_params[':tipo_planta'] = $tipo_planta;
        }
        if ($categoria) {
            $stats_query .= " AND ps.categoria = :categoria";
            $stats_params[':categoria'] = $categoria;
        }
        if ($rol_personal) {
            $stats_query .= " AND ps.rol_personal = :rol_personal";
            $stats_params[':rol_personal'] = $rol_personal;
        }
        
        $stats_stmt = $db->prepare($stats_query);
        foreach ($stats_params as $key => $value) {
            $stats_stmt->bindValue($key, $value);
        }
        
        $stats_stmt->execute();
        $estadisticas = $stats_stmt->fetch();
    }
    
    sendJsonResponse([
        'success' => true,
        'data' => [
            'progreso_secciones' => $progreso_subsecciones, // Mantener compatibilidad con el frontend
            'estadisticas' => $estadisticas,
            'paginacion' => [
                'pagina_actual' => (int)$pagina,
                'limite' => (int)$limite,
                'total_registros' => (int)$total_registros,
                'total_paginas' => ceil($total_registros / $limite)
            ]
        ]
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener progreso de subsecciones: ' . $e->getMessage());
}
?>