<?php
/**
 * API para obtener usuarios que han realizado evaluaciones de jefe de planta
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    handleError('Método no permitido', 405);
}

try {
    // Conectar a la base de datos resultados
    $host = 'localhost';
    $dbname = 'resultados';
    $username = 'admin';
    $password = 'Imc590923cz4#';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener usuarios que han realizado evaluaciones de jefe de planta
    $query = "SELECT 
                u.id,
                u.nombre,
                u.email,
                u.empresa,
                u.oportunidades,
                u.permiso,
                u.created_at,
                u.updated_at,
                COUNT(ep.id) as total_evaluaciones,
                MAX(ep.created_at) as ultima_evaluacion,
                MAX(ep.total_obtenido) as mejor_calificacion,
                MAX(ep.pass_status) as ultimo_estado,
                GROUP_CONCAT(ep.total_obtenido ORDER BY ep.created_at DESC) as historial_calificaciones
              FROM usuarios u
              LEFT JOIN evaluaciones_personal ep ON u.email = ep.nombre
              WHERE u.email IS NOT NULL
              GROUP BY u.id, u.nombre, u.email, u.empresa, u.oportunidades, u.permiso, u.created_at, u.updated_at
              ORDER BY u.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear los datos
    $usuarios_formateados = [];
    foreach ($usuarios as $usuario) {
        $historial_calificaciones = [];
        if ($usuario['historial_calificaciones']) {
            $historial_calificaciones = array_map('floatval', explode(',', $usuario['historial_calificaciones']));
        }
        
        $usuarios_formateados[] = [
            'id' => (int)$usuario['id'],
            'nombre' => $usuario['nombre'],
            'email' => $usuario['email'],
            'empresa' => $usuario['empresa'],
            'oportunidades' => (int)$usuario['oportunidades'],
            'permiso' => (int)$usuario['permiso'],
            'puede_hacer_examen' => (int)$usuario['permiso'] === 0,
            'total_evaluaciones' => (int)$usuario['total_evaluaciones'],
            'ultima_evaluacion' => $usuario['ultima_evaluacion'],
            'mejor_calificacion' => $usuario['mejor_calificacion'] ? (float)$usuario['mejor_calificacion'] : null,
            'ultimo_estado' => $usuario['ultimo_estado'],
            'historial_calificaciones' => $historial_calificaciones,
            'promedio_calificaciones' => !empty($historial_calificaciones) ? round(array_sum($historial_calificaciones) / count($historial_calificaciones), 2) : null,
            'created_at' => $usuario['created_at'],
            'updated_at' => $usuario['updated_at'],
            'estado_resumen' => [
                'activo' => (int)$usuario['permiso'] === 0,
                'tiene_evaluaciones' => (int)$usuario['total_evaluaciones'] > 0,
                'aprobado' => $usuario['ultimo_estado'] === 'APROBADO',
                'necesita_atencion' => (int)$usuario['oportunidades'] >= 3
            ]
        ];
    }
    
    // Calcular estadísticas
    $estadisticas = [
        'total_usuarios' => count($usuarios_formateados),
        'usuarios_activos' => count(array_filter($usuarios_formateados, function($u) { return $u['puede_hacer_examen']; })),
        'usuarios_con_evaluaciones' => count(array_filter($usuarios_formateados, function($u) { return $u['total_evaluaciones'] > 0; })),
        'usuarios_aprobados' => count(array_filter($usuarios_formateados, function($u) { return $u['estado_resumen']['aprobado']; })),
        'usuarios_necesitan_atencion' => count(array_filter($usuarios_formateados, function($u) { return $u['estado_resumen']['necesita_atencion']; }))
    ];
    
    sendJsonResponse([
        'success' => true,
        'data' => $usuarios_formateados,
        'estadisticas' => $estadisticas,
        'total' => count($usuarios_formateados)
    ]);
    
} catch (Exception $e) {
    error_log("Error en usuarios-con-evaluacion.php: " . $e->getMessage());
    handleError('Error al obtener usuarios con evaluaciones: ' . $e->getMessage());
}
?>
