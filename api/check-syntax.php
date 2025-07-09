<?php
/**
 * Script para verificar sintaxis de archivos PHP
 */

header("Content-Type: text/plain; charset=UTF-8");

echo "=== VERIFICACIÓN DE SINTAXIS PHP ===\n\n";

$files_to_check = [
    'evaluaciones/progreso-equipo.php',
    'config/database.php'
];

foreach ($files_to_check as $file) {
    echo "Verificando: $file\n";
    
    if (!file_exists($file)) {
        echo "   ✗ Archivo no existe\n\n";
        continue;
    }
    
    // Verificar sintaxis
    $output = [];
    $return_code = 0;
    exec("php -l $file 2>&1", $output, $return_code);
    
    if ($return_code === 0) {
        echo "   ✓ Sintaxis correcta\n";
    } else {
        echo "   ✗ Error de sintaxis:\n";
        foreach ($output as $line) {
            echo "     $line\n";
        }
    }
    
    echo "\n";
}

echo "=== FIN DE VERIFICACIÓN ===\n";
?>