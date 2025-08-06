import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart } from '@/components/ui/chart';
import { X, Download, BarChart3 } from 'lucide-react';

const EquipmentSummaryModal = ({ 
  isOpen, 
  onClose, 
  progressData, 
  evaluationData, 
  selectedPlantType 
}) => {
  const [radarData, setRadarData] = useState(null);

  useEffect(() => {
    if (evaluationData) {
      generateRadarData();
    }
  }, [progressData, evaluationData]);

  const generateRadarData = () => {
    if (!evaluationData?.secciones) {
      return;
    }

    console.log('=== DEBUG RADAR DATA ===');
    console.log('evaluationData.secciones:', evaluationData.secciones);
    console.log('progressData:', progressData);

    // Preparar datos para el radar chart usando TODAS las secciones de evaluación
    const categories = evaluationData.secciones.map(section => {
      const progressSection = progressData?.secciones?.find(
        p => p.seccion_id === section.id
      );

      const score = progressSection?.puntaje_porcentaje || 0;
      const completed = progressSection?.completada || false;
      const weight = parseFloat(section.ponderacion) || 0;

      console.log(`Sección ${section.nombre}: score=${score}, completed=${completed}, weight=${weight}`);

      return {
        category: section.nombre,
        score: score,
        weight: weight,
        completed: completed
      };
    });

    console.log('categories para radar:', categories);

    setRadarData({
      categories,
      title: `Evaluación de Equipo - Planta ${selectedPlantType?.charAt(0).toUpperCase() + selectedPlantType?.slice(1)}`
    });
  };

  const calculateOverallStats = () => {
    if (!evaluationData?.secciones) {
      return {
        completedSections: 0,
        totalSections: 0,
        weightedScore: 0,
        totalWeight: 0,
        averageScore: 0
      };
    }

    const completedSections = progressData?.secciones ? 
      progressData.secciones.filter(s => s.completada).length : 0;
    const totalSections = evaluationData.secciones.length;
    
    let weightedScore = 0;
    let totalWeight = 0;
    let totalScore = 0;
    let sectionsWithScores = 0;

    evaluationData.secciones.forEach(section => {
      const progressSection = progressData?.secciones?.find(
        p => p.seccion_id === section.id
      );

      const weight = parseFloat(section.ponderacion) || 0;
      totalWeight += weight;

      if (progressSection?.completada) {
        const score = progressSection.puntaje_porcentaje || 0;
        weightedScore += (score * weight / 100);
        totalScore += score;
        sectionsWithScores++;
      }
    });

    const averageScore = sectionsWithScores > 0 ? totalScore / sectionsWithScores : 0;

    return {
      completedSections,
      totalSections,
      weightedScore: Math.round(weightedScore),
      totalWeight: Math.round(totalWeight),
      averageScore: Math.round(averageScore)
    };
  };

  const stats = calculateOverallStats();

  const handleDownload = () => {
    // Aquí se puede implementar la funcionalidad de descarga
    console.log('Descargar resumen...');
  };

  if (!isOpen || !evaluationData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto m-4 w-full">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Resumen Final de Evaluación de Equipo</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Estadísticas generales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas Generales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.completedSections}
                  </div>
                  <div className="text-sm text-gray-600">Secciones Completadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalSections}
                  </div>
                  <div className="text-sm text-gray-600">Total de Secciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.weightedScore}%
                  </div>
                  <div className="text-sm text-gray-600">Puntuación Ponderada</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.averageScore}%
                  </div>
                  <div className="text-sm text-gray-600">Promedio General</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((stats.completedSections / stats.totalSections) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Progreso</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfica radar */}
          {radarData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evaluación por Secciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <RadarChart 
                    data={radarData.categories}
                    size={400}
                    title="Evaluación"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detalle por secciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalle por Secciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluationData.secciones.map((section) => {
                  const progressSection = progressData?.secciones?.find(
                    p => p.seccion_id === section.id
                  );
                  
                  return (
                    <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{section.nombre}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            progressSection?.completada 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {progressSection?.completada ? 'Completada' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Peso: {section.ponderacion}%
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {progressSection?.completada ? (
                          <>
                            <div className="text-lg font-semibold text-green-600">
                              {Math.round(progressSection.puntaje_porcentaje)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {progressSection.respuestas_correctas}/{progressSection.total_preguntas} correctas
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Resumen</span>
            </Button>
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentSummaryModal;
