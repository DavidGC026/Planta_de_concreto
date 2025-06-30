import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Settings, Zap, Loader2, BarChart3, Save, ChevronRight, Building2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  // Estados principales del flujo
  const [currentStep, setCurrentStep] = useState('plantType'); // 'plantType' -> 'sectionSelection' -> 'subsectionEvaluation'
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubsection, setSelectedSubsection] = useState(null);
  const [currentSubsectionIndex, setCurrentSubsectionIndex] = useState(0);
  
  // Estados de datos
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [subsectionProgress, setSubsectionProgress] = useState({});
  const [showStats, setShowStats] = useState(false);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Configuración de tipos de planta
  const plantTypes = [
    { id: 'pequena', name: 'Planta Pequeña', description: 'Hasta 30 m³/h' },
    { id: 'mediana', name: 'Planta Mediana', description: '30-60 m³/h' },
    { id: 'grande', name: 'Planta Grande', description: 'Más de 60 m³/h' }
  ];

  useEffect(() => {
    // Cargar datos de evaluación cuando se selecciona tipo de planta
    if (selectedPlantType && currentStep === 'sectionSelection') {
      loadEvaluationData();
    }
  }, [selectedPlantType, currentStep]);

  // Scroll al inicio cuando cambia el paso
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentStep, selectedSection, currentSubsectionIndex]);

  // Cargar progreso guardado
  useEffect(() => {
    if (selectedPlantType && evaluationData) {
      loadSavedProgress();
    }
  }, [selectedPlantType, evaluationData]);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      
      const data = await apiService.getPreguntas({
        tipo: 'equipo',
        tipoPlanta: selectedPlantType
      });
      
      console.log('Datos de evaluación cargados:', data);
      setEvaluationData(data);
      
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los datos de evaluación"
      });
      
      // Fallback a datos predefinidos
      setEvaluationData(generateFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackData = () => {
    return {
      title: 'Evaluación de Equipo',
      secciones: [
        {
          id: 'produccion_mezclado',
          nombre: 'Producción y mezclado',
          ponderacion: 19.90,
          subsecciones: [
            {
              id: 'mezcladora_principal',
              nombre: 'Mezcladora Principal',
              ponderacion_subseccion: 3.32,
              preguntas: [
                { id: 1, pregunta: '¿La mezcladora principal se encuentra estructuralmente íntegra, sin fugas, grietas visibles ni desgaste severo en las paletas?', tipo_pregunta: 'abierta' },
                { id: 2, pregunta: '¿Los motores de la mezcladora operan sin vibraciones anormales, sobrecalentamiento o ruidos extraños?', tipo_pregunta: 'abierta' },
                { id: 3, pregunta: '¿El sistema de transmisión (reductores, acoplamientos) funciona correctamente sin fugas de aceite?', tipo_pregunta: 'abierta' },
                { id: 4, pregunta: '¿Las paletas mezcladoras mantienen la geometría adecuada y están firmemente sujetas?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistema_dosificacion',
              nombre: 'Sistema de Dosificación',
              ponderacion_subseccion: 3.32,
              preguntas: [
                { id: 5, pregunta: '¿Las básculas de cemento están calibradas y funcionan con precisión?', tipo_pregunta: 'abierta' },
                { id: 6, pregunta: '¿Las básculas de agregados pesan correctamente y están libres de obstrucciones?', tipo_pregunta: 'abierta' },
                { id: 7, pregunta: '¿El sistema de dosificación de agua funciona con precisión y sin fugas?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'bandas_transportadoras',
              nombre: 'Bandas Transportadoras',
              ponderacion_subseccion: 3.32,
              preguntas: [
                { id: 8, pregunta: '¿Las bandas transportadoras están en buen estado, sin roturas ni desgaste excesivo?', tipo_pregunta: 'abierta' },
                { id: 9, pregunta: '¿Los motores y reductores de las bandas operan correctamente?', tipo_pregunta: 'abierta' },
                { id: 10, pregunta: '¿Los sistemas de limpieza de bandas funcionan adecuadamente?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'tolvas_silos',
              nombre: 'Tolvas y Silos',
              ponderacion_subseccion: 3.32,
              preguntas: [
                { id: 11, pregunta: '¿Las tolvas de agregados están estructuralmente íntegras y libres de obstrucciones?', tipo_pregunta: 'abierta' },
                { id: 12, pregunta: '¿Los silos de cemento mantienen su integridad estructural y sistemas de descarga?', tipo_pregunta: 'abierta' },
                { id: 13, pregunta: '¿Los sistemas de vibración y fluidización funcionan correctamente?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistema_agua',
              nombre: 'Sistema de Agua',
              ponderacion_subseccion: 3.32,
              preguntas: [
                { id: 14, pregunta: '¿El sistema de suministro de agua mantiene presión y caudal adecuados?', tipo_pregunta: 'abierta' },
                { id: 15, pregunta: '¿Los tanques de agua están limpios y en buen estado?', tipo_pregunta: 'abierta' },
                { id: 16, pregunta: '¿El sistema de dosificación de aditivos funciona correctamente?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistema_control',
              nombre: 'Sistema de Control',
              ponderacion_subseccion: 3.32,
              preguntas: [
                { id: 17, pregunta: '¿El sistema de control automatizado responde correctamente a los comandos?', tipo_pregunta: 'abierta' },
                { id: 18, pregunta: '¿Los sensores y dispositivos de medición están calibrados y funcionando?', tipo_pregunta: 'abierta' },
                { id: 19, pregunta: '¿El software de control está actualizado y libre de errores?', tipo_pregunta: 'abierta' }
              ]
            }
          ]
        },
        {
          id: 'transporte_entrega',
          nombre: 'Transporte y entrega',
          ponderacion: 12.04,
          subsecciones: [
            {
              id: 'camiones_revolvedores',
              nombre: 'Camiones Revolvedores',
              ponderacion_subseccion: 3.01,
              preguntas: [
                { id: 20, pregunta: '¿Los tambores de los camiones están en buen estado estructural?', tipo_pregunta: 'abierta' },
                { id: 21, pregunta: '¿Los sistemas hidráulicos de los camiones funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 22, pregunta: '¿Las paletas internas del tambor están completas y bien fijadas?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'bombas_concreto',
              nombre: 'Bombas de Concreto',
              ponderacion_subseccion: 3.01,
              preguntas: [
                { id: 23, pregunta: '¿Las bombas de concreto operan sin fugas ni obstrucciones?', tipo_pregunta: 'abierta' },
                { id: 24, pregunta: '¿Los sistemas de limpieza de bombas funcionan adecuadamente?', tipo_pregunta: 'abierta' },
                { id: 25, pregunta: '¿Las mangueras y tuberías están en buen estado?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistemas_carga',
              nombre: 'Sistemas de Carga',
              ponderacion_subseccion: 3.01,
              preguntas: [
                { id: 26, pregunta: '¿Los sistemas de carga de camiones funcionan eficientemente?', tipo_pregunta: 'abierta' },
                { id: 27, pregunta: '¿Las tolvas de descarga están libres de obstrucciones?', tipo_pregunta: 'abierta' },
                { id: 28, pregunta: '¿Los controles de carga responden correctamente?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_limpieza',
              nombre: 'Equipos de Limpieza',
              ponderacion_subseccion: 3.01,
              preguntas: [
                { id: 29, pregunta: '¿Los equipos de lavado de camiones funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 30, pregunta: '¿Los sistemas de reciclaje de agua operan adecuadamente?', tipo_pregunta: 'abierta' },
                { id: 31, pregunta: '¿Las instalaciones de limpieza están en buen estado?', tipo_pregunta: 'abierta' }
              ]
            }
          ]
        },
        {
          id: 'control_calidad',
          nombre: 'Control de calidad',
          ponderacion: 18.50,
          subsecciones: [
            {
              id: 'equipos_laboratorio',
              nombre: 'Equipos de Laboratorio',
              ponderacion_subseccion: 3.70,
              preguntas: [
                { id: 32, pregunta: '¿Las prensas de laboratorio están calibradas y funcionando?', tipo_pregunta: 'abierta' },
                { id: 33, pregunta: '¿Las balanzas de precisión están calibradas?', tipo_pregunta: 'abierta' },
                { id: 34, pregunta: '¿Los equipos de ensayo están en buen estado?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'instrumentos_medicion',
              nombre: 'Instrumentos de Medición',
              ponderacion_subseccion: 3.70,
              preguntas: [
                { id: 35, pregunta: '¿Los instrumentos de medición están calibrados?', tipo_pregunta: 'abierta' },
                { id: 36, pregunta: '¿Los medidores de humedad funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 37, pregunta: '¿Los termómetros están calibrados y funcionando?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_muestreo',
              nombre: 'Equipos de Muestreo',
              ponderacion_subseccion: 3.70,
              preguntas: [
                { id: 38, pregunta: '¿Los equipos para toma de muestras están disponibles?', tipo_pregunta: 'abierta' },
                { id: 39, pregunta: '¿Los contenedores de muestras están limpios?', tipo_pregunta: 'abierta' },
                { id: 40, pregunta: '¿Los equipos de muestreo están calibrados?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistemas_curado',
              nombre: 'Sistemas de Curado',
              ponderacion_subseccion: 3.70,
              preguntas: [
                { id: 41, pregunta: '¿Las cámaras húmedas mantienen condiciones adecuadas?', tipo_pregunta: 'abierta' },
                { id: 42, pregunta: '¿Los sistemas de control de temperatura funcionan?', tipo_pregunta: 'abierta' },
                { id: 43, pregunta: '¿Los sistemas de humedad están operativos?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_pruebas',
              nombre: 'Equipos de Pruebas',
              ponderacion_subseccion: 3.70,
              preguntas: [
                { id: 44, pregunta: '¿Los equipos para pruebas específicas están disponibles?', tipo_pregunta: 'abierta' },
                { id: 45, pregunta: '¿Los equipos de ensayo están calibrados?', tipo_pregunta: 'abierta' },
                { id: 46, pregunta: '¿Los instrumentos de medición están funcionando?', tipo_pregunta: 'abierta' }
              ]
            }
          ]
        },
        {
          id: 'mantenimiento',
          nombre: 'Mantenimiento',
          ponderacion: 15.20,
          subsecciones: [
            {
              id: 'herramientas_mantenimiento',
              nombre: 'Herramientas de Mantenimiento',
              ponderacion_subseccion: 3.80,
              preguntas: [
                { id: 47, pregunta: '¿Las herramientas de mantenimiento están disponibles?', tipo_pregunta: 'abierta' },
                { id: 48, pregunta: '¿Las herramientas están en buen estado?', tipo_pregunta: 'abierta' },
                { id: 49, pregunta: '¿Se cuenta con repuestos básicos?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_diagnostico',
              nombre: 'Equipos de Diagnóstico',
              ponderacion_subseccion: 3.80,
              preguntas: [
                { id: 50, pregunta: '¿Los equipos de diagnóstico están disponibles?', tipo_pregunta: 'abierta' },
                { id: 51, pregunta: '¿Los instrumentos de medición funcionan?', tipo_pregunta: 'abierta' },
                { id: 52, pregunta: '¿Se cuenta con equipos de análisis?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistemas_lubricacion',
              nombre: 'Sistemas de Lubricación',
              ponderacion_subseccion: 3.80,
              preguntas: [
                { id: 53, pregunta: '¿Los sistemas de lubricación automática funcionan?', tipo_pregunta: 'abierta' },
                { id: 54, pregunta: '¿Se cuenta con lubricantes adecuados?', tipo_pregunta: 'abierta' },
                { id: 55, pregunta: '¿Los sistemas de distribución están operativos?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_soldadura',
              nombre: 'Equipos de Soldadura',
              ponderacion_subseccion: 3.80,
              preguntas: [
                { id: 56, pregunta: '¿Los equipos de soldadura están disponibles?', tipo_pregunta: 'abierta' },
                { id: 57, pregunta: '¿Los equipos de soldadura funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 58, pregunta: '¿Se cuenta con materiales de soldadura?', tipo_pregunta: 'abierta' }
              ]
            }
          ]
        },
        {
          id: 'seguridad_ambiente',
          nombre: 'Seguridad y medio ambiente',
          ponderacion: 20.36,
          subsecciones: [
            {
              id: 'equipos_incendios',
              nombre: 'Equipos Contra Incendios',
              ponderacion_subseccion: 3.39,
              preguntas: [
                { id: 59, pregunta: '¿Los extintores están en buen estado y vigentes?', tipo_pregunta: 'abierta' },
                { id: 60, pregunta: '¿Los sistemas contra incendios funcionan?', tipo_pregunta: 'abierta' },
                { id: 61, pregunta: '¿Las alarmas de incendio están operativas?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_proteccion',
              nombre: 'Equipos de Protección Personal',
              ponderacion_subseccion: 3.39,
              preguntas: [
                { id: 62, pregunta: '¿Se cuenta con EPP suficiente y en buen estado?', tipo_pregunta: 'abierta' },
                { id: 63, pregunta: '¿Los equipos de seguridad están disponibles?', tipo_pregunta: 'abierta' },
                { id: 64, pregunta: '¿Los EPP cumplen con las normas?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'control_polvo',
              nombre: 'Control de Polvo',
              ponderacion_subseccion: 3.39,
              preguntas: [
                { id: 65, pregunta: '¿Los sistemas de control de polvo funcionan?', tipo_pregunta: 'abierta' },
                { id: 66, pregunta: '¿Los filtros están en buen estado?', tipo_pregunta: 'abierta' },
                { id: 67, pregunta: '¿Los sistemas de aspersión operan correctamente?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'tratamiento_aguas',
              nombre: 'Tratamiento de Aguas',
              ponderacion_subseccion: 3.39,
              preguntas: [
                { id: 68, pregunta: '¿Los sistemas de tratamiento de aguas funcionan?', tipo_pregunta: 'abierta' },
                { id: 69, pregunta: '¿Las plantas de tratamiento están operativas?', tipo_pregunta: 'abierta' },
                { id: 70, pregunta: '¿Los sistemas de reciclaje funcionan?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistemas_emergencia',
              nombre: 'Sistemas de Emergencia',
              ponderacion_subseccion: 3.39,
              preguntas: [
                { id: 71, pregunta: '¿Los sistemas de alarma funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 72, pregunta: '¿Los sistemas de emergencia están operativos?', tipo_pregunta: 'abierta' },
                { id: 73, pregunta: '¿Las rutas de evacuación están señalizadas?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'monitoreo_ambiental',
              nombre: 'Monitoreo Ambiental',
              ponderacion_subseccion: 3.39,
              preguntas: [
                { id: 74, pregunta: '¿Los equipos de monitoreo ambiental funcionan?', tipo_pregunta: 'abierta' },
                { id: 75, pregunta: '¿Los sensores ambientales están calibrados?', tipo_pregunta: 'abierta' },
                { id: 76, pregunta: '¿Los sistemas de medición están operativos?', tipo_pregunta: 'abierta' }
              ]
            }
          ]
        },
        {
          id: 'gestion_administracion',
          nombre: 'Gestión y administración',
          ponderacion: 14.00,
          subsecciones: [
            {
              id: 'sistemas_informaticos',
              nombre: 'Sistemas Informáticos',
              ponderacion_subseccion: 3.50,
              preguntas: [
                { id: 77, pregunta: '¿Los sistemas informáticos funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 78, pregunta: '¿El software está actualizado?', tipo_pregunta: 'abierta' },
                { id: 79, pregunta: '¿Los sistemas de respaldo funcionan?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_comunicacion',
              nombre: 'Equipos de Comunicación',
              ponderacion_subseccion: 3.50,
              preguntas: [
                { id: 80, pregunta: '¿Los equipos de comunicación funcionan?', tipo_pregunta: 'abierta' },
                { id: 81, pregunta: '¿Los sistemas de telecomunicaciones están operativos?', tipo_pregunta: 'abierta' },
                { id: 82, pregunta: '¿Los radios y teléfonos funcionan correctamente?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'sistemas_pesaje',
              nombre: 'Sistemas de Pesaje',
              ponderacion_subseccion: 3.50,
              preguntas: [
                { id: 83, pregunta: '¿Las básculas de camiones están calibradas?', tipo_pregunta: 'abierta' },
                { id: 84, pregunta: '¿Los sistemas de pesaje funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 85, pregunta: '¿Los indicadores de peso están operativos?', tipo_pregunta: 'abierta' }
              ]
            },
            {
              id: 'equipos_oficina',
              nombre: 'Equipos de Oficina',
              ponderacion_subseccion: 3.50,
              preguntas: [
                { id: 86, pregunta: '¿Los equipos de oficina están en buen estado?', tipo_pregunta: 'abierta' },
                { id: 87, pregunta: '¿Las computadoras funcionan correctamente?', tipo_pregunta: 'abierta' },
                { id: 88, pregunta: '¿Los equipos de impresión están operativos?', tipo_pregunta: 'abierta' }
              ]
            }
          ]
        }
      ]
    };
  };

  const loadSavedProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progressData = await apiService.getProgresoSecciones({
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        tipo_planta: selectedPlantType
      });

      if (progressData.progreso_secciones && progressData.progreso_secciones.length > 0) {
        const savedProgress = {};
        progressData.progreso_secciones.forEach(progress => {
          const key = `${progress.seccion_orden - 1}`;
          savedProgress[key] = {
            completed: true,
            score: progress.puntaje_porcentaje,
            correctAnswers: progress.respuestas_correctas,
            totalQuestions: progress.total_preguntas
          };
        });
        setSubsectionProgress(savedProgress);

        toast({
          title: "📊 Progreso cargado",
          description: `Se encontró progreso previo para ${selectedPlantType}`
        });
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

  const generateSimulatedEquipmentEvaluation = () => {
    const simulatedAnswers = {};
    let totalQuestions = 0;
    let correctAnswers = 0;

    const sectionsToUse = evaluationData?.secciones || generateFallbackData().secciones;

    sectionsToUse.forEach((seccion, sectionIndex) => {
      if (seccion.subsecciones && seccion.subsecciones.length > 0) {
        seccion.subsecciones.forEach((subseccion, subsectionIndex) => {
          subseccion.preguntas?.forEach((pregunta, questionIndex) => {
            const key = `${selectedPlantType}-${sectionIndex}-${subsectionIndex}-${questionIndex}`;
            
            const randomValue = Math.random();
            let answer;
            
            if (randomValue < 0.75) {
              answer = 'si';
              correctAnswers++;
            } else if (randomValue < 0.95) {
              answer = 'no';
            } else {
              answer = 'na';
            }
            
            simulatedAnswers[key] = answer;
            totalQuestions++;
          });
        });
      }
    });

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Equipo Simulada - ${selectedPlantType}`,
      sections: sectionsToUse,
      isEquipmentEvaluation: true,
      isSimulated: true,
      plantType: selectedPlantType
    };
  };

  const handleSkipToResults = () => {
    try {
      const simulatedResults = generateSimulatedEquipmentEvaluation();
      
      toast({
        title: "🎯 Evaluación de Equipo Simulada",
        description: "Se ha generado una evaluación con respuestas aleatorias para demostración"
      });

      onComplete(simulatedResults);
    } catch (error) {
      console.error('Error generating simulated equipment evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo generar la evaluación simulada"
      });
    }
  };

  // Manejar selección de tipo de planta
  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setCurrentStep('sectionSelection');
    setAnswers({});
    setSubsectionProgress({});
  };

  // Manejar selección de sección
  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setCurrentSubsectionIndex(0);
    setCurrentStep('subsectionEvaluation');
  };

  // Manejar respuesta a pregunta
  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedPlantType}-${selectedSection.id}-${currentSubsectionIndex}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  // Guardar progreso de subsección actual
  const saveCurrentSubsectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSubsection = selectedSection.subsecciones[currentSubsectionIndex];
      if (!currentSubsection) return;
      
      let subsectionScore = 0;
      let correctAnswers = 0;
      let totalQuestions = 0;

      currentSubsection.preguntas?.forEach((question, qIndex) => {
        const key = `${selectedPlantType}-${selectedSection.id}-${currentSubsectionIndex}-${qIndex}`;
        const answer = answers[key];
        
        if (answer) {
          totalQuestions++;
          if (answer === 'si') {
            subsectionScore += 10;
            correctAnswers++;
          }
        }
      });

      const subsectionPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      await apiService.guardarProgresoSeccion({
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        seccion_nombre: currentSubsection.nombre,
        seccion_orden: currentSubsectionIndex + 1,
        puntaje_seccion: subsectionScore,
        puntaje_porcentaje: subsectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        tipo_planta: selectedPlantType
      });

      const progressKey = `${selectedSection.id}-${currentSubsectionIndex}`;
      setSubsectionProgress(prev => ({
        ...prev,
        [progressKey]: {
          completed: true,
          score: subsectionPercentage,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions
        }
      }));

      toast({
        title: "💾 Progreso guardado",
        description: `Subsección "${currentSubsection.nombre}" guardada exitosamente`
      });

    } catch (error) {
      console.error('Error saving subsection progress:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso de la subsección"
      });
    }
  };

  // Continuar a siguiente subsección o completar evaluación
  const handleNextSubsection = async () => {
    await saveCurrentSubsectionProgress();

    if (currentSubsectionIndex < selectedSection.subsecciones.length - 1) {
      setCurrentSubsectionIndex(prev => prev + 1);
    } else {
      // Verificar si todas las secciones están completas
      const allSectionsCompleted = evaluationData?.secciones?.every(section => 
        section.subsecciones?.every((_, subIndex) => {
          const progressKey = `${section.id}-${subIndex}`;
          return subsectionProgress[progressKey]?.completed;
        })
      );

      if (allSectionsCompleted) {
        await completeEvaluation();
      } else {
        // Volver a selección de secciones
        setCurrentStep('sectionSelection');
        setSelectedSection(null);
        setCurrentSubsectionIndex(0);
      }
    }
  };

  // Completar evaluación completa
  const completeEvaluation = async () => {
    try {
      setLoading(true);

      const user = apiService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      let totalScore = 0;
      let totalQuestions = 0;
      let correctAnswers = 0;

      Object.entries(answers).forEach(([key, selectedAnswer]) => {
        if (selectedAnswer) {
          totalQuestions++;
          if (selectedAnswer === 'si') {
            totalScore += 10;
            correctAnswers++;
          }
        }
      });

      const finalPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        rol_personal: null,
        respuestas: Object.entries(answers).map(([key, selectedAnswer]) => {
          return {
            pregunta_id: null,
            respuesta: selectedAnswer,
            observacion: `Equipo: ${selectedPlantType} - Pregunta: ${key}`
          };
        }),
        observaciones: `Evaluación de equipo completada - Tipo: ${selectedPlantType}`
      };

      const result = await apiService.guardarEvaluacion(evaluacionData);

      onComplete({
        answers,
        score: Math.round(result.puntuacion_ponderada || finalPercentage),
        totalAnswers: totalQuestions,
        correctAnswers: correctAnswers,
        evaluationTitle: `Evaluación de Equipo - ${selectedPlantType}`,
        sections: evaluationData?.secciones || [],
        isEquipmentEvaluation: true,
        plantType: selectedPlantType
      });

      toast({
        title: "✅ Evaluación completada",
        description: "Los resultados han sido guardados exitosamente"
      });

    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "❌ Error",
        description: `No se pudo guardar la evaluación: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {currentStep === 'subsectionEvaluation' ? 'Guardando evaluación de equipo...' : 'Cargando datos de evaluación...'}
          </p>
        </div>
      </div>
    );
  }

  // PASO 1: Selección de tipo de planta
  if (currentStep === 'plantType') {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Equipo</h2>
              <p className="text-white/80">Selecciona el tipo de planta a evaluar</p>
            </div>

            {/* Botón para saltar a resultados simulados */}
            <div className="mb-6 flex justify-center">
              <Button
                onClick={handleSkipToResults}
                variant="outline"
                size="lg"
                className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2 px-6 py-3"
              >
                <Zap className="w-5 h-5" />
                <span>Ver Evaluación Simulada</span>
              </Button>
            </div>

            {/* Selección de tipo de planta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plantTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => handlePlantTypeSelect(type.id)}
                    className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-center border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-gray-800 font-bold text-lg block">{type.name}</span>
                        <span className="text-gray-600 text-sm">{type.description}</span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <img
          src="public/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  // PASO 2: Selección de sección
  if (currentStep === 'sectionSelection') {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8" ref={evaluationContentRef}>
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Equipo - {selectedPlantType}</h2>
              <p className="text-white/80">Selecciona la sección a evaluar</p>
            </div>

            {/* Botón para saltar a resultados simulados */}
            <div className="mb-6 flex justify-center">
              <Button
                onClick={handleSkipToResults}
                variant="outline"
                size="lg"
                className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2 px-6 py-3"
              >
                <Zap className="w-5 h-5" />
                <span>Ver Evaluación Simulada</span>
              </Button>
            </div>

            {/* Lista de secciones */}
            <div className="space-y-4">
              {evaluationData?.secciones?.map((section, index) => {
                const completedSubsections = section.subsecciones?.filter((_, subIndex) => {
                  const progressKey = `${section.id}-${subIndex}`;
                  return subsectionProgress[progressKey]?.completed;
                }).length || 0;

                const totalSubsections = section.subsecciones?.length || 0;
                const isCompleted = completedSubsections === totalSubsections && totalSubsections > 0;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => handleSectionSelect(section)}
                      className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-left border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <Settings className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <span className="text-gray-800 font-bold text-lg block">{section.nombre}</span>
                            <span className="text-gray-600 text-sm">
                              {totalSubsections} subsecciones
                              {completedSubsections > 0 && (
                                <span className="ml-2 text-green-600 font-medium">
                                  ({completedSubsections}/{totalSubsections} completadas)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Botón para volver */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => setCurrentStep('plantType')}
                variant="outline"
                className="bg-white/90 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cambiar Tipo de Planta
              </Button>
            </div>
          </div>
        </div>

        <img
          src="public/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  // PASO 3: Evaluación de subsección
  if (currentStep === 'subsectionEvaluation' && selectedSection) {
    const currentSubsection = selectedSection.subsecciones[currentSubsectionIndex];
    const progressKey = `${selectedSection.id}-${currentSubsectionIndex}`;
    const isSubsectionCompleted = subsectionProgress[progressKey]?.completed;

    if (!currentSubsection) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
          <Settings size={64} className="mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold mb-2">Subsección no encontrada</h1>
          <p className="text-lg mb-6 text-center">No se encontró la subsección solicitada.</p>
          <Button onClick={() => setCurrentStep('sectionSelection')} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Secciones
          </Button>
        </div>
      );
    }

    // Verificar si todas las preguntas de la subsección actual han sido respondidas
    const allQuestionsAnswered = currentSubsection?.preguntas?.every((_, index) => {
      const key = `${selectedPlantType}-${selectedSection.id}-${currentSubsectionIndex}-${index}`;
      return answers[key] !== undefined;
    });

    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8" ref={evaluationContentRef}>
          {/* Barra de progreso */}
          <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedSection.nombre} - {currentSubsection.nombre}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Subsección {currentSubsectionIndex + 1} de {selectedSection.subsecciones.length}
                </span>
                {isSubsectionCompleted && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Guardado ({Math.round(subsectionProgress[progressKey]?.score || 0)}%)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="flex h-full">
                {Array.from({ length: selectedSection.subsecciones.length }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${
                      subsectionProgress[`${selectedSection.id}-${i}`]?.completed ? 'bg-green-600' :
                      i < currentSubsectionIndex ? 'bg-blue-600' :
                      i === currentSubsectionIndex ? 'bg-blue-400' : 'bg-gray-300'
                    } ${i < selectedSection.subsecciones.length - 1 ? 'mr-1' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Panel principal de evaluación */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSubsectionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                  {/* Header de la subsección */}
                  <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 text-center">
                      {currentSubsection.nombre}
                    </h2>
                    {currentSubsection.ponderacion_subseccion && (
                      <div className="text-center text-sm text-gray-600 mt-1">
                        Ponderación: {currentSubsection.ponderacion_subseccion}%
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {currentSubsection?.preguntas?.map((question, index) => {
                        const key = `${selectedPlantType}-${selectedSection.id}-${currentSubsectionIndex}-${index}`;
                        const selectedAnswer = answers[key];

                        return (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">
                              {index + 1}. {question.pregunta}
                            </h3>

                            <div className="space-y-2">
                              <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value="si"
                                  checked={selectedAnswer === 'si'}
                                  onChange={() => handleAnswer(index, 'si')}
                                  className="mr-3 text-green-600 focus:ring-green-500"
                                />
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                <span className="text-gray-700">Sí</span>
                              </label>

                              <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value="no"
                                  checked={selectedAnswer === 'no'}
                                  onChange={() => handleAnswer(index, 'no')}
                                  className="mr-3 text-red-600 focus:ring-red-500"
                                />
                                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                <span className="text-gray-700">No</span>
                              </label>

                              <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value="na"
                                  checked={selectedAnswer === 'na'}
                                  onChange={() => handleAnswer(index, 'na')}
                                  className="mr-3 text-gray-600 focus:ring-gray-500"
                                />
                                <MinusCircle className="w-5 h-5 text-gray-600 mr-2" />
                                <span className="text-gray-700">No Aplica</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-8 flex justify-center space-x-4">
                      {/* Botón para guardar progreso */}
                      <Button
                        onClick={saveCurrentSubsectionProgress}
                        disabled={!allQuestionsAnswered}
                        variant="outline"
                        className="px-6 py-3 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Progreso</span>
                      </Button>

                      {/* Botón para continuar */}
                      <Button
                        onClick={handleNextSubsection}
                        disabled={!allQuestionsAnswered || loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                          {currentSubsectionIndex < selectedSection.subsecciones.length - 1 ? 'Siguiente Subsección' : 'Finalizar Sección'}
                        </span>
                      </Button>
                    </div>

                    {/* Botón para volver a secciones */}
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={() => setCurrentStep('sectionSelection')}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Secciones
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <img
          src="public/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
      <Settings size={64} className="mb-4 text-blue-600" />
      <h1 className="text-3xl font-bold mb-2">Estado no válido</h1>
      <p className="text-lg mb-6 text-center">Ha ocurrido un error en el flujo de evaluación.</p>
      <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
      </Button>
    </div>
  );
};

export default EvaluationScreenEquipo;