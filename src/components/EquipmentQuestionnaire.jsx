import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Loader2, CheckCircle, XCircle, MinusCircle, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';
import SectionCompletionModal from '@/components/SectionCompletionModal';

const EquipmentQuestionnaire = ({ 
  selectedPlantType,
  evaluationData,
  currentSection,
  currentSubsection,
  onBack,
  onComplete,
  onSkipToResults,
  onSectionComplete
}) => {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [completedSubsections, setCompletedSubsections] = useState(new Set());
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionModalData, setSectionModalData] = useState(null);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Scroll al inicio cuando cambia la sección o subsección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentSection, currentSubsection]);

  const totalSections = evaluationData?.secciones?.length || 0;
  const currentSectionData = evaluationData?.secciones?.[currentSection];
  const totalSubsections = currentSectionData?.subsecciones?.length || 0;
  const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];

  const progress = totalSections > 0
    ? ((currentSection + (currentSubsection + 1) / totalSubsections) / totalSections) * 100
    : 0;

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${currentSectionData.id}-${currentSubsectionData.id}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const saveSubsectionProgress = async (sectionId, subsectionId, subsectionName, sectionName) => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      // Calcular progreso de la subsección actual
      const subsectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${sectionId}-${subsectionId}-`));

      let correctAnswers = 0;
      const totalQuestions = subsectionAnswers.length;

      subsectionAnswers.forEach(([, answer]) => {
        if (answer === 'si' || answer === 'na') {
          correctAnswers++;
        }
        // 'no' = 0 puntos
      });

      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const score = correctAnswers * 10; // Puntuación base

      // Validar datos antes de enviar
      const progressData = {
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: sectionId,
        subseccion_id: subsectionId,
        subseccion_nombre: subsectionName,
        puntaje_obtenido: score,
        puntaje_porcentaje: percentage,
        respuestas_correctas: Math.round(correctAnswers),
        total_preguntas: totalQuestions
      };

      // Log para debugging
      console.log('Guardando progreso de subsección:', progressData);

      await equipmentProgressService.saveSubsectionProgress(progressData);

      // Marcar subsección como completada
      setCompletedSubsections(prev => new Set([...prev, `${sectionId}-${subsectionId}`]));

      toast({
        title: "✅ Progreso guardado",
        description: `Subsección "${subsectionName}" completada`
      });

    } catch (error) {
      console.error('Error saving subsection progress:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso de la subsección"
      });
    }
  };

  const saveSectionProgress = async (sectionId, sectionName) => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const section = evaluationData?.secciones?.find(s => s.id === sectionId);
      if (!section) return;

      // Calcular progreso total de la sección
      let totalCorrect = 0;
      let totalQuestions = 0;
      let completedSubsections = 0;

      section.subsecciones?.forEach(subsection => {
        const subsectionAnswers = Object.entries(answers)
          .filter(([key]) => key.startsWith(`${sectionId}-${subsection.id}-`));

        if (subsectionAnswers.length > 0) {
          completedSubsections++;

          subsectionAnswers.forEach(([, answer]) => {
            totalQuestions++;
            if (answer === 'si' || answer === 'na') {
              totalCorrect++;
            }
          });
        }
      });

      const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      const score = totalCorrect * 10;

      await equipmentProgressService.saveSectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: sectionId,
        seccion_nombre: sectionName,
        puntaje_obtenido: score,
        puntaje_porcentaje: percentage,
        total_subsecciones: section.subsecciones?.length || 0,
        subsecciones_completadas: completedSubsections,
        respuestas_correctas: Math.round(totalCorrect),
        total_preguntas: totalQuestions
      });

      // Marcar sección como completada
      setCompletedSections(prev => new Set([...prev, sectionId]));

      // Preparar datos para el modal
      const subsectionResults = section.subsecciones?.map(subsection => {
        const subsectionAnswers = Object.entries(answers)
          .filter(([key]) => key.startsWith(`${sectionId}-${subsection.id}-`));

        let subCorrect = 0;
        subsectionAnswers.forEach(([, answer]) => {
          if (answer === 'si' || answer === 'na') {
            subCorrect++;
          }
        });

        const subPercentage = subsectionAnswers.length > 0 ? (subCorrect / subsectionAnswers.length) * 100 : 0;

        return {
          name: subsection.nombre,
          percentage: subPercentage,
          correctAnswers: Math.round(subCorrect),
          totalQuestions: subsectionAnswers.length,
          ponderacion: subsection.ponderacion_subseccion
        };
      }) || [];

      // Mostrar modal de sección completada
      setSectionModalData({
        sectionName: sectionName,
        overallPercentage: percentage,
        totalCorrect: Math.round(totalCorrect),
        totalQuestions: totalQuestions,
        subsectionResults: subsectionResults,
        recommendations: generateRecommendations(percentage),
        ponderacion: section.ponderacion
      });
      setShowSectionModal(true);

    } catch (error) {
      console.error('Error saving section progress:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso de la sección"
      });
    }
  };

  const generateRecommendations = (percentage) => {
    const recommendations = [];

    if (percentage < 60) {
      recommendations.push('Se requiere revisión completa de los equipos de esta sección');
      recommendations.push('Implementar plan de mantenimiento preventivo inmediato');
      recommendations.push('Capacitar al personal en el uso correcto de los equipos');
    } else if (percentage < 80) {
      recommendations.push('Realizar mantenimiento preventivo en equipos con calificación regular');
      recommendations.push('Revisar procedimientos operativos estándar');
      recommendations.push('Considerar actualización de equipos obsoletos');
    } else {
      recommendations.push('Mantener el programa de mantenimiento actual');
      recommendations.push('Continuar con las buenas prácticas implementadas');
      recommendations.push('Considerar esta sección como referencia para otras áreas');
    }

    return recommendations;
  };

  const handleNextSubsection = async () => {
    // Guardar progreso de la subsección actual
    await saveSubsectionProgress(
      currentSectionData.id,
      currentSubsectionData.id,
      currentSubsectionData.nombre,
      currentSectionData.nombre
    );

    if (currentSubsection < totalSubsections - 1) {
      // Ir a la siguiente subsección
      onSectionComplete('nextSubsection');
    } else {
      // Completar sección
      await saveSectionProgress(currentSectionData.id, currentSectionData.nombre);
    }
  };

  const handleNextSection = () => {
    // Volver a la pantalla de selección de secciones
    onSectionComplete('backToSections');
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

      Object.entries(answers).forEach(([key, answer]) => {
        totalQuestions++;
        if (answer === 'si' || answer === 'na') {
          totalScore += 10;
          correctAnswers++;
        }
        // 'no' = 0 puntos
      });

      const finalScore = totalQuestions > 0 ? Math.round((totalScore / (totalQuestions * 10)) * 100) : 0;

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        rol_personal: null,
        respuestas: Object.entries(answers).map(([key, answer]) => ({
          pregunta_id: null,
          respuesta: answer, // 'si', 'no', 'na'
          observacion: `Equipo evaluado: ${key} - Estado: ${answer}`
        })),
        observaciones: `Evaluación de equipo completada - Planta ${selectedPlantType}`
      };

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      // Calcular resultados por sección para el resultado final
      const sectionResults = evaluationData.secciones?.map(section => {
        let sectionCorrect = 0;
        let sectionTotal = 0;

        section.subsecciones?.forEach(subsection => {
          const subsectionAnswers = Object.entries(answers)
            .filter(([key]) => key.startsWith(`${section.id}-${subsection.id}-`));

          subsectionAnswers.forEach(([, answer]) => {
            sectionTotal++;
            if (answer === 'si' || answer === 'na') {
              sectionCorrect++;
            }
          });
        });

        const sectionPercentage = sectionTotal > 0 ? (sectionCorrect / sectionTotal) * 100 : 0;

        return {
          name: section.nombre,
          percentage: sectionPercentage,
          correctAnswers: Math.round(sectionCorrect),
          totalQuestions: sectionTotal,
          ponderacion: section.ponderacion
        };
      }) || [];

      onComplete({
        answers,
        score: Math.round(result.puntuacion_ponderada || finalScore),
        totalAnswers: totalQuestions,
        correctAnswers: Math.round(correctAnswers),
        evaluationTitle: `Evaluación de Equipo - Planta ${selectedPlantType}`,
        sections: evaluationData.secciones || [],
        sectionResults: sectionResults,
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
    const key = `${currentSectionData.id}-${currentSubsectionData.id}-${index}`;
    return answers[key] !== undefined;
  });

  // Calcular estadísticas de progreso
  const calculateProgressStats = () => {
    if (!evaluationData?.secciones) return null;

    const totalQuestions = evaluationData.secciones.reduce((total, section) => {
      return total + (section.subsecciones?.reduce((subTotal, subsection) => {
        return subTotal + (subsection.preguntas?.length || 0);
      }, 0) || 0);
    }, 0);

    const answeredQuestions = Object.keys(answers).length;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Contar respuestas por tipo
    const responseStats = {
      si: 0,
      no: 0,
      na: 0
    };

    let correctAnswers = 0;

    Object.values(answers).forEach(answer => {
      if (responseStats.hasOwnProperty(answer)) {
        responseStats[answer]++;
        if (answer === 'si' || answer === 'na') {
          correctAnswers++;
        }
      }
    });

    const currentScore = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;

    return {
      totalQuestions,
      answeredQuestions,
      progressPercentage,
      responseStats,
      correctAnswers,
      currentScore
    };
  };

  const progressStats = calculateProgressStats();

  if (!evaluationData || !evaluationData.secciones || evaluationData.secciones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
        <Settings size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron secciones para esta evaluación.</p>
        <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
        </Button>
      </div>
    );
  }

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
        {/* Botón para volver a selección de secciones */}
        <div className="mb-4 flex justify-between items-center">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="bg-white/90 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Secciones
          </Button>

          <Button
            onClick={onSkipToResults}
            variant="outline"
            size="sm"
            className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Saltar a Resultados (Simulado)</span>
          </Button>
        </div>

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
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Sección {currentSection + 1} de {totalSections} •
            Subsección {currentSubsection + 1} de {totalSubsections}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className={`${progressStats ? 'w-3/5' : 'w-full'}`}>
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
                      <div className="text-right">
                        {completedSections.has(currentSectionData?.id) && (
                          <div className="flex items-center text-green-600 mb-1">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Sección Completada</span>
                          </div>
                        )}
                        {completedSubsections.has(`${currentSectionData?.id}-${currentSubsectionData?.id}`) && (
                          <div className="flex items-center text-blue-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Subsección Completada</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {currentSubsectionData?.preguntas?.map((question, index) => {
                        const key = `${currentSectionData.id}-${currentSubsectionData.id}-${index}`;
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

                    {/* Botón para continuar */}
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleNextSubsection}
                        disabled={!allQuestionsAnswered || loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                          {currentSubsection < totalSubsections - 1
                            ? 'Siguiente Subsección'
                            : 'Completar Sección'
                          }
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Panel de ponderación de secciones */}
          {progressStats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Ponderación de Secciones
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-4">
                    {/* Tabla de ponderación de secciones */}
                    <div className="overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-2 font-medium text-gray-700">Sección</th>
                            <th className="text-center p-2 font-medium text-gray-700">Peso (%)</th>
                            <th className="text-center p-2 font-medium text-gray-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evaluationData.secciones?.map((section, index) => {
                            const isCurrentSection = index === currentSection;
                            const isCompleted = completedSections.has(section.id);
                            
                            return (
                              <tr
                                key={section.id}
                                className={`border-b border-gray-100 ${
                                  isCurrentSection ? 'bg-blue-50' :
                                  isCompleted ? 'bg-green-50' : ''
                                }`}
                              >
                                <td className="p-2">
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-blue-600 mr-1">
                                      {index + 1}
                                    </span>
                                    <span className="text-xs text-gray-800 truncate" title={section.nombre}>
                                      {section.nombre.length > 20 ? section.nombre.substring(0, 20) + '...' : section.nombre}
                                    </span>
                                    {isCurrentSection && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-1 flex-shrink-0" />
                                    )}
                                    {isCompleted && (
                                      <CheckCircle className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" />
                                    )}
                                  </div>
                                </td>
                                <td className="text-center p-2 text-xs font-medium">
                                  {section.ponderacion}%
                                </td>
                                <td className="text-center p-2">
                                  {isCompleted ? (
                                    <span className="text-xs text-green-600 font-medium">✓</span>
                                  ) : isCurrentSection ? (
                                    <span className="text-xs text-blue-600 font-medium">●</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">○</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-gray-100 font-bold">
                            <td className="p-2 text-xs">TOTAL</td>
                            <td className="text-center p-2 text-xs">100%</td>
                            <td className="text-center p-2 text-xs">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Progreso general */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Progreso general</h4>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(progressStats.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressStats.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {progressStats.answeredQuestions} de {progressStats.totalQuestions} preguntas
                      </div>
                    </div>

                    {/* Puntuación estimada */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Puntuación estimada</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {progressStats.currentScore}%
                        </div>
                        <div className="text-xs text-gray-500">
                          puntos acumulados
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {progressStats.correctAnswers} correctas de {progressStats.answeredQuestions} respondidas
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas de respuestas */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución de respuestas</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            <span>Sí</span>
                          </div>
                          <span className="font-medium">{progressStats.responseStats.si}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-red-600 mr-2" />
                            <span>No</span>
                          </div>
                          <span className="font-medium">{progressStats.responseStats.no}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <MinusCircle className="w-4 h-4 text-gray-600 mr-2" />
                            <span>No Aplica</span>
                          </div>
                          <span className="font-medium">{progressStats.responseStats.na}</span>
                        </div>
                      </div>
                    </div>

                    {/* Información del sistema */}
                    <div className="border-t pt-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-xs font-medium text-blue-800 mb-1">Sistema de Evaluación</h4>
                        <div className="text-xs text-blue-700">
                          <div>• Respuestas "Sí" y "No Aplica" = Correctas</div>
                          <div>• Respuesta "No" = Incorrecta</div>
                          <div>• Ponderación por secciones</div>
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

      {/* Modal de sección completada */}
      <SectionCompletionModal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        onContinue={() => {
          setShowSectionModal(false);
          handleNextSection();
        }}
        sectionData={sectionModalData}
        plantType={selectedPlantType}
      />

      <img
        src="/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
      />
    </div>
  );
};

export default EquipmentQuestionnaire;