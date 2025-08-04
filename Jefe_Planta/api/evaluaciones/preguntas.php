<?php
/**
 * API para obtener preguntas de Jefe de Planta
 * IMCYC - Sistema de Evaluación de Plantas de Concreto
 */

require_once '../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    handleError('Método no permitido', 405);
}

try {
    // Datos de ejemplo para Jefe de Planta
    $jefePlantaData = [
        'tipo_evaluacion' => 'personal',
        'rol_personal' => 'jefe_planta',
        'secciones' => [
            [
                'id' => 1,
                'nombre' => 'Conocimiento técnico y operativo',
                'ponderacion' => 15.00,
                'preguntas' => [
                    [
                        'pregunta_id' => 1,
                        'pregunta' => '¿Conoce los procedimientos de control de calidad del concreto?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 2,
                        'pregunta' => '¿Maneja adecuadamente los tiempos de mezclado según las especificaciones?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 3,
                        'pregunta' => '¿Supervisa el cumplimiento de las especificaciones técnicas del concreto?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 4,
                        'pregunta' => '¿Conoce las normas mexicanas aplicables a la producción de concreto?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ]
                ]
            ],
            [
                'id' => 2,
                'nombre' => 'Gestión de la producción',
                'ponderacion' => 20.00,
                'preguntas' => [
                    [
                        'pregunta_id' => 5,
                        'pregunta' => '¿Planifica eficientemente la producción diaria de concreto?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 6,
                        'pregunta' => '¿Optimiza el uso de recursos y materiales en la planta?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 7,
                        'pregunta' => '¿Coordina adecuadamente con el área de logística y despacho?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 8,
                        'pregunta' => '¿Controla los inventarios de materias primas?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ]
                ]
            ],
            [
                'id' => 3,
                'nombre' => 'Seguridad y cumplimiento normativo',
                'ponderacion' => 25.00,
                'preguntas' => [
                    [
                        'pregunta_id' => 9,
                        'pregunta' => '¿Implementa y supervisa las medidas de seguridad industrial?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 10,
                        'pregunta' => '¿Asegura el cumplimiento de las normas ambientales?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 11,
                        'pregunta' => '¿Mantiene actualizados los protocolos de emergencia?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 12,
                        'pregunta' => '¿Verifica el uso correcto del equipo de protección personal?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ]
                ]
            ],
            [
                'id' => 4,
                'nombre' => 'Gestión del personal',
                'ponderacion' => 20.00,
                'preguntas' => [
                    [
                        'pregunta_id' => 13,
                        'pregunta' => '¿Capacita regularmente a su equipo de trabajo?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 14,
                        'pregunta' => '¿Evalúa el desempeño del personal a su cargo?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 15,
                        'pregunta' => '¿Fomenta un ambiente de trabajo colaborativo y seguro?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 16,
                        'pregunta' => '¿Comunica efectivamente las metas y objetivos del área?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ]
                ]
            ],
            [
                'id' => 5,
                'nombre' => 'Mejora continua y resultados',
                'ponderacion' => 20.00,
                'preguntas' => [
                    [
                        'pregunta_id' => 17,
                        'pregunta' => '¿Implementa acciones de mejora continua en los procesos?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 18,
                        'pregunta' => '¿Analiza y reporta indicadores de desempeño de la planta?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 19,
                        'pregunta' => '¿Busca constantemente optimizar los procesos productivos?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ],
                    [
                        'pregunta_id' => 20,
                        'pregunta' => '¿Mantiene comunicación efectiva con clientes y proveedores?',
                        'tipo_pregunta' => 'abierta',
                        'es_trampa' => false
                    ]
                ]
            ]
        ]
    ];
    
    sendJsonResponse([
        'success' => true,
        'data' => $jefePlantaData
    ]);
    
} catch (Exception $e) {
    handleError('Error al obtener preguntas: ' . $e->getMessage());
}
?>