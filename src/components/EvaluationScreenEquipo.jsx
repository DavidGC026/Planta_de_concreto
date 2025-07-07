import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, ClipboardCheck, BarChart3, CheckCircle, Clock, Play } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';

const EvaluationScreenEquipo = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentScreen, setCurrentScreen] = useState('plantSelection'); // plantSelection, sectionSelection, evaluation, progress
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentSubsection, setCurrentSubsection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [progressData, setProgressData] = useState(null);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  // Tipos de planta disponibles
  const plantTypes = [
    { id: 'pequena', name: 'Planta Pequeña', description: 'Hasta 30 m³/h' },
    { id: 'mediana', name: 'Planta Mediana', description: '30-60 m³/h' },
    { id: 'grande', name: 'Planta Grande', description: 'Más de 60 m³/h' }
  ];

  // Scroll al inicio cuando cambia la sección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentSection, currentSubsection]);

  // Cargar progreso cuando se selecciona tipo de planta
  useEffect(() => {
    if (selectedPlantType && currentScreen === 'sectionSelection') {
      loadProgress();
    }
  }, [selectedPlantType, currentScreen]);

  const loadProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const progress = await equipmentProgressService.getProgress(user.id, selectedPlantType);
      setProgressData(progress);
    } catch (error) {
      console.error('Error loading progress:', error);
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

  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setCurrentScreen('sectionSelection');
  };

  const handleSectionSelect = async (sectionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentSubsection(0);
    await loadEvaluationData();
    setCurrentScreen('evaluation');
  };

  const handleViewProgress = () => {
    setCurrentScreen('progress');
  };

  const handleAnswer = (subsectionIndex, questionIndex, selectedOption) => {
    const key = `${currentSection}-${subsectionIndex}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const saveSubsectionProgress = async (subsectionIndex) => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSectionData = evaluationData?.secciones?.[currentSection];
      const currentSubsectionData = currentSectionData?.subsecciones?.[subsectionIndex];
      
      if (!currentSubsectionData) return;

      // Calcular progreso de la subsección
      const subsectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${currentSection}-${subsectionIndex}-`));
      
      let correctAnswers = 0;
      const totalQuestions = subsectionAnswers.length;
      
      subsectionAnswers.forEach(([, answer]) => {
        if (answer === 'si' || answer === 'bueno') {
          correctAnswers++;
        }
      });

      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Guardar progreso usando el servicio
      await equipmentProgressService.saveSubsectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: currentSectionData.id,
        subseccion_id: currentSubsectionData.id,
        subseccion_nombre: currentSubsectionData.nombre,
        puntaje_obtenido: percentage,
        puntaje_porcentaje: percentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions
      });

      // Recargar progreso
      await loadProgress();

      toast({
        title: "✅ Progreso guardado",
        description: `Subsección "${currentSubsectionData.nombre}" completada`
      });

    } catch (error) {
      console.error('Error saving subsection progress:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el progreso"
      });
    }
  };

  const handleNextSubsection = async () => {
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    
    // Guardar progreso de la subsección actual
    await saveSubsectionProgress(currentSubsection);

    if (currentSubsection < (currentSectionData?.subsecciones?.length || 0) - 1) {
      setCurrentSubsection(prev => prev + 1);
    } else {
      // Completar sección
      await completeSectionEvaluation();
    }
  };

  const completeSectionEvaluation = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const currentSectionData = evaluationData?.secciones?.[currentSection];
      
      // Calcular progreso total de la sección
      const sectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${currentSection}-`));
      
      let totalCorrect = 0;
      const totalQuestions = sectionAnswers.length;
      
      sectionAnswers.forEach(([, answer]) => {
        if (answer === 'si' || answer === 'bueno') {
          totalCorrect++;
        }
      });

      const sectionPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Guardar progreso de sección completa
      await equipmentProgressService.saveSectionProgress({
        usuario_id: user.id,
        tipo_planta: selectedPlantType,
        seccion_id: currentSectionData.id,
        seccion_nombre: currentSectionData.nombre,
        puntaje_obtenido: sectionPercentage,
        puntaje_porcentaje: sectionPercentage,
        total_subsecciones: currentSectionData.subsecciones?.length || 0,
        subsecciones_completadas: currentSectionData.subsecciones?.length || 0,
        respuestas_correctas: totalCorrect,
        total_preguntas: totalQuestions
      });

      toast({
        title: "✅ Sección completada",
        description: `Sección "${currentSectionData.nombre}" completada exitosamente`
      });

      // Volver a la selección de secciones
      setCurrentScreen('sectionSelection');
      await loadProgress();

    } catch (error) {
      console.error('Error completing section:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo completar la sección"
      });
    }
  };

  // Función para generar evaluación simulada
  const generateSimulatedEquipmentEvaluation = () => {
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
        const questionId = `${selectedPlantType}-${sectionIndex}-${i}`;

        // Generar respuesta aleatoria con tendencia hacia respuestas positivas
        const randomValue = Math.random();
        let answer;

        if (randomValue < 0.75) { // 75% probabilidad de respuesta correcta
          answer = 'bueno';
          correctAnswers++;
        } else if (randomValue < 0.9) { // 15% probabilidad de respuesta regular
          answer = 'regular';
        } else { // 10% probabilidad de respuesta mala
          answer = 'malo';
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
      evaluationTitle: `Evaluación de Equipo Simulada - ${selectedPlantType}`,
      sections: simulatedSections,
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

  // Pantalla de selección de secciones con progreso
  if (currentScreen === 'sectionSelection') {
    const sections = [
      { id: 1014, name: 'Producción y Mezclado', subsections: 6 },
      { id: 1015, name: 'Transporte y Entrega', subsections: 4 },
      { id: 1016, name: 'Control de Calidad', subsections: 5 },
      { id: 1017, name: 'Mantenimiento', subsections: 4 },
      { id: 1018, name: 'Seguridad y Medio Ambiente', subsections: 6 },
      { id: 1019, name: 'Gestión y Administración', subsections: 4 }
    ];

    const getSectionProgress = (sectionId) => {
      if (!progressData?.secciones) return null;
      return progressData.secciones.find(s => s.seccion_id === sectionId);
    };

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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Evaluación de Equipo - {plantTypes.find(p => p.id === selectedPlantType)?.name}
            </h2>
            <p className="text-white/80">Selecciona la sección a evaluar</p>
          </div>

          {/* Información de progreso general */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Progreso guardado</h3>
              <span className="text-sm text-gray-600">
                {progressData?.secciones_completadas || 0}/{progressData?.total_secciones || 6} secciones completadas
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ 
                  width: `${progressData?.secciones_completadas && progressData?.total_secciones 
                    ? (progressData.secciones_completadas / progressData.total_secciones) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>

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
              onClick={handleViewProgress}
              variant="outline"
              size="sm"
              className="bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200 flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Ver Progreso</span>
            </Button>

            <Button
              onClick={() => setCurrentScreen('plantSelection')}
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
            {sections.map((section, index) => {
              const progress = getSectionProgress(section.id);
              const isCompleted = progress?.completada || false;
              const percentage = progress?.puntaje_porcentaje || 0;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isCompleted ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">{section.name}</h3>
                            <p className="text-sm text-gray-600">
                              {section.subsections} subsecciones
                              {isCompleted && (
                                <span className="ml-2 text-green-600 font-medium">
                                  - {Math.round(percentage)}% completado
                                </span>
                              )}
                              {progress?.fecha_completada && (
                                <span className="ml-2 text-gray-500">
                                  - Completado: {new Date(progress.fecha_completada).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSectionSelect(index)}
                          className="flex items-center space-x-2"
                          variant={isCompleted ? "outline" : "default"}
                        >
                          <Play className="w-4 h-4" />
                          <span>{isCompleted ? 'Revisar' : 'Evaluar'}</span>
                        </Button>
                      </div>
                      
                      {/* Barra de progreso de la sección */}
                      {isCompleted && (
                        <div className="mt-3">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

  // Pantalla de progreso detallado
  if (currentScreen === 'progress') {
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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Progreso Detallado - {plantTypes.find(p => p.id === selectedPlantType)?.name}
            </h2>
            <p className="text-white/80">Estado actual de la evaluación</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6">
            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {progressData?.secciones_completadas || 0}
                </div>
                <div className="text-sm text-gray-600">Secciones Completadas</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {progressData?.total_secciones || 6}
                </div>
                <div className="text-sm text-gray-600">Total Secciones</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {progressData?.secciones_completadas && progressData?.total_secciones 
                    ? Math.round((progressData.secciones_completadas / progressData.total_secciones) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Progreso General</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {selectedPlantType}
                </div>
                <div className="text-sm text-gray-600">Tipo de Planta</div>
              </div>
            </div>

            {/* Detalle por sección */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle por Sección</h3>
              
              {progressData?.secciones?.map((section, index) => (
                <div key={section.seccion_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        section.completada ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {section.completada ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{section.seccion_nombre}</h4>
                        <p className="text-sm text-gray-600">
                          {section.subsecciones_completadas}/{section.total_subsecciones} subsecciones
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        section.completada ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {Math.round(section.puntaje_porcentaje)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {section.respuestas_correctas}/{section.total_preguntas} correctas
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        section.completada ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${section.puntaje_porcentaje}%` }}
                    />
                  </div>
                  
                  {section.fecha_completada && (
                    <div className="text-xs text-gray-500 mt-2">
                      Completado: {new Date(section.fecha_completada).toLocaleString()}
                    </div>
                  )}

                  {/* Detalle de subsecciones */}
                  {section.subsecciones && section.subsecciones.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">Subsecciones:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {section.subsecciones.map((subsection, subIndex) => (
                          <div key={subIndex} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{subsection.nombre}</span>
                            <span className={`font-medium ${
                              subsection.completada ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {subsection.completada ? `${Math.round(subsection.puntaje_porcentaje)}%` : 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button
                onClick={() => setCurrentScreen('sectionSelection')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Volver a Secciones
              </Button>
              
              <Button
                onClick={() => setCurrentScreen('plantSelection')}
                variant="outline"
                className="px-6 py-2"
              >
                Cambiar Tipo de Planta
              </Button>
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

  // Pantalla de evaluación (simplificada para demostración)
  if (currentScreen === 'evaluation') {
    const currentSectionData = evaluationData?.secciones?.[currentSection];
    const currentSubsectionData = currentSectionData?.subsecciones?.[currentSubsection];

    if (!currentSectionData || !currentSubsectionData) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
          <ClipboardCheck size={64} className="mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
          <p className="text-lg mb-6 text-center">No se encontraron datos para esta evaluación.</p>
          <Button onClick={() => setCurrentScreen('sectionSelection')} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Secciones
          </Button>
        </div>
      );
    }

    // Generar preguntas de ejemplo para la subsección
    const sampleQuestions = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      text: `¿El ${currentSubsectionData.nombre.toLowerCase()} está en buen estado y funcionando correctamente? (Pregunta ${i + 1})`,
      type: 'estado'
    }));

    // Verificar si todas las preguntas han sido respondidas
    const allQuestionsAnswered = sampleQuestions.every((_, index) => {
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
          {/* Barra de progreso */}
          <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {currentSectionData.nombre} - {currentSubsectionData.nombre}
              </h2>
              <span className="text-sm text-gray-600">
                Subsección {currentSubsection + 1} de {currentSectionData.subsecciones?.length || 0}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ 
                  width: `${((currentSubsection + 1) / (currentSectionData.subsecciones?.length || 1)) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Panel de evaluación */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
            <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 text-center">
                Evaluación: {currentSubsectionData.nombre}
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {sampleQuestions.map((question, index) => {
                  const key = `${currentSection}-${currentSubsection}-${index}`;
                  const selectedAnswer = answers[key];

                  return (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h4 className="text-lg font-medium text-gray-800 mb-4">
                        {index + 1}. {question.text}
                      </h4>
                      
                      <div className="flex space-x-4">
                        {[
                          { value: 'bueno', label: 'Bueno', color: 'bg-green-500 hover:bg-green-600' },
                          { value: 'regular', label: 'Regular', color: 'bg-yellow-500 hover:bg-yellow-600' },
                          { value: 'malo', label: 'Malo', color: 'bg-red-500 hover:bg-red-600' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleAnswer(currentSubsection, index, option.value)}
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
              <div className="mt-8 flex justify-center space-x-4">
                <Button
                  onClick={() => setCurrentScreen('sectionSelection')}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>

                <Button
                  onClick={handleNextSubsection}
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