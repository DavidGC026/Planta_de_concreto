<?php
/**
 * API de autenticación - SSO por email con firma opcional
 * Permite iniciar sesión con un token firmado desde una plataforma externa.
 *
 * Seguridad recomendada:
 * - Usar firma HMAC (SHA256) con secreto compartido: signature = hmac_sha256(email|ts, SSO_SHARED_SECRET)
 * - Validar que ts (timestamp) no sea mayor a 5 minutos de antigüedad
 * - Opcionalmente restringir dominio de email
 */

require_once '../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Método no permitido', 405);
}

// Configuración rápida (idealmente mover a un archivo de config seguro o variables de entorno)
$SSO_SHARED_SECRET = getenv('SSO_SHARED_SECRET') ?: '';
$ALLOW_INSECURE_EMAIL_ONLY = filter_var(getenv('SSO_ALLOW_INSECURE_EMAIL_ONLY') ?: 'false', FILTER_VALIDATE_BOOLEAN); // NO recomendado en producción
$ALLOW_PROVISIONING = filter_var(getenv('SSO_ALLOW_PROVISIONING') ?: 'true', FILTER_VALIDATE_BOOLEAN); // Crear usuarios inexistentes
$MAX_TOKEN_AGE_SECONDS = 300; // 5 minutos

try {
    $database = new Database();
    $db = $database->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);

    $email = isset($input['email']) ? trim($input['email']) : null;
    $ts = isset($input['ts']) ? intval($input['ts']) : null; // epoch segundos
    $signature = isset($input['signature']) ? $input['signature'] : null;
    $perm = isset($input['perm']) ? trim($input['perm']) : null; // token permanente opcional

    if (!$email) {
        handleError('Email requerido', 400);
    }

    // Validación de firma si hay secreto configurado (cuando no se usa token permanente)
    if ($perm === null && !empty($SSO_SHARED_SECRET)) {
        if (!$ts || !$signature) {
            handleError('Parámetros SSO inválidos', 400);
        }
        if (abs(time() - $ts) > $MAX_TOKEN_AGE_SECONDS) {
            handleError('Token SSO expirado', 401);
        }
        $payload = $email . '|' . $ts;
        $expected = hash_hmac('sha256', $payload, $SSO_SHARED_SECRET);
        if (!hash_equals($expected, $signature)) {
            handleError('Firma SSO inválida', 401);
        }
    } else if ($perm === null && !$ALLOW_INSECURE_EMAIL_ONLY) {
        handleError('SSO no habilitado', 403);
    }

    // Si se usa token permanente, validar en base de datos
    if ($perm !== null) {
        // Crear tabla si no existe
        $db->exec("CREATE TABLE IF NOT EXISTS sso_permanent_tokens (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(128) NOT NULL UNIQUE,
            page_slug VARCHAR(150) NOT NULL,
            tipo_evaluacion VARCHAR(50) DEFAULT NULL,
            activo TINYINT(1) DEFAULT 1,
            fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $permStmt = $db->prepare("SELECT token, page_slug, tipo_evaluacion, activo, expires_at FROM sso_permanent_tokens WHERE token = :t LIMIT 1");
        $permStmt->bindParam(':t', $perm);
        $permStmt->execute();
        $permRow = $permStmt->fetch();
        if (!$permRow || intval($permRow['activo']) !== 1) {
            handleError('Token permanente inválido o inactivo', 401);
        }
        if (!empty($permRow['expires_at']) && strtotime($permRow['expires_at']) < time()) {
            handleError('Token permanente expirado', 401);
        }
    }

    // Buscar usuario por email
    $query = "SELECT id, username, nombre_completo, email, rol, activo, puede_hacer_examen
              FROM usuarios
              WHERE email = :email AND activo = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $user = $stmt->fetch();

    if (!$user) {
        if (!$ALLOW_PROVISIONING) {
            handleError('Usuario no encontrado o inactivo', 404);
        }
        // Provisionamiento automático de usuario
        $usernameBase = strtolower(preg_replace('/[^a-zA-Z0-9_\.\-]/', '', explode('@', $email)[0]));
        if ($usernameBase === '') {
            $usernameBase = 'user' . time();
        }
        $username = $usernameBase;
        // Asegurar unicidad
        $checkStmt = $db->prepare("SELECT COUNT(*) as c FROM usuarios WHERE username = :u");
        $suffix = 1;
        while (true) {
            $checkStmt->bindParam(':u', $username);
            $checkStmt->execute();
            $count = $checkStmt->fetch();
            if (intval($count['c']) === 0) break;
            $username = $usernameBase . $suffix;
            $suffix++;
        }
        $randomPass = bin2hex(random_bytes(12));
        $passwordHash = password_hash($randomPass, PASSWORD_BCRYPT);
        $nombre = ucfirst($usernameBase);
        $rol = 'evaluador';
        $activo = 1;
        $puede = 1;
        $insert = $db->prepare("INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo, puede_hacer_examen) VALUES (:u, :ph, :n, :e, :r, :a, :p)");
        $insert->bindParam(':u', $username);
        $insert->bindParam(':ph', $passwordHash);
        $insert->bindParam(':n', $nombre);
        $insert->bindParam(':e', $email);
        $insert->bindParam(':r', $rol);
        $insert->bindParam(':a', $activo);
        $insert->bindParam(':p', $puede);
        $insert->execute();

        // Reconsultar
        $stmt->execute();
        $user = $stmt->fetch();
        if (!$user) {
            handleError('No fue posible crear el usuario SSO', 500);
        }
    }

    // Generar token simple (igual que login.php)
    $token = base64_encode($user['id'] . ':' . time() . ':' . $user['username']);

    sendJsonResponse([
        'success' => true,
        'data' => [
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'nombre_completo' => $user['nombre_completo'],
                'email' => $user['email'],
                'rol' => $user['rol'],
                'puede_hacer_examen' => $user['puede_hacer_examen']
            ],
            'token' => $token
        ]
    ]);

} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}

?>


