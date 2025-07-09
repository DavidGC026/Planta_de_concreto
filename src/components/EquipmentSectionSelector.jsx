import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Zap, Loader2, Play, BarChart3 } from 'lucide-react';
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
      return { status: 'pending', icon: Play, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }

    const section = progressData.secciones.find(s => s.seccion_id === sectionId);
    
    if (section?.completada) {
      return { status: 'completed', icon: Play, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    }

    if (section?.subsecciones_completadas > 0) {
      return { status: 'partial', icon: Play, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    }

    return { status: 'pending', icon: Play, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  };

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

        {/* Progreso General */}
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
};

export default EquipmentSectionSelector;