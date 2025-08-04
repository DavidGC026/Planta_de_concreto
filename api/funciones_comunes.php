<?php

// Funciones comunes para el API

function enviarRespuestaJson($datos, $codigo_http = 200) {
    http_response_code($codigo_http);
    echo json_encode($datos);
    exit();
}

function manejarError($mensaje, $codigo_http = 500) {
    error_log("Error en API: " . $mensaje);
    enviarRespuestaJson([
        'success' => false,
        'error' => $mensaje
    ], $codigo_http);
}

function sanitizarEntrada($datos) {
    if (is_array($datos)) {
        return array_map('sanitizarEntrada', $datos);
    }
    return htmlspecialchars(strip_tags(trim($datos)), ENT_QUOTES, 'UTF-8');
}

function validarTokenAutenticacion($token) {
    if (empty($token)) {
        return false;
    }
    $decoded = base64_decode($token);
    $partes = explode(':', $decoded);
    return count($partes) >= 3;
}
