<?php
/**
 * Script de prueba para la API de progreso de equipo
 */

header("Content-Type: text/plain; charset=UTF-8");

echo "=== PRUEBA DE API PROGRESO EQUIPO ===\n\n";

// Función para hacer peticiones HTTP
function makeRequest($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen(json_encode($data))
            ]);
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'response' => $response,
        'http_code' => $httpCode,
        'error' => $error
    ];
}

// 1. Probar GET (obtener progreso)
echo "1. Probando GET /api/evaluaciones/progreso-equipo\n";
$getUrl = "http://localhost/imcyc/api/evaluaciones/progreso-equipo?usuario_id=1&tipo_planta=mediana";
$getResult = makeRequest($getUrl);

echo "   HTTP Code: {$getResult['http_code']}\n";
if ($getResult['error']) {
    echo "   Error: {$getResult['error']}\n";
}
echo "   Response: " . substr($getResult['response'], 0, 200) . "...\n\n";

// 2. Probar POST (guardar progreso de subsección)
echo "2. Probando POST /api/evaluaciones/progreso-equipo (subsección)\n";
$postUrl = "http://localhost/imcyc/api/evaluaciones/progreso-equipo";
$postData = [
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

$postResult = makeRequest($postUrl, 'POST', $postData);

echo "   HTTP Code: {$postResult['http_code']}\n";
if ($postResult['error']) {
    echo "   Error: {$postResult['error']}\n";
}
echo "   Response: " . substr($postResult['response'], 0, 200) . "...\n\n";

// 3. Verificar que el archivo existe
echo "3. Verificando archivo progreso-equipo.php\n";
$filePath = __DIR__ . '/evaluaciones/progreso-equipo.php';
if (file_exists($filePath)) {
    echo "   ✓ Archivo existe: $filePath\n";
    echo "   ✓ Tamaño: " . filesize($filePath) . " bytes\n";
    echo "   ✓ Permisos: " . substr(sprintf('%o', fileperms($filePath)), -4) . "\n";
} else {
    echo "   ✗ Archivo NO existe: $filePath\n";
}

// 4. Verificar configuración de Apache
echo "\n4. Verificando configuración de Apache\n";
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    echo "   mod_rewrite: " . (in_array('mod_rewrite', $modules) ? "✓ Habilitado" : "✗ Deshabilitado") . "\n";
} else {
    echo "   No se puede verificar módulos de Apache\n";
}

// 5. Verificar variables de entorno
echo "\n5. Variables de entorno PHP relevantes\n";
echo "   PHP Version: " . PHP_VERSION . "\n";
echo "   Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'No definido') . "\n";
echo "   Script Name: " . ($_SERVER['SCRIPT_NAME'] ?? 'No definido') . "\n";
echo "   Request URI: " . ($_SERVER['REQUEST_URI'] ?? 'No definido') . "\n";

echo "\n=== FIN DE PRUEBAS ===\n";
?>