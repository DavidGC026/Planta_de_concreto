import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, Settings, Zap, Loader2, BarChart3, List, Play } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';
import SectionCompletionModal from '@/components/SectionCompletionModal';
import EvaluationSummaryModal from '@/components/EvaluationSummaryModal';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [showSectionSelection, setShowSectionSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [completedSections, setCompletedSections] = useState({});
  const [sectionResults, setSectionResults] = useState({});
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentSectionModalData, setCurrentSectionModalData] = useState(null);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    if (!evaluationStarted) {
      // No cargar datos hasta que se seleccione el tipo de planta
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
      setShowSectionSelection(true); // Mostrar selección de secciones

      // Cargar progreso previo si existe
      await loadPreviousProgress();
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

  const loadPreviousProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progress = await equipmentProgressService.getProgress(user.id, selectedPlantType);
      const formattedProgress = equipmentProgressService.formatProgressForComponent(progress);
      setCompletedSections(formattedProgress);

      // Actualizar resultados de secciones
      const newSectionResults = {};
      progress.secciones?.forEach(section => {
        if (section.completada) {
          newSectionResults[section.seccion_id] = {
            percentage: section.puntaje_porcentaje || 0,
            correctAnswers: section.respuestas_correctas || 0,
            totalQuestions: section.total_preguntas || 0,
            subsectionResults: section.subsecciones?.map(sub => ({
              name: sub.nombre,
              percentage: sub.puntaje_porcentaje || 0,
              correctAnswers: sub.respuestas_correctas || 0,
              totalQuestions: sub.total_preguntas || 0
            })) || []
          };
        }
      });
      setSectionResults(newSectionResults);

    } catch (error) {
      console.error('Error loading previous progress:', error);
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

  const handlePlantTypeSelect = async (plantType) => {
    setSelectedPlantType(plantType);
    setCurrentSection(0);
    setCurrentSubsection(0);
    setAnswers({});
    await loadEvaluationData();
  };

  // Nueva función para seleccionar una sección específica
  const handleSectionSelect = (sectionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentSubsection(0);
    setShowSectionSelection(false);
  };

  // Función para volver al menú de selección de secciones
  const handleBackToSectionSelection = () => {
    setShowSectionSelection(true);
  };

  const saveSubsectionProgress = async () => {
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
          subsectionScore += 10;
          correctAnswers++;
        }
      });

      const subsectionPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

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

      // Calcular resultados de toda la sección
      const sectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${currentSection}-`));
      
      let sectionScore = 0;
      let sectionCorrect = 0;
      const sectionTotal = sectionAnswers.length;
      
      sectionAnswers.forEach(([, answer]) => {
        if (answer === 'si' || answer === 'na') {
          sectionScore += 10;
          sectionCorrect++;
        }
      });

      const sectionPercentage = sectionTotal > 0 ? (sectionCorrect / sectionTotal) * 100 : 0;

      // Calcular resultados por subsección
      const subsectionResults = [];
      const totalSubsections = currentSectionData?.subsecciones?.length || 0;

      for (let i = 0; i < totalSubsections; i++) {
        const subsectionAnswers = Object.entries(answers)
          .filter(([key]) => key.startsWith(`${currentSection}-${i}-`));
        
        let subsectionCorrect = 0;
        const subsectionTotal = subsectionAnswers.length;
        
        subsectionAnswers.forEach(([, answer]) => {
          if (answer === 'si' || answer === 'na') {
            subsectionCorrect++;
          }
        });

        const subsectionPercentage = subsectionTotal > 0 ? (subsectionCorrect / subsectionTotal) * 100 : 0;
        const subsection = currentSectionData?.subsecciones?.[i];

        subsectionResults.push({
          name: subsection?.nombre || `Subsección ${i + 1}`,
          percentage: subsectionPercentage,
          correctAnswers: subsectionCorrect,
          totalQuestions: subsectionTotal,
          ponderacion: parseFloat(subsection?.ponderacion_subseccion) || 0
        });
      }

      // Guardar progreso de sección completa
      await equipmentProgressService.saveSectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: currentSectionData?.id,
        seccion_nombre: currentSectionData?.nombre,
        puntaje_obtenido: sectionScore,
        puntaje_porcentaje: sectionPercentage,
        total_subsecciones: totalSubsections,
        subsecciones_completadas: totalSubsections,
        respuestas_correctas: sectionCorrect,
        total_preguntas: sectionTotal
      });

      // Actualizar estado local
      setSectionResults(prev => ({
        ...prev,
        [currentSectionData?.id]: {
          percentage: sectionPercentage,
          correctAnswers: sectionCorrect,
          totalQuestions: sectionTotal,
          subsectionResults
        }
      }));

      setCompletedSections(prev => ({
        ...prev,
        [currentSectionData?.id]: {
          completed: true,
          score: sectionPercentage,
          correctAnswers: sectionCorrect,
          totalQuestions: sectionTotal
        }
      }));

      // Preparar datos para el modal
      const modalData = {
        sectionName: currentSectionData?.nombre,
        overallPercentage: sectionPercentage,
        totalCorrect: sectionCorrect,
        totalQuestions: sectionTotal,
        subsectionResults,
        ponderacion: parseFloat(currentSectionData?.ponderacion) || 0,
        recommendations: generateSectionRecommendations(sectionPercentage, currentSectionData?.nombre)
      };

      setCurrentSectionModalData(modalData);
      setShowSectionModal(true);

    } catch (error) {
      console.error('Error completing section:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso de la sección"
      });
    }
  };

  const generateSectionRecommendations = (percentage, sectionName) => {
    const recommendations = [];
    
    if (percentage < 60) {
      recommendations.push(`Revisar y mejorar el estado general de ${sectionName?.toLowerCase()}`);
      recommendations.push('Implementar plan de mantenimiento correctivo inmediato');
      recommendations.push('Capacitar al personal en el uso adecuado de equipos');
    } else if (percentage < 80) {
      recommendations.push(`Optimizar algunos aspectos de ${sectionName?.toLowerCase()}`);
      recommendations.push('Implementar mantenimiento preventivo regular');
      recommendations.push('Revisar procedimientos operativos');
    } else {
      recommendations.push(`Excelente estado de ${sectionName?.toLowerCase()}`);
      recommendations.push('Mantener los estándares actuales de operación');
      recommendations.push('Continuar con el programa de mantenimiento preventivo');
    }

    return recommendations;
  };

  const handleSectionModalContinue = () => {
    setShowSectionModal(false);
    // Volver al menú de selección de secciones
    setShowSectionSelection(true);
  };

  const showFinalSummary = () => {
    // Calcular datos del resumen final
    const finalSectionResults = [];
    let totalQuestions = 0;
    let totalCorrect = 0;
    let weightedScore = 0;
    let totalWeight = 0;

    evaluationData?.secciones?.forEach((section, index) => {
      const sectionResult = sectionResults[section.id];
      if (sectionResult) {
        const weight = parseFloat(section.ponderacion) || 0;
        weightedScore += (sectionResult.percentage * weight) / 100;
        totalWeight += weight;
        totalQuestions += sectionResult.totalQuestions;
        totalCorrect += sectionResult.correctAnswers;

        finalSectionResults.push({
          name: section.nombre,
          percentage: sectionResult.percentage,
          correctAnswers: sectionResult.correctAnswers,
          totalQuestions: sectionResult.totalQuestions,
          ponderacion: weight
        });
      }
    });

    const overallScore = totalWeight > 0 ? weightedScore : 0;

    const summaryData = {
      sectionResults: finalSectionResults,
      overallScore: Math.round(overallScore),
      totalQuestions,
      correctAnswers: totalCorrect
    };

    setCurrentSectionModalData(summaryData);
    setShowSummaryModal(true);
  };

  const handleSummaryFinish = () => {
    setShowSummaryModal(false);
    
    // Preparar datos finales para onComplete
    const finalResults = {
      answers,
      score: currentSectionModalData?.overallScore || 0,
      totalAnswers: currentSectionModalData?.totalQuestions || 0,
      correctAnswers: currentSectionModalData?.correctAnswers || 0,
      evaluationTitle: `Evaluación de Equipo - Planta ${selectedPlantType}`,
      sections: evaluationData?.secciones || [],
      sectionResults: currentSectionModalData?.sectionResults || [],
      isEquipmentEvaluation: true,
      plantType: selectedPlantType
    };

    onComplete(finalResults);
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

  // Pantalla de selección de secciones
  if (showSectionSelection) {
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
              Evaluación de Equipo - Planta {selectedPlantType?.charAt(0).toUpperCase() + selectedPlantType?.slice(1)}
            </h2>
            <p className="text-white/80 text-lg">Selecciona la sección que deseas evaluar</p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/90 text-gray-800 border-gray-300 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Menú
            </Button>

            <div className="flex space-x-4">
              <Button
                onClick={handleSkipToResults}
                variant="outline"
                className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                Ver Simulación
              </Button>

              <Button
                onClick={showFinalSummary}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={Object.keys(sectionResults).length === 0}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Resumen Final
              </Button>
            </div>
          </div>

          {/* Grid de secciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluationData?.secciones?.map((section, index) => {
              const isCompleted = completedSections[section.id]?.completed || false;
              const sectionResult = sectionResults[section.id];
              const completionPercentage = sectionResult?.percentage || 0;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`bg-white/95 backdrop-blur-sm border-2 transition-all duration-200 hover:shadow-xl ${
                    isCompleted 
                      ? 'border-green-500 bg-green-50/50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-800 mb-1">
                            {section.nombre}
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            {section.subsecciones?.length || 0} subsecciones
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCompleted && (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          )}
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-600">
                              Peso: {parseFloat(section.ponderacion || 0).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Barra de progreso */}
                      {isCompleted && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Completado</span>
                            <span>{Math.round(completionPercentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                completionPercentage >= 80 ? 'bg-green-500' :
                                completionPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Subsecciones */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Subsecciones:</h4>
                        <div className="space-y-1">
                          {section.subsecciones?.slice(0, 3).map((subsection, subIndex) => (
                            <div key={subIndex} className="text-xs text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0" />
                              <span className="truncate">{subsection.nombre}</span>
                            </div>
                          ))}
                          {section.subsecciones?.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{section.subsecciones.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <Button
                        onClick={() => handleSectionSelect(index)}
                        className={`w-full ${
                          isCompleted 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isCompleted ? 'Revisar Sección' : 'Iniciar Evaluación'}
                      </Button>

                      {/* Estadísticas si está completada */}
                      {isCompleted && sectionResult && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium text-green-600">
                                {sectionResult.correctAnswers}
                              </div>
                              <div className="text-gray-500">Correctas</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-600">
                                {sectionResult.totalQuestions}
                              </div>
                              <div className="text-gray-500">Total</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Estadísticas generales */}
          <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <List className="w-5 h-5 mr-2 text-blue-600" />
              Progreso General
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(sectionResults).length}
                </div>
                <div className="text-sm text-gray-600">Secciones Completadas</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {evaluationData?.secciones?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Total de Secciones</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(sectionResults).reduce((sum, result) => sum + result.correctAnswers, 0)}
                </div>
                <div className="text-sm text-gray-600">Respuestas Correctas</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(sectionResults).reduce((sum, result) => sum + result.totalQuestions, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Evaluado</div>
              </div>
            </div>

            {/* Barra de progreso general */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progreso General</span>
                <span>
                  {Math.round((Object.keys(sectionResults).length / (evaluationData?.secciones?.length || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(Object.keys(sectionResults).length / (evaluationData?.secciones?.length || 1)) * 100}%` 
                  }}
                />
              </div>
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

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = currentSubsectionData?.preguntas?.every((_, index) => {
    const key = `${currentSection}-${currentSubsection}-${index}`;
    return answers[key] !== undefined;
  });

  // Calcular estadísticas mejoradas
  const calculateEnhancedStats = () => {
    if (!evaluationData?.secciones) {
      return null;
    }

    const totalSections = evaluationData.secciones.length;
    const completedSectionsCount = Object.keys(completedSections).filter(key => 
      completedSections[key].completed && !key.includes('-')
    ).length;

    const progressPercentage = totalSections > 0 ? (completedSectionsCount / totalSections) * 100 : 0;

    // Información detallada por sección
    const sectionsInfo = evaluationData.secciones.map((section, sectionIndex) => {
      const sectionResult = sectionResults[section.id];
      const isCompleted = completedSections[section.id]?.completed || false;
      const isCurrentSection = sectionIndex === currentSection;

      return {
        nombre: section.nombre,
        ponderacion: parseFloat(section.ponderacion) || 0,
        totalSubsecciones: section.subsecciones?.length || 0,
        isCurrentSection,
        isCompleted,
        puntuacion: sectionResult?.percentage || 0,
        respuestasCorrectas: sectionResult?.correctAnswers || 0,
        totalPreguntas: sectionResult?.totalQuestions || 0
      };
    });

    return {
      totalSections,
      completedSectionsCount,
      progressPercentage,
      sectionsInfo,
      currentSectionName: currentSectionData?.nombre,
      currentSubsectionName: currentSubsectionData?.nombre
    };
  };

  const enhancedStats = calculateEnhancedStats();

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
        {/* Botón para volver a selección de secciones */}
        <div className="mb-4 flex justify-between items-center">
          <Button
            onClick={handleBackToSectionSelection}
            variant="outline"
            className="bg-white/90 text-gray-800 border-gray-300 hover:bg-white"
          >
            <List className="w-4 h-4 mr-2" />
            Seleccionar Otra Sección
          </Button>

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

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className={`${enhancedStats ? 'w-3/5' : 'w-full'}`}>
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

          {/* Panel de estadísticas mejorado */}
          {enhancedStats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Progreso de Evaluación
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-4">
                    {/* Progreso actual */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sección Actual</h4>
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-blue-600">{enhancedStats.currentSectionName}</div>
                        <div className="text-xs text-gray-500">{enhancedStats.currentSubsectionName}</div>
                      </div>
                    </div>

                    {/* Tabla de secciones */}
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Estado de Secciones</h4>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-2 font-medium text-gray-700">Sección</th>
                            <th className="text-center p-2 font-medium text-gray-700">Estado</th>
                            <th className="text-center p-2 font-medium text-gray-700">Peso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enhancedStats.sectionsInfo.map((section, index) => (
                            <tr
                              key={index}
                              className={`border-b border-gray-100 ${
                                section.isCurrentSection ? 'bg-blue-50' :
                                section.isCompleted ? 'bg-green-50' : ''
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
                                  {section.isCurrentSection && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-1 flex-shrink-0" />
                                  )}
                                  {section.isCompleted && (
                                    <CheckCircle className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" />
                                  )}
                                </div>
                              </td>
                              <td className="text-center p-2 text-xs">
                                {section.isCompleted ? (
                                  <span className="text-green-600 font-medium">
                                    {Math.round(section.puntuacion)}%
                                  </span>
                                ) : section.isCurrentSection ? (
                                  <span className="text-blue-600 font-medium">En curso</span>
                                ) : (
                                  <span className="text-gray-400">Pendiente</span>
                                )}
                              </td>
                              <td className="text-center p-2 text-xs font-medium">
                                {section.ponderacion.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td className="p-2 text-xs">TOTAL</td>
                            <td className="text-center p-2 text-xs">
                              {Math.round(enhancedStats.progressPercentage)}%
                            </td>
                            <td className="text-center p-2 text-xs">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Progreso general */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Progreso general</h4>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Secciones completadas</span>
                        <span>{enhancedStats.completedSectionsCount}/{enhancedStats.totalSections}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enhancedStats.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(enhancedStats.progressPercentage)}% del total
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <SectionCompletionModal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        onContinue={handleSectionModalContinue}
        sectionData={currentSectionModalData}
        plantType={selectedPlantType}
      />

      <EvaluationSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onFinish={handleSummaryFinish}
        evaluationData={currentSectionModalData}
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

export default EvaluationScreenEquipo;