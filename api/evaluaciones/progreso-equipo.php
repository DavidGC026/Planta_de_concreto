<?php
/**
 * API para manejar el progreso de evaluaciones de equipo
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            obtenerProgreso($db);
            break;
        case 'POST':
            guardarProgreso($db);
            break;
        case 'DELETE':
            limpiarProgreso($db);
            break;
        default:
            handleError('Método no permitido', 405);
    }
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage());
}

/**
 * Obtener progreso de evaluación de equipo
 */
function obtenerProgreso($db) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $tipo_planta = $_GET['tipo_planta'] ?? null;
    
    if (!$usuario_id || !$tipo_planta) {
        handleError('usuario_id y tipo_planta son requeridos', 400);
    }
    
    try {
        // Verificar si existen las tablas de progreso de equipo
        $check_table = $db->query("SHOW TABLES LIKE 'progreso_secciones_equipo'");
        if ($check_table->rowCount() == 0) {
            // Si no existe la tabla, crear estructura básica
            createProgressTables($db);
        }
        
        // Obtener progreso de secciones
        $query = "SELECT 
                    pse.seccion_id,
                    pse.seccion_nombre,
                    pse.completada as seccion_completada,
                    pse.puntaje_obtenido as seccion_puntaje,
                    pse.puntaje_porcentaje as seccion_porcentaje,
                    pse.total_subsecciones,
                    pse.subsecciones_completadas,
                    pse.respuestas_correctas as seccion_respuestas_correctas,
                    pse.total_preguntas as seccion_total_preguntas,
                    pse.fecha_completada as seccion_fecha_completada
                  FROM progreso_secciones_equipo pse
                  WHERE pse.usuario_id = :usuario_id 
                    AND pse.tipo_planta = :tipo_planta
                  ORDER BY pse.seccion_id";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':tipo_planta' => $tipo_planta
        ]);
        
        $progreso = $stmt->fetchAll();
        
        // Obtener detalles de subsecciones para cada sección
        $resultado = [];
        foreach ($progreso as $seccion) {
            // Obtener subsecciones de esta sección
            $subsecciones_query = "SELECT 
                                     psse.subseccion_id,
                                     psse.subseccion_nombre as nombre,
                                     psse.completada,
                                     psse.puntaje_porcentaje
                                   FROM progreso_subsecciones_equipo psse
                                   WHERE psse.usuario_id = :usuario_id 
                                     AND psse.tipo_planta = :tipo_planta
                                     AND psse.progreso_seccion_id = (
                                         SELECT id FROM progreso_secciones_equipo 
                                         WHERE usuario_id = :usuario_id 
                                           AND tipo_planta = :tipo_planta 
                                           AND seccion_id = :seccion_id
                                     )
                                   ORDER BY psse.subseccion_id";
            
            $subsecciones_stmt = $db->prepare($subsecciones_query);
            $subsecciones_stmt->execute([
                ':usuario_id' => $usuario_id,
                ':tipo_planta' => $tipo_planta,
                ':seccion_id' => $seccion['seccion_id']
            ]);
            
            $subsecciones = $subsecciones_stmt->fetchAll();
            
            $resultado[] = [
                'seccion_id' => (int)$seccion['seccion_id'],
                'seccion_nombre' => $seccion['seccion_nombre'],
                'completada' => (bool)$seccion['seccion_completada'],
                'puntaje_obtenido' => (float)$seccion['seccion_puntaje'],
                'puntaje_porcentaje' => (float)$seccion['seccion_porcentaje'],
                'total_subsecciones' => (int)$seccion['total_subsecciones'],
                'subsecciones_completadas' => (int)$seccion['subsecciones_completadas'],
                'respuestas_correctas' => (int)$seccion['seccion_respuestas_correctas'],
                'total_preguntas' => (int)$seccion['seccion_total_preguntas'],
                'fecha_completada' => $seccion['seccion_fecha_completada'],
                'subsecciones' => $subsecciones
            ];
        }
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'usuario_id' => (int)$usuario_id,
                'tipo_planta' => $tipo_planta,
                'secciones' => $resultado,
                'total_secciones' => count($resultado),
                'secciones_completadas' => count(array_filter($resultado, function($s) { return $s['completada']; }))
            ]
        ]);
        
    } catch (Exception $e) {
        handleError('Error al obtener progreso: ' . $e->getMessage());
    }
}

/**
 * Guardar progreso de sección o subsección
 */
function guardarProgreso($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required_fields = ['usuario_id', 'tipo_planta', 'tipo_progreso'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            handleError("Campo requerido: $field", 400);
        }
    }
    
    $usuario_id = $input['usuario_id'];
    $tipo_planta = $input['tipo_planta'];
    $tipo_progreso = $input['tipo_progreso']; // 'seccion' o 'subseccion'
    
    try {
        // Verificar si existen las tablas de progreso de equipo
        $check_table = $db->query("SHOW TABLES LIKE 'progreso_secciones_equipo'");
        if ($check_table->rowCount() == 0) {
            createProgressTables($db);
        }
        
        if ($tipo_progreso === 'subseccion') {
            // Guardar progreso de subsección
            $required_subsection_fields = ['seccion_id', 'subseccion_id', 'subseccion_nombre', 'puntaje_obtenido', 'puntaje_porcentaje', 'respuestas_correctas', 'total_preguntas'];
            foreach ($required_subsection_fields as $field) {
                if (!isset($input[$field])) {
                    handleError("Campo requerido para subsección: $field", 400);
                }
            }
            
            marcarSubseccionCompletada($db, $usuario_id, $tipo_planta, $input);
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Progreso de subsección guardado exitosamente',
                'data' => [
                    'tipo_progreso' => 'subseccion',
                    'subseccion_id' => $input['subseccion_id'],
                    'subseccion_nombre' => $input['subseccion_nombre']
                ]
            ]);
            
        } elseif ($tipo_progreso === 'seccion') {
            // Guardar progreso de sección completa
            $required_section_fields = ['seccion_id', 'seccion_nombre', 'puntaje_obtenido', 'puntaje_porcentaje', 'total_subsecciones', 'subsecciones_completadas', 'respuestas_correctas', 'total_preguntas'];
            foreach ($required_section_fields as $field) {
                if (!isset($input[$field])) {
                    handleError("Campo requerido para sección: $field", 400);
                }
            }
            
            marcarSeccionCompletada($db, $usuario_id, $tipo_planta, $input);
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Progreso de sección guardado exitosamente',
                'data' => [
                    'tipo_progreso' => 'seccion',
                    'seccion_id' => $input['seccion_id'],
                    'seccion_nombre' => $input['seccion_nombre']
                ]
            ]);
            
        } else {
            handleError('tipo_progreso debe ser "seccion" o "subseccion"', 400);
        }
        
    } catch (Exception $e) {
        handleError('Error al guardar progreso: ' . $e->getMessage());
    }
}

/**
 * Limpiar progreso de un usuario (útil para testing)
 */
function limpiarProgreso($db) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    $tipo_planta = $_GET['tipo_planta'] ?? null;
    
    if (!$usuario_id || !$tipo_planta) {
        handleError('usuario_id y tipo_planta son requeridos', 400);
    }
    
    try {
        $db->beginTransaction();
        
        // Eliminar progreso de subsecciones
        $delete_subsecciones = "DELETE psse FROM progreso_subsecciones_equipo psse
                                JOIN progreso_secciones_equipo pse ON psse.progreso_seccion_id = pse.id
                                WHERE pse.usuario_id = :usuario_id 
                                  AND pse.tipo_planta = :tipo_planta";
        
        $stmt = $db->prepare($delete_subsecciones);
        $stmt->execute([':usuario_id' => $usuario_id, ':tipo_planta' => $tipo_planta]);
        
        // Eliminar progreso de secciones
        $delete_secciones = "DELETE FROM progreso_secciones_equipo 
                            WHERE usuario_id = :usuario_id 
                              AND tipo_planta = :tipo_planta";
        
        $stmt = $db->prepare($delete_secciones);
        $stmt->execute([':usuario_id' => $usuario_id, ':tipo_planta' => $tipo_planta]);
        
        $db->commit();
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Progreso limpiado exitosamente',
            'data' => [
                'usuario_id' => (int)$usuario_id,
                'tipo_planta' => $tipo_planta
            ]
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        handleError('Error al limpiar progreso: ' . $e->getMessage());
    }
}

/**
 * Crear tablas de progreso si no existen
 */
function createProgressTables($db) {
    // Crear tabla para el progreso de secciones de equipo
    $create_secciones = "CREATE TABLE IF NOT EXISTS progreso_secciones_equipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo_planta ENUM('pequena', 'mediana', 'grande') NOT NULL,
        seccion_id INT NOT NULL,
        seccion_nombre VARCHAR(200) NOT NULL,
        completada BOOLEAN DEFAULT FALSE,
        puntaje_obtenido DECIMAL(5,2) DEFAULT 0.00,
        puntaje_porcentaje DECIMAL(5,2) DEFAULT 0.00,
        total_subsecciones INT DEFAULT 0,
        subsecciones_completadas INT DEFAULT 0,
        respuestas_correctas INT DEFAULT 0,
        total_preguntas INT DEFAULT 0,
        fecha_completada TIMESTAMP NULL,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_plant_section (usuario_id, tipo_planta, seccion_id),
        INDEX idx_usuario_tipo_planta (usuario_id, tipo_planta),
        INDEX idx_completada (completada)
    )";
    
    $db->exec($create_secciones);
    
    // Crear tabla para el progreso detallado de subsecciones
    $create_subsecciones = "CREATE TABLE IF NOT EXISTS progreso_subsecciones_equipo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        progreso_seccion_id INT NOT NULL,
        usuario_id INT NOT NULL,
        tipo_planta ENUM('pequena', 'mediana', 'grande') NOT NULL,
        subseccion_id INT NOT NULL,
        subseccion_nombre VARCHAR(200) NOT NULL,
        completada BOOLEAN DEFAULT FALSE,
        puntaje_obtenido DECIMAL(5,2) DEFAULT 0.00,
        puntaje_porcentaje DECIMAL(5,2) DEFAULT 0.00,
        respuestas_correctas INT DEFAULT 0,
        total_preguntas INT DEFAULT 0,
        fecha_completada TIMESTAMP NULL,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (progreso_seccion_id) REFERENCES progreso_secciones_equipo(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_plant_subsection (usuario_id, tipo_planta, subseccion_id),
        INDEX idx_progreso_seccion (progreso_seccion_id),
        INDEX idx_usuario_tipo_planta (usuario_id, tipo_planta)
    )";
    
    $db->exec($create_subsecciones);
}

/**
 * Marcar una subsección como completada
 */
function marcarSubseccionCompletada($db, $usuario_id, $tipo_planta, $input) {
    $db->beginTransaction();
    
    try {
        // Obtener o crear el registro de progreso de sección
        $seccion_query = "SELECT id FROM progreso_secciones_equipo 
                         WHERE usuario_id = :usuario_id 
                           AND tipo_planta = :tipo_planta 
                           AND seccion_id = :seccion_id";
        
        $stmt = $db->prepare($seccion_query);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':tipo_planta' => $tipo_planta,
            ':seccion_id' => $input['seccion_id']
        ]);
        
        $progreso_seccion_id = $stmt->fetchColumn();
        
        // Si no existe el progreso de sección, crearlo
        if (!$progreso_seccion_id) {
            // Obtener información de la sección desde la base de datos
            $seccion_info_query = "SELECT se.nombre, COUNT(sub.id) as total_subsecciones
                                  FROM secciones_evaluacion se
                                  LEFT JOIN subsecciones_evaluacion sub ON se.id = sub.seccion_id AND sub.activo = 1
                                  WHERE se.id = :seccion_id
                                  GROUP BY se.id, se.nombre";
            
            $stmt = $db->prepare($seccion_info_query);
            $stmt->execute([':seccion_id' => $input['seccion_id']]);
            $seccion_info = $stmt->fetch();
            
            $insert_seccion = "INSERT INTO progreso_secciones_equipo (
                usuario_id, tipo_planta, seccion_id, seccion_nombre,
                completada, total_subsecciones, subsecciones_completadas
            ) VALUES (
                :usuario_id, :tipo_planta, :seccion_id, :seccion_nombre,
                FALSE, :total_subsecciones, 0
            )";
            
            $stmt = $db->prepare($insert_seccion);
            $stmt->execute([
                ':usuario_id' => $usuario_id,
                ':tipo_planta' => $tipo_planta,
                ':seccion_id' => $input['seccion_id'],
                ':seccion_nombre' => $seccion_info['nombre'] ?? 'Sección ' . $input['seccion_id'],
                ':total_subsecciones' => $seccion_info['total_subsecciones'] ?? 0
            ]);
            
            $progreso_seccion_id = $db->lastInsertId();
        }
        
        // Insertar o actualizar el progreso de la subsección
        $upsert_subseccion = "INSERT INTO progreso_subsecciones_equipo (
            progreso_seccion_id, usuario_id, tipo_planta, subseccion_id, subseccion_nombre,
            completada, puntaje_obtenido, puntaje_porcentaje,
            respuestas_correctas, total_preguntas, fecha_completada
        ) VALUES (
            :progreso_seccion_id, :usuario_id, :tipo_planta, :subseccion_id, :subseccion_nombre,
            TRUE, :puntaje_obtenido, :puntaje_porcentaje,
            :respuestas_correctas, :total_preguntas, NOW()
        )
        ON DUPLICATE KEY UPDATE
            completada = TRUE,
            puntaje_obtenido = VALUES(puntaje_obtenido),
            puntaje_porcentaje = VALUES(puntaje_porcentaje),
            respuestas_correctas = VALUES(respuestas_correctas),
            total_preguntas = VALUES(total_preguntas),
            fecha_completada = NOW(),
            fecha_actualizacion = NOW()";
        
        $stmt = $db->prepare($upsert_subseccion);
        $stmt->execute([
            ':progreso_seccion_id' => $progreso_seccion_id,
            ':usuario_id' => $usuario_id,
            ':tipo_planta' => $tipo_planta,
            ':subseccion_id' => $input['subseccion_id'],
            ':subseccion_nombre' => $input['subseccion_nombre'],
            ':puntaje_obtenido' => $input['puntaje_obtenido'],
            ':puntaje_porcentaje' => $input['puntaje_porcentaje'],
            ':respuestas_correctas' => $input['respuestas_correctas'],
            ':total_preguntas' => $input['total_preguntas']
        ]);
        
        // Actualizar el contador de subsecciones completadas en la sección
        $update_seccion = "UPDATE progreso_secciones_equipo 
                          SET subsecciones_completadas = (
                              SELECT COUNT(*) 
                              FROM progreso_subsecciones_equipo 
                              WHERE progreso_seccion_id = :progreso_seccion_id 
                                AND completada = TRUE
                          ),
                          puntaje_obtenido = (
                              SELECT COALESCE(AVG(puntaje_obtenido), 0)
                              FROM progreso_subsecciones_equipo 
                              WHERE progreso_seccion_id = :progreso_seccion_id 
                                AND completada = TRUE
                          ),
                          puntaje_porcentaje = (
                              SELECT COALESCE(AVG(puntaje_porcentaje), 0)
                              FROM progreso_subsecciones_equipo 
                              WHERE progreso_seccion_id = :progreso_seccion_id 
                                AND completada = TRUE
                          ),
                          respuestas_correctas = (
                              SELECT COALESCE(SUM(respuestas_correctas), 0)
                              FROM progreso_subsecciones_equipo 
                              WHERE progreso_seccion_id = :progreso_seccion_id 
                                AND completada = TRUE
                          ),
                          total_preguntas = (
                              SELECT COALESCE(SUM(total_preguntas), 0)
                              FROM progreso_subsecciones_equipo 
                              WHERE progreso_seccion_id = :progreso_seccion_id 
                                AND completada = TRUE
                          )
                          WHERE id = :progreso_seccion_id";
        
        $stmt = $db->prepare($update_seccion);
        $stmt->execute([':progreso_seccion_id' => $progreso_seccion_id]);
        
        // Marcar la sección como completada si todas las subsecciones están completadas
        $check_completion = "UPDATE progreso_secciones_equipo 
                            SET completada = (subsecciones_completadas >= total_subsecciones),
                                fecha_completada = CASE 
                                    WHEN (subsecciones_completadas >= total_subsecciones) THEN NOW() 
                                    ELSE fecha_completada 
                                END
                            WHERE id = :progreso_seccion_id";
        
        $stmt = $db->prepare($check_completion);
        $stmt->execute([':progreso_seccion_id' => $progreso_seccion_id]);
        
        $db->commit();
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * Marcar una sección como completada
 */
function marcarSeccionCompletada($db, $usuario_id, $tipo_planta, $input) {
    $db->beginTransaction();
    
    try {
        // Insertar o actualizar el progreso de la sección
        $upsert_seccion = "INSERT INTO progreso_secciones_equipo (
            usuario_id, tipo_planta, seccion_id, seccion_nombre,
            completada, puntaje_obtenido, puntaje_porcentaje,
            total_subsecciones, subsecciones_completadas,
            respuestas_correctas, total_preguntas, fecha_completada
        ) VALUES (
            :usuario_id, :tipo_planta, :seccion_id, :seccion_nombre,
            TRUE, :puntaje_obtenido, :puntaje_porcentaje,
            :total_subsecciones, :subsecciones_completadas,
            :respuestas_correctas, :total_preguntas, NOW()
        )
        ON DUPLICATE KEY UPDATE
            completada = TRUE,
            puntaje_obtenido = VALUES(puntaje_obtenido),
            puntaje_porcentaje = VALUES(puntaje_porcentaje),
            total_subsecciones = VALUES(total_subsecciones),
            subsecciones_completadas = VALUES(subsecciones_completadas),
            respuestas_correctas = VALUES(respuestas_correctas),
            total_preguntas = VALUES(total_preguntas),
            fecha_completada = NOW(),
            fecha_actualizacion = NOW()";
        
        $stmt = $db->prepare($upsert_seccion);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':tipo_planta' => $tipo_planta,
            ':seccion_id' => $input['seccion_id'],
            ':seccion_nombre' => $input['seccion_nombre'],
            ':puntaje_obtenido' => $input['puntaje_obtenido'],
            ':puntaje_porcentaje' => $input['puntaje_porcentaje'],
            ':total_subsecciones' => $input['total_subsecciones'],
            ':subsecciones_completadas' => $input['subsecciones_completadas'],
            ':respuestas_correctas' => $input['respuestas_correctas'],
            ':total_preguntas' => $input['total_preguntas']
        ]);
        
        $db->commit();
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}
?>
