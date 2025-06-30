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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [subsectionProgress, setSubsectionProgress] = useState({});
  const [showStats, setShowStats] = useState(false);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Configuración de tipos de planta y categorías
  const plantTypes = [
    { id: 'pequena', name: 'Planta Pequeña', description: 'Hasta 30 m³/h' },
    { id: 'mediana', name: 'Planta Mediana', description: '30-60 m³/h' },
    { id: 'grande', name: 'Planta Grande', description: 'Más de 60 m³/h' }
  ];

  const categories = [
    { id: 'fija', name: 'Planta Fija', description: 'Instalación permanente' },
    { id: 'movil', name: 'Planta Móvil', description: 'Instalación temporal' }
  ];

  // Datos de evaluación de equipo predefinidos
  const equipmentEvaluationData = {
    title: 'Evaluación de Equipo',
    subsections: [
      {
        id: 'mezclado',
        title: 'Sistema de Mezclado',
        ponderacion: 25,
        questions: [
          { id: 1, text: '¿La mezcladora está en buen estado general?', type: 'abierta' },
          { id: 2, text: '¿Las paletas mezcladoras están completas y sin desgaste excesivo?', type: 'abierta' },
          { id: 3, text: '¿El sistema de descarga funciona correctamente?', type: 'abierta' },
          { id: 4, text: '¿Los sellos y empaques están en buen estado?', type: 'abierta' },
          { id: 5, text: '¿El motor de la mezcladora opera sin problemas?', type: 'abierta' }
        ]
      },
      {
        id: 'dosificacion',
        title: 'Sistema de Dosificación',
        ponderacion: 20,
        questions: [
          { id: 6, text: '¿Las básculas de cemento están calibradas?', type: 'abierta' },
          { id: 7, text: '¿Las básculas de agregados funcionan correctamente?', type: 'abierta' },
          { id: 8, text: '¿El sistema de dosificación de agua es preciso?', type: 'abierta' },
          { id: 9, text: '¿Los aditivos se dosifican correctamente?', type: 'abierta' },
          { id: 10, text: '¿Las tolvas están limpias y sin obstrucciones?', type: 'abierta' }
        ]
      },
      {
        id: 'transporte',
        title: 'Sistema de Transporte',
        ponderacion: 15,
        questions: [
          { id: 11, text: '¿Las bandas transportadoras están en buen estado?', type: 'abierta' },
          { id: 12, text: '¿Los elevadores funcionan sin problemas?', type: 'abierta' },
          { id: 13, text: '¿Los sistemas de limpieza de bandas operan correctamente?', type: 'abierta' },
          { id: 14, text: '¿Las estructuras de soporte están estables?', type: 'abierta' }
        ]
      },
      {
        id: 'almacenamiento',
        title: 'Sistema de Almacenamiento',
        ponderacion: 15,
        questions: [
          { id: 15, text: '¿Los silos de cemento están en buen estado?', type: 'abierta' },
          { id: 16, text: '¿Los sistemas de aireación funcionan correctamente?', type: 'abierta' },
          { id: 17, text: '¿Las tolvas de agregados están limpias?', type: 'abierta' },
          { id: 18, text: '¿Los sistemas de descarga operan sin problemas?', type: 'abierta' }
        ]
      },
      {
        id: 'control',
        title: 'Sistema de Control',
        ponderacion: 15,
        questions: [
          { id: 19, text: '¿El panel de control funciona correctamente?', type: 'abierta' },
          { id: 20, text: '¿Los sensores están calibrados?', type: 'abierta' },
          { id: 21, text: '¿El software de control está actualizado?', type: 'abierta' },
          { id: 22, text: '¿Los sistemas de seguridad están activos?', type: 'abierta' }
        ]
      },
      {
        id: 'auxiliares',
        title: 'Sistemas Auxiliares',
        ponderacion: 10,
        questions: [
          { id: 23, text: '¿El compresor de aire funciona correctamente?', type: 'abierta' },
          { id: 24, text: '¿El sistema eléctrico está en buen estado?', type: 'abierta' },
          { id: 25, text: '¿Los sistemas de iluminación funcionan?', type: 'abierta' }
        ]
      }
    ]
  };

  useEffect(() => {
    if (!evaluationStarted) {
      setEvaluationData(equipmentEvaluationData);
    }
  }, []);

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
    if (evaluationStarted && selectedPlantType && selectedCategory) {
      loadSavedProgress();
    }
  }, [evaluationStarted, selectedPlantType, selectedCategory]);

  const loadSavedProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progressData = await apiService.getProgresoSecciones({
        usuario_id: user.id,
        tipo_evaluacion: 'equipo',
        tipo_planta: selectedPlantType,
        categoria: selectedCategory
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
          description: `Se encontró progreso previo para ${selectedPlantType} - ${selectedCategory}`
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

    equipmentEvaluationData.subsections.forEach((subsection, subsectionIndex) => {
      subsection.questions.forEach((question, questionIndex) => {
        const key = `${selectedPlantType}-${selectedCategory}-${subsectionIndex}-${questionIndex}`;
        
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

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Equipo Simulada - ${selectedPlantType} ${selectedCategory}`,
      sections: equipmentEvaluationData.subsections,
      isEquipmentEvaluation: true,
      isSimulated: true,
      plantType: selectedPlantType,
      category: selectedCategory
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
    const key = `${selectedPlantType}-${selectedCategory}-${currentSubsection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const saveCurrentSubsectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSubsectionData = evaluationData.subsections[currentSubsection];
      
      // Calcular progreso de la subsección actual
      let subsectionScore = 0;
      let correctAnswers = 0;
      let totalQuestions = 0;

      currentSubsectionData.questions.forEach((question, qIndex) => {
        const key = `${selectedPlantType}-${selectedCategory}-${currentSubsection}-${qIndex}`;
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
        seccion_nombre: currentSubsectionData.title,
        seccion_orden: currentSubsection + 1,
        puntaje_seccion: subsectionScore,
        puntaje_porcentaje: subsectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        tipo_planta: selectedPlantType,
        categoria: selectedCategory
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
        description: `Subsección "${currentSubsectionData.title}" guardada exitosamente`
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

    if (currentSubsection < evaluationData.subsections.length - 1) {
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
          const [plantType, category, subsectionIndex, questionIndex] = key.split('-');
          const subsection = evaluationData.subsections[parseInt(subsectionIndex)];
          const question = subsection?.questions[parseInt(questionIndex)];

          return {
            pregunta_id: question?.id || null,
            respuesta: selectedAnswer,
            observacion: `Equipo: ${plantType} - ${category} - ${subsection?.title}`
          };
        }),
        observaciones: `Evaluación de equipo completada - Tipo: ${selectedPlantType} - Categoría: ${selectedCategory}`
      };

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      onComplete({
        answers,
        score: Math.round(result.puntuacion_ponderada || finalPercentage),
        totalAnswers: totalQuestions,
        correctAnswers: correctAnswers,
        evaluationTitle: `Evaluación de Equipo - ${selectedPlantType} ${selectedCategory}`,
        sections: evaluationData.subsections,
        isEquipmentEvaluation: true,
        plantType: selectedPlantType,
        category: selectedCategory
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

  const handleConfigurationSelect = (plantType, category) => {
    setSelectedPlantType(plantType);
    setSelectedCategory(category);
    setCurrentSubsection(0);
    setAnswers({});
    setSubsectionProgress({});
    setEvaluationStarted(true);
  };

  // Calcular estadísticas para la gráfica
  const calculateSubsectionStats = () => {
    if (!evaluationData?.subsections) return null;

    const subsectionsInfo = evaluationData.subsections.map((subsection, index) => {
      const totalQuestions = subsection.questions.length;
      
      // Contar respuestas de esta subsección
      let answered = 0;
      let correct = 0;

      subsection.questions.forEach((question, qIndex) => {
        const key = `${selectedPlantType}-${selectedCategory}-${index}-${qIndex}`;
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
        nombre: subsection.title,
        ponderacion: subsection.ponderacion,
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
          <p className="text-lg text-gray-600">Guardando evaluación de equipo...</p>
        </div>
      </div>
    );
  }

  // Pantalla de selección de configuración
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
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Equipo</h2>
              <p className="text-white/80">Selecciona el tipo de planta y categoría</p>
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

            {/* Selección de configuración */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tipos de planta */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white text-center">Tipo de Planta</h3>
                {plantTypes.map((type, index) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => setSelectedPlantType(type.id)}
                      className={`w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border-2 ${
                        selectedPlantType === type.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedPlantType === type.id ? 'bg-blue-500' : 'bg-blue-100'
                        }`}>
                          <Settings className={`w-5 h-5 ${
                            selectedPlantType === type.id ? 'text-white' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <span className="text-gray-800 font-medium block">{type.name}</span>
                          <span className="text-gray-600 text-sm">{type.description}</span>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Categorías */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white text-center">Categoría</h3>
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border-2 ${
                        selectedCategory === category.id ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedCategory === category.id ? 'bg-green-500' : 'bg-green-100'
                        }`}>
                          <Settings className={`w-5 h-5 ${
                            selectedCategory === category.id ? 'text-white' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <span className="text-gray-800 font-medium block">{category.name}</span>
                          <span className="text-gray-600 text-sm">{category.description}</span>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Botón para iniciar */}
            {selectedPlantType && selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-8"
              >
                <Button
                  onClick={() => handleConfigurationSelect(selectedPlantType, selectedCategory)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Iniciar Evaluación de {plantTypes.find(p => p.id === selectedPlantType)?.name} {categories.find(c => c.id === selectedCategory)?.name}
                </Button>
              </motion.div>
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
  }

  if (!evaluationData || !evaluationData.subsections || evaluationData.subsections.length === 0) {
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

  const totalSubsections = evaluationData.subsections.length;
  const currentSubsectionData = evaluationData.subsections[currentSubsection];
  const progress = totalSubsections > 0 ? ((currentSubsection + 1) / totalSubsections) * 100 : 0;

  // Verificar si todas las preguntas de la subsección actual han sido respondidas
  const allQuestionsAnswered = currentSubsectionData?.questions?.every((_, index) => {
    const key = `${selectedPlantType}-${selectedCategory}-${currentSubsection}-${index}`;
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
              Evaluación de Equipo - {selectedPlantType} {selectedCategory}
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
                        {currentSubsectionData?.title}
                      </h2>
                      {subsectionProgress[currentSubsection]?.completed && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Guardado</span>
                        </div>
                      )}
                    </div>
                    {currentSubsectionData?.ponderacion && (
                      <div className="text-center text-sm text-gray-600 mt-1">
                        Ponderación: {currentSubsectionData.ponderacion}%
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {currentSubsectionData?.questions?.map((question, index) => {
                        const key = `${selectedPlantType}-${selectedCategory}-${currentSubsection}-${index}`;
                        const selectedAnswer = answers[key];

                        return (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">
                              {index + 1}. {question.text}
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