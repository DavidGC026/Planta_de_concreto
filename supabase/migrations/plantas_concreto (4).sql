-- Adminer 4.8.1 MySQL 8.0.42-0ubuntu0.24.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `configuracion_ponderacion`;
CREATE TABLE `configuracion_ponderacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_evaluacion_id` int NOT NULL,
  `rol_personal_id` int DEFAULT NULL,
  `total_preguntas_trampa` int DEFAULT '0' COMMENT 'Total de preguntas trampa disponibles',
  `preguntas_trampa_por_seccion` int DEFAULT '1' COMMENT 'Preguntas trampa a mostrar por sección',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tipo_evaluacion_id` (`tipo_evaluacion_id`),
  KEY `rol_personal_id` (`rol_personal_id`),
  CONSTRAINT `configuracion_ponderacion_ibfk_1` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipos_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `configuracion_ponderacion_ibfk_2` FOREIGN KEY (`rol_personal_id`) REFERENCES `roles_personal` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `configuracion_ponderacion` (`id`, `tipo_evaluacion_id`, `rol_personal_id`, `total_preguntas_trampa`, `preguntas_trampa_por_seccion`, `activo`, `fecha_creacion`) VALUES
(1,	1,	1,	20,	1,	1,	'2025-06-24 15:29:49'),
(2,	1,	1,	20,	1,	1,	'2025-06-24 15:32:58'),
(3,	1,	2,	10,	1,	1,	'2025-06-24 15:32:58'),
(4,	1,	4,	10,	1,	1,	'2025-06-24 15:32:58'),
(5,	1,	3,	10,	1,	1,	'2025-06-24 15:32:58'),
(6,	1,	1,	20,	1,	1,	'2025-06-24 15:36:27'),
(7,	1,	2,	10,	1,	1,	'2025-06-24 15:36:27'),
(8,	1,	4,	10,	1,	1,	'2025-06-24 15:36:27'),
(9,	1,	3,	10,	1,	1,	'2025-06-24 15:36:27');

DROP TABLE IF EXISTS `evaluaciones`;
CREATE TABLE `evaluaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo_evaluacion_id` int NOT NULL,
  `rol_personal_id` int DEFAULT NULL,
  `puntuacion_total` decimal(5,2) NOT NULL DEFAULT '0.00',
  `total_preguntas` int NOT NULL DEFAULT '0',
  `respuestas_si` int NOT NULL DEFAULT '0',
  `respuestas_no` int NOT NULL DEFAULT '0',
  `respuestas_na` int NOT NULL DEFAULT '0',
  `estado` enum('en_progreso','completada','cancelada') COLLATE utf8mb4_unicode_ci DEFAULT 'en_progreso',
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_finalizacion` timestamp NULL DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `puntuacion_ponderada` decimal(5,2) DEFAULT '0.00',
  `preguntas_trampa_respondidas` int DEFAULT '0',
  `preguntas_trampa_incorrectas` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `rol_personal_id` (`rol_personal_id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_tipo_evaluacion` (`tipo_evaluacion_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_inicio` (`fecha_inicio`),
  CONSTRAINT `evaluaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluaciones_ibfk_2` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipos_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluaciones_ibfk_3` FOREIGN KEY (`rol_personal_id`) REFERENCES `roles_personal` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `preguntas`;
CREATE TABLE `preguntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seccion_id` int NOT NULL,
  `subseccion_id` int DEFAULT NULL,
  `pregunta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_pregunta` enum('abierta','seleccion_multiple') COLLATE utf8mb4_unicode_ci DEFAULT 'abierta',
  `opcion_a` text COLLATE utf8mb4_unicode_ci,
  `opcion_b` text COLLATE utf8mb4_unicode_ci,
  `opcion_c` text COLLATE utf8mb4_unicode_ci,
  `respuesta_correcta` enum('a','b','c') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `es_trampa` tinyint(1) DEFAULT '0' COMMENT 'Indica si es una pregunta trampa',
  `ponderacion_individual` decimal(5,2) DEFAULT '0.00' COMMENT 'Ponderación individual de la pregunta',
  PRIMARY KEY (`id`),
  KEY `idx_seccion` (`seccion_id`),
  KEY `idx_orden` (`orden`),
  KEY `idx_tipo_pregunta` (`tipo_pregunta`),
  KEY `subseccion_id` (`subseccion_id`),
  CONSTRAINT `preguntas_ibfk_1` FOREIGN KEY (`seccion_id`) REFERENCES `secciones_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `preguntas_ibfk_2` FOREIGN KEY (`subseccion_id`) REFERENCES `subsecciones_evaluacion` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `progreso_secciones`;
CREATE TABLE `progreso_secciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo_evaluacion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seccion_nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seccion_orden` int NOT NULL,
  `puntaje_seccion` decimal(5,2) DEFAULT '0.00',
  `puntaje_porcentaje` decimal(5,2) DEFAULT '0.00',
  `respuestas_correctas` int DEFAULT '0',
  `total_preguntas` int DEFAULT '0',
  `tipo_planta` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_completada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progreso` (`usuario_id`,`tipo_evaluacion`,`seccion_orden`,`tipo_planta`,`categoria`),
  CONSTRAINT `progreso_secciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `progreso_subsecciones`;
CREATE TABLE `progreso_subsecciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo_evaluacion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subseccion_nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subseccion_orden` int NOT NULL,
  `puntaje_subseccion` decimal(5,2) DEFAULT '0.00',
  `puntaje_porcentaje` decimal(5,2) DEFAULT '0.00',
  `respuestas_correctas` int DEFAULT '0',
  `total_preguntas` int DEFAULT '0',
  `tipo_planta` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol_personal` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_completada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progreso_subseccion` (`usuario_id`,`tipo_evaluacion`,`subseccion_orden`,`tipo_planta`,`categoria`,`rol_personal`),
  CONSTRAINT `progreso_subsecciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `reportes`;
CREATE TABLE `reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evaluacion_id` int NOT NULL,
  `tipo_reporte` enum('pdf','excel','json') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta_archivo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamaño_archivo` int DEFAULT NULL,
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evaluacion` (`evaluacion_id`),
  KEY `idx_tipo_reporte` (`tipo_reporte`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `respuestas_evaluacion`;
CREATE TABLE `respuestas_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evaluacion_id` int NOT NULL,
  `pregunta_id` int NOT NULL,
  `respuesta` enum('si','no','na','a','b','c') COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacion` text COLLATE utf8mb4_unicode_ci,
  `fecha_respuesta` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `es_trampa` tinyint(1) DEFAULT '0',
  `ponderacion_obtenida` decimal(5,2) DEFAULT '0.00',
  `subseccion_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_evaluacion_pregunta` (`evaluacion_id`,`pregunta_id`),
  KEY `idx_evaluacion` (`evaluacion_id`),
  KEY `idx_pregunta` (`pregunta_id`),
  KEY `idx_respuesta` (`respuesta`),
  CONSTRAINT `respuestas_evaluacion_ibfk_1` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `respuestas_evaluacion_ibfk_2` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `roles_personal`;
CREATE TABLE `roles_personal` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles_personal` (`id`, `codigo`, `nombre`, `descripcion`, `activo`, `fecha_creacion`) VALUES
(1,	'jefe_planta',	'Jefe de Planta',	'Responsable general de la operación de la planta',	1,	'2025-06-19 15:38:34'),
(2,	'laboratorista',	'Laboratorista',	'Encargado del control de calidad y pruebas de laboratorio',	1,	'2025-06-19 15:38:34'),
(3,	'operador_camion',	'Operador de Camión Revolvedor',	'Operador de vehículos de transporte de concreto',	1,	'2025-06-19 15:38:34'),
(4,	'operador_bombas',	'Operador de Bombas de Concreto',	'Operador de equipos de bombeo de concreto',	1,	'2025-06-19 15:38:34');

DROP TABLE IF EXISTS `secciones_evaluacion`;
CREATE TABLE `secciones_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_evaluacion_id` int NOT NULL,
  `rol_personal_id` int DEFAULT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `orden` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ponderacion` decimal(5,2) DEFAULT '0.00' COMMENT 'Porcentaje de ponderación de la sección (ej: 17.55)',
  `es_trampa` tinyint(1) DEFAULT '0' COMMENT 'Indica si es una sección de preguntas trampa',
  `preguntas_trampa_por_seccion` int DEFAULT '0' COMMENT 'Número de preguntas trampa a mostrar por sección normal',
  PRIMARY KEY (`id`),
  KEY `idx_tipo_evaluacion` (`tipo_evaluacion_id`),
  KEY `idx_rol_personal` (`rol_personal_id`),
  KEY `idx_orden` (`orden`),
  CONSTRAINT `secciones_evaluacion_ibfk_1` FOREIGN KEY (`tipo_evaluacion_id`) REFERENCES `tipos_evaluacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `secciones_evaluacion_ibfk_2` FOREIGN KEY (`rol_personal_id`) REFERENCES `roles_personal` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `secciones_evaluacion` (`id`, `tipo_evaluacion_id`, `rol_personal_id`, `nombre`, `descripcion`, `orden`, `activo`, `fecha_creacion`, `ponderacion`, `es_trampa`, `preguntas_trampa_por_seccion`) VALUES
(1001,	1,	1,	'Conocimiento técnico y operativo',	'Evaluación de conocimientos técnicos relacionados con los procesos productivos, equipos y tecnologías utilizadas en la planta. Incluye comprensión de especificaciones técnicas, procedimientos operativos y normativas industriales.',	1,	1,	'2025-06-19 16:32:53',	15.00,	0,	1),
(1002,	1,	1,	'Gestión de la producción',	'Capacidad para planificar, organizar y controlar los procesos productivos. Incluye optimización de recursos, programación de producción, cumplimiento de objetivos y eficiencia operacional.',	2,	1,	'2025-06-19 16:32:53',	20.00,	0,	1),
(1003,	1,	1,	'Mantenimiento del equipo',	'Gestión del mantenimiento preventivo y correctivo de equipos y maquinaria. Incluye planificación de mantenimientos, control de inventarios de repuestos y coordinación con equipos técnicos.',	3,	1,	'2025-06-19 16:32:53',	10.00,	0,	1),
(1004,	1,	1,	'Gestión del personal',	'Habilidades de liderazgo, supervisión y desarrollo del equipo de trabajo. Incluye motivación, capacitación, evaluación del desempeño y resolución de conflictos laborales.',	4,	1,	'2025-06-19 16:32:53',	10.00,	0,	1),
(1005,	1,	1,	'Seguridad y cumplimiento normativo',	'Implementación y supervisión de políticas de seguridad industrial, cumplimiento de normativas ambientales y laborales. Incluye prevención de accidentes y gestión de riesgos.',	5,	1,	'2025-06-19 16:32:53',	10.00,	0,	1),
(1006,	1,	1,	'Control de calidad',	'Supervisión y control de la calidad del producto final. Incluye implementación de sistemas de calidad, control de especificaciones y mejora continua de procesos.',	6,	1,	'2025-06-19 16:32:53',	10.00,	0,	1),
(1007,	1,	1,	'Documentación y control administrativo',	'Gestión de la documentación técnica y administrativa de la planta. Incluye reportes de producción, registros de control, documentación de procesos y archivo de información.',	7,	1,	'2025-06-19 16:32:53',	5.00,	0,	1),
(1008,	1,	1,	'Mejora continua y enfoque a resultados',	'Implementación de metodologías de mejora continua, análisis de indicadores de desempeño y búsqueda constante de optimización en procesos y resultados.',	8,	1,	'2025-06-19 16:32:53',	7.50,	0,	1),
(1009,	1,	1,	'Coordinación con logística y clientes',	'Coordinación con áreas de logística para el cumplimiento de entregas, comunicación con clientes y resolución de requerimientos especiales de producción.',	9,	1,	'2025-06-19 16:32:53',	5.00,	0,	1),
(1010,	1,	1,	'Resolución de problemas',	'Capacidad para identificar, analizar y resolver problemas operativos de manera eficiente. Incluye toma de decisiones bajo presión y implementación de soluciones efectivas.',	10,	1,	'2025-06-19 16:32:53',	7.50,	0,	1),
(1013,	1,	1,	'Preguntas Trampa - Jefe de Planta',	'Preguntas trampa para evaluar conocimiento específico',	999,	1,	'2025-06-24 15:36:27',	0.00,	1,	0),
(1014,	2,	NULL,	'Producción y Mezclado',	'Evaluación de equipos de producción, mezclado y dosificación',	1,	1,	'2025-06-24 16:49:59',	19.90,	0,	0),
(1015,	2,	NULL,	'Transporte y Entrega',	'Evaluación de equipos de transporte y sistemas de entrega',	2,	1,	'2025-06-24 16:49:59',	12.04,	0,	0),
(1016,	2,	NULL,	'Control de Calidad',	'Evaluación de equipos de laboratorio y control de calidad',	3,	1,	'2025-06-24 16:49:59',	18.50,	0,	0),
(1017,	2,	NULL,	'Mantenimiento',	'Evaluación de equipos y herramientas de mantenimiento',	4,	1,	'2025-06-24 16:49:59',	15.20,	0,	0),
(1018,	2,	NULL,	'Seguridad y Medio Ambiente',	'Evaluación de equipos de seguridad y protección ambiental',	5,	1,	'2025-06-24 16:49:59',	20.36,	0,	0),
(1019,	2,	NULL,	'Gestión y Administración',	'Evaluación de sistemas de gestión y equipos administrativos',	6,	1,	'2025-06-24 16:49:59',	14.00,	0,	0);

DROP TABLE IF EXISTS `subsecciones_evaluacion`;
CREATE TABLE `subsecciones_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seccion_id` int NOT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `orden` int NOT NULL DEFAULT '1',
  `ponderacion_subseccion` decimal(5,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subseccion_seccion` (`seccion_id`),
  KEY `idx_subseccion_orden` (`orden`),
  CONSTRAINT `subsecciones_evaluacion_ibfk_1` FOREIGN KEY (`seccion_id`) REFERENCES `secciones_evaluacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subsecciones_evaluacion` (`id`, `seccion_id`, `nombre`, `descripcion`, `orden`, `ponderacion_subseccion`, `activo`, `fecha_creacion`) VALUES
(1,	1014,	'Mezcladora Principal',	'Evaluación de la mezcladora principal y sus componentes',	1,	3.32,	1,	'2025-06-24 16:49:59'),
(2,	1014,	'Sistema de Dosificación',	'Evaluación de básculas y sistemas de dosificación',	2,	3.32,	1,	'2025-06-24 16:49:59'),
(3,	1014,	'Bandas Transportadoras',	'Evaluación de bandas transportadoras y sistemas de transporte',	3,	3.32,	1,	'2025-06-24 16:49:59'),
(4,	1014,	'Tolvas y Silos',	'Evaluación de tolvas de agregados y silos de cemento',	4,	3.32,	1,	'2025-06-24 16:49:59'),
(5,	1014,	'Sistema de Agua',	'Evaluación del sistema de agua y aditivos',	5,	3.32,	1,	'2025-06-24 16:49:59'),
(6,	1014,	'Sistema de Control',	'Evaluación del sistema de control automatizado',	6,	3.32,	1,	'2025-06-24 16:49:59'),
(8,	1015,	'Camiones Revolvedores',	'Evaluación de camiones revolvedores y tambores',	1,	3.01,	1,	'2025-06-24 16:49:59'),
(9,	1015,	'Bombas de Concreto',	'Evaluación de bombas de concreto y sistemas de bombeo',	2,	3.01,	1,	'2025-06-24 16:49:59'),
(10,	1015,	'Sistemas de Carga',	'Evaluación de sistemas de carga y descarga',	3,	3.01,	1,	'2025-06-24 16:49:59'),
(11,	1015,	'Equipos de Limpieza',	'Evaluación de equipos de limpieza de camiones',	4,	3.01,	1,	'2025-06-24 16:49:59'),
(15,	1016,	'Equipos de Laboratorio',	'Evaluación de prensas, balanzas y equipos de laboratorio',	1,	3.70,	1,	'2025-06-24 16:49:59'),
(16,	1016,	'Instrumentos de Medición',	'Evaluación de instrumentos de medición y calibración',	2,	3.70,	1,	'2025-06-24 16:49:59'),
(17,	1016,	'Equipos de Muestreo',	'Evaluación de equipos para toma de muestras',	3,	3.70,	1,	'2025-06-24 16:49:59'),
(18,	1016,	'Sistemas de Curado',	'Evaluación de cámaras húmedas y sistemas de curado',	4,	3.70,	1,	'2025-06-24 16:49:59'),
(19,	1016,	'Equipos de Pruebas',	'Evaluación de equipos para pruebas específicas',	5,	3.70,	1,	'2025-06-24 16:49:59'),
(22,	1017,	'Herramientas de Mantenimiento',	'Evaluación de herramientas y equipos de mantenimiento',	1,	3.80,	1,	'2025-06-24 16:49:59'),
(23,	1017,	'Equipos de Diagnóstico',	'Evaluación de equipos de diagnóstico y medición',	2,	3.80,	1,	'2025-06-24 16:49:59'),
(24,	1017,	'Sistemas de Lubricación',	'Evaluación de sistemas de lubricación automática',	3,	3.80,	1,	'2025-06-24 16:49:59'),
(25,	1017,	'Equipos de Soldadura',	'Evaluación de equipos de soldadura y reparación',	4,	3.80,	1,	'2025-06-24 16:49:59'),
(29,	1018,	'Equipos Contra Incendios',	'Evaluación de extintores y sistemas contra incendios',	1,	3.39,	1,	'2025-06-24 16:49:59'),
(30,	1018,	'Equipos de Protección Personal',	'Evaluación de EPP y equipos de seguridad personal',	2,	3.39,	1,	'2025-06-24 16:49:59'),
(31,	1018,	'Control de Polvo',	'Evaluación de sistemas de control de polvo',	3,	3.39,	1,	'2025-06-24 16:49:59'),
(32,	1018,	'Tratamiento de Aguas',	'Evaluación de sistemas de tratamiento de aguas residuales',	4,	3.39,	1,	'2025-06-24 16:49:59'),
(33,	1018,	'Sistemas de Emergencia',	'Evaluación de sistemas de alarma y emergencia',	5,	3.39,	1,	'2025-06-24 16:49:59'),
(34,	1018,	'Monitoreo Ambiental',	'Evaluación de equipos de monitoreo ambiental',	6,	3.39,	1,	'2025-06-24 16:49:59'),
(36,	1019,	'Sistemas Informáticos',	'Evaluación de sistemas informáticos y software',	1,	3.50,	1,	'2025-06-24 16:49:59'),
(37,	1019,	'Equipos de Comunicación',	'Evaluación de equipos de comunicación y telecomunicaciones',	2,	3.50,	1,	'2025-06-24 16:49:59'),
(38,	1019,	'Sistemas de Pesaje',	'Evaluación de básculas de camiones y sistemas de pesaje',	3,	3.50,	1,	'2025-06-24 16:49:59'),
(39,	1019,	'Equipos de Oficina',	'Evaluación de equipos de oficina y administración',	4,	3.50,	1,	'2025-06-24 16:49:59');

DROP TABLE IF EXISTS `tipos_evaluacion`;
CREATE TABLE `tipos_evaluacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tipos_evaluacion` (`id`, `codigo`, `nombre`, `descripcion`, `activo`, `fecha_creacion`) VALUES
(1,	'personal',	'Evaluación de Personal',	'Evaluación de competencias y conocimientos del personal',	1,	'2025-06-19 15:38:34'),
(2,	'equipo',	'Evaluación de Equipo',	'Evaluación del estado y funcionamiento de equipos',	1,	'2025-06-19 15:38:34'),
(3,	'operacion',	'Evaluación de Operación',	'Evaluación de procesos operativos y procedimientos',	1,	'2025-06-19 15:38:34');

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` enum('admin','evaluador','supervisor') COLLATE utf8mb4_unicode_ci DEFAULT 'evaluador',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `username`, `password_hash`, `nombre_completo`, `email`, `rol`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1,	'admin',	'$2y$10$HRryB93eIfGqmccxtfQM.e9GlNm9ipoVDnUCczr1WDRzyYAIFaP.W',	'Administrador IMCYC',	'admin@imcyc.org',	'admin',	1,	'2025-06-19 15:38:34',	'2025-06-19 19:48:46'),
(4,	'ruribe2',	'$2y$10$HRryB93eIfGqmccxtfQM.e9GlNm9ipoVDnUCczr1WDRzyYAIFaP.W',	'Administrador',	'admin@admin.com',	'admin',	1,	'2025-06-19 15:58:30',	'2025-06-20 16:51:54'),
(8,	'ruribe',	'$2y$10$Vaf8MLtlLHLdpl7eGs0Y.uLhVGbn8rLDV3mp2VBG7FUC1gv4IYXfG',	'Roberto Uribe',	'ruribe@imcyc.com',	'admin',	1,	'2025-06-20 22:50:22',	'2025-06-20 22:50:22');

DROP VIEW IF EXISTS `vista_estadisticas_evaluacion`;
CREATE TABLE `vista_estadisticas_evaluacion` (`tipo_evaluacion` varchar(200), `total_evaluaciones` bigint, `promedio_puntuacion` decimal(9,6), `aprobados` decimal(23,0), `reprobados` decimal(23,0));


DROP VIEW IF EXISTS `vista_evaluacion_equipo_subsecciones`;
CREATE TABLE `vista_evaluacion_equipo_subsecciones` (`seccion_id` int, `seccion_nombre` varchar(200), `seccion_orden` int, `seccion_ponderacion` decimal(5,2), `subseccion_id` int, `subseccion_nombre` varchar(200), `subseccion_orden` int, `ponderacion_subseccion` decimal(5,2), `total_preguntas` bigint, `tipo_evaluacion` varchar(50));


DROP VIEW IF EXISTS `vista_evaluacion_ponderada`;
CREATE TABLE `vista_evaluacion_ponderada` (`seccion_id` int, `seccion_nombre` varchar(200), `seccion_orden` int, `seccion_ponderacion` decimal(5,2), `seccion_es_trampa` tinyint(1), `preguntas_trampa_por_seccion` int, `tipo_evaluacion` varchar(50), `tipo_nombre` varchar(200), `rol_codigo` varchar(50), `rol_nombre` varchar(200), `total_preguntas` bigint, `preguntas_normales` bigint, `preguntas_trampa` bigint);


DROP VIEW IF EXISTS `vista_evaluaciones_completas`;
CREATE TABLE `vista_evaluaciones_completas` (`id` int, `puntuacion_total` decimal(5,2), `total_preguntas` int, `estado` enum('en_progreso','completada','cancelada'), `fecha_inicio` timestamp, `fecha_finalizacion` timestamp, `username` varchar(100), `nombre_completo` varchar(200), `tipo_evaluacion` varchar(200), `rol_personal` varchar(200), `resultado` varchar(9));


DROP VIEW IF EXISTS `vista_preguntas_ponderadas`;
CREATE TABLE `vista_preguntas_ponderadas` (`id` int, `seccion_id` int, `pregunta` text, `tipo_pregunta` enum('abierta','seleccion_multiple'), `opcion_a` text, `opcion_b` text, `opcion_c` text, `respuesta_correcta` enum('a','b','c'), `orden` int, `activo` tinyint(1), `es_trampa` tinyint(1), `ponderacion_individual` decimal(5,2), `seccion_nombre` varchar(200), `seccion_ponderacion` decimal(5,2), `seccion_es_trampa` tinyint(1), `preguntas_trampa_por_seccion` int, `tipo_evaluacion` varchar(50), `rol_personal` varchar(50), `ponderacion_calculada` decimal(6,2));


DROP TABLE IF EXISTS `vista_estadisticas_evaluacion`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_estadisticas_evaluacion` AS select `te`.`nombre` AS `tipo_evaluacion`,count(`e`.`id`) AS `total_evaluaciones`,avg(`e`.`puntuacion_total`) AS `promedio_puntuacion`,sum((case when (`e`.`puntuacion_total` >= 120) then 1 else 0 end)) AS `aprobados`,sum((case when (`e`.`puntuacion_total` < 120) then 1 else 0 end)) AS `reprobados` from (`tipos_evaluacion` `te` left join `evaluaciones` `e` on(((`te`.`id` = `e`.`tipo_evaluacion_id`) and (`e`.`estado` = 'completada')))) group by `te`.`id`,`te`.`nombre`;

DROP TABLE IF EXISTS `vista_evaluacion_equipo_subsecciones`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_evaluacion_equipo_subsecciones` AS select `se`.`id` AS `seccion_id`,`se`.`nombre` AS `seccion_nombre`,`se`.`orden` AS `seccion_orden`,`se`.`ponderacion` AS `seccion_ponderacion`,`sub`.`id` AS `subseccion_id`,`sub`.`nombre` AS `subseccion_nombre`,`sub`.`orden` AS `subseccion_orden`,`sub`.`ponderacion_subseccion` AS `ponderacion_subseccion`,count(`p`.`id`) AS `total_preguntas`,`te`.`codigo` AS `tipo_evaluacion` from (((`secciones_evaluacion` `se` join `tipos_evaluacion` `te` on((`se`.`tipo_evaluacion_id` = `te`.`id`))) left join `subsecciones_evaluacion` `sub` on(((`sub`.`seccion_id` = `se`.`id`) and (`sub`.`activo` = true)))) left join `preguntas` `p` on(((`p`.`subseccion_id` = `sub`.`id`) and (`p`.`activo` = true)))) where ((`te`.`codigo` = 'equipo') and (`se`.`activo` = true) and (`se`.`es_trampa` = false)) group by `se`.`id`,`se`.`nombre`,`se`.`orden`,`se`.`ponderacion`,`sub`.`id`,`sub`.`nombre`,`sub`.`orden`,`sub`.`ponderacion_subseccion`,`te`.`codigo` order by `se`.`orden`,`sub`.`orden`;

DROP TABLE IF EXISTS `vista_evaluacion_ponderada`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_evaluacion_ponderada` AS select `se`.`id` AS `seccion_id`,`se`.`nombre` AS `seccion_nombre`,`se`.`orden` AS `seccion_orden`,`se`.`ponderacion` AS `seccion_ponderacion`,`se`.`es_trampa` AS `seccion_es_trampa`,`se`.`preguntas_trampa_por_seccion` AS `preguntas_trampa_por_seccion`,`te`.`codigo` AS `tipo_evaluacion`,`te`.`nombre` AS `tipo_nombre`,`rp`.`codigo` AS `rol_codigo`,`rp`.`nombre` AS `rol_nombre`,count(`p`.`id`) AS `total_preguntas`,count((case when (`p`.`es_trampa` = 0) then 1 end)) AS `preguntas_normales`,count((case when (`p`.`es_trampa` = 1) then 1 end)) AS `preguntas_trampa` from (((`secciones_evaluacion` `se` join `tipos_evaluacion` `te` on((`se`.`tipo_evaluacion_id` = `te`.`id`))) left join `roles_personal` `rp` on((`se`.`rol_personal_id` = `rp`.`id`))) left join `preguntas` `p` on(((`se`.`id` = `p`.`seccion_id`) and (`p`.`activo` = 1)))) where (`se`.`activo` = 1) group by `se`.`id`,`se`.`nombre`,`se`.`orden`,`se`.`ponderacion`,`se`.`es_trampa`,`se`.`preguntas_trampa_por_seccion`,`te`.`codigo`,`te`.`nombre`,`rp`.`codigo`,`rp`.`nombre` order by `te`.`codigo`,`rp`.`codigo`,`se`.`orden`;

DROP TABLE IF EXISTS `vista_evaluaciones_completas`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_evaluaciones_completas` AS select `e`.`id` AS `id`,`e`.`puntuacion_total` AS `puntuacion_total`,`e`.`total_preguntas` AS `total_preguntas`,`e`.`estado` AS `estado`,`e`.`fecha_inicio` AS `fecha_inicio`,`e`.`fecha_finalizacion` AS `fecha_finalizacion`,`u`.`username` AS `username`,`u`.`nombre_completo` AS `nombre_completo`,`te`.`nombre` AS `tipo_evaluacion`,`rp`.`nombre` AS `rol_personal`,(case when (`e`.`puntuacion_total` >= 120) then 'APROBADO' else 'REPROBADO' end) AS `resultado` from (((`evaluaciones` `e` join `usuarios` `u` on((`e`.`usuario_id` = `u`.`id`))) join `tipos_evaluacion` `te` on((`e`.`tipo_evaluacion_id` = `te`.`id`))) left join `roles_personal` `rp` on((`e`.`rol_personal_id` = `rp`.`id`)));

DROP TABLE IF EXISTS `vista_preguntas_ponderadas`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vista_preguntas_ponderadas` AS select `p`.`id` AS `id`,`p`.`seccion_id` AS `seccion_id`,`p`.`pregunta` AS `pregunta`,`p`.`tipo_pregunta` AS `tipo_pregunta`,`p`.`opcion_a` AS `opcion_a`,`p`.`opcion_b` AS `opcion_b`,`p`.`opcion_c` AS `opcion_c`,`p`.`respuesta_correcta` AS `respuesta_correcta`,`p`.`orden` AS `orden`,`p`.`activo` AS `activo`,`p`.`es_trampa` AS `es_trampa`,`p`.`ponderacion_individual` AS `ponderacion_individual`,`se`.`nombre` AS `seccion_nombre`,`se`.`ponderacion` AS `seccion_ponderacion`,`se`.`es_trampa` AS `seccion_es_trampa`,`se`.`preguntas_trampa_por_seccion` AS `preguntas_trampa_por_seccion`,`te`.`codigo` AS `tipo_evaluacion`,`rp`.`codigo` AS `rol_personal`,(case when (`p`.`ponderacion_individual` > 0) then `p`.`ponderacion_individual` when (`se`.`es_trampa` = 1) then 0.00 else round((`se`.`ponderacion` / (select count(0) from `preguntas` `p2` where ((`p2`.`seccion_id` = `se`.`id`) and (`p2`.`activo` = 1) and (`p2`.`es_trampa` = 0)))),2) end) AS `ponderacion_calculada` from (((`preguntas` `p` join `secciones_evaluacion` `se` on((`p`.`seccion_id` = `se`.`id`))) join `tipos_evaluacion` `te` on((`se`.`tipo_evaluacion_id` = `te`.`id`))) left join `roles_personal` `rp` on((`se`.`rol_personal_id` = `rp`.`id`))) where ((`p`.`activo` = 1) and (`se`.`activo` = 1));

-- 2025-06-30 23:12:51
