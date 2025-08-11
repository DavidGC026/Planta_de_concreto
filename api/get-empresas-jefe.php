<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$host = 'localhost';
$user = 'admin';
$pass = 'Imc590923cz4#';
$db = 'resultados';

try {
    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión: ' . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    // Obtener empresas con conteo de evaluaciones
    $sql = "SELECT 
                u.empresa,
                COUNT(DISTINCT e.id) as total_evaluaciones,
                COUNT(DISTINCT u.id) as total_usuarios,
                AVG(e.total_obtenido) as promedio_puntuacion,
                MIN(e.fecha) as primera_evaluacion,
                MAX(e.fecha) as ultima_evaluacion
            FROM usuarios u
            LEFT JOIN evaluaciones_personal e ON u.id = e.usuario_id
            WHERE u.empresa IS NOT NULL AND u.empresa != ''
            GROUP BY u.empresa
            HAVING COUNT(DISTINCT e.id) > 0
            ORDER BY u.empresa ASC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }
    
    $empresas = [];
    while ($row = $result->fetch_assoc()) {
        $empresas[] = [
            'nombre' => $row['empresa'],
            'total_evaluaciones' => (int)$row['total_evaluaciones'],
            'total_usuarios' => (int)$row['total_usuarios'],
            'promedio_puntuacion' => $row['promedio_puntuacion'] ? round((float)$row['promedio_puntuacion'], 2) : 0,
            'primera_evaluacion' => $row['primera_evaluacion'],
            'ultima_evaluacion' => $row['ultima_evaluacion']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $empresas,
        'total_empresas' => count($empresas)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
