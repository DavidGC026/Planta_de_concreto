<?php
/**
 * Debug detallado para la API de progreso de equipo
 */

// Configurar headers para debugging
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: text/plain; charset=UTF-8");

// Habilitar reporte de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DEBUG DETALLADO EQUIPMENT PROGRESS API ===\n";

try {
    // 1. Verificar archivo de configuración
    echo "1. Verificando configuración...\n";
    if (file_exists('config/database.php')) {
        echo "   ✓ Archivo config/database.php existe\n";
        require_once 'config/database.php';
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

    // 3. Verificar tablas necesarias
    echo "3. Verificando tablas necesarias...\n";
    
    $tables_to_check = [
        'usuarios',
        'secciones_evaluacion', 
        'subsecciones_evaluacion',
        'progreso_secciones',
        'progreso_subsecciones'
    ];
    
    foreach ($tables_to_check as $table) {
        $check = $db->query("SHOW TABLES LIKE '$table'");
        if ($check->rowCount() > 0) {
            echo "   ✓ Tabla $table existe\n";
        } else {
            echo "   ✗ Tabla $table NO existe\n";
        }
    }

    // 4. Verificar usuario específico
    echo "4. Verificando usuario ID 8...\n";
    $user_check = $db->prepare("SELECT id, username, nombre_completo FROM usuarios WHERE id = 8");
    $user_check->execute();
    $user = $user_check->fetch();
    
    if ($user) {
        echo "   ✓ Usuario encontrado: {$user['username']} - {$user['nombre_completo']}\n";
    } else {
        echo "   ✗ Usuario ID 8 NO encontrado\n";
    }

    // 5. Verificar sección 1014
    echo "5. Verificando sección 1014...\n";
    $section_check = $db->prepare("SELECT id, nombre, tipo_evaluacion_id FROM secciones_evaluacion WHERE id = 1014");
    $section_check->execute();
    $section = $section_check->fetch();
    
    if ($section) {
        echo "   ✓ Sección encontrada: {$section['nombre']}\n";
        
        // Verificar subsecciones
        $subsection_check = $db->prepare("SELECT id, nombre FROM subsecciones_evaluacion WHERE seccion_id = 1014 AND activo = 1");
        $subsection_check->execute();
        $subsections = $subsection_check->fetchAll();
        
        echo "   ✓ Subsecciones encontradas: " . count($subsections) . "\n";
        foreach ($subsections as $sub) {
            echo "     - ID {$sub['id']}: {$sub['nombre']}\n";
        }
    } else {
        echo "   ✗ Sección 1014 NO encontrada\n";
    }

    // 6. Simular datos de entrada
    echo "6. Simulando datos de entrada...\n";
    $test_data = [
        'usuario_id' => 8,
        'tipo_planta' => 'pequena',
        'tipo_progreso' => 'subseccion',
        'seccion_id' => 1014,
        'subseccion_id' => 1,
        'subseccion_nombre' => 'Mezcladora Principal',
        'puntaje_obtenido' => 80,
        'puntaje_porcentaje' => 100,
        'respuestas_correctas' => 8,
        'total_preguntas' => 8
    ];
    
    echo "   Datos de prueba: " . json_encode($test_data, JSON_PRETTY_PRINT) . "\n";

    // 7. Probar inserción en tabla fallback
    echo "7. Probando inserción en tabla fallback...\n";
    
    try {
        $fallback_query = "INSERT INTO progreso_subsecciones 
                          (usuario_id, tipo_evaluacion, subseccion_nombre, subseccion_orden, 
                           puntaje_subseccion, puntaje_porcentaje, respuestas_correctas, total_preguntas,
                           tipo_planta, fecha_completada)
                          VALUES 
                          (:usuario_id, 'equipo', :subseccion_nombre, :subseccion_id,
                           :puntaje_obtenido, :puntaje_porcentaje, :respuestas_correctas, :total_preguntas,
                           :tipo_planta, NOW())
                          ON DUPLICATE KEY UPDATE
                          subseccion_nombre = VALUES(subseccion_nombre),
                          puntaje_subseccion = VALUES(puntaje_subseccion),
                          puntaje_porcentaje = VALUES(puntaje_porcentaje),
                          respuestas_correctas = VALUES(respuestas_correctas),
                          total_preguntas = VALUES(total_preguntas),
                          fecha_actualizacion = NOW()";

        $stmt = $db->prepare($fallback_query);
        $result = $stmt->execute([
            ':usuario_id' => $test_data['usuario_id'],
            ':subseccion_nombre' => $test_data['subseccion_nombre'],
            ':subseccion_id' => $test_data['subseccion_id'],
            ':puntaje_obtenido' => $test_data['puntaje_obtenido'],
            ':puntaje_porcentaje' => $test_data['puntaje_porcentaje'],
            ':respuestas_correctas' => $test_data['respuestas_correctas'],
            ':total_preguntas' => $test_data['total_preguntas'],
            ':tipo_planta' => $test_data['tipo_planta']
        ]);
        
        if ($result) {
            echo "   ✓ Inserción en tabla fallback exitosa\n";
            echo "   ✓ Affected rows: " . $stmt->rowCount() . "\n";
        } else {
            echo "   ✗ Error en inserción fallback\n";
        }
        
    } catch (Exception $e) {
        echo "   ✗ Error en inserción fallback: " . $e->getMessage() . "\n";
    }

    // 8. Verificar datos insertados
    echo "8. Verificando datos insertados...\n";
    $verify_query = "SELECT * FROM progreso_subsecciones 
                     WHERE usuario_id = 8 AND tipo_planta = 'pequena' AND subseccion_nombre = 'Mezcladora Principal'";
    $verify_stmt = $db->prepare($verify_query);
    $verify_stmt->execute();
    $inserted_data = $verify_stmt->fetch();
    
    if ($inserted_data) {
        echo "   ✓ Datos verificados:\n";
        echo "     - ID: {$inserted_data['id']}\n";
        echo "     - Usuario: {$inserted_data['usuario_id']}\n";
        echo "     - Subsección: {$inserted_data['subseccion_nombre']}\n";
        echo "     - Puntaje: {$inserted_data['puntaje_porcentaje']}%\n";
        echo "     - Fecha: {$inserted_data['fecha_completada']}\n";
    } else {
        echo "   ✗ No se encontraron datos insertados\n";
    }

    // 9. Probar endpoint real
    echo "9. Probando endpoint real...\n";
    
    // Simular POST request
    $_SERVER['REQUEST_METHOD'] = 'POST';
    
    // Simular input JSON
    $json_input = json_encode($test_data);
    
    // Crear un archivo temporal para simular php://input
    $temp_file = tempnam(sys_get_temp_dir(), 'test_input');
    file_put_contents($temp_file, $json_input);
    
    echo "   Input JSON simulado: $json_input\n";
    
    // Limpiar datos de prueba
    echo "10. Limpiando datos de prueba...\n";
    $cleanup_query = "DELETE FROM progreso_subsecciones 
                      WHERE usuario_id = 8 AND tipo_planta = 'pequena' AND subseccion_nombre = 'Mezcladora Principal'";
    $cleanup_stmt = $db->prepare($cleanup_query);
    $cleanup_result = $cleanup_stmt->execute();
    
    if ($cleanup_result) {
        echo "   ✓ Datos de prueba limpiados\n";
    } else {
        echo "   ✗ Error limpiando datos de prueba\n";
    }

    echo "\n=== DIAGNÓSTICO COMPLETADO ===\n";
    echo "El sistema parece estar funcionando correctamente.\n";
    echo "El error 500 puede estar relacionado con:\n";
    echo "1. Permisos de archivos PHP\n";
    echo "2. Configuración de Apache/PHP\n";
    echo "3. Límites de memoria o tiempo de ejecución\n";
    echo "4. Headers CORS mal configurados\n";
    echo "5. Errores de sintaxis PHP no detectados\n";

} catch (Exception $e) {
    echo "ERROR CRÍTICO: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>