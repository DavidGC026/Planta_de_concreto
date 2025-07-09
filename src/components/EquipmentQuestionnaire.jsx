import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Loader2, CheckCircle } from 'lucide-react';
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
        if (answer === 'bueno') {
          correctAnswers++;
        } else if (answer === 'regular') {
          correctAnswers += 0.5; // Valor parcial para regular
        }
      });

      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const score = correctAnswers * 10; // Puntuación base

      await equipmentProgressService.saveSubsectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: sectionId,
        subseccion_id: subsectionId,
        subseccion_nombre: subsectionName,
        puntaje_obtenido: score,
        puntaje_porcentaje: percentage,
        respuestas_correctas: Math.round(correctAnswers),
        total_preguntas: totalQuestions
      });

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
            if (answer === 'bueno') {
              totalCorrect++;
            } else if (answer === 'regular') {
              totalCorrect += 0.5;
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
          if (answer === 'bueno') {
            subCorrect++;
          } else if (answer === 'regular') {
            subCorrect += 0.5;
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
        if (answer === 'bueno') {
          totalScore += 10;
          correctAnswers++;
        } else if (answer === 'regular') {
          totalScore += 5;
          correctAnswers += 0.5;
        }
      });

      const finalScore = totalQuestions > 0 ? Math.round((totalScore / (totalQuestions * 10)) * 100) : 0;

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        rol_personal: null,
        respuestas: Object.entries(answers).map(([key, answer]) => ({
          pregunta_id: null,
          respuesta: answer === 'bueno' ? 'si' : answer === 'malo' ? 'no' : 'na',
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
            if (answer === 'bueno') {
              sectionCorrect++;
            } else if (answer === 'regular') {
              sectionCorrect += 0.5;
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
                            {[
                              { value: 'bueno', label: 'Bueno', color: 'bg-green-500 hover:bg-green-600' },
                              { value: 'regular', label: 'Regular', color: 'bg-yellow-500 hover:bg-yellow-600' },
                              { value: 'malo', label: 'Malo', color: 'bg-red-500 hover:bg-red-600' }
                            ].map((option) => (
                              <label
                                key={option.value}
                                className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option.value}
                                  checked={selectedAnswer === option.value}
                                  onChange={() => handleAnswer(index, option.value)}
                                  className="mr-3 text-blue-600 focus:ring-blue-500"
                                />
                                <div className={`w-4 h-4 rounded-full ${option.color} mr-3`}></div>
                                <span className="text-gray-700">{option.label}</span>
                              </label>
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
        src="public/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
      />
    </div>
  );
};

export default EquipmentQuestionnaire;