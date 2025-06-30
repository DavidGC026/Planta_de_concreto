import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Settings, Zap, Loader2, BarChart3, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [subsectionProgress, setSubsectionProgress] = useState({});
  const [showStats, setShowStats] = useState(false);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Configuración simplificada - solo tipos de planta
  const plantTypes = [
    { id: 'pequena', name: 'Planta Pequeña', description: 'Hasta 30 m³/h' },
    { id: 'mediana', name: 'Planta Mediana', description: '30-60 m³/h' },
    { id: 'grande', name: 'Planta Grande', description: 'Más de 60 m³/h' }
  ];

  useEffect(() => {
    // Cargar datos de evaluación cuando se inicia
    if (evaluationStarted && selectedPlantType) {
      loadEvaluationData();
    }
  }, [evaluationStarted, selectedPlantType]);

  // Scroll al inicio cuando cambia la subsección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentSubsection]);

  // Cargar progreso guardado al iniciar evaluación
  useEffect(() => {
    if (evaluationStarted && selectedPlantType && evaluationData) {
      loadSavedProgress();
    }
  }, [evaluationStarted, selectedPlantType, evaluationData]);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de evaluación de equipo desde la API
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
      
      // Fallback a datos predefinidos si falla la carga
      setEvaluationData(generateFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackData = () => {
    // Datos de respaldo en caso de que falle la carga desde la API
    return {
      title: 'Evaluación de Equipo',
      secciones: [
        {
          id: 'mezclado',
          nombre: 'Sistema de Mezclado',
          ponderacion: 25,
          subsecciones: [
            {
              id: 'mezcladora',
              nombre: 'Mezcladora Principal',
              preguntas: [
                { id: 1, pregunta: '¿La mezcladora está en buen estado general?', tipo_pregunta: 'abierta' },
                { id: 2, pregunta: '¿Las paletas mezcladoras están completas y sin desgaste excesivo?', tipo_pregunta: 'abierta' },
                { id: 3, pregunta: '¿El sistema de descarga funciona correctamente?', tipo_pregunta: 'abierta' }
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
          savedProgress[progress.seccion_orden - 1] = {
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

    // Usar datos reales si están disponibles, sino usar fallback
    const sectionsToUse = evaluationData?.secciones || generateFallbackData().secciones;

    sectionsToUse.forEach((seccion, sectionIndex) => {
      // Si la sección tiene subsecciones, usarlas
      if (seccion.subsecciones && seccion.subsecciones.length > 0) {
        seccion.subsecciones.forEach((subseccion, subsectionIndex) => {
          subseccion.preguntas?.forEach((pregunta, questionIndex) => {
            const key = `${selectedPlantType}-${sectionIndex}-${subsectionIndex}-${questionIndex}`;
            
            // Generar respuesta aleatoria con tendencia hacia respuestas positivas
            const randomValue = Math.random();
            let answer;
            
            if (randomValue < 0.75) { // 75% probabilidad de "sí"
              answer = 'si';
              correctAnswers++;
            } else if (randomValue < 0.95) { // 20% probabilidad de "no"
              answer = 'no';
            } else { // 5% probabilidad de "na"
              answer = 'na';
            }
            
            simulatedAnswers[key] = answer;
            totalQuestions++;
          });
        });
      } else {
        // Fallback para secciones sin subsecciones
        const questions = seccion.preguntas || [];
        questions.forEach((pregunta, questionIndex) => {
          const key = `${selectedPlantType}-${sectionIndex}-${questionIndex}`;
          
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

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedPlantType}-${currentSubsection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const saveCurrentSubsectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSubsectionData = getCurrentSubsectionData();
      if (!currentSubsectionData) return;
      
      // Calcular progreso de la subsección actual
      let subsectionScore = 0;
      let correctAnswers = 0;
      let totalQuestions = 0;

      currentSubsectionData.preguntas?.forEach((question, qIndex) => {
        const key = `${selectedPlantType}-${currentSubsection}-${qIndex}`;
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

      // Guardar progreso de subsección
      await apiService.guardarProgresoSeccion({
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        seccion_nombre: currentSubsectionData.nombre,
        seccion_orden: currentSubsection + 1,
        puntaje_seccion: subsectionScore,
        puntaje_porcentaje: subsectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        tipo_planta: selectedPlantType
      });

      // Actualizar estado local del progreso
      setSubsectionProgress(prev => ({
        ...prev,
        [currentSubsection]: {
          completed: true,
          score: subsectionPercentage,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions
        }
      }));

      toast({
        title: "💾 Progreso guardado",
        description: `Subsección "${currentSubsectionData.nombre}" guardada exitosamente`
      });

    } catch (error) {
      console.error('Error saving subsection progress:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso de la subsección"
      });
    }
  };

  const handleNextSubsection = async () => {
    // Guardar progreso de la subsección actual
    await saveCurrentSubsectionProgress();

    const totalSubsections = getTotalSubsections();
    if (currentSubsection < totalSubsections - 1) {
      setCurrentSubsection(prev => prev + 1);
    } else {
      // Completar evaluación
      await completeEvaluation();
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

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        rol_personal: null,
        respuestas: Object.entries(answers).map(([key, selectedAnswer]) => {
          const keyParts = key.split('-');
          const questionId = `equipo_${keyParts.join('_')}`;

          return {
            pregunta_id: null,
            respuesta: selectedAnswer,
            observacion: `Equipo: ${selectedPlantType} - Pregunta: ${key}`
          };
        }),
        observaciones: `Evaluación de equipo completada - Tipo: ${selectedPlantType}`
      };

      console.log('Enviando datos de evaluación:', evaluacionData);

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      onComplete({
        answers,
        score: Math.round(result.puntuacion_ponderada || finalPercentage),
        totalAnswers: totalQuestions,
        correctAnswers: correctAnswers,
        evaluationTitle: `Evaluación de Equipo - ${selectedPlantType}`,
        sections: getAllSubsections(),
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

  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setCurrentSubsection(0);
    setAnswers({});
    setSubsectionProgress({});
    setEvaluationStarted(true);
  };

  // Funciones auxiliares para manejar la estructura de datos
  const getAllSubsections = () => {
    if (!evaluationData?.secciones) return [];
    
    const allSubsections = [];
    evaluationData.secciones.forEach(seccion => {
      if (seccion.subsecciones && seccion.subsecciones.length > 0) {
        allSubsections.push(...seccion.subsecciones);
      } else {
        // Si no hay subsecciones, tratar la sección como subsección
        allSubsections.push({
          id: seccion.id,
          nombre: seccion.nombre,
          preguntas: seccion.preguntas || []
        });
      }
    });
    
    return allSubsections;
  };

  const getTotalSubsections = () => {
    return getAllSubsections().length;
  };

  const getCurrentSubsectionData = () => {
    const allSubsections = getAllSubsections();
    return allSubsections[currentSubsection] || null;
  };

  // Calcular estadísticas para la gráfica
  const calculateSubsectionStats = () => {
    const allSubsections = getAllSubsections();
    if (allSubsections.length === 0) return null;

    const subsectionsInfo = allSubsections.map((subsection, index) => {
      const totalQuestions = subsection.preguntas?.length || 0;
      
      // Contar respuestas de esta subsección
      let answered = 0;
      let correct = 0;

      subsection.preguntas?.forEach((question, qIndex) => {
        const key = `${selectedPlantType}-${index}-${qIndex}`;
        const answer = answers[key];
        
        if (answer) {
          answered++;
          if (answer === 'si') {
            correct++;
          }
        }
      });

      const progress = totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0;
      const score = answered > 0 ? (correct / answered) * 100 : 0;
      
      // Usar progreso guardado si existe
      const savedProgress = subsectionProgress[index];
      
      return {
        nombre: subsection.nombre,
        ponderacion: subsection.ponderacion_subseccion || 0,
        totalPreguntas: totalQuestions,
        preguntasRespondidas: answered,
        respuestasCorrectas: correct,
        progreso: savedProgress?.completed ? 100 : progress,
        puntuacion: savedProgress?.score || score,
        isCurrentSubsection: index === currentSubsection,
        isCompleted: savedProgress?.completed || progress === 100,
        isSaved: !!savedProgress?.completed
      };
    });

    const totalProgress = subsectionsInfo.reduce((sum, sub) => sum + sub.progreso, 0) / subsectionsInfo.length;
    const totalAnswered = subsectionsInfo.reduce((sum, sub) => sum + sub.preguntasRespondidas, 0);
    const totalQuestions = subsectionsInfo.reduce((sum, sub) => sum + sub.totalPreguntas, 0);
    const totalCorrect = subsectionsInfo.reduce((sum, sub) => sum + sub.respuestasCorrectas, 0);

    return {
      subsectionsInfo,
      totalProgress,
      totalAnswered,
      totalQuestions,
      totalCorrect,
      currentScore: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
    };
  };

  const stats = calculateSubsectionStats();

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {evaluationStarted ? 'Guardando evaluación de equipo...' : 'Cargando datos de evaluación...'}
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de selección simplificada - solo tipos de planta
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
                        <Settings className="w-8 h-8 text-blue-600" />
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

  const totalSubsections = getTotalSubsections();
  const currentSubsectionData = getCurrentSubsectionData();

  if (!currentSubsectionData) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
        <Settings size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron subsecciones para esta evaluación.</p>
        <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
        </Button>
      </div>
    );
  }

  const progress = totalSubsections > 0 ? ((currentSubsection + 1) / totalSubsections) * 100 : 0;

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = currentSubsectionData?.preguntas?.every((_, index) => {
    const key = `${selectedPlantType}-${currentSubsection}-${index}`;
    return answers[key] !== undefined;
  });

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
        {/* Botón de desarrollo para saltar a resultados - solo en primera subsección */}
        {currentSubsection === 0 && (
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
              Evaluación de Equipo - {selectedPlantType}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {Math.round(progress)}% completado
              </span>
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{showStats ? 'Ocultar' : 'Mostrar'} Estadísticas</span>
              </Button>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="flex h-full">
              {Array.from({ length: totalSubsections }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${
                    subsectionProgress[i]?.completed ? 'bg-green-600' :
                    i < currentSubsection ? 'bg-blue-600' :
                    i === currentSubsection ? 'bg-blue-400' : 'bg-gray-300'
                  } ${i < totalSubsections - 1 ? 'mr-1' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className={`${showStats && stats ? 'w-3/5' : 'w-full'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSubsection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                  {/* Header de la subsección */}
                  <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {currentSubsectionData?.nombre}
                      </h2>
                      {subsectionProgress[currentSubsection]?.completed && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Guardado</span>
                        </div>
                      )}
                    </div>
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
                        const key = `${selectedPlantType}-${currentSubsection}-${index}`;
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
                          {currentSubsection < totalSubsections - 1 ? 'Siguiente Subsección' : 'Finalizar Evaluación'}
                        </span>
                      </Button>
                    </div>

                    {/* Contador de subsecciones */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                      Subsección {currentSubsection + 1} de {totalSubsections}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Panel de estadísticas */}
          {showStats && stats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Estado de Subsecciones
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-4">
                    {/* Tabla de subsecciones */}
                    <div className="overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-2 font-medium text-gray-700">Subsección</th>
                            <th className="text-center p-2 font-medium text-gray-700">%</th>
                            <th className="text-center p-2 font-medium text-gray-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.subsectionsInfo.map((subsection, index) => (
                            <tr
                              key={index}
                              className={`border-b border-gray-100 ${
                                subsection.isCurrentSubsection ? 'bg-blue-50' :
                                subsection.isCompleted ? 'bg-green-50' : ''
                              }`}
                            >
                              <td className="p-2">
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-blue-600 mr-1">
                                    {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-800 truncate" title={subsection.nombre}>
                                    {subsection.nombre.length > 20 ? subsection.nombre.substring(0, 20) + '...' : subsection.nombre}
                                  </span>
                                  {subsection.isCurrentSubsection && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-1 flex-shrink-0" />
                                  )}
                                  {subsection.isSaved && (
                                    <CheckCircle className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" />
                                  )}
                                </div>
                              </td>
                              <td className="text-center p-2 text-xs font-medium">
                                {Math.round(subsection.puntuacion)}
                              </td>
                              <td className="text-center p-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  subsection.isSaved ? 'bg-green-500' :
                                  subsection.isCompleted ? 'bg-blue-500' :
                                  subsection.progreso > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                                }`} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Progreso general */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Progreso general</h4>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(stats.totalProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.totalProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stats.totalAnswered} de {stats.totalQuestions} preguntas
                      </div>
                    </div>

                    {/* Puntuación estimada */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Puntuación estimada</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.currentScore}%
                        </div>
                        <div className="text-xs text-gray-500">
                          puntos acumulados
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stats.totalCorrect} correctas de {stats.totalAnswered} respondidas
                        </div>
                      </div>
                    </div>

                    {/* Leyenda de estados */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Leyenda</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                          <span>Guardado</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                          <span>Completado</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                          <span>En progreso</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-300 rounded-full mr-2" />
                          <span>Pendiente</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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