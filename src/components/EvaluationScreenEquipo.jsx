import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, CheckCircle, XCircle, AlertTriangle, Award, Play, RotateCcw, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';
import SectionCompletionModal from '@/components/SectionCompletionModal';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [sectionSelectionMode, setSectionSelectionMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [completedSubsections, setCompletedSubsections] = useState(new Set());
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionModalData, setSectionModalData] = useState(null);
  const [progressData, setProgressData] = useState(null);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    if (sectionSelectionMode) {
      loadEvaluationData();
      loadExistingProgress();
    }
  }, [sectionSelectionMode, selectedPlantType]);

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

  const loadExistingProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progress = await equipmentProgressService.getProgress(user.id, selectedPlantType);
      setProgressData(progress);

      if (progress && progress.secciones) {
        const completedSecs = new Set();
        const completedSubs = new Set();
        const existingAnswers = {};

        progress.secciones.forEach(section => {
          if (section.completada) {
            completedSecs.add(section.seccion_id);
          }

          if (section.subsecciones) {
            section.subsecciones.forEach(subsection => {
              if (subsection.completada) {
                completedSubs.add(`${section.seccion_id}-${subsection.subseccion_id}`);

                // Simular respuestas para subsecciones completadas
                for (let i = 0; i < 5; i++) {
                  const key = `${section.seccion_id}-${subsection.subseccion_id}-${i}`;
                  existingAnswers[key] = 'bueno'; // Valor por defecto para completadas
                }
              }
            });
          }
        });

        setCompletedSections(completedSecs);
        setCompletedSubsections(completedSubs);
        setAnswers(existingAnswers);
      }
    } catch (error) {
      console.error('Error loading existing progress:', error);
    }
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

      // Recargar progreso después de guardar
      await loadExistingProgress();

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
    const sectionResults = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    simulatedSections.forEach((section, sectionIndex) => {
      const subsectionsPerSection = 4;
      const questionsPerSubsection = 5;
      let sectionCorrect = 0;
      let sectionTotal = 0;

      for (let subIndex = 0; subIndex < subsectionsPerSection; subIndex++) {
        for (let qIndex = 0; qIndex < questionsPerSubsection; qIndex++) {
          const key = `${sectionIndex}-${subIndex}-${qIndex}`;
          const randomValue = Math.random();

          let answer;
          if (randomValue < 0.6) {
            answer = 'bueno';
            sectionCorrect++;
            correctAnswers++;
          } else if (randomValue < 0.8) {
            answer = 'regular';
            sectionCorrect += 0.5;
            correctAnswers += 0.5;
          } else {
            answer = 'malo';
          }

          simulatedAnswers[key] = answer;
          sectionTotal++;
          totalQuestions++;
        }
      }

      const sectionPercentage = (sectionCorrect / sectionTotal) * 100;
      sectionResults.push({
        name: section.nombre,
        percentage: sectionPercentage,
        correctAnswers: Math.round(sectionCorrect),
        totalQuestions: sectionTotal,
        ponderacion: section.ponderacion
      });
    });

    const overallScore = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      answers: simulatedAnswers,
      score: overallScore,
      totalAnswers: totalQuestions,
      correctAnswers: Math.round(correctAnswers),
      evaluationTitle: `Evaluación de Equipo Simulada - Planta ${selectedPlantType || 'Mediana'}`,
      sections: simulatedSections,
      sectionResults: sectionResults,
      isEquipmentEvaluation: true,
      isSimulated: true
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

  const handleNextSubsection = async () => {
    // Guardar progreso de la subsección actual
    await saveSubsectionProgress(
      currentSectionData.id,
      currentSubsectionData.id,
      currentSubsectionData.nombre,
      currentSectionData.nombre
    );

    if (currentSubsection < totalSubsections - 1) {
      setCurrentSubsection(prev => prev + 1);
    } else {
      // Completar sección
      await saveSectionProgress(currentSectionData.id, currentSectionData.nombre);
    }
  };

  const handleNextSection = () => {
    // Volver a la pantalla de selección de secciones
    setSectionSelectionMode(true);
    setEvaluationStarted(false);
    setCurrentSection(0);
    setCurrentSubsection(0);
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

  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setSectionSelectionMode(true);
    setCurrentSection(0);
    setCurrentSubsection(0);
    setAnswers({});
    setCompletedSections(new Set());
    setCompletedSubsections(new Set());
  };

  const handleSectionSelect = (sectionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentSubsection(0);
    setEvaluationStarted(true);
    setSectionSelectionMode(false);
  };

  const getSectionStatus = (sectionId) => {
    if (completedSections.has(sectionId)) {
      return { status: 'completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    }

    // Verificar si tiene progreso parcial
    const hasPartialProgress = progressData?.secciones?.find(s =>
      s.seccion_id === sectionId && s.subsecciones_completadas > 0 && !s.completada
    );

    if (hasPartialProgress) {
      return { status: 'partial', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    }

    return { status: 'pending', icon: Play, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  };

  // Calcular estadísticas generales
  const calculateGeneralStats = () => {
    if (!progressData || !progressData.secciones) {
      return {
        sectionsCompleted: 0,
        totalSections: evaluationData?.secciones?.length || 6,
        correctAnswers: 0,
        totalEvaluated: 0
      };
    }

    const sectionsCompleted = progressData.secciones_completadas || 0;
    const totalSections = progressData.total_secciones || 6;

    // Calcular respuestas correctas y total evaluado basado en el progreso
    let correctAnswers = 0;
    let totalEvaluated = 0;

    progressData.secciones.forEach(section => {
      correctAnswers += section.respuestas_correctas || 0;
      totalEvaluated += section.total_preguntas || 0;
    });

    return {
      sectionsCompleted,
      totalSections,
      correctAnswers,
      totalEvaluated
    };
  };

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = currentSubsectionData?.preguntas?.every((_, index) => {
    const key = `${currentSectionData.id}-${currentSubsectionData.id}-${index}`;
    return answers[key] !== undefined;
  });

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
  if (!selectedPlantType) {
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

  // Pantalla de selección de secciones - DISEÑO ACTUALIZADO COMO EN LA IMAGEN
  if (sectionSelectionMode) {
    const generalStats = calculateGeneralStats();
    const progressPercentage = generalStats.totalSections > 0 ?
      Math.round((generalStats.sectionsCompleted / generalStats.totalSections) * 100) : 0;

    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Evaluación de Equipo - Planta {selectedPlantType.charAt(0).toUpperCase() + selectedPlantType.slice(1)}
            </h2>
            <p className="text-white/80">Selecciona la sección que deseas evaluar</p>
          </div>

          {/* Botones de navegación */}
          <div className="flex justify-between items-center mb-8">
            <Button
              onClick={() => {
                setSelectedPlantType(null);
                setSectionSelectionMode(false);
              }}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Menú</span>
            </Button>

            <div className="flex space-x-2">
              <Button
                onClick={handleSkipToResults}
                variant="outline"
                size="sm"
                className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Ver Simulación</span>
              </Button>

              <Button
                onClick={() => {/* Implementar ver resumen final */}}
                variant="outline"
                size="sm"
                className="bg-green-100 border-green-400 text-green-800 hover:bg-green-200 flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Ver Resumen Final</span>
              </Button>
            </div>
          </div>

          {/* Grid de secciones - DISEÑO COMO EN LA IMAGEN */}
          {evaluationData?.secciones && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {evaluationData.secciones.map((section, index) => {
                const sectionStatus = getSectionStatus(section.id);

                // Obtener información de progreso
                const progressInfo = progressData?.secciones?.find(s => s.seccion_id === section.id);
                const completedSubsections = progressInfo?.subsecciones_completadas || 0;
                const totalSubsections = progressInfo?.total_subsecciones || section.subsecciones?.length || 0;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-800 mb-1">
                              {section.nombre}
                            </CardTitle>
                            <div className="text-sm text-gray-600 mb-2">
                              Peso: {section.ponderacion}%
                            </div>
                            <div className="text-sm text-gray-600">
                              {totalSubsections} subsecciones
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* Lista de subsecciones */}
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Subsecciones:</div>
                          <div className="space-y-1">
                            {section.subsecciones?.slice(0, 3).map((subsection, subIndex) => (
                              <div key={subIndex} className="flex items-center text-xs text-gray-600">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                {subsection.nombre}
                              </div>
                            ))}
                            {section.subsecciones?.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{section.subsecciones.length - 3} más...
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleSectionSelect(index)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Iniciar Evaluación</span>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Progreso General - DISEÑO COMO EN LA IMAGEN */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Progreso General</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {generalStats.sectionsCompleted}
                </div>
                <div className="text-sm text-gray-600">Secciones Completadas</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {generalStats.totalSections}
                </div>
                <div className="text-sm text-gray-600">Total de Secciones</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {generalStats.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Respuestas Correctas</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {generalStats.totalEvaluated}
                </div>
                <div className="text-sm text-gray-600">Total Evaluado</div>
              </div>
            </div>

            {/* Barra de progreso general */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso General</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
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
            onClick={() => {
              setSectionSelectionMode(true);
              setEvaluationStarted(false);
            }}
            variant="outline"
            size="sm"
            className="bg-white/90 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Secciones
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

export default EvaluationScreenEquipo;
