import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, ClipboardCheck, CheckCircle, Clock, BarChart3, Award, TrendingUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';

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

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentScreen, setCurrentScreen] = useState('plantSelection'); // plantSelection, sectionsList, evaluation, results
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [finalResults, setFinalResults] = useState(null);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Tipos de planta disponibles
  const plantTypes = [
    { id: 'pequena', name: 'Planta Pequeña', description: 'Capacidad hasta 30 m³/h' },
    { id: 'mediana', name: 'Planta Mediana', description: 'Capacidad 30-60 m³/h' },
    { id: 'grande', name: 'Planta Grande', description: 'Capacidad mayor a 60 m³/h' }
  ];

  useEffect(() => {
    if (selectedPlantType && currentScreen === 'sectionsList') {
      loadEvaluationData();
      loadProgressData();
    }
  }, [selectedPlantType, currentScreen]);

  // Scroll al inicio cuando cambia la sección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentSection, currentSubsection]);

  // Verificar si todas las secciones están completadas
  useEffect(() => {
    if (progressData && evaluationData) {
      checkAllSectionsCompleted();
    }
  }, [progressData, evaluationData]);

  const checkAllSectionsCompleted = () => {
    if (!progressData?.secciones || !evaluationData?.secciones) return;

    const totalSections = evaluationData.secciones.length;
    const completedSectionsCount = progressData.secciones.filter(s => s.completada).length;

    if (totalSections > 0 && completedSectionsCount === totalSections) {
      // Todas las secciones están completadas, generar resultados finales
      generateFinalResults();
    }
  };

  const generateFinalResults = () => {
    if (!progressData?.secciones) return;

    // Calcular estadísticas generales
    let totalQuestions = 0;
    let totalCorrectAnswers = 0;
    let totalScore = 0;
    const sectionResults = [];

    progressData.secciones.forEach(section => {
      totalQuestions += section.total_preguntas || 0;
      totalCorrectAnswers += section.respuestas_correctas || 0;
      totalScore += section.puntaje_porcentaje || 0;

      // Preparar datos de subsecciones para la sección
      const subsectionResults = section.subsecciones?.map(sub => ({
        name: sub.nombre,
        percentage: sub.puntaje_porcentaje || 0,
        correctAnswers: sub.respuestas_correctas || 0,
        totalQuestions: sub.total_preguntas || 0
      })) || [];

      sectionResults.push({
        name: section.seccion_nombre,
        percentage: section.puntaje_porcentaje || 0,
        correctAnswers: section.respuestas_correctas || 0,
        totalQuestions: section.total_preguntas || 0,
        ponderacion: section.ponderacion || 0,
        subsections: subsectionResults
      });
    });

    const overallScore = sectionResults.length > 0 ? totalScore / sectionResults.length : 0;

    const results = {
      evaluationTitle: `Evaluación de Equipo - Planta ${selectedPlantType}`,
      score: Math.round(overallScore),
      totalAnswers: totalQuestions,
      correctAnswers: totalCorrectAnswers,
      sections: sectionResults,
      sectionResults: sectionResults,
      overallScore: overallScore,
      plantType: selectedPlantType,
      isEquipmentEvaluation: true,
      completedDate: new Date().toISOString()
    };

    setFinalResults(results);
    setCurrentScreen('results');

    toast({
      title: "🎉 Evaluación Completada",
      description: "Todas las secciones han sido completadas. Mostrando resultados finales."
    });
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

  const loadProgressData = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progress = await equipmentProgressService.getProgress(user.id, selectedPlantType);
      setProgressData(progress);

      // Actualizar conjunto de secciones completadas
      if (progress?.secciones) {
        const completed = new Set(
          progress.secciones
            .filter(s => s.completada)
            .map(s => s.seccion_id)
        );
        setCompletedSections(completed);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setCurrentScreen('sectionsList');
    setCurrentSection(0);
    setCurrentSubsection(0);
    setAnswers({});
  };

  const handleSectionSelect = (sectionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentSubsection(0);
    setCurrentScreen('evaluation');
  };

  const handleBackToSections = () => {
    setCurrentScreen('sectionsList');
    setCurrentSection(0);
    setCurrentSubsection(0);
  };

  const handleBackToPlantSelection = () => {
    setCurrentScreen('plantSelection');
    setSelectedPlantType(null);
    setEvaluationData(null);
    setProgressData(null);
    setCompletedSections(new Set());
  };

  // Función para generar evaluación simulada
  const generateSimulatedEvaluation = () => {
    const simulatedAnswers = {};
    let totalItems = 0;
    let goodItems = 0;

    plantStatusEvaluation.sections.forEach((section, sectionIndex) => {
      section.items.forEach((item, itemIndex) => {
        const key = `${sectionIndex}-${itemIndex}`;
        
        const randomValue = Math.random();
        let status;
        
        if (randomValue < 0.7) {
          status = 'bueno';
          goodItems++;
        } else if (randomValue < 0.9) {
          status = 'regular';
        } else {
          status = 'malo';
        }
        
        simulatedAnswers[key] = status;
        totalItems++;
      });
    });

    let score = 0;
    Object.values(simulatedAnswers).forEach(status => {
      if (status === 'bueno') score += 10;
      else if (status === 'regular') score += 5;
    });

    const finalScore = Math.round((score / (totalItems * 10)) * 100);

    const simulatedResults = {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalItems,
      evaluationTitle: 'Evaluación de Equipo Simulada',
      sections: plantStatusEvaluation.sections,
      isPlantStatus: true,
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
      console.error('Error generating simulated evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo generar la evaluación simulada"
      });
    }
  };

  const saveSubsectionProgress = async (subsectionData) => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      await equipmentProgressService.saveSubsectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: subsectionData.sectionId,
        subseccion_id: subsectionData.subsectionId,
        subseccion_nombre: subsectionData.name,
        puntaje_obtenido: subsectionData.score,
        puntaje_porcentaje: subsectionData.percentage,
        respuestas_correctas: subsectionData.correctAnswers,
        total_preguntas: subsectionData.totalQuestions
      });

      // Recargar datos de progreso
      await loadProgressData();
    } catch (error) {
      console.error('Error saving subsection progress:', error);
    }
  };

  const handleSubsectionComplete = async (subsectionResults) => {
    await saveSubsectionProgress(subsectionResults);
    
    // Verificar si la sección está completa
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    if (currentSectionData?.subsecciones) {
      const totalSubsections = currentSectionData.subsecciones.length;
      const nextSubsection = currentSubsection + 1;
      
      if (nextSubsection < totalSubsections) {
        setCurrentSubsection(nextSubsection);
      } else {
        // Sección completada, volver a la lista
        handleBackToSections();
        toast({
          title: "✅ Sección Completada",
          description: `${currentSectionData.nombre} ha sido completada exitosamente`
        });
      }
    }
  };

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${currentSection}-${currentSubsection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const handleNextQuestion = () => {
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];
    
    if (!currentSubsectionData?.preguntas) return;

    const totalQuestions = currentSubsectionData.preguntas.length;
    const answeredQuestions = currentSubsectionData.preguntas.filter((_, index) => {
      const key = `${currentSection}-${currentSubsection}-${index}`;
      return answers[key] !== undefined;
    }).length;

    if (answeredQuestions === totalQuestions) {
      // Calcular resultados de la subsección
      let correctAnswers = 0;
      currentSubsectionData.preguntas.forEach((_, index) => {
        const key = `${currentSection}-${currentSubsection}-${index}`;
        const answer = answers[key];
        if (answer === 'si' || answer === 'bueno') {
          correctAnswers++;
        }
      });

      const percentage = (correctAnswers / totalQuestions) * 100;
      const score = correctAnswers * 10;

      const subsectionResults = {
        sectionId: currentSectionData.id,
        subsectionId: currentSubsectionData.id,
        name: currentSubsectionData.nombre,
        score: score,
        percentage: percentage,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions
      };

      handleSubsectionComplete(subsectionResults);
    }
  };

  // Pantalla de selección de tipo de planta
  if (currentScreen === 'plantSelection') {
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
                key={plantType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => handlePlantTypeSelect(plantType.id)}
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

  // Pantalla de resultados finales
  if (currentScreen === 'results' && finalResults) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8" ref={evaluationContentRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-xl">
              <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-2xl">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Award className="w-8 h-8" />
                  <CardTitle className="text-3xl font-bold">
                    Evaluación Completada
                  </CardTitle>
                </div>
                <p className="text-green-100">
                  {finalResults.evaluationTitle}
                </p>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                {/* Estadísticas generales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{finalResults.score}%</div>
                    <div className="text-sm text-gray-600">Puntuación General</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{finalResults.correctAnswers}</div>
                    <div className="text-sm text-gray-600">Respuestas Correctas</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{finalResults.totalAnswers}</div>
                    <div className="text-sm text-gray-600">Total Evaluado</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">{finalResults.sectionResults.length}</div>
                    <div className="text-sm text-gray-600">Secciones</div>
                  </div>
                </div>

                {/* Resultados por sección */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-800">Resultados por Sección</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {finalResults.sectionResults.map((section, index) => {
                      let statusColor;
                      if (section.percentage >= 80) statusColor = 'border-green-500 bg-green-50';
                      else if (section.percentage >= 60) statusColor = 'border-yellow-500 bg-yellow-50';
                      else statusColor = 'border-red-500 bg-red-50';

                      return (
                        <div key={index} className={`border-l-4 ${statusColor} p-4 rounded-r-lg`}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <div className="font-medium text-gray-800">{section.name}</div>
                              <div className="text-sm text-gray-600">
                                {section.correctAnswers}/{section.totalQuestions} correctas
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-800">
                                {Math.round(section.percentage)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Barra de progreso */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${section.percentage}%` }}
                            />
                          </div>

                          {/* Subsecciones */}
                          {section.subsections && section.subsections.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-200">
                              <div className="text-xs text-gray-500 mb-2">Subsecciones:</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {section.subsections.map((subsection, subIndex) => (
                                  <div key={subIndex} className="text-xs bg-white rounded px-2 py-1 border">
                                    <div className="font-medium">{subsection.name}</div>
                                    <div className="text-gray-500">{Math.round(subsection.percentage)}%</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => onComplete(finalResults)}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                  >
                    Ver Reporte Completo
                  </Button>
                  
                  <Button
                    onClick={handleBackToPlantSelection}
                    variant="outline"
                    className="px-8 py-3"
                  >
                    Nueva Evaluación
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <img
          src="public/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  // Pantalla de lista de secciones
  if (currentScreen === 'sectionsList') {
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

    const progressStats = progressData ? equipmentProgressService.getProgressStats(progressData) : null;

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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Evaluación de Equipo - {selectedPlantType}
            </h1>
            <p className="text-white/80">Selecciona la sección a evaluar</p>
          </div>

          {/* Progreso general */}
          {progressStats && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Progreso guardado</h3>
                <span className="text-sm text-gray-600">
                  {progressStats.completedSections}/{progressStats.totalSections} secciones completadas
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressStats.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-center space-x-4 mb-6">
            <Button
              onClick={handleSkipToResults}
              variant="outline"
              size="sm"
              className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Ver Evaluación Simulada</span>
            </Button>

            <Button
              onClick={handleBackToPlantSelection}
              variant="outline"
              size="sm"
              className="bg-gray-100 border-gray-400 text-gray-800 hover:bg-gray-200 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cambiar Tipo de Planta</span>
            </Button>
          </div>

          {/* Lista de secciones */}
          <div className="space-y-4">
            {evaluationData?.secciones?.map((section, index) => {
              const isCompleted = completedSections.has(section.id);
              const sectionProgress = progressData?.secciones?.find(s => s.seccion_id === section.id);
              
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isCompleted ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <Clock className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {section.nombre}
                            </h3>
                            <div className="text-sm text-gray-600">
                              {section.subsecciones?.length || 0} subsecciones
                              {isCompleted && sectionProgress && (
                                <span className="ml-2 text-green-600 font-medium">
                                  - {Math.round(sectionProgress.puntaje_porcentaje)}% completado
                                </span>
                              )}
                            </div>
                            {isCompleted && sectionProgress?.fecha_completada && (
                              <div className="text-xs text-gray-500">
                                Completado: {new Date(sectionProgress.fecha_completada).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {isCompleted && sectionProgress && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-700">
                                {sectionProgress.subsecciones_completadas}/{sectionProgress.total_subsecciones}
                              </div>
                              <div className="text-xs text-gray-500">subsecciones</div>
                            </div>
                          )}
                          
                          <Button
                            onClick={() => handleSectionSelect(index)}
                            variant={isCompleted ? "outline" : "default"}
                            className={isCompleted ? 
                              "border-green-600 text-green-600 hover:bg-green-50" : 
                              "bg-blue-600 hover:bg-blue-700 text-white"
                            }
                          >
                            {isCompleted ? 'Revisar' : 'Evaluar'}
                          </Button>
                        </div>
                      </div>

                      {/* Barra de progreso para secciones completadas */}
                      {isCompleted && sectionProgress && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${sectionProgress.puntaje_porcentaje}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
  if (currentScreen === 'evaluation') {
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];

    if (!currentSectionData || !currentSubsectionData) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
          <ClipboardCheck size={64} className="mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold mb-2">Sección no disponible</h1>
          <p className="text-lg mb-6 text-center">No se encontraron datos para esta sección.</p>
          <Button onClick={handleBackToSections} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Secciones
          </Button>
        </div>
      );
    }

    // Verificar si todas las preguntas de la subsección actual han sido respondidas
    const allQuestionsAnswered = currentSubsectionData.preguntas?.every((_, index) => {
      const key = `${currentSection}-${currentSubsection}-${index}`;
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

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-8" ref={evaluationContentRef}>
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {currentSectionData.nombre} - {currentSubsectionData.nombre}
              </h2>
              <Button
                onClick={handleBackToSections}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Subsección {currentSubsection + 1} de {currentSectionData.subsecciones?.length || 0}
            </div>
          </div>

          {/* Preguntas */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
            <div className="p-6">
              <div className="space-y-6">
                {currentSubsectionData.preguntas?.map((question, index) => {
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
                          <Clock className="w-5 h-5 text-red-600 mr-2" />
                          <span className="text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón para continuar */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleNextQuestion}
                  disabled={!allQuestionsAnswered || loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {currentSubsection < (currentSectionData.subsecciones?.length || 0) - 1 
                      ? 'Siguiente Subsección' 
                      : 'Completar Sección'}
                  </span>
                </Button>
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

  return null;
};

export default EvaluationScreenEquipo;