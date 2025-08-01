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
    error_log("Error crítico en progreso-equipo.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
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
        // Verificar si existe el procedimiento almacenado
        $check_procedure = $db->query("SHOW PROCEDURE STATUS WHERE Name = 'ObtenerProgresoEquipoUsuario'");
        if ($check_procedure->rowCount() == 0) {
            // Si no existe el procedimiento, usar el sistema de progreso estándar como fallback
            return obtenerProgresoFallback($db, $usuario_id, $tipo_planta);
        }

        // Llamar al procedimiento almacenado
        $stmt = $db->prepare("CALL ObtenerProgresoEquipoUsuario(?, ?)");
        $stmt->execute([$usuario_id, $tipo_planta]);

        $progreso = $stmt->fetchAll();

        // Procesar los datos para el frontend
        $resultado = [];
        foreach ($progreso as $seccion) {
            $subsecciones = [];

            // Procesar el detalle de subsecciones si existe
            if ($seccion['subsecciones_detalle']) {
                $subsecciones_raw = explode('|', $seccion['subsecciones_detalle']);
                foreach ($subsecciones_raw as $sub_raw) {
                    $parts = explode(':', $sub_raw);
                    if (count($parts) >= 4) {
                        $subsecciones[] = [
                            'subseccion_id' => (int)$parts[0],
                            'nombre' => $parts[1],
                            'completada' => (bool)$parts[2],
                            'puntaje_porcentaje' => (float)$parts[3]
                        ];
                    }
                }
            }

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
        error_log("Error en obtenerProgreso: " . $e->getMessage());
        handleError('Error al obtener progreso: ' . $e->getMessage());
    }
}

/**
 * Obtener progreso usando el sistema estándar como fallback
 */
function obtenerProgresoFallback($db, $usuario_id, $tipo_planta) {
    try {
        // Usar el sistema de progreso estándar
        $query = "SELECT
                    ps.seccion_nombre,
                    ps.seccion_orden,
                    ps.puntaje_porcentaje,
                    ps.respuestas_correctas,
                    ps.total_preguntas,
                    ps.fecha_completada
                  FROM progreso_secciones ps
                  WHERE ps.usuario_id = :usuario_id
                    AND ps.tipo_evaluacion = 'equipo'
                    AND ps.tipo_planta = :tipo_planta
                  ORDER BY ps.seccion_orden";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':tipo_planta' => $tipo_planta
        ]);

        $progreso_secciones = $stmt->fetchAll();

        // Convertir a formato esperado
        $resultado = [];
        foreach ($progreso_secciones as $index => $seccion) {
            $resultado[] = [
                'seccion_id' => $seccion['seccion_orden'],
                'seccion_nombre' => $seccion['seccion_nombre'],
                'completada' => true, // Si está en progreso_secciones, está completada
                'puntaje_obtenido' => (float)$seccion['puntaje_porcentaje'],
                'puntaje_porcentaje' => (float)$seccion['puntaje_porcentaje'],
                'total_subsecciones' => 0,
                'subsecciones_completadas' => 0,
                'respuestas_correctas' => (int)$seccion['respuestas_correctas'],
                'total_preguntas' => (int)$seccion['total_preguntas'],
                'fecha_completada' => $seccion['fecha_completada'],
                'subsecciones' => []
            ];
        }

        sendJsonResponse([
            'success' => true,
            'data' => [
                'usuario_id' => (int)$usuario_id,
                'tipo_planta' => $tipo_planta,
                'secciones' => $resultado,
                'total_secciones' => count($resultado),
                'secciones_completadas' => count($resultado),
                'sistema' => 'fallback'
            ]
        ]);

    } catch (Exception $e) {
        error_log("Error en obtenerProgresoFallback: " . $e->getMessage());
        // Si también falla el fallback, devolver estructura vacía
        sendJsonResponse([
            'success' => true,
            'data' => [
                'usuario_id' => (int)$usuario_id,
                'tipo_planta' => $tipo_planta,
                'secciones' => [],
                'total_secciones' => 0,
                'secciones_completadas' => 0,
                'sistema' => 'empty'
            ]
        ]);
    }
}

/**
 * Guardar progreso de sección o subsección
 */
function guardarProgreso($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Log para debugging
    error_log("=== DATOS RECIBIDOS EN PROGRESO-EQUIPO ===");
    error_log("Input completo: " . json_encode($input, JSON_PRETTY_PRINT));

    if (!$input) {
        handleError('Datos JSON inválidos', 400);
    }

    // Validar campos requeridos básicos
    $required_fields = ['usuario_id', 'tipo_planta', 'tipo_progreso'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || $input[$field] === null || $input[$field] === '') {
            error_log("Campo faltante o vacío: $field");
            error_log("Valor recibido: " . var_export($input[$field] ?? 'NO_EXISTE', true));
            handleError("Campo requerido: $field", 400);
        }
    }

    $usuario_id = (int)$input['usuario_id'];
    $tipo_planta = $input['tipo_planta'];
    $tipo_progreso = $input['tipo_progreso']; // 'seccion' o 'subseccion'

    error_log("Procesando: usuario_id=$usuario_id, tipo_planta=$tipo_planta, tipo_progreso=$tipo_progreso");

    try {
        // Verificar si existen las tablas de progreso de equipo
        $check_table = $db->query("SHOW TABLES LIKE 'progreso_secciones_equipo'");
        if ($check_table->rowCount() == 0) {
            // Usar sistema de progreso estándar como fallback
            return guardarProgresoFallback($db, $input);
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
        error_log("Error en guardarProgreso: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        handleError('Error al guardar progreso: ' . $e->getMessage());
    }
}

/**
 * Guardar progreso usando el sistema estándar como fallback
 */
function guardarProgresoFallback($db, $input) {
    try {
        error_log("Usando sistema fallback para guardar progreso");

        // Usar el sistema de progreso estándar
        if ($input['tipo_progreso'] === 'subseccion') {
            // Para subsecciones, usar progreso_subsecciones
            $query = "INSERT INTO progreso_subsecciones
                      (usuario_id, tipo_evaluacion, subseccion_nombre, subseccion_orden,
                       puntaje_subseccion, puntaje_porcentaje, respuestas_correctas, total_preguntas,
                       tipo_planta, fecha_completada)
                      VALUES
                      (?, 'equipo', ?, ?,
                       ?, ?, ?, ?,
                       ?, NOW())
                      ON DUPLICATE KEY UPDATE
                      subseccion_nombre = VALUES(subseccion_nombre),
                      puntaje_subseccion = VALUES(puntaje_subseccion),
                      puntaje_porcentaje = VALUES(puntaje_porcentaje),
                      respuestas_correctas = VALUES(respuestas_correctas),
                      total_preguntas = VALUES(total_preguntas),
                      fecha_actualizacion = NOW()";

            $stmt = $db->prepare($query);
            $stmt->execute([
                $input['usuario_id'],
                $input['subseccion_nombre'],
                $input['subseccion_id'],
                $input['puntaje_obtenido'],
                $input['puntaje_porcentaje'],
                $input['respuestas_correctas'],
                $input['total_preguntas'],
                $input['tipo_planta']
            ]);

        } else {
            // Para secciones, usar progreso_secciones
            $query = "INSERT INTO progreso_secciones
                      (usuario_id, tipo_evaluacion, seccion_nombre, seccion_orden,
                       puntaje_seccion, puntaje_porcentaje, respuestas_correctas, total_preguntas,
                       tipo_planta, fecha_completada)
                      VALUES
                      (?, 'equipo', ?, ?,
                       ?, ?, ?, ?,
                       ?, NOW())
                      ON DUPLICATE KEY UPDATE
                      seccion_nombre = VALUES(seccion_nombre),
                      puntaje_seccion = VALUES(puntaje_seccion),
                      puntaje_porcentaje = VALUES(puntaje_porcentaje),
                      respuestas_correctas = VALUES(respuestas_correctas),
                      total_preguntas = VALUES(total_preguntas),
                      fecha_actualizacion = NOW()";

            $stmt = $db->prepare($query);
            $stmt->execute([
                $input['usuario_id'],
                $input['seccion_nombre'],
                $input['seccion_id'],
                $input['puntaje_obtenido'],
                $input['puntaje_porcentaje'],
                $input['respuestas_correctas'],
                $input['total_preguntas'],
                $input['tipo_planta']
            ]);
        }

        sendJsonResponse([
            'success' => true,
            'message' => 'Progreso guardado exitosamente (sistema fallback)',
            'data' => [
                'tipo_progreso' => $input['tipo_progreso'],
                'sistema' => 'fallback'
            ]
        ]);

    } catch (Exception $e) {
        error_log("Error en guardarProgresoFallback: " . $e->getMessage());
        error_log("Stack trace fallback: " . $e->getTraceAsString());
        handleError('Error al guardar progreso (fallback): ' . $e->getMessage());
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

        // Verificar si existen las tablas de progreso de equipo
        $check_table = $db->query("SHOW TABLES LIKE 'progreso_secciones_equipo'");
        if ($check_table->rowCount() > 0) {
            // Eliminar progreso de subsecciones
            $delete_subsecciones = "DELETE psse FROM progreso_subsecciones_equipo psse
                                    JOIN progreso_secciones_equipo pse ON psse.progreso_seccion_id = pse.id
                                    WHERE pse.usuario_id = ? AND pse.tipo_planta = ?";

            $stmt = $db->prepare($delete_subsecciones);
            $stmt->execute([$usuario_id, $tipo_planta]);

            // Eliminar progreso de secciones
            $delete_secciones = "DELETE FROM progreso_secciones_equipo
                                WHERE usuario_id = ? AND tipo_planta = ?";

            $stmt = $db->prepare($delete_secciones);
            $stmt->execute([$usuario_id, $tipo_planta]);
        }

        // También limpiar del sistema estándar
        $delete_standard_subsecciones = "DELETE FROM progreso_subsecciones
                                        WHERE usuario_id = ? AND tipo_evaluacion = 'equipo' AND tipo_planta = ?";

        $stmt = $db->prepare($delete_standard_subsecciones);
        $stmt->execute([$usuario_id, $tipo_planta]);

        $delete_standard_secciones = "DELETE FROM progreso_secciones
                                     WHERE usuario_id = ? AND tipo_evaluacion = 'equipo' AND tipo_planta = ?";

        $stmt = $db->prepare($delete_standard_secciones);
        $stmt->execute([$usuario_id, $tipo_planta]);

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
        error_log("Error en limpiarProgreso: " . $e->getMessage());
        handleError('Error al limpiar progreso: ' . $e->getMessage());
    }
}

/**
 * Marcar una subsección como completada (solo si existen las tablas específicas)
 */
function marcarSubseccionCompletada($db, $usuario_id, $tipo_planta, $input) {
    $db->beginTransaction();

    try {
        // Obtener o crear el registro de progreso de sección
        $seccion_query = "SELECT id FROM progreso_secciones_equipo
                         WHERE usuario_id = ? AND tipo_planta = ? AND seccion_id = ?";

        $stmt = $db->prepare($seccion_query);
        $stmt->execute([$usuario_id, $tipo_planta, $input['seccion_id']]);
        $progreso_seccion_id = $stmt->fetchColumn();

        // Si no existe el progreso de sección, crearlo
        if (!$progreso_seccion_id) {
            // Obtener información de la sección desde la base de datos
            $seccion_info_query = "SELECT se.nombre, COUNT(sub.id) as total_subsecciones
                                  FROM secciones_evaluacion se
                                  LEFT JOIN subsecciones_evaluacion sub ON se.id = sub.seccion_id AND sub.activo = 1
                                  WHERE se.id = ?
                                  GROUP BY se.id, se.nombre";

            $stmt = $db->prepare($seccion_info_query);
            $stmt->execute([$input['seccion_id']]);
            $seccion_info = $stmt->fetch();

            $insert_seccion = "INSERT INTO progreso_secciones_equipo (
                usuario_id, tipo_planta, seccion_id, seccion_nombre,
                completada, total_subsecciones, subsecciones_completadas
            ) VALUES (?, ?, ?, ?, FALSE, ?, 0)";

            $stmt = $db->prepare($insert_seccion);
            $stmt->execute([
                $usuario_id,
                $tipo_planta,
                $input['seccion_id'],
                $seccion_info['nombre'] ?? 'Sección ' . $input['seccion_id'],
                $seccion_info['total_subsecciones'] ?? 0
            ]);

            $progreso_seccion_id = $db->lastInsertId();
        }

        // Insertar o actualizar el progreso de la subsección
        $upsert_subseccion = "INSERT INTO progreso_subsecciones_equipo (
            progreso_seccion_id, usuario_id, tipo_planta, subseccion_id, subseccion_nombre,
            completada, puntaje_obtenido, puntaje_porcentaje,
            respuestas_correctas, total_preguntas, fecha_completada
        ) VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, NOW())
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
            $progreso_seccion_id,
            $usuario_id,
            $tipo_planta,
            $input['subseccion_id'],
            $input['subseccion_nombre'],
            $input['puntaje_obtenido'],
            $input['puntaje_porcentaje'],
            $input['respuestas_correctas'],
            $input['total_preguntas']
        ]);

        // Actualizar el contador de subsecciones completadas en la sección
        $update_seccion = "UPDATE progreso_secciones_equipo
                          SET subsecciones_completadas = (
                              SELECT COUNT(*)
                              FROM progreso_subsecciones_equipo
                              WHERE progreso_seccion_id = ? AND completada = TRUE
                          ),
                          puntaje_obtenido = (
                              SELECT COALESCE(AVG(puntaje_obtenido), 0)
                              FROM progreso_subsecciones_equipo
                              WHERE progreso_seccion_id = ? AND completada = TRUE
                          ),
                          puntaje_porcentaje = (
                              SELECT COALESCE(AVG(puntaje_porcentaje), 0)
                              FROM progreso_subsecciones_equipo
                              WHERE progreso_seccion_id = ? AND completada = TRUE
                          ),
                          respuestas_correctas = (
                              SELECT COALESCE(SUM(respuestas_correctas), 0)
                              FROM progreso_subsecciones_equipo
                              WHERE progreso_seccion_id = ? AND completada = TRUE
                          ),
                          total_preguntas = (
                              SELECT COALESCE(SUM(total_preguntas), 0)
                              FROM progreso_subsecciones_equipo
                              WHERE progreso_seccion_id = ? AND completada = TRUE
                          )
                          WHERE id = ?";

        $stmt = $db->prepare($update_seccion);
        $stmt->execute([
            $progreso_seccion_id, $progreso_seccion_id, $progreso_seccion_id,
            $progreso_seccion_id, $progreso_seccion_id, $progreso_seccion_id
        ]);

        // Marcar la sección como completada si todas las subsecciones están completadas
        $check_completion = "UPDATE progreso_secciones_equipo
                            SET completada = (subsecciones_completadas >= total_subsecciones),
                                fecha_completada = CASE
                                    WHEN (subsecciones_completadas >= total_subsecciones) THEN NOW()
                                    ELSE fecha_completada
                                END
                            WHERE id = ?";

        $stmt = $db->prepare($check_completion);
        $stmt->execute([$progreso_seccion_id]);

        $db->commit();

    } catch (Exception $e) {
        $db->rollback();
        error_log("Error en marcarSubseccionCompletada: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Marcar una sección como completada (solo si existen las tablas específicas)
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
        ) VALUES (?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, NOW())
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
            $usuario_id,
            $tipo_planta,
            $input['seccion_id'],
            $input['seccion_nombre'],
            $input['puntaje_obtenido'],
            $input['puntaje_porcentaje'],
            $input['total_subsecciones'],
            $input['subsecciones_completadas'],
            $input['respuestas_correctas'],
            $input['total_preguntas']
        ]);

        $db->commit();

    } catch (Exception $e) {
        $db->rollback();
        error_log("Error en marcarSeccionCompletada: " . $e->getMessage());
        throw $e;
    }
}
?>
