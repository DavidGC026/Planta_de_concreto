import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, ClipboardCheck, Save, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [savedProgress, setSavedProgress] = useState({});
  const [savingProgress, setSavingProgress] = useState(false);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Tipos de planta disponibles
  const plantTypes = [
    { code: 'pequena', name: 'Planta Pequeña', description: 'Hasta 30 m³/h' },
    { code: 'mediana', name: 'Planta Mediana', description: '30-60 m³/h' },
    { code: 'grande', name: 'Planta Grande', description: 'Más de 60 m³/h' }
  ];

  useEffect(() => {
    if (!evaluationStarted) {
      loadSavedProgress();
    }
  }, [selectedPlantType]);

  // Scroll al inicio cuando cambia la sección o subsección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentSection, currentSubsection]);

  const loadSavedProgress = async () => {
    if (!selectedPlantType) return;

    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progress = await equipmentProgressService.getProgress(user.id, selectedPlantType);
      setSavedProgress(progress);

      // Restaurar respuestas desde el progreso guardado
      const restoredAnswers = {};
      if (progress.secciones) {
        progress.secciones.forEach(seccion => {
          if (seccion.subsecciones) {
            seccion.subsecciones.forEach(subseccion => {
              // Simular respuestas basadas en el progreso guardado
              if (subseccion.completada) {
                // Generar claves de respuestas para esta subsección
                for (let i = 0; i < 10; i++) { // Asumiendo máximo 10 preguntas por subsección
                  const key = `${seccion.seccion_id}-${subseccion.subseccion_id}-${i}`;
                  restoredAnswers[key] = 'si'; // Valor por defecto para subsecciones completadas
                }
              }
            });
          }
        });
      }

      setAnswers(restoredAnswers);
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

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

  const saveSubsectionProgress = async (sectionData, subsectionData, subsectionAnswers) => {
    try {
      setSavingProgress(true);
      const user = apiService.getCurrentUser();
      if (!user) return;

      // Calcular estadísticas de la subsección
      let correctAnswers = 0;
      let totalQuestions = 0;

      Object.values(subsectionAnswers).forEach(answer => {
        totalQuestions++;
        if (answer === 'si') {
          correctAnswers++;
        }
      });

      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Guardar progreso de subsección
      await equipmentProgressService.saveSubsectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: sectionData.id,
        subseccion_id: subsectionData.id,
        subseccion_nombre: subsectionData.nombre,
        puntaje_obtenido: correctAnswers * 10, // 10 puntos por respuesta correcta
        puntaje_porcentaje: percentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions
      });

      // Actualizar progreso local
      await loadSavedProgress();

      toast({
        title: "💾 Progreso guardado",
        description: `Subsección "${subsectionData.nombre}" guardada exitosamente`,
        duration: 2000
      });

    } catch (error) {
      console.error('Error saving subsection progress:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso de la subsección"
      });
    } finally {
      setSavingProgress(false);
    }
  };

  const saveSectionProgress = async (sectionData) => {
    try {
      setSavingProgress(true);
      const user = apiService.getCurrentUser();
      if (!user) return;

      // Calcular estadísticas de toda la sección
      let totalCorrect = 0;
      let totalQuestions = 0;
      let completedSubsections = 0;

      sectionData.subsecciones.forEach(subsection => {
        const subsectionAnswers = Object.entries(answers).filter(([key]) => 
          key.startsWith(`${sectionData.id}-${subsection.id}-`)
        );

        if (subsectionAnswers.length > 0) {
          completedSubsections++;
          subsectionAnswers.forEach(([, answer]) => {
            totalQuestions++;
            if (answer === 'si') {
              totalCorrect++;
            }
          });
        }
      });

      const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Guardar progreso de sección completa
      await equipmentProgressService.saveSectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: sectionData.id,
        seccion_nombre: sectionData.nombre,
        puntaje_obtenido: totalCorrect * 10,
        puntaje_porcentaje: percentage,
        total_subsecciones: sectionData.subsecciones.length,
        subsecciones_completadas: completedSubsections,
        respuestas_correctas: totalCorrect,
        total_preguntas: totalQuestions
      });

      // Actualizar progreso local
      await loadSavedProgress();

      toast({
        title: "✅ Sección completada",
        description: `Sección "${sectionData.nombre}" guardada exitosamente`,
        duration: 3000
      });

    } catch (error) {
      console.error('Error saving section progress:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso de la sección"
      });
    } finally {
      setSavingProgress(false);
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
      // Generar 20 preguntas simuladas por sección
      const questionsPerSection = 20;

      for (let i = 0; i < questionsPerSection; i++) {
        const questionId = `simulated-${sectionIndex}-${i}`;

        // Generar respuesta aleatoria con tendencia hacia respuestas positivas
        const randomValue = Math.random();
        let answer;

        if (randomValue < 0.7) { // 70% probabilidad de respuesta correcta
          answer = 'si';
          correctAnswers++;
        } else if (randomValue < 0.9) { // 20% probabilidad de N/A
          answer = 'na';
          correctAnswers++; // N/A también cuenta como correcta para equipo
        } else { // 10% probabilidad de respuesta incorrecta
          answer = 'no';
        }

        simulatedAnswers[questionId] = answer;
        totalQuestions++;
      }
    });

    // Calcular puntuación simulada
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Equipo Simulada - Planta ${selectedPlantType || 'Genérica'}`,
      sections: simulatedSections.map(section => ({
        ...section,
        title: section.nombre
      })),
      isEquipmentEvaluation: true,
      isSimulated: true,
      plantType: selectedPlantType
    };
  };

  const handleSkipToResults = () => {
    try {
      const simulatedResults = generateSimulatedEvaluation();

      toast({
        title: "🎯 Evaluación Simulada",
        description: "Se ha generado una evaluación con respuestas aleatorias para demostración"
      });

      onComplete(simulatedResults);
    } catch (error) {
      console.error('Error generating simulated evaluation:', error);
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

  const handleAnswer = (questionIndex, selectedOption) => {
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];
    
    if (!currentSectionData || !currentSubsectionData) return;

    const key = `${currentSectionData.id}-${currentSubsectionData.id}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const handleNextSubsection = async () => {
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];
    
    if (!currentSectionData || !currentSubsectionData) return;

    // Obtener respuestas de la subsección actual
    const subsectionAnswers = Object.entries(answers).reduce((acc, [key, value]) => {
      if (key.startsWith(`${currentSectionData.id}-${currentSubsectionData.id}-`)) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Guardar progreso de la subsección actual
    await saveSubsectionProgress(currentSectionData, currentSubsectionData, subsectionAnswers);

    // Avanzar a la siguiente subsección o sección
    if (currentSubsection < currentSectionData.subsecciones.length - 1) {
      setCurrentSubsection(prev => prev + 1);
    } else {
      // Completar la sección actual
      await saveSectionProgress(currentSectionData);
      
      // Avanzar a la siguiente sección
      if (currentSection < evaluationData.secciones.length - 1) {
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

      // Calcular puntuación final
      let totalScore = 0;
      let totalQuestions = 0;
      let correctAnswers = 0;

      Object.values(answers).forEach(answer => {
        totalQuestions++;
        if (answer === 'si') {
          totalScore += 10;
          correctAnswers++;
        } else if (answer === 'na') {
          totalScore += 10; // N/A también vale 10 puntos para equipo
          correctAnswers++;
        }
        // 'no' vale 0 puntos
      });

      const finalPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        tipo_planta: selectedPlantType,
        respuestas: Object.entries(answers).map(([key, selectedAnswer]) => {
          return {
            pregunta_id: null, // Para evaluación de equipo no hay pregunta_id real
            respuesta: selectedAnswer,
            observacion: `Equipo: ${key} - Estado: ${selectedAnswer}`
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
        description: "No se pudo guardar la evaluación. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = () => {
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];
    
    if (!currentSectionData || !currentSubsectionData || !currentSubsectionData.preguntas) {
      return false;
    }

    return currentSubsectionData.preguntas.every((_, index) => {
      const key = `${currentSectionData.id}-${currentSubsectionData.id}-${index}`;
      return answers[key] !== undefined;
    });
  };

  // Verificar si una subsección está completada según el progreso guardado
  const isSubsectionCompleted = (sectionId, subsectionId) => {
    return equipmentProgressService.isSubsectionCompleted(savedProgress, sectionId, subsectionId);
  };

  // Verificar si una sección está completada según el progreso guardado
  const isSectionCompleted = (sectionId) => {
    return equipmentProgressService.isSectionCompleted(savedProgress, sectionId);
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

            {plantTypes.map((plantType, index) => (
              <motion.div
                key={plantType.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handlePlantTypeSelect(plantType.code)}
                  className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium block">{plantType.name}</span>
                      <span className="text-gray-600 text-sm">{plantType.description}</span>
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

  const totalSections = evaluationData.secciones.length;
  const currentSectionData = evaluationData.secciones[currentSection];
  const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];
  const totalSubsections = currentSectionData?.subsecciones?.length || 0;

  const progress = totalSections > 0 
    ? ((currentSection + (currentSubsection + 1) / totalSubsections) / totalSections) * 100
    : 0;

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
            <div className="flex items-center space-x-2">
              {savingProgress && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <Save className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Guardando...</span>
                </div>
              )}
              <span className="text-sm text-gray-600">
                {Math.round(progress)}% completado
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Sección {currentSection + 1} de {totalSections} - 
            Subsección {currentSubsection + 1} de {totalSubsections}
          </div>
        </div>

        {/* Panel principal de evaluación */}
        <div className="w-full">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {currentSectionData?.nombre}
                      </h2>
                      <h3 className="text-lg text-blue-600 mt-1">
                        {currentSubsectionData?.nombre}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isSectionCompleted(currentSectionData?.id) && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Sección completada</span>
                        </div>
                      )}
                      {isSubsectionCompleted(currentSectionData?.id, currentSubsectionData?.id) && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Guardado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <div className="space-y-4">
                    {currentSubsectionData?.preguntas?.map((question, index) => {
                      const key = `${currentSectionData.id}-${currentSubsectionData.id}-${index}`;
                      const selectedAnswer = answers[key];

                      return (
                        <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-800 mb-3">
                            {index + 1}. {question.pregunta}
                          </h3>
                          
                          <div className="flex space-x-4">
                            {[
                              { value: 'si', label: 'Sí', color: 'bg-green-500 hover:bg-green-600' },
                              { value: 'no', label: 'No', color: 'bg-red-500 hover:bg-red-600' },
                              { value: 'na', label: 'No Aplica', color: 'bg-gray-500 hover:bg-gray-600' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleAnswer(index, option.value)}
                                className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                                  selectedAnswer === option.value 
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

                  {/* Botón para continuar */}
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleNextSubsection}
                      disabled={!allQuestionsAnswered() || loading || savingProgress}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {(loading || savingProgress) && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>
                        {currentSubsection < totalSubsections - 1 
                          ? 'Siguiente Subsección' 
                          : currentSection < totalSections - 1 
                            ? 'Siguiente Sección' 
                            : 'Finalizar Evaluación'
                        }
                      </span>
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
};

export default EvaluationScreenEquipo;