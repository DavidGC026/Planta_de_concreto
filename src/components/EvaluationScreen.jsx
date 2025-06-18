import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowLeft, CheckCircle, XCircle, MinusCircle, UserCheck, Users, Wrench, Settings, Zap, ClipboardCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const evaluationQuestions = {
  jefe_planta: {
    title: 'Jefe de Planta',
    icon: UserCheck,
    sections: [
      {
        title: 'Gestión de la producción',
        questions: [
          {
            text: '¿Qué acciones se toman si un cliente solicita un cambio en su pedido (hora, volumen o tipo de concreto) con menos de 2 horas de anticipación?',
            options: [
              'Se acepta sin restricciones',
              'Se evalúa disponibilidad y se cobra recargo',
              'Se rechaza automáticamente',
              'Se programa para el día siguiente'
            ],
            correctAnswer: 1 // Índice de la respuesta correcta (Se evalúa disponibilidad y se cobra recargo)
          },
          {
            text: '¿Cuál debe ser el porcentaje mínimo de desperdicios sobre la producción mensual?',
            options: [
              '<2.3%',
              '>1.3%',
              '<1.5%',
              '>3%'
            ],
            correctAnswer: 2 // <1.5%
          },
          {
            text: '¿Qué tipo de inspecciones se realizan a los equipos de planta?',
            options: [
              'Pruebas de carga y presión',
              'Evaluación de la integridad mecánica',
              'Visuales',
              'Todas las anteriores'
            ],
            correctAnswer: 3 // Todas las anteriores
          },
          {
            text: '¿Con qué frecuencia se hacen pruebas de funcionamiento?',
            options: [
              'Diarias',
              'Por jornada',
              'Mensuales',
              'Semanales'
            ],
            correctAnswer: 0 // Diarias
          },
          {
            text: '¿Cuál es el tiempo máximo permitido para la descarga de concreto?',
            options: [
              '90 minutos',
              '60 minutos',
              '120 minutos',
              '45 minutos'
            ],
            correctAnswer: 0 // 90 minutos
          },
          {
            text: '¿Qué documentación debe acompañar cada entrega de concreto?',
            options: [
              'Solo la factura',
              'Remisión con especificaciones técnicas',
              'Certificado de calidad únicamente',
              'Orden de compra'
            ],
            correctAnswer: 1 // Remisión con especificaciones técnicas
          },
          {
            text: '¿Cuál es la tolerancia máxima en el revenimiento del concreto?',
            options: [
              '±1 cm',
              '±2 cm',
              '±3 cm',
              '±0.5 cm'
            ],
            correctAnswer: 1 // ±2 cm
          },
          {
            text: '¿Cada cuánto se debe calibrar la báscula de cemento?',
            options: [
              'Mensualmente',
              'Semanalmente',
              'Diariamente',
              'Cada 6 meses'
            ],
            correctAnswer: 2 // Diariamente
          },
          {
            text: '¿Qué se debe verificar antes de iniciar la producción diaria?',
            options: [
              'Solo los niveles de materiales',
              'Equipos, materiales y condiciones climáticas',
              'Únicamente el personal disponible',
              'Solo la programación de pedidos'
            ],
            correctAnswer: 1 // Equipos, materiales y condiciones climáticas
          },
          {
            text: '¿Cuál es el procedimiento cuando se detecta una no conformidad en el concreto?',
            options: [
              'Continuar con la entrega',
              'Detener producción y evaluar causas',
              'Diluir con agua',
              'Entregar con descuento'
            ],
            correctAnswer: 1 // Detener producción y evaluar causas
          },
          {
            text: '¿Qué registro se debe mantener de cada bachada producida?',
            options: [
              'Solo el volumen',
              'Hora, materiales, resistencia y destino',
              'Únicamente el cliente',
              'Solo la hora de producción'
            ],
            correctAnswer: 1 // Hora, materiales, resistencia y destino
          },
          {
            text: '¿Cuál es la temperatura máxima recomendada para el concreto fresco?',
            options: [
              '25°C',
              '30°C',
              '35°C',
              '40°C'
            ],
            correctAnswer: 1 // 30°C
          },
          {
            text: '¿Qué se debe hacer si la humedad de los agregados varía significativamente?',
            options: [
              'Ignorar la variación',
              'Ajustar la cantidad de agua',
              'Cambiar de proveedor',
              'Suspender la producción'
            ],
            correctAnswer: 1 // Ajustar la cantidad de agua
          },
          {
            text: '¿Con qué frecuencia se debe limpiar el equipo de mezclado?',
            options: [
              'Al final del día',
              'Cada cambio de diseño',
              'Semanalmente',
              'Solo cuando sea necesario'
            ],
            correctAnswer: 1 // Cada cambio de diseño
          },
          {
            text: '¿Qué información debe contener la etiqueta de identificación de materiales?',
            options: [
              'Solo el nombre',
              'Nombre, fecha de recepción y proveedor',
              'Solo la fecha',
              'Solo el proveedor'
            ],
            correctAnswer: 1 // Nombre, fecha de recepción y proveedor
          }
        ]
      },
      {
        title: 'Mantenimiento del equipo',
        questions: [
          {
            text: '¿Qué tipo de inspecciones se realizan a los equipos de planta?',
            options: [
              'Pruebas de carga y presión',
              'Evaluación de la integridad mecánica',
              'Visuales',
              'Todas las anteriores'
            ],
            correctAnswer: 3
          },
          {
            text: '¿Con qué frecuencia se hacen pruebas de funcionamiento?',
            options: [
              'Diarias',
              'Por jornada',
              'Mensuales',
              'Semanales'
            ],
            correctAnswer: 0
          },
          {
            text: '¿Cuál es el intervalo recomendado para el mantenimiento preventivo de la mezcladora?',
            options: [
              'Cada 100 horas',
              'Cada 200 horas',
              'Cada 500 horas',
              'Cada 1000 horas'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué se debe verificar en las bandas transportadoras diariamente?',
            options: [
              'Solo la velocidad',
              'Alineación, tensión y desgaste',
              'Solo el motor',
              'Únicamente la limpieza'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuándo se debe cambiar el aceite hidráulico de los equipos?',
            options: [
              'Cada mes',
              'Según especificaciones del fabricante',
              'Cada año',
              'Solo cuando se vea sucio'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué herramientas son esenciales para el mantenimiento básico?',
            options: [
              'Solo llaves inglesas',
              'Multímetro, llaves, lubricantes',
              'Solo desarmadores',
              'Únicamente martillo'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cómo se debe almacenar las refacciones de repuesto?',
            options: [
              'Al aire libre',
              'En lugar seco y etiquetado',
              'En cualquier lugar',
              'Solo en el almacén general'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué registro se debe llevar del mantenimiento realizado?',
            options: [
              'Solo la fecha',
              'Fecha, actividad, responsable y observaciones',
              'Solo el responsable',
              'No es necesario registrar'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es la presión de trabajo normal en el sistema neumático?',
            options: [
              '5-7 bar',
              '8-10 bar',
              '12-15 bar',
              '20-25 bar'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué se debe hacer antes de realizar mantenimiento en equipos eléctricos?',
            options: [
              'Solo apagar el equipo',
              'Desenergizar y bloquear',
              'Trabajar con el equipo encendido',
              'Solo desconectar'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se debe revisar el sistema de lubricación automática?',
            options: [
              'Diariamente',
              'Semanalmente',
              'Mensualmente',
              'Anualmente'
            ],
            correctAnswer: 0
          },
          {
            text: '¿Qué componentes se deben inspeccionar en las básculas?',
            options: [
              'Solo la pantalla',
              'Celdas de carga, cables y calibración',
              'Solo los cables',
              'Únicamente la estructura'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es la vida útil promedio de las aspas de la mezcladora?',
            options: [
              '6 meses',
              '1 año',
              '2 años',
              '5 años'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué se debe verificar en el sistema de aire comprimido?',
            options: [
              'Solo la presión',
              'Presión, fugas y humedad',
              'Solo las fugas',
              'Únicamente el compresor'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cómo se debe limpiar el interior de la mezcladora?',
            options: [
              'Solo con agua',
              'Con agua a presión y detergente',
              'Solo con aire comprimido',
              'No requiere limpieza'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Control de calidad',
        questions: [
          {
            text: '¿Cuál es la frecuencia mínima para realizar pruebas de revenimiento?',
            options: [
              'Cada bachada',
              'Cada 10 m³',
              'Una vez por día',
              'Solo cuando el cliente lo solicite'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué resistencia debe alcanzar el concreto a los 7 días?',
            options: [
              '50% de f\'c',
              '65% de f\'c',
              '75% de f\'c',
              '90% de f\'c'
            ],
            correctAnswer: 2
          },
          {
            text: '¿Cuántos cilindros se deben elaborar por cada muestra?',
            options: [
              '2 cilindros',
              '3 cilindros',
              '4 cilindros',
              '6 cilindros'
            ],
            correctAnswer: 1
          },
          {
            text: '¿A qué edad se rompen los cilindros para control de calidad?',
            options: [
              'Solo a 28 días',
              '7 y 28 días',
              '3, 7 y 28 días',
              'Solo a 7 días'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es la temperatura de curado de los especímenes?',
            options: [
              '15°C ± 2°C',
              '20°C ± 2°C',
              '23°C ± 2°C',
              '25°C ± 2°C'
            ],
            correctAnswer: 2
          },
          {
            text: '¿Qué se debe verificar en los agregados antes de su uso?',
            options: [
              'Solo el tamaño',
              'Granulometría, humedad y limpieza',
              'Solo la humedad',
              'Únicamente la procedencia'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se debe calibrar la balanza del laboratorio?',
            options: [
              'Diariamente',
              'Semanalmente',
              'Mensualmente',
              'Anualmente'
            ],
            correctAnswer: 0
          },
          {
            text: '¿Cuál es el tiempo máximo para transportar una muestra al laboratorio?',
            options: [
              '15 minutos',
              '30 minutos',
              '45 minutos',
              '60 minutos'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué información debe contener el reporte de pruebas?',
            options: [
              'Solo la resistencia',
              'Fecha, diseño, resistencia y observaciones',
              'Solo la fecha',
              'Únicamente el responsable'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es la tolerancia en peso para los cilindros de prueba?',
            options: [
              '±1%',
              '±2%',
              '±3%',
              '±5%'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué se debe hacer si una muestra no cumple con la resistencia especificada?',
            options: [
              'Ignorar el resultado',
              'Investigar causas y tomar acciones correctivas',
              'Repetir la prueba únicamente',
              'Cambiar de laboratorio'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es el contenido de aire máximo permitido en concreto normal?',
            options: [
              '2%',
              '4%',
              '6%',
              '8%'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué equipo se utiliza para medir el contenido de aire?',
            options: [
              'Cono de Abrams',
              'Medidor de aire tipo A',
              'Balanza',
              'Termómetro'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuánto tiempo se debe vibrar un cilindro de prueba?',
            options: [
              '10 segundos',
              '15 segundos',
              'Hasta que cese el burbujeo',
              '30 segundos'
            ],
            correctAnswer: 2
          },
          {
            text: '¿Qué se debe verificar en el cemento antes de su uso?',
            options: [
              'Solo la fecha de caducidad',
              'Fecha, temperatura y ausencia de grumos',
              'Solo el proveedor',
              'Únicamente el color'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Seguridad y normatividad',
        questions: [
          {
            text: '¿Cuál es el equipo de protección personal mínimo requerido?',
            options: [
              'Solo casco',
              'Casco, lentes, chaleco y botas',
              'Solo botas',
              'Únicamente chaleco'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se deben realizar simulacros de emergencia?',
            options: [
              'Mensualmente',
              'Trimestralmente',
              'Semestralmente',
              'Anualmente'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué distancia mínima debe mantenerse de líneas eléctricas aéreas?',
            options: [
              '1 metro',
              '3 metros',
              '5 metros',
              '10 metros'
            ],
            correctAnswer: 2
          },
          {
            text: '¿Cuál es el procedimiento para reportar un accidente?',
            options: [
              'Solo informar al supervisor',
              'Atender lesionado, asegurar área y reportar',
              'Solo llamar a emergencias',
              'Continuar trabajando'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué tipo de extinguidor se debe usar para fuegos eléctricos?',
            options: [
              'Agua',
              'Espuma',
              'CO2 o polvo químico seco',
              'Arena'
            ],
            correctAnswer: 2
          },
          {
            text: '¿Cuál es la señalización requerida en áreas de riesgo?',
            options: [
              'Solo letreros',
              'Letreros, colores y barreras',
              'Solo colores',
              'No se requiere'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se debe revisar el botiquín de primeros auxilios?',
            options: [
              'Diariamente',
              'Semanalmente',
              'Mensualmente',
              'Anualmente'
            ],
            correctAnswer: 2
          },
          {
            text: '¿Qué se debe hacer antes de ingresar a un espacio confinado?',
            options: [
              'Solo informar',
              'Medir gases, ventilar y usar EPP',
              'Ingresar directamente',
              'Solo usar linterna'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es la altura máxima para trabajar sin arnés?',
            options: [
              '1.5 metros',
              '1.8 metros',
              '2.0 metros',
              '2.5 metros'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué documentos de seguridad debe tener cada trabajador?',
            options: [
              'Solo identificación',
              'Capacitación en seguridad y examen médico',
              'Solo contrato',
              'Únicamente seguro'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es el procedimiento para bloqueo y etiquetado (LOTO)?',
            options: [
              'Solo apagar',
              'Desenergizar, bloquear, etiquetar y verificar',
              'Solo desconectar',
              'No es necesario'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué se debe verificar en las escaleras antes de usarlas?',
            options: [
              'Solo la altura',
              'Estructura, peldaños y sistemas de seguridad',
              'Solo los peldaños',
              'Únicamente el material'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es la velocidad máxima permitida dentro de la planta?',
            options: [
              '10 km/h',
              '15 km/h',
              '20 km/h',
              '25 km/h'
            ],
            correctAnswer: 0
          },
          {
            text: '¿Qué se debe hacer con los residuos peligrosos?',
            options: [
              'Tirar en cualquier lugar',
              'Clasificar, etiquetar y almacenar adecuadamente',
              'Mezclar con residuos comunes',
              'Quemar'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se debe capacitar al personal en seguridad?',
            options: [
              'Al ingreso únicamente',
              'Anualmente y cuando sea necesario',
              'Solo cuando ocurra un accidente',
              'No es necesario'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        title: 'Gestión administrativa',
        questions: [
          {
            text: '¿Qué documentos se requieren para cada pedido de concreto?',
            options: [
              'Solo orden de compra',
              'Orden, especificaciones técnicas y condiciones',
              'Solo especificaciones',
              'Únicamente factura'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es el tiempo de respuesta máximo para cotizaciones?',
            options: [
              '24 horas',
              '48 horas',
              '72 horas',
              '1 semana'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué información debe contener la remisión de entrega?',
            options: [
              'Solo volumen',
              'Cliente, diseño, volumen, hora y especificaciones',
              'Solo cliente',
              'Únicamente hora'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se debe actualizar el inventario de materiales?',
            options: [
              'Diariamente',
              'Semanalmente',
              'Mensualmente',
              'Cuando se agote'
            ],
            correctAnswer: 0
          },
          {
            text: '¿Cuál es el procedimiento para cambios en pedidos confirmados?',
            options: [
              'Aceptar automáticamente',
              'Evaluar factibilidad y confirmar por escrito',
              'Rechazar siempre',
              'Solo cambios menores'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué registros se deben mantener de la producción diaria?',
            options: [
              'Solo volumen total',
              'Volumen, diseños, clientes y observaciones',
              'Solo clientes',
              'Únicamente problemas'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es el tiempo máximo de crédito estándar para clientes?',
            options: [
              '15 días',
              '30 días',
              '45 días',
              '60 días'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué se debe verificar antes de autorizar un pedido?',
            options: [
              'Solo disponibilidad de material',
              'Crédito, capacidad y especificaciones técnicas',
              'Solo el crédito',
              'Únicamente la fecha'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se debe revisar la cartera de clientes?',
            options: [
              'Diariamente',
              'Semanalmente',
              'Mensualmente',
              'Trimestralmente'
            ],
            correctAnswer: 2
          },
          {
            text: '¿Qué documentos se requieren para facturación?',
            options: [
              'Solo remisión',
              'Remisión firmada y orden de compra',
              'Solo orden de compra',
              'Únicamente datos del cliente'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es el procedimiento para devoluciones de concreto?',
            options: [
              'Aceptar siempre',
              'Evaluar causas y determinar responsabilidad',
              'Rechazar siempre',
              'Solo si es culpa de la planta'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué información debe contener el reporte de ventas diario?',
            options: [
              'Solo volumen',
              'Volumen, clientes, diseños e ingresos',
              'Solo ingresos',
              'Únicamente clientes'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Con qué frecuencia se debe actualizar la lista de precios?',
            options: [
              'Mensualmente',
              'Según variación de costos',
              'Anualmente',
              'Nunca'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué se debe hacer con las quejas de clientes?',
            options: [
              'Ignorarlas',
              'Registrar, investigar y dar seguimiento',
              'Solo registrar',
              'Transferir a otro departamento'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Cuál es el tiempo máximo para entregar certificados de calidad?',
            options: [
              '24 horas',
              '48 horas',
              '72 horas',
              '1 semana'
            ],
            correctAnswer: 1
          }
        ]
      }
    ]
  },
  laboratorista: {
    title: 'Laboratorista',
    icon: UserCheck,
    sections: [
      {
        title: 'Control de calidad',
        questions: [
          {
            text: '¿Cuál es la frecuencia mínima para realizar pruebas de revenimiento?',
            options: [
              'Cada bachada',
              'Cada 10 m³',
              'Una vez por día',
              'Solo cuando el cliente lo solicite'
            ],
            correctAnswer: 1
          },
          {
            text: '¿Qué resistencia debe alcanzar el concreto a los 7 días?',
            options: [
              '50% de f\'c',
              '65% de f\'c',
              '75% de f\'c',
              '90% de f\'c'
            ],
            correctAnswer: 2
          }
          // ... más preguntas para laboratorista
        ]
      }
      // ... más secciones para laboratorista
    ]
  },
  operador_camion: {
    title: 'Operador de camión revolvedor',
    icon: UserCheck,
    sections: [
      {
        title: 'Operación del vehículo',
        questions: [
          {
            text: '¿Cuál es la velocidad máxima recomendada para el tambor durante el transporte?',
            options: [
              '2-4 RPM',
              '6-8 RPM',
              '10-12 RPM',
              '15-20 RPM'
            ],
            correctAnswer: 0
          }
          // ... más preguntas para operador de camión
        ]
      }
      // ... más secciones para operador de camión
    ]
  },
  operador_bombas: {
    title: 'Operador de bombas de concreto',
    icon: UserCheck,
    sections: [
      {
        title: 'Operación de bombas',
        questions: [
          {
            text: '¿Cuál es la presión máxima de trabajo de una bomba de concreto estándar?',
            options: [
              '50 bar',
              '80 bar',
              '120 bar',
              '200 bar'
            ],
            correctAnswer: 2
          }
          // ... más preguntas para operador de bombas
        ]
      }
      // ... más secciones para operador de bombas
    ]
  }
};

// Evaluación de estado de planta (Operación)
const plantStatusEvaluation = {
  title: 'Evaluación del Estado de la Planta',
  icon: ClipboardCheck,
  sections: [
    {
      title: 'Estado de Equipos Principales',
      items: [
        { name: 'Mezcladora principal', status: null },
        { name: 'Básculas de cemento', status: null },
        { name: 'Básculas de agregados', status: null },
        { name: 'Sistema de agua', status: null },
        { name: 'Bandas transportadoras', status: null },
        { name: 'Silos de cemento', status: null },
        { name: 'Compresor de aire', status: null },
        { name: 'Sistema eléctrico', status: null },
        { name: 'Tolvas de agregados', status: null },
        { name: 'Sistema de control', status: null }
      ]
    },
    {
      title: 'Infraestructura y Seguridad',
      items: [
        { name: 'Señalización de seguridad', status: null },
        { name: 'Extintores', status: null },
        { name: 'Botiquín de primeros auxilios', status: null },
        { name: 'Iluminación general', status: null },
        { name: 'Drenajes y desagües', status: null },
        { name: 'Accesos y vialidades', status: null },
        { name: 'Área de laboratorio', status: null },
        { name: 'Oficinas administrativas', status: null },
        { name: 'Almacén de materiales', status: null },
        { name: 'Cerca perimetral', status: null }
      ]
    },
    {
      title: 'Documentación y Certificaciones',
      items: [
        { name: 'Licencias de operación', status: null },
        { name: 'Certificados de calidad', status: null },
        { name: 'Manuales de operación', status: null },
        { name: 'Registros de mantenimiento', status: null },
        { name: 'Bitácoras de producción', status: null },
        { name: 'Certificados de calibración', status: null },
        { name: 'Pólizas de seguro', status: null },
        { name: 'Permisos ambientales', status: null },
        { name: 'Capacitación del personal', status: null },
        { name: 'Procedimientos de emergencia', status: null }
      ]
    }
  ]
};

const evaluationDataConfig = {
  personal: {
    title: 'Evaluación de Personal',
    icon: Users,
    roles: [
      { id: 'jefe_planta', name: 'Jefe de Planta' },
      { id: 'laboratorista', name: 'Laboratorista' },
      { id: 'operador_camion', name: 'Operador de camión revolvedor' },
      { id: 'operador_bombas', name: 'Operador de bombas de concreto' }
    ],
  },
  equipo: {
    title: 'Evaluación de Equipo',
    icon: Wrench,
    sections: evaluationQuestions.jefe_planta.sections
  },
  operacion: {
    title: 'Evaluación del Estado de la Planta',
    icon: Settings,
    isPlantStatus: true,
    data: plantStatusEvaluation
  }
};

// Función para obtener 10 preguntas aleatorias de una sección
const getRandomQuestions = (questions, count = 10) => {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, questions.length));
};

const EvaluationScreen = ({ evaluationType, onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [randomizedQuestions, setRandomizedQuestions] = useState({});
  const [plantStatusAnswers, setPlantStatusAnswers] = useState({});

  const config = evaluationDataConfig[evaluationType];
  let currentEvaluationData;

  if (evaluationType === 'personal' && selectedRole) {
    currentEvaluationData = evaluationQuestions[selectedRole];
  } else if (evaluationType === 'operacion') {
    currentEvaluationData = config.data;
  } else if (evaluationType !== 'personal') {
    currentEvaluationData = config;
  } else {
    currentEvaluationData = config;
  }

  const totalSections = currentEvaluationData?.sections?.length || 0;
  const currentSectionData = currentEvaluationData?.sections?.[currentSection];

  // Obtener preguntas aleatorias para la sección actual (solo para cuestionarios)
  const getCurrentSectionQuestions = () => {
    if (!currentSectionData || evaluationType === 'operacion') return [];
    
    const sectionKey = `${selectedRole || evaluationType}-${currentSection}`;
    
    if (!randomizedQuestions[sectionKey]) {
      const randomQuestions = getRandomQuestions(currentSectionData.questions, 10);
      setRandomizedQuestions(prev => ({
        ...prev,
        [sectionKey]: randomQuestions
      }));
      return randomQuestions;
    }
    
    return randomizedQuestions[sectionKey];
  };

  const currentQuestions = getCurrentSectionQuestions();

  const progress = totalSections > 0 
    ? ((currentSection + 1) / totalSections) * 100
    : 0;

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedRole || evaluationType}-${currentSection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const handlePlantStatusAnswer = (itemIndex, status) => {
    const key = `${currentSection}-${itemIndex}`;
    setPlantStatusAnswers(prev => ({ ...prev, [key]: status }));
  };

  const handleNextSection = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      // Completar evaluación
      if (evaluationType === 'operacion') {
        // Calcular puntuación para evaluación de estado de planta
        const totalItems = Object.keys(plantStatusAnswers).length;
        let score = 0;
        
        Object.values(plantStatusAnswers).forEach(status => {
          if (status === 'bueno') score += 10;
          else if (status === 'regular') score += 5;
          // 'malo' = 0 puntos
        });

        onComplete({
          answers: plantStatusAnswers,
          score: Math.round(score),
          totalAnswers: totalItems,
          evaluationTitle: currentEvaluationData.title,
          sections: currentEvaluationData.sections,
          isPlantStatus: true
        });
      } else {
        // Calcular puntuación para cuestionarios
        const totalAnswerCount = Object.keys(answers).length;
        let score = 0;
        let correctAnswers = 0;
        
        // Calcular respuestas correctas
        Object.entries(answers).forEach(([key, selectedOptionIndex]) => {
          const [roleOrType, sectionIndex, questionIndex] = key.split('-');
          const sectionKey = `${roleOrType}-${sectionIndex}`;
          const questions = randomizedQuestions[sectionKey];
          
          if (questions && questions[questionIndex]) {
            const question = questions[questionIndex];
            if (question.correctAnswer === selectedOptionIndex) {
              correctAnswers++;
              score += 10;
            }
          }
        });

        onComplete({
          answers,
          score: Math.round(score),
          totalAnswers: totalAnswerCount,
          correctAnswers,
          evaluationTitle: currentEvaluationData.title,
          sections: currentEvaluationData.sections.map((sec, secIndex) => ({
            title: sec.title,
            questions: randomizedQuestions[`${selectedRole || evaluationType}-${secIndex}`] || []
          }))
        });
      }
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setCurrentSection(0);
    setAnswers({});
    setRandomizedQuestions({});
    setEvaluationStarted(true);
  };

  const MainIcon = config.icon;

  // Pantalla de selección de roles
  if (evaluationType === 'personal' && !evaluationStarted) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-4">
            {config.roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handleRoleSelect(role.id)}
                  className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-gray-800 font-medium">{role.name}</span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <img
          src="/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  // Iniciar evaluación de operación directamente
  if (evaluationType === 'operacion' && !evaluationStarted) {
    setEvaluationStarted(true);
  }

  if (!currentEvaluationData || !currentEvaluationData.sections || currentEvaluationData.sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
        <Building2 size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron preguntas para esta selección.</p>
        <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
        </Button>
      </div>
    );
  }

  // Verificar si todas las preguntas/items de la sección actual han sido respondidas
  const allQuestionsAnswered = evaluationType === 'operacion' 
    ? currentSectionData?.items?.every((_, index) => {
        const key = `${currentSection}-${index}`;
        return plantStatusAnswers[key] !== undefined;
      })
    : currentQuestions.every((_, index) => {
        const key = `${selectedRole || evaluationType}-${currentSection}-${index}`;
        return answers[key] !== undefined;
      });

  // Pantalla de evaluación
  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Botón de desarrollo para saltar a resultados - solo en primera sección y no en operación */}
        {currentSection === 0 && evaluationType !== 'operacion' && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={onSkipToResults}
              variant="outline"
              size="sm"
              className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Saltar a Resultados (Dev)</span>
            </Button>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {currentEvaluationData.title}
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="flex h-full">
              {Array.from({ length: totalSections }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < currentSection ? 'bg-blue-600' :
                    i === currentSection ? 'bg-blue-400' : 'bg-gray-300'} 
                    ${i < totalSections - 1 ? 'mr-1' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
              {/* Header de la sección */}
              <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 text-center">
                  {currentSectionData?.title}
                </h2>
              </div>

              {/* Contenido */}
              <div className="p-6">
                {evaluationType === 'operacion' ? (
                  // Evaluación de estado de planta
                  <div className="space-y-4">
                    {currentSectionData?.items?.map((item, index) => {
                      const key = `${currentSection}-${index}`;
                      const selectedStatus = plantStatusAnswers[key];

                      return (
                        <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-800 mb-3">
                            {index + 1}. {item.name}
                          </h3>
                          
                          <div className="flex space-x-4">
                            {[
                              { value: 'bueno', label: 'Bueno', color: 'bg-green-500 hover:bg-green-600' },
                              { value: 'regular', label: 'Regular', color: 'bg-yellow-500 hover:bg-yellow-600' },
                              { value: 'malo', label: 'Malo', color: 'bg-red-500 hover:bg-red-600' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handlePlantStatusAnswer(index, option.value)}
                                className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                                  selectedStatus === option.value 
                                    ? option.color + ' ring-2 ring-offset-2 ring-gray-400'
                                    : option.color
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Cuestionario normal
                  <div className="space-y-6">
                    {currentQuestions.map((question, index) => {
                      const key = `${selectedRole || evaluationType}-${currentSection}-${index}`;
                      const selectedAnswer = answers[key];

                      return (
                        <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-800 mb-4">
                            {index + 1}. {question.text}
                          </h3>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={optionIndex}
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                  selectedAnswer === optionIndex
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={optionIndex}
                                  checked={selectedAnswer === optionIndex}
                                  onChange={() => handleAnswer(index, optionIndex)}
                                  className="mr-3 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Botón para continuar */}
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleNextSection}
                    disabled={!allQuestionsAnswered}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentSection < totalSections - 1 ? 'Siguiente Sección' : 'Finalizar Evaluación'}
                  </Button>
                </div>

                {/* Contador de secciones */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  Sección {currentSection + 1} de {totalSections}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <img
        src="/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
      />
    </div>
  );
};

export default EvaluationScreen;