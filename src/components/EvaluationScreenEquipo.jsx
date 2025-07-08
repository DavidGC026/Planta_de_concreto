import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, ClipboardCheck, CheckCircle, AlertTriangle } from 'lucide-react';
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

  // Tipos de planta disponibles
  const plantTypes = [
    { code: 'pequena', name: 'Planta Pequeña', description: 'Hasta 30 m³/h' },
    { code: 'mediana', name: 'Planta Mediana', description: '30-60 m³/h' },
    { code: 'grande', name: 'Planta Grande', description: 'Más de 60 m³/h' }
  ];

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
    const simulatedSectionResults = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    simulatedSections.forEach((section, sectionIndex) => {
      // Generar 6 subsecciones por sección
      const subsectionsPerSection = 6;
      const subsectionResults = [];
      let sectionCorrect = 0;
      let sectionTotal = 0;

      for (let subIndex = 0; subIndex < subsectionsPerSection; subIndex++) {
        const questionsPerSubsection = 3;
        let subsectionCorrect = 0;

        for (let qIndex = 0; qIndex < questionsPerSubsection; qIndex++) {
          const key = `${sectionIndex}-${subIndex}-${qIndex}`;
          
          // Generar respuesta aleatoria con tendencia hacia respuestas positivas
          const randomValue = Math.random();
          let answer;
          
          if (randomValue < 0.7) { // 70% probabilidad de "si"
            answer = 'si';
            subsectionCorrect++;
            sectionCorrect++;
            correctAnswers++;
          } else if (randomValue < 0.9) { // 20% probabilidad de "na"
            answer = 'na';
            subsectionCorrect++;
            sectionCorrect++;
            correctAnswers++;
          } else { // 10% probabilidad de "no"
            answer = 'no';
          }
          
          simulatedAnswers[key] = answer;
          sectionTotal++;
          totalQuestions++;
        }

        const subsectionPercentage = (subsectionCorrect / questionsPerSubsection) * 100;
        subsectionResults.push({
          name: `Subsección ${subIndex + 1}`,
          percentage: subsectionPercentage,
          correctAnswers: subsectionCorrect,
          totalQuestions: questionsPerSubsection
        });
      }

      const sectionPercentage = sectionTotal > 0 ? (sectionCorrect / sectionTotal) * 100 : 0;
      simulatedSectionResults.push({
        name: section.nombre,
        percentage: sectionPercentage,
        correctAnswers: sectionCorrect,
        totalQuestions: sectionTotal,
        ponderacion: section.ponderacion,
        subsections: subsectionResults
      });
    });

    // Calcular puntuación final
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Equipo Simulada - ${selectedPlantType || 'Planta Genérica'}`,
      sections: simulatedSectionResults,
      isEquipmentEvaluation: true,
      isSimulated: true,
      sectionResults: simulatedSectionResults
    };
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

  const handlePlantTypeSelect = async (plantTypeCode) => {
    setSelectedPlantType(plantTypeCode);
    setCurrentSection(0);
    setCurrentSubsection(0);
    setAnswers({});
    setSectionProgress({});
    await loadEvaluationData();
  };

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${currentSection}-${currentSubsection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  // Función para guardar progreso de subsección
  const saveSubsectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSectionData = evaluationData?.secciones?.[currentSection];
      const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];
      
      if (!currentSubsectionData) return;

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
        subseccion_nombre: currentSubsectionData?.nombre || `Subsección ${currentSubsection + 1}`,
        subseccion_orden: currentSubsection + 1,
        puntaje_subseccion: subsectionScore,
        puntaje_porcentaje: subsectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        tipo_planta: selectedPlantType,
        categoria: null
      });

      // Actualizar progreso local
      const progressKey = `${currentSection}-${currentSubsection}`;
      setSectionProgress(prev => ({
        ...prev,
        [progressKey]: {
          completed: true,
          score: subsectionPercentage,
          correctAnswers,
          totalQuestions
        }
      }));

    } catch (error) {
      console.error('Error saving subsection progress:', error);
    }
  };

  // Función para guardar progreso de sección completa
  const saveSectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSectionData = evaluationData?.secciones?.[currentSection];
      if (!currentSectionData) return;

      // Calcular progreso de toda la sección
      const sectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${currentSection}-`));
      
      let sectionScore = 0;
      let correctAnswers = 0;
      const totalQuestions = sectionAnswers.length;
      
      sectionAnswers.forEach(([, answer]) => {
        if (answer === 'si') {
          sectionScore += 10;
          correctAnswers++;
        } else if (answer === 'na') {
          sectionScore += 10;
          correctAnswers++;
        }
      });

      const sectionPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const totalSubsections = currentSectionData?.subsecciones?.length || 0;
      
      // Contar subsecciones completadas
      let subsectionsCompleted = 0;
      for (let i = 0; i < totalSubsections; i++) {
        const progressKey = `${currentSection}-${i}`;
        if (sectionProgress[progressKey]?.completed) {
          subsectionsCompleted++;
        }
      }

      // Guardar progreso de sección
      await apiService.guardarProgresoSeccion({
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        seccion_nombre: currentSectionData?.nombre || `Sección ${currentSection + 1}`,
        seccion_orden: currentSection + 1,
        puntaje_seccion: sectionScore,
        puntaje_porcentaje: sectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        tipo_planta: selectedPlantType,
        categoria: null
      });

    } catch (error) {
      console.error('Error saving section progress:', error);
    }
  };

  const handleNextSubsection = async () => {
    // Guardar progreso de la subsección actual
    await saveSubsectionProgress();

    const currentSectionData = evaluationData?.secciones?.[currentSection];
    const totalSubsections = currentSectionData?.subsecciones?.length || 0;

    if (currentSubsection < totalSubsections - 1) {
      setCurrentSubsection(prev => prev + 1);
    } else {
      // Completar sección y pasar a la siguiente
      await saveSectionProgress();
      handleNextSection();
    }
  };

  const handleNextSection = async () => {
    const totalSections = evaluationData?.secciones?.length || 0;

    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
      setCurrentSubsection(0);
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
      const totalQuestions = Object.keys(answers).length;
      let score = 0;
      let correctAnswers = 0;
      
      Object.values(answers).forEach(answer => {
        if (answer === 'si' || answer === 'na') {
          score += 10;
          correctAnswers++;
        }
      });

      const finalPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        rol_personal: null,
        tipo_planta: selectedPlantType,
        respuestas: Object.entries(answers).map(([key, answer]) => ({
          pregunta_id: null, // Para evaluación de equipo no hay pregunta_id real
          respuesta: answer,
          observacion: `Equipo: ${key} - Estado: ${answer}`
        })),
        observaciones: `Evaluación de equipo completada - Tipo de planta: ${selectedPlantType}`
      };

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      // Preparar resultados para mostrar
      const sectionResults = evaluationData?.secciones?.map((section, sectionIndex) => {
        const sectionAnswers = Object.entries(answers)
          .filter(([key]) => key.startsWith(`${sectionIndex}-`));
        
        let sectionCorrect = 0;
        sectionAnswers.forEach(([, answer]) => {
          if (answer === 'si' || answer === 'na') {
            sectionCorrect++;
          }
        });

        const sectionPercentage = sectionAnswers.length > 0 ? (sectionCorrect / sectionAnswers.length) * 100 : 0;

        return {
          name: section.nombre,
          percentage: sectionPercentage,
          correctAnswers: sectionCorrect,
          totalQuestions: sectionAnswers.length,
          ponderacion: section.ponderacion
        };
      }) || [];

      onComplete({
        answers,
        score: Math.round(result.puntuacion_ponderada || finalPercentage),
        totalAnswers: totalQuestions,
        correctAnswers,
        evaluationTitle: `Evaluación de Equipo - ${selectedPlantType}`,
        sections: evaluationData?.secciones || [],
        sectionResults,
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
        <Settings size={64} className="mb-4 text-blue-600" />
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
  const totalSubsections = currentSectionData?.subsecciones?.length || 0;
  const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];

  // Calcular progreso general
  const totalSubsectionsOverall = evaluationData.secciones.reduce((total, section) => {
    return total + (section.subsecciones?.length || 0);
  }, 0);

  const completedSubsections = Object.keys(sectionProgress).filter(key => 
    sectionProgress[key]?.completed
  ).length;

  const overallProgress = totalSubsectionsOverall > 0 
    ? (completedSubsections / totalSubsectionsOverall) * 100
    : 0;

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const currentSubsectionQuestions = currentSubsectionData?.preguntas || [];
  const allQuestionsAnswered = currentSubsectionQuestions.every((_, index) => {
    const key = `${currentSection}-${currentSubsection}-${index}`;
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
        {/* Botón de desarrollo para saltar a resultados - solo en primera sección y subsección */}
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
              Evaluación de Equipo - {selectedPlantType}
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(overallProgress)}% completado
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Sección {currentSection + 1} de {totalSections} - Subsección {currentSubsection + 1} de {totalSubsections}
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
                  <h2 className="text-xl font-semibold text-gray-800 text-center">
                    {currentSectionData?.nombre}
                  </h2>
                  <h3 className="text-lg text-gray-600 text-center mt-1">
                    {currentSubsectionData?.nombre}
                  </h3>
                  {/* Mostrar ponderación */}
                  {currentSubsectionData?.ponderacion_subseccion && (
                    <div className="text-center text-sm text-gray-600 mt-1">
                      Ponderación: {currentSubsectionData.ponderacion_subseccion}%
                    </div>
                  )}
                  {/* Indicador de progreso de subsección */}
                  <div className="mt-2 flex justify-center">
                    <div className="flex items-center space-x-2">
                      {sectionProgress[`${currentSection}-${currentSubsection}`]?.completed && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm text-gray-600">
                        {sectionProgress[`${currentSection}-${currentSubsection}`]?.completed 
                          ? 'Completada' 
                          : 'En progreso'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <div className="space-y-6">
                    {currentSubsectionQuestions.map((question, index) => {
                      const key = `${currentSection}-${currentSubsection}-${index}`;
                      const selectedAnswer = answers[key];

                      return (
                        <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-800 mb-4">
                            {index + 1}. {question.pregunta}
                          </h3>
                          
                          <div className="space-y-2">
                            {[
                              { value: 'si', label: 'Sí', color: 'bg-green-500 hover:bg-green-600' },
                              { value: 'no', label: 'No', color: 'bg-red-500 hover:bg-red-600' },
                              { value: 'na', label: 'No Aplica', color: 'bg-gray-500 hover:bg-gray-600' }
                            ].map((option) => (
                              <label
                                key={option.value}
                                className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentSection}-${currentSubsection}-${index}`}
                                  value={option.value}
                                  checked={selectedAnswer === option.value}
                                  onChange={() => handleAnswer(index, option.value)}
                                  className="mr-3 text-blue-600 focus:ring-blue-500"
                                />
                                <div className={`w-4 h-4 rounded-full mr-3 ${option.color}`}></div>
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
                          : currentSection < totalSections - 1 
                            ? 'Siguiente Sección' 
                            : 'Finalizar Evaluación'
                        }
                      </span>
                    </Button>
                  </div>

                  {/* Contador de progreso */}
                  <div className="mt-6 text-center text-sm text-gray-500">
                    Subsecciones completadas: {completedSubsections} de {totalSubsectionsOverall}
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