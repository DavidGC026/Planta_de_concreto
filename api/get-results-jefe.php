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
    
    // Obtener el parámetro de empresa si existe
    $empresa_filter = isset($_GET['empresa']) ? $_GET['empresa'] : null;
    
    // Construir la consulta con JOIN a usuarios
    $sql = "SELECT 
                e.id,
                e.nombre as nombre_original,
                e.fecha,
                DATE_FORMAT(e.fecha, '%d de %M de %Y') as fecha_formateada,
                e.tipo_evaluacion,
                e.total_obtenido,
                e.calificaciones_secciones,
                e.respuestas,
                e.preguntas,
                e.observaciones,
                e.pass_status,
                e.trap_incorrect_count,
                e.created_at,
                e.updated_at,
                e.usuario_id,
                u.nombre as usuario_nombre,
                u.email as usuario_email,
                u.empresa as usuario_empresa
            FROM evaluaciones_personal e
            LEFT JOIN usuarios u ON e.usuario_id = u.id";
    
    // Agregar filtro por empresa si se especifica
    if ($empresa_filter) {
        $empresa_filter = $conn->real_escape_string($empresa_filter);
        $sql .= " WHERE u.empresa = '$empresa_filter'";
    }
    
    $sql .= " ORDER BY e.fecha DESC, e.created_at DESC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        // Decodificar JSON fields con manejo correcto de UTF-8
        $row['respuestas'] = json_decode($row['respuestas'], true) ?: [];
        
        // Decodificar y limpiar calificaciones_secciones
        $calificaciones = json_decode($row['calificaciones_secciones'], true) ?: [];
        $calificaciones_limpias = [];
        
        // Los datos ya vienen correctamente decodificados desde json_decode()
        $calificaciones_limpias = $calificaciones;
        
        $row['calificaciones_secciones'] = $calificaciones_limpias;
        $row['preguntas'] = json_decode($row['preguntas'], true) ?: [];
        
        // Convertir pass_status a boolean para compatibilidad con React
        $row['pass'] = ($row['pass_status'] === 'APROBADO');
        
        // Usar información de la tabla usuarios si está disponible
        if ($row['usuario_nombre']) {
            $row['nombre'] = $row['usuario_nombre'];
            $row['nombre_limpio'] = $row['usuario_nombre'];
            $row['email'] = $row['usuario_email'];
            $row['empresa'] = $row['usuario_empresa'];
        } else {
            // Fallback a la lógica anterior si no hay datos de usuario
            $cleanName = $row['nombre_original'];
            $cleanName = str_replace('@plantaconcreto.com', '', $cleanName);
            
            // Si parece ser un email, extraer solo la parte antes del @
            if (strpos($cleanName, '@') !== false) {
                $emailParts = explode('@', $cleanName);
                $cleanName = $emailParts[0];
            }
            
            $row['nombre'] = $cleanName;
            $row['nombre_limpio'] = $cleanName;
            $row['email'] = $row['nombre_original'];
            $row['empresa'] = 'Sin definir';
        }
        
        $data[] = $row;
    }
    
    echo json_encode([
        'success' => true, 
        'data' => $data,
        'total_records' => count($data)
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
