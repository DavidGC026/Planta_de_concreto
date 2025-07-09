import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, ClipboardCheck, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [showSectionSelection, setShowSectionSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [savedProgress, setSavedProgress] = useState({});
  const [completedSubsections, setCompletedSubsections] = useState(new Set());
  const [completedSections, setCompletedSections] = useState(new Set());

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    if (!evaluationStarted) {
      // Para evaluación de equipo, no necesitamos cargar roles
      // Mostrar directamente la selección de tipo de planta
    }
  }, []);

  // Cargar progreso guardado cuando se selecciona tipo de planta
  useEffect(() => {
    if (selectedPlantType && evaluationStarted) {
      loadSavedProgress();
    }
  }, [selectedPlantType, evaluationStarted]);

  const loadSavedProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progress = await equipmentProgressService.getProgress(user.id, selectedPlantType);
      const formattedProgress = equipmentProgressService.formatProgressForComponent(progress);
      setSavedProgress(formattedProgress);

      // Log para debugging
      console.log('Progreso cargado:', formattedProgress);

    } catch (error) {
      console.error('Error loading saved progress:', error);
      // No mostrar error al usuario, solo log
    }
  };

  // Scroll al inicio cuando cambia la sección o subsección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentSection, currentSubsection]);

  // Cargar progreso guardado cuando se selecciona tipo de planta
  const loadSavedProgress = async (plantType) => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progress = await equipmentProgressService.getProgress(user.id, plantType);

      if (progress && progress.secciones) {
        const progressData = {};
        const completedSubs = new Set();
        const completedSecs = new Set();

        progress.secciones.forEach(seccion => {
          // Marcar sección como completada si está completada
          if (seccion.completada) {
            completedSecs.add(seccion.seccion_id);
          }

          // Procesar subsecciones
          if (seccion.subsecciones) {
            seccion.subsecciones.forEach(subseccion => {
              if (subseccion.completada) {
                const key = `${seccion.seccion_id}-${subseccion.subseccion_id}`;
                completedSubs.add(key);

                // Marcar todas las preguntas de esta subsección como respondidas
                progressData[key] = {
                  completed: true,
                  score: subseccion.puntaje_porcentaje || 0,
                  subsectionId: subseccion.subseccion_id,
                  sectionId: seccion.seccion_id
                };
              }
            });
          }
        });

        setSavedProgress(progressData);
        setCompletedSubsections(completedSubs);
        setCompletedSections(completedSecs);

        console.log('Progreso cargado:', {
          progressData,
          completedSubs: Array.from(completedSubs),
          completedSecs: Array.from(completedSecs)
        });
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
      // No mostrar error al usuario, solo log
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

      // Cargar progreso guardado después de cargar los datos de evaluación
      await loadSavedProgress(selectedPlantType);

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
    if (!evaluationData?.secciones) {
      // Datos simulados si no hay datos reales
      const simulatedSections = [
        { nombre: 'Producción y Mezclado', ponderacion: 19.90 },
        { nombre: 'Transporte y Entrega', ponderacion: 12.04 },
        { nombre: 'Control de Calidad', ponderacion: 18.50 },
        { nombre: 'Mantenimiento', ponderacion: 15.20 },
        { nombre: 'Seguridad y Medio Ambiente', ponderacion: 20.36 },
        { nombre: 'Gestión y Administración', ponderacion: 14.00 }
      ];

      return generateSimulatedResults(simulatedSections);
    }

    return generateSimulatedResults(evaluationData.secciones);
  };

  const generateSimulatedResults = (sections) => {
    const simulatedAnswers = {};
    const simulatedSectionResults = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    sections.forEach((section, sectionIndex) => {
      const subsections = section.subsecciones || [];
      const subsectionResults = [];
      let sectionCorrect = 0;
      let sectionTotal = 0;

      if (subsections.length > 0) {
        // Procesar subsecciones
        subsections.forEach((subsection, subsectionIndex) => {
          const questionsPerSubsection = 5;
          let subsectionCorrect = 0;

          for (let i = 0; i < questionsPerSubsection; i++) {
            const key = `${sectionIndex}-${subsectionIndex}-${i}`;
            const randomValue = Math.random();
            let answer;

            if (randomValue < 0.7) {
              answer = 'si';
              subsectionCorrect++;
              sectionCorrect++;
              correctAnswers++;
            } else if (randomValue < 0.9) {
              answer = 'na';
              subsectionCorrect++;
              sectionCorrect++;
              correctAnswers++;
            } else {
              answer = 'no';
            }

            simulatedAnswers[key] = answer;
            sectionTotal++;
            totalQuestions++;
          }

          const subsectionPercentage = (subsectionCorrect / questionsPerSubsection) * 100;
          subsectionResults.push({
            name: subsection.nombre,
            percentage: subsectionPercentage,
            correctAnswers: subsectionCorrect,
            totalQuestions: questionsPerSubsection,
            ponderacion: parseFloat(subsection.ponderacion_subseccion) || 0
          });
        });
      } else {
        // Sección sin subsecciones
        const questionsPerSection = 10;
        for (let i = 0; i < questionsPerSection; i++) {
          const key = `${sectionIndex}-${i}`;
          const randomValue = Math.random();
          let answer;

          if (randomValue < 0.7) {
            answer = 'si';
            sectionCorrect++;
            correctAnswers++;
          } else if (randomValue < 0.9) {
            answer = 'na';
            sectionCorrect++;
            correctAnswers++;
          } else {
            answer = 'no';
          }

          simulatedAnswers[key] = answer;
          sectionTotal++;
          totalQuestions++;
        }
      }

      const sectionPercentage = sectionTotal > 0 ? (sectionCorrect / sectionTotal) * 100 : 0;
      simulatedSectionResults.push({
        name: section.nombre,
        percentage: sectionPercentage,
        correctAnswers: sectionCorrect,
        totalQuestions: sectionTotal,
        ponderacion: parseFloat(section.ponderacion) || 0,
        subsectionResults
      });
    });

    // Calcular puntuación final ponderada
    let finalScore = 0;
    let totalWeight = 0;

    simulatedSectionResults.forEach(section => {
      const weight = section.ponderacion || 0;
      finalScore += (section.percentage * weight) / 100;
      totalWeight += weight;
    });

    const finalPercentage = totalWeight > 0 ? finalScore : 0;

    return {
      answers: simulatedAnswers,
      score: Math.round(finalPercentage),
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Equipo Simulada - Planta ${selectedPlantType}`,
      sections: sections,
      sectionResults: simulatedSectionResults,
      isEquipmentEvaluation: true,
      isSimulated: true,
      plantType: selectedPlantType
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

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${currentSectionData.id}-${currentSubsectionData.id}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const handlePlantTypeSelect = async (plantType) => {
    setSelectedPlantType(plantType);
    setCurrentSection(0);
    setCurrentSubsection(0);
    setAnswers({});
    setSavedProgress({});
    setCompletedSubsections(new Set());
    setCompletedSections(new Set());
    await loadEvaluationData();
  };

  const handleSubsectionSelect = (subsection) => {
    const sectionIndex = evaluationData.secciones.findIndex(s =>
      s.subsecciones.some(sub => sub.id === subsection.id)
    );
    const subsectionIndex = evaluationData.secciones[sectionIndex].subsecciones.findIndex(
      sub => sub.id === subsection.id
    );

    setCurrentSection(sectionIndex);
    setCurrentSubsection(subsectionIndex);
  };

  const saveSubsectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSectionData = evaluationData?.secciones?.[sectionIndex];
      const currentSubsectionData = currentSectionData?.subsecciones?.[subsectionIndex];

      if (!currentSectionData || !currentSubsectionData) return;

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
          subsectionScore += 10;
          correctAnswers++;
        }
        // 'no' = 0 puntos y no cuenta como correcta
      });

      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Guardar progreso de subsección
      await equipmentProgressService.saveSubsectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: currentSectionData?.id,
        subseccion_id: currentSubsectionData?.id,
        subseccion_nombre: currentSubsectionData?.nombre,
        puntaje_obtenido: subsectionScore,
        puntaje_porcentaje: subsectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions
      });

      // Marcar subsección como completada
      const subsectionKey = `${currentSectionData?.id}-${currentSubsectionData?.id}`;
      setCompletedSections(prev => ({
        ...prev,
        [subsectionKey]: {
          completed: true,
          score: subsectionPercentage,
          subsectionId: currentSubsectionData?.id,
          sectionId: currentSectionData?.id
        }
      }));

      console.log(`Progreso de subsección guardado: ${currentSubsectionData.nombre} - ${subsectionPercentage}%`);

    } catch (error) {
      console.error('Error saving subsection progress:', error);
    }
  };

  const handleNextSubsection = async () => {
    // Guardar progreso de la subsección actual
    await saveSubsectionProgress();

    const totalSubsections = currentSectionData?.subsecciones?.length || 0;

    if (currentSubsection < totalSubsections - 1) {
      setCurrentSubsection(prev => prev + 1);
    } else {
      // Completar sección y mostrar modal
      await completeSectionAndShowModal();
    }
  };

  const completeSectionAndShowModal = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      // Calcular estadísticas generales de la sección
      let totalCorrect = 0;
      let totalQuestions = 0;

      allSubsectionResults.forEach(result => {
        totalCorrect += result.correctAnswers;
        totalQuestions += result.totalQuestions;
      });

      const overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Guardar progreso de sección completa
      await equipmentProgressService.saveSectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: sectionData.id,
        seccion_nombre: sectionData.nombre,
        puntaje_obtenido: overallPercentage,
        puntaje_porcentaje: overallPercentage,
        total_subsecciones: sectionData.subsecciones.length,
        subsecciones_completadas: allSubsectionResults.length,
        respuestas_correctas: totalCorrect,
        total_preguntas: totalQuestions
      });

      // Actualizar estado local
      setCompletedSections(prev => new Set([...prev, sectionData.id]));

    } catch (error) {
      console.error('Error saving section progress:', error);
      // No interrumpir el flujo por errores de guardado
    }
  };

  const handleNextSubsection = async () => {
    const currentSectionData = evaluationData.secciones[currentSection];
    const currentSubsectionData = currentSectionData.subsecciones[currentSubsection];

    // Obtener respuestas de la subsección actual
    const subsectionAnswers = {};
    currentSubsectionData.preguntas.forEach((_, index) => {
      const key = `${currentSectionData.id}-${currentSubsectionData.id}-${index}`;
      if (answers[key]) {
        subsectionAnswers[key] = answers[key];
      }
    });

    // Guardar progreso de la subsección actual
    await saveSubsectionProgress(currentSectionData, currentSubsectionData, subsectionAnswers);

    const isLastSubsection = currentSubsection === currentSectionData.subsecciones.length - 1;

    if (isLastSubsection) {
      // Calcular resultados de todas las subsecciones de esta sección
      const allSubsectionResults = [];

      currentSectionData.subsecciones.forEach((subsection, index) => {
        const subsectionAnswers = {};
        let correctAnswers = 0;
        let totalQuestions = 0;

        subsection.preguntas.forEach((_, qIndex) => {
          const key = `${currentSectionData.id}-${subsection.id}-${qIndex}`;
          if (answers[key]) {
            totalQuestions++;
            if (answers[key] === 'si') {
              correctAnswers++;
            }
          }
        });

        allSubsectionResults.push({
          correctAnswers,
          totalQuestions,
          percentage: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
        });
      });

      // Guardar progreso de toda la sección
      await saveSectionProgress(currentSectionData, allSubsectionResults);

      // Mostrar resultados de la sección y volver al menú de secciones
      toast({
        title: "✅ Sección Completada",
        description: `Has completado la sección: ${currentSectionData.nombre}`
      });

      // Volver al menú de selección de secciones
      setCurrentSection(0);
      setCurrentSubsection(0);
    } else {
      // Ir a la siguiente subsección
      setCurrentSubsection(prev => prev + 1);
    }
  };

  // Verificar si una subsección está completada
  const isSubsectionCompleted = (sectionId, subsectionId) => {
    const key = `${sectionId}-${subsectionId}`;
    return completedSubsections.has(key);
  };

  // Verificar si una sección está completada
  const isSectionCompleted = (sectionId) => {
    return completedSections.has(sectionId);
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
        <Settings size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron secciones para esta evaluación.</p>
        <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
        </Button>
      </div>
    );
  }

  const currentSectionData = evaluationData.secciones[currentSection];
  const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = currentSubsectionData?.preguntas?.every((_, index) => {
    const key = `${currentSectionData.id}-${currentSubsectionData.id}-${index}`;
    return answers[key] !== undefined;
  });

  const isLastSubsection = currentSubsection === (currentSectionData?.subsecciones?.length || 0) - 1;

  // Si no hay subsección actual, mostrar selección de subsecciones
  if (!currentSubsectionData) {
    const sectionData = evaluationData.secciones[currentSection];

    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {sectionData.nombre}
            </h2>
            <p className="text-white/80 text-lg">
              Selecciona la subsección que deseas evaluar
            </p>
          </div>

          {/* Botón para volver */}
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/90 text-gray-800 border-gray-300 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Menú
            </Button>
          </div>

          {/* Grid de subsecciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sectionData.subsecciones.map((subsection, index) => {
              const isCompleted = isSubsectionCompleted(sectionData.id, subsection.id);
              const buttonColor = isCompleted
                ? 'bg-green-600 hover:bg-green-700 border-green-600'
                : 'bg-blue-600 hover:bg-blue-700 border-blue-600';

              return (
                <motion.div
                  key={subsection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => handleSubsectionSelect(subsection)}
                    className={`w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-left border-2 ${
                      isCompleted
                        ? 'border-green-300 bg-green-50/50 hover:border-green-400 hover:bg-green-50/70'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {subsection.nombre}
                          {isCompleted && (
                            <CheckCircle className="inline-block w-5 h-5 text-green-600 ml-2" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Ponderación: {subsection.ponderacion_subseccion}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        className={`w-full ${buttonColor} text-white font-medium py-2 px-4 rounded-lg border-2 flex items-center justify-center space-x-2`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Ver Completada</span>
                          </>
                        ) : (
                          <span>Iniciar Evaluación</span>
                        )}
                      </Button>
                    </div>
                  </button>
                </motion.div>
              );
            })}
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8" ref={evaluationContentRef}>
        {/* Botón para saltar a resultados */}
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

        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Evaluación de Equipo - Planta {selectedPlantType}
            </h2>
            <span className="text-sm text-gray-600">
              Subsección {currentSubsection + 1} de {currentSectionData?.subsecciones?.length || 0}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="flex h-full">
              {Array.from({ length: currentSectionData?.subsecciones?.length || 0 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < currentSubsection ? 'bg-blue-600' :
                    i === currentSubsection ? 'bg-blue-400' : 'bg-gray-300'}
                    ${i < (currentSectionData?.subsecciones?.length || 0) - 1 ? 'mr-1' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

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
                <h3 className="text-lg font-medium text-gray-600 text-center mt-1">
                  {currentSubsectionData?.nombre}
                </h3>
                {/* Mostrar ponderación */}
                <div className="text-center text-sm text-gray-600 mt-1">
                  Ponderación de sección: {parseFloat(currentSectionData?.ponderacion || 0).toFixed(2)}%
                  {currentSubsectionData?.ponderacion_subseccion && (
                    <span className="ml-2">
                      | Subsección: {parseFloat(currentSubsectionData.ponderacion_subseccion || 0).toFixed(2)}%
                    </span>
                  )}
                </div>
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
                          {currentSubsection < (currentSectionData?.subsecciones?.length || 0) - 1
                            ? 'Siguiente Subsección'
                            : 'Completar Sección'}
                        </span>
                      </Button>
                    </div>

                {/* Contador de progreso */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  Subsección {currentSubsection + 1} de {currentSectionData?.subsecciones?.length || 0}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
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
