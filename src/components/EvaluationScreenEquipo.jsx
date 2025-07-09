import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, ClipboardCheck, BarChart3, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [sectionProgress, setSectionProgress] = useState({});

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    if (!evaluationStarted) {
      // Para evaluación de equipo, no necesitamos cargar roles
    }
  }, []);

  // Scroll al inicio cuando cambia la sección o subsección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentSection, currentSubsection]);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      const params = {
        tipo: 'equipo',
        tipoPlanta: selectedPlantType
      };

      const data = await apiService.getPreguntas(params);
      setEvaluationData(data);
      setEvaluationStarted(true);
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar las preguntas de evaluación"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para generar evaluación simulada
  const generateSimulatedEvaluation = () => {
    const simulatedSections = [
      { nombre: 'Producción y Mezclado', ponderacion: 19.90 },
      { nombre: 'Transporte y Entrega', ponderacion: 12.04 },
      { nombre: 'Control de Calidad', ponderacion: 18.50 },
      { nombre: 'Mantenimiento', ponderacion: 15.20 },
      { nombre: 'Seguridad y Medio Ambiente', ponderacion: 20.36 },
      { nombre: 'Gestión y Administración', ponderacion: 14.00 }
    ];

    const simulatedAnswers = {};
    let totalQuestions = 0;
    let correctAnswers = 0;

    simulatedSections.forEach((section, sectionIndex) => {
      // Generar 6 subsecciones por sección
      for (let subIndex = 0; subIndex < 6; subIndex++) {
        // Generar 3 preguntas por subsección
        for (let qIndex = 0; qIndex < 3; qIndex++) {
          const key = `${sectionIndex}-${subIndex}-${qIndex}`;
          
          // Generar respuesta aleatoria con tendencia hacia respuestas positivas
          const randomValue = Math.random();
          let answer;
          
          if (randomValue < 0.7) { // 70% probabilidad de "si"
            answer = 'si';
            correctAnswers++;
          } else if (randomValue < 0.9) { // 20% probabilidad de "na"
            answer = 'na';
            correctAnswers++; // 'na' también cuenta como correcta para equipo
          } else { // 10% probabilidad de "no"
            answer = 'no';
          }
          
          simulatedAnswers[key] = answer;
          totalQuestions++;
        }
      }
    });

    // Calcular puntuación simulada
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Crear objeto de resultados simulados
    const simulatedResults = {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Equipo Simulada - Planta ${selectedPlantType || 'Mediana'}`,
      sections: simulatedSections.map((section, index) => ({
        ...section,
        subsecciones: Array.from({ length: 6 }, (_, subIndex) => ({
          id: subIndex,
          nombre: `Subsección ${subIndex + 1} de ${section.nombre}`,
          preguntas: Array.from({ length: 3 }, (_, qIndex) => ({
            id: qIndex,
            pregunta: `Pregunta simulada ${qIndex + 1}`,
            tipo_pregunta: 'abierta'
          }))
        }))
      })),
      isEquipmentEvaluation: true,
      isSimulated: true
    };

    return simulatedResults;
  };

  const handleSkipToResults = () => {
    try {
      const simulatedResults = generateSimulatedEvaluation();
      
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

  const handlePlantTypeSelect = async (plantType) => {
    setSelectedPlantType(plantType);
    setCurrentSection(0);
    setCurrentSubsection(0);
    setAnswers({});
    await loadEvaluationData();
  };

  const totalSections = evaluationData?.secciones?.length || 0;
  const currentSectionData = evaluationData?.secciones?.[currentSection];
  const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];

  const progress = totalSections > 0 
    ? ((currentSection + 1) / totalSections) * 100
    : 0;

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${currentSection}-${currentSubsection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const saveCurrentSubsectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      // Calcular progreso de la subsección actual
      const subsectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${currentSection}-${currentSubsection}-`));
      
      let subsectionScore = 0;
      let correctAnswers = 0;
      const totalQuestions = subsectionAnswers.length;
      
      subsectionAnswers.forEach(([, answer]) => {
        if (answer === 'si') {
          subsectionScore += 10;
          correctAnswers++;
        } else if (answer === 'na') {
          subsectionScore += 10; // Para evaluación de equipo, 'na' también vale 10 puntos
          correctAnswers++;
        }
        // 'no' = 0 puntos y no cuenta como correcta
      });

      const subsectionPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Guardar progreso de subsección
      await apiService.guardarProgresoSeccion({
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        seccion_nombre: currentSubsectionData?.nombre || `Subsección ${currentSubsection + 1}`,
        seccion_orden: (currentSection * 100) + currentSubsection + 1, // Orden único para subsecciones
        puntaje_seccion: subsectionScore,
        puntaje_porcentaje: subsectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        tipo_planta: selectedPlantType
      });

    } catch (error) {
      console.error('Error saving subsection progress:', error);
    }
  };

  const handleNextSubsection = async () => {
    // Guardar progreso de la subsección actual
    await saveCurrentSubsectionProgress();

    const totalSubsections = currentSectionData?.subsecciones?.length || 0;
    
    if (currentSubsection < totalSubsections - 1) {
      setCurrentSubsection(prev => prev + 1);
    } else {
      // Pasar a la siguiente sección
      if (currentSection < totalSections - 1) {
        setCurrentSection(prev => prev + 1);
        setCurrentSubsection(0);
      } else {
        // Completar evaluación
        await completeEvaluation();
      }
    }
  };

  const completeEvaluation = async () => {
    try {
      setLoading(true);

      const user = apiService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calcular puntuación final para evaluación de equipo
      let totalScore = 0;
      let totalQuestions = 0;
      let correctAnswers = 0;

      Object.entries(answers).forEach(([key, answer]) => {
        totalQuestions++;
        if (answer === 'si') {
          totalScore += 10;
          correctAnswers++;
        } else if (answer === 'na') {
          totalScore += 10; // Para evaluación de equipo, 'na' también vale 10 puntos
          correctAnswers++;
        }
        // 'no' = 0 puntos
      });

      const finalPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        rol_personal: null,
        respuestas: Object.entries(answers).map(([key, answer]) => {
          return {
            pregunta_id: null, // Para evaluación de equipo no hay pregunta_id real
            respuesta: answer,
            observacion: `Subsección: ${key} - Estado: ${answer}`
          };
        }),
        observaciones: `Evaluación de equipo completada - Planta ${selectedPlantType}`
      };

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      onComplete({
        answers,
        score: Math.round(result.puntuacion_ponderada || finalPercentage),
        totalAnswers: totalQuestions,
        correctAnswers: correctAnswers,
        evaluationTitle: `Evaluación de Equipo - Planta ${selectedPlantType}`,
        sections: evaluationData.secciones || [],
        isEquipmentEvaluation: true
      });

      toast({
        title: "✅ Evaluación completada",
        description: "Los resultados han sido guardados exitosamente"
      });

    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la evaluación. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = currentSubsectionData?.preguntas?.every((_, index) => {
    const key = `${currentSection}-${currentSubsection}-${index}`;
    return answers[key] !== undefined;
  });

  // Función para generar el panel de criterios de evaluación
  const generateEvaluationCriteriaPanel = () => {
    if (!currentSectionData) return null;

    // Obtener información de la sección actual desde la base de datos
    const sectionInfo = {
      nombre: currentSectionData.nombre,
      descripcion: currentSectionData.descripcion || 'Evaluación de equipos y sistemas relacionados',
      ponderacion: currentSectionData.ponderacion || 0,
      totalSubsecciones: currentSectionData.subsecciones?.length || 0,
      subseccionActual: currentSubsection + 1
    };

    // Generar criterios específicos basados en la sección
    const getCriteriaForSection = (sectionName) => {
      const criteriaMap = {
        'Producción y Mezclado': [
          'Estado general del equipo',
          'Funcionamiento correcto de componentes',
          'Mantenimiento preventivo actualizado',
          'Calibración de sistemas de dosificación',
          'Limpieza y orden del área',
          'Disponibilidad de repuestos críticos'
        ],
        'Transporte y Entrega': [
          'Estado de camiones revolvedores',
          'Funcionamiento de bombas de concreto',
          'Sistemas de carga operativos',
          'Equipos de limpieza disponibles',
          'Documentación de vehículos',
          'Cumplimiento de horarios'
        ],
        'Control de Calidad': [
          'Equipos de laboratorio calibrados',
          'Instrumentos de medición precisos',
          'Equipos de muestreo disponibles',
          'Sistemas de curado funcionando',
          'Equipos de pruebas operativos',
          'Registros de control actualizados'
        ],
        'Mantenimiento': [
          'Herramientas de mantenimiento completas',
          'Equipos de diagnóstico operativos',
          'Sistemas de lubricación funcionando',
          'Equipos de soldadura disponibles',
          'Programa de mantenimiento actualizado',
          'Personal capacitado disponible'
        ],
        'Seguridad y Medio Ambiente': [
          'Equipos contra incendios operativos',
          'EPP disponible y en buen estado',
          'Control de polvo efectivo',
          'Tratamiento de aguas funcionando',
          'Sistemas de emergencia operativos',
          'Monitoreo ambiental activo'
        ],
        'Gestión y Administración': [
          'Sistemas informáticos operativos',
          'Equipos de comunicación funcionando',
          'Sistemas de pesaje calibrados',
          'Equipos de oficina disponibles',
          'Documentación organizada',
          'Procesos administrativos claros'
        ]
      };

      return criteriaMap[sectionName] || [
        'Estado general del equipo',
        'Funcionamiento correcto',
        'Mantenimiento actualizado',
        'Documentación completa',
        'Personal capacitado',
        'Cumplimiento normativo'
      ];
    };

    const criteria = getCriteriaForSection(sectionInfo.nombre);

    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
        <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Criterios de Evaluación
          </h3>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            {/* Información de la sección */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-800 mb-1">{sectionInfo.nombre}</h4>
              <p className="text-sm text-gray-600 mb-2">{sectionInfo.descripcion}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Ponderación: {sectionInfo.ponderacion}%</span>
                <span>Subsección {sectionInfo.subseccionActual} de {sectionInfo.totalSubsecciones}</span>
              </div>
            </div>

            {/* Criterios de evaluación */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Aspectos a evaluar:</h5>
              <div className="space-y-2">
                {criteria.map((criterion, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-600">{criterion}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Escala de evaluación */}
            <div className="border-t pt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Escala de evaluación:</h5>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600"><strong>Sí:</strong> Cumple completamente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-600"><strong>No:</strong> No cumple o deficiente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600"><strong>N/A:</strong> No aplica</span>
                </div>
              </div>
            </div>

            {/* Progreso de la sección */}
            <div className="border-t pt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Progreso de sección:</h5>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((currentSubsection + 1) / sectionInfo.totalSubsecciones) * 100}%` 
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentSubsection + 1} de {sectionInfo.totalSubsecciones} subsecciones
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h6 className="text-xs font-medium text-blue-800 mb-1">💡 Recomendación:</h6>
              <p className="text-xs text-blue-700">
                Evalúe cada aspecto considerando el estado actual, funcionalidad y cumplimiento de normativas aplicables.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando evaluación de equipo...</p>
        </div>
      </div>
    );
  }

  // Pantalla de selección de tipo de planta
  if (!evaluationStarted) {
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
          <div className="w-full max-w-lg space-y-4">
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

            {['pequena', 'mediana', 'grande'].map((plantType, index) => (
              <motion.div
                key={plantType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handlePlantTypeSelect(plantType)}
                  className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium block">
                        Planta {plantType.charAt(0).toUpperCase() + plantType.slice(1)}
                      </span>
                      <span className="text-gray-600 text-sm">
                        Evaluación de equipos para planta {plantType}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
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

  if (!evaluationData || !evaluationData.secciones || evaluationData.secciones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
        <ClipboardCheck size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron secciones para esta evaluación.</p>
        <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
        </Button>
      </div>
    );
  }

  // Pantalla de evaluación
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
        {/* Botón de desarrollo para saltar a resultados - solo en primera sección */}
        {currentSection === 0 && currentSubsection === 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={handleSkipToResults}
              variant="outline"
              size="sm"
              className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Saltar a Resultados (Simulado)</span>
            </Button>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Evaluación de Equipo - Planta {selectedPlantType}
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

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className="w-3/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentSection}-${currentSubsection}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                  {/* Header de la sección y subsección */}
                  <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 text-center">
                      {currentSectionData?.nombre}
                    </h2>
                    <h3 className="text-lg text-gray-600 text-center mt-1">
                      {currentSubsectionData?.nombre}
                    </h3>
                    {/* Mostrar ponderación de la subsección */}
                    {currentSubsectionData?.ponderacion_subseccion && (
                      <div className="text-center text-sm text-gray-600 mt-1">
                        Ponderación: {currentSubsectionData.ponderacion_subseccion}%
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {currentSubsectionData?.preguntas?.map((question, index) => {
                        const key = `${currentSection}-${currentSubsection}-${index}`;
                        const selectedAnswer = answers[key];

                        return (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">
                              {index + 1}. {question.pregunta}
                            </h3>

                            {/* Pregunta abierta (Sí/No/NA) */}
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
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
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
                                <div className="w-5 h-5 bg-gray-400 rounded-full mr-2"></div>
                                <span className="text-gray-700">No Aplica</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botón para continuar */}
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleNextSubsection}
                        disabled={!allQuestionsAnswered || loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                          {currentSection < totalSections - 1 || currentSubsection < (currentSectionData?.subsecciones?.length || 0) - 1
                            ? 'Siguiente Subsección' 
                            : 'Finalizar Evaluación'}
                        </span>
                      </Button>
                    </div>

                    {/* Contador de secciones y subsecciones */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                      Sección {currentSection + 1} de {totalSections} - 
                      Subsección {currentSubsection + 1} de {currentSectionData?.subsecciones?.length || 0}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Panel de criterios de evaluación */}
          <div className="w-2/5">
            {generateEvaluationCriteriaPanel()}
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
};

export default EvaluationScreenEquipo;