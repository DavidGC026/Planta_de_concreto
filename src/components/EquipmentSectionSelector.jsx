import React, { useState, useEffect } from 'react';
import { IMAGES } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, Play, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import equipmentProgressService from '@/services/equipmentProgressService';

const EquipmentSectionSelector = ({ 
  selectedPlantType, 
  onBack, 
  onSectionSelect, 
  onSkipToResults 
}) => {
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    if (selectedPlantType) {
      loadEvaluationData();
      loadExistingProgress();
    }
  }, [selectedPlantType]);

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
    } catch (error) {
      console.error('Error loading existing progress:', error);
    }
  };

  const getSectionStatus = (sectionId) => {
    if (!progressData?.secciones) {
      return { 
        status: 'pending', 
        icon: Play, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        textColor: 'text-blue-800',
        buttonColor: 'bg-blue-600 hover:bg-blue-700'
      };
    }

    const section = progressData.secciones.find(s => s.seccion_id === sectionId);
    
    if (section?.completada) {
      return { 
        status: 'completed', 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        textColor: 'text-green-800',
        buttonColor: 'bg-green-600 hover:bg-green-700'
      };
    }

    if (section?.subsecciones_completadas > 0) {
      return { 
        status: 'partial', 
        icon: Clock, 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200',
        textColor: 'text-yellow-800',
        buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
      };
    }

    return { 
      status: 'pending', 
      icon: Play, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      border: 'border-blue-200',
      textColor: 'text-blue-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    };
  };

  const calculateGeneralStats = () => {
    if (!progressData || !progressData.secciones) {
      return {
        sectionsCompleted: 0,
        totalSections: evaluationData?.secciones?.length || 6,
        correctAnswers: 0,
        totalEvaluated: 0,
        weightedProgress: 0,
        totalWeight: 100
      };
    }

    const sectionsCompleted = progressData.secciones_completadas || 0;
    const totalSections = progressData.total_secciones || 6;

    let correctAnswers = 0;
    let totalEvaluated = 0;
    let weightedProgress = 0;
    let totalWeight = 0;

    // Calcular el peso total de todas las secciones
    evaluationData?.secciones?.forEach(section => {
      totalWeight += parseFloat(section.ponderacion) || 0;
    });

    // Calcular progreso ponderado basado en secciones completadas
    progressData.secciones.forEach(section => {
      correctAnswers += section.respuestas_correctas || 0;
      totalEvaluated += section.total_preguntas || 0;
      
      // Si la sección está completada, sumar su ponderación
      if (section.completada) {
        // Buscar la ponderación de esta sección en evaluationData
        const sectionData = evaluationData?.secciones?.find(s => s.id === section.seccion_id);
        if (sectionData) {
          weightedProgress += parseFloat(sectionData.ponderacion) || 0;
        }
      }
    });

    return {
      sectionsCompleted,
      totalSections,
      correctAnswers,
      totalEvaluated,
      weightedProgress,
      totalWeight
    };
  };

  const handleSectionSelect = (sectionIndex) => {
    onSectionSelect(sectionIndex);
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

  const generalStats = calculateGeneralStats();
  
  // Usar progreso ponderado en lugar de conteo simple
  const progressPercentage = generalStats.totalWeight > 0 ?
    Math.round((generalStats.weightedProgress / generalStats.totalWeight) * 100) : 0;

  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${IMAGES.FONDO}")`,
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
            onClick={onBack}
            variant="outline"
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Menú</span>
          </Button>

          <div className="flex space-x-2">
            <Button
              onClick={onSkipToResults}
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

        {/* Grid de secciones */}
        {evaluationData?.secciones && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {evaluationData.secciones.map((section, index) => {
              const sectionStatus = getSectionStatus(section.id);
              const progressInfo = progressData?.secciones?.find(s => s.seccion_id === section.id);
              const completedSubsections = progressInfo?.subsecciones_completadas || 0;
              const totalSubsections = progressInfo?.total_subsecciones || section.subsecciones?.length || 0;
              const sectionPercentage = progressInfo?.puntaje_porcentaje || 0;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`bg-white/95 backdrop-blur-sm ${sectionStatus.border} hover:shadow-lg transition-all duration-200 ${sectionStatus.bg}`}>
                    <CardHeader className="pb-3 relative">
                      {/* Indicador de estado en la esquina superior derecha */}
                      <div className="absolute top-3 right-3">
                        <sectionStatus.icon className={`w-6 h-6 ${sectionStatus.color}`} />
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-8">
                          <CardTitle className="text-lg font-semibold text-gray-800 mb-1">
                            {section.nombre}
                          </CardTitle>
                          <div className={`text-sm ${sectionStatus.textColor} mb-2 font-medium`}>
                            Peso: {section.ponderacion}%
                          </div>
                          
                          {/* Mostrar progreso si existe */}
                          {progressInfo && (
                            <div className="mb-2">
                              <div className={`text-sm font-medium ${sectionStatus.color}`}>
                                {sectionStatus.status === 'completed' && '✅ Completada'}
                                {sectionStatus.status === 'partial' && `🔄 En progreso (${completedSubsections}/${totalSubsections})`}
                                {sectionStatus.status === 'pending' && '⏳ Pendiente'}
                              </div>
                              {sectionPercentage > 0 && (
                                <div className={`text-xs ${sectionStatus.textColor} mt-1`}>
                                  Puntuación: {Math.round(sectionPercentage)}%
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-600">
                            {totalSubsections} subsecciones
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Barra de progreso de subsecciones */}
                      {totalSubsections > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progreso de subsecciones</span>
                            <span>{completedSubsections}/{totalSubsections}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                sectionStatus.status === 'completed' ? 'bg-green-500' :
                                sectionStatus.status === 'partial' ? 'bg-yellow-500' : 'bg-gray-300'
                              }`}
                              style={{ 
                                width: `${totalSubsections > 0 ? (completedSubsections / totalSubsections) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Lista de subsecciones */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Subsecciones:</div>
                        <div className="space-y-1">
                          {section.subsecciones?.slice(0, 3).map((subsection, subIndex) => (
                            <div key={subIndex} className="flex items-center text-xs text-gray-600">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                // Verificar si esta subsección específica está completada
                                progressInfo?.subsecciones?.some(sub => 
                                  sub.subseccion_id === subsection.id && sub.completada
                                ) ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
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
                        className={`w-full ${sectionStatus.buttonColor} text-white flex items-center justify-center space-x-2`}
                      >
                        <sectionStatus.icon className="w-4 h-4" />
                        <span>
                          {sectionStatus.status === 'completed' ? 'Ver Evaluación' :
                           sectionStatus.status === 'partial' ? 'Continuar' : 'Iniciar Evaluación'}
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Progreso General */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Progreso General</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {Math.round(generalStats.weightedProgress)}%
              </div>
              <div className="text-sm text-gray-600">Peso Completado</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {generalStats.correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Respuestas Correctas</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {generalStats.totalEvaluated}
              </div>
              <div className="text-sm text-gray-600">Preguntas Evaluadas</div>
            </div>
          </div>

          {/* Barra de progreso general */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso Ponderado</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {Math.round(generalStats.weightedProgress)}% de {generalStats.totalWeight}% total completado
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
        src={IMAGES.CONCRETON}
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-40 drop-shadow-2xl pointer-events-none"
      />
    </div>
  );
};

export default EquipmentSectionSelector;