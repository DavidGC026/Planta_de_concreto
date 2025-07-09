<?php
/**
 * Debug script para identificar problemas con la API de progreso de equipo
 */

// Configurar headers para debugging
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Habilitar reporte de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DEBUG EQUIPMENT PROGRESS API ===\n";

try {
    // 1. Verificar que el archivo de configuración existe
    echo "1. Verificando archivo de configuración...\n";
    if (file_exists('../config/database.php')) {
        echo "   ✓ Archivo config/database.php existe\n";
        require_once '../config/database.php';
        echo "   ✓ Archivo config/database.php cargado\n";
    } else {
        echo "   ✗ Archivo config/database.php NO existe\n";
        exit(1);
    }

    // 2. Verificar conexión a base de datos
    echo "2. Verificando conexión a base de datos...\n";
    $database = new Database();
    $db = $database->getConnection();
    echo "   ✓ Conexión a base de datos exitosa\n";

    // 3. Verificar que las tablas existen
    echo "3. Verificando tablas de progreso de equipo...\n";
    
    $check_table1 = $db->query("SHOW TABLES LIKE 'progreso_secciones_equipo'");
    if ($check_table1->rowCount() > 0) {
        echo "   ✓ Tabla progreso_secciones_equipo existe\n";
    } else {
        echo "   ✗ Tabla progreso_secciones_equipo NO existe\n";
    }

    $check_table2 = $db->query("SHOW TABLES LIKE 'progreso_subsecciones_equipo'");
    if ($check_table2->rowCount() > 0) {
        echo "   ✓ Tabla progreso_subsecciones_equipo existe\n";
    } else {
        echo "   ✗ Tabla progreso_subsecciones_equipo NO existe\n";
    }

    // 4. Verificar estructura de las tablas
    echo "4. Verificando estructura de tablas...\n";
    
    try {
        $columns1 = $db->query("DESCRIBE progreso_secciones_equipo")->fetchAll();
        echo "   ✓ Estructura de progreso_secciones_equipo:\n";
        foreach ($columns1 as $col) {
            echo "     - {$col['Field']} ({$col['Type']})\n";
        }
    } catch (Exception $e) {
        echo "   ✗ Error al obtener estructura de progreso_secciones_equipo: " . $e->getMessage() . "\n";
    }

    // 5. Verificar datos de prueba
    echo "5. Verificando datos existentes...\n";
    
    try {
        $count_secciones = $db->query("SELECT COUNT(*) FROM progreso_secciones_equipo")->fetchColumn();
        echo "   ✓ Registros en progreso_secciones_equipo: $count_secciones\n";
        
        $count_subsecciones = $db->query("SELECT COUNT(*) FROM progreso_subsecciones_equipo")->fetchColumn();
        echo "   ✓ Registros en progreso_subsecciones_equipo: $count_subsecciones\n";
    } catch (Exception $e) {
        echo "   ✗ Error al contar registros: " . $e->getMessage() . "\n";
    }

    // 6. Probar una consulta simple
    echo "6. Probando consulta de progreso...\n";
    
    try {
        $query = "SELECT usuario_id, tipo_planta, seccion_nombre FROM progreso_secciones_equipo LIMIT 5";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        echo "   ✓ Consulta exitosa, " . count($results) . " resultados:\n";
        foreach ($results as $row) {
            echo "     - Usuario: {$row['usuario_id']}, Planta: {$row['tipo_planta']}, Sección: {$row['seccion_nombre']}\n";
        }
    } catch (Exception $e) {
        echo "   ✗ Error en consulta: " . $e->getMessage() . "\n";
    }

    // 7. Simular una petición POST
    echo "7. Simulando petición POST...\n";
    
    $test_data = [
        'usuario_id' => 1,
        'tipo_planta' => 'mediana',
        'tipo_progreso' => 'subseccion',
        'seccion_id' => 1014,
        'subseccion_id' => 1,
        'subseccion_nombre' => 'Test Subsection',
        'puntaje_obtenido' => 85.5,
        'puntaje_porcentaje' => 85.5,
        'respuestas_correctas' => 17,
        'total_preguntas' => 20
    ];
    
    echo "   Datos de prueba: " . json_encode($test_data) . "\n";
    
    // Simular el procesamiento
    try {
        // Verificar campos requeridos
        $required_fields = ['usuario_id', 'tipo_planta', 'tipo_progreso'];
        foreach ($required_fields as $field) {
            if (!isset($test_data[$field])) {
                throw new Exception("Campo requerido: $field");
            }
        }
        echo "   ✓ Campos requeridos presentes\n";
        
        // Verificar campos de subsección
        if ($test_data['tipo_progreso'] === 'subseccion') {
            $required_subsection_fields = ['seccion_id', 'subseccion_id', 'subseccion_nombre', 'puntaje_obtenido', 'puntaje_porcentaje', 'respuestas_correctas', 'total_preguntas'];
            foreach ($required_subsection_fields as $field) {
                if (!isset($test_data[$field])) {
                    throw new Exception("Campo requerido para subsección: $field");
                }
            }
            echo "   ✓ Campos de subsección presentes\n";
        }
        
        echo "   ✓ Simulación de petición POST exitosa\n";
        
    } catch (Exception $e) {
        echo "   ✗ Error en simulación POST: " . $e->getMessage() . "\n";
    }

    echo "\n=== DIAGNÓSTICO COMPLETADO ===\n";
    echo "Si todas las verificaciones son exitosas, el problema puede estar en:\n";
    echo "1. Configuración de Apache/htaccess\n";
    echo "2. Permisos de archivos\n";
    echo "3. Configuración de PHP\n";
    echo "4. Headers CORS\n";

} catch (Exception $e) {
    echo "ERROR CRÍTICO: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>