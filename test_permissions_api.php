<?php
/**
 * Script para probar la API de permisos usando cURL
 */

$base_url = "http://localhost/plantaconcreto/api/admin/manage-permissions.php";

// Datos de prueba para equipo
$test_data_equipo = [
    'usuario_id' => 10,
    'tipo_evaluacion' => 'equipo',
    'puede_evaluar' => true,
    'puede_ver_resultados' => true
];

// Datos de prueba para operación
$test_data_operacion = [
    'usuario_id' => 10,
    'tipo_evaluacion' => 'operacion',
    'puede_evaluar' => true,
    'puede_ver_resultados' => true
];

function testAPI($url, $data, $test_name) {
    echo "\n=== TESTING: $test_name ===\n";
    echo "URL: $url\n";
    echo "Data: " . json_encode($data) . "\n\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($data))
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        echo "CURL Error: $error\n";
    } else {
        echo "HTTP Code: $http_code\n";
        echo "Response:\n$response\n";
    }
    
    echo "=== END TEST ===\n\n";
}

// Probar asignación de permisos de equipo
testAPI($base_url, $test_data_equipo, "Asignar permisos de equipo");

// Probar asignación de permisos de operación
testAPI($base_url, $test_data_operacion, "Asignar permisos de operación");

?>
