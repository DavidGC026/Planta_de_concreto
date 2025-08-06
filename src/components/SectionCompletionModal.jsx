import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, BarChart, CircularChart } from '@/components/ui/chart';
import { CheckCircle, AlertCircle, TrendingUp, Award, X } from 'lucide-react';

const SectionCompletionModal = ({ 
  isOpen, 
  onClose, 
  onContinue,
  sectionData,
  plantType
}) => {
  if (!isOpen || !sectionData) return null;

  const {
    sectionName,
    overallPercentage,
    totalCorrect,
    totalQuestions,
    subsectionResults = [],
    recommendations = [],
    ponderacion
  } = sectionData;

  const isComplete = totalQuestions > 0;
  const isExcellent = overallPercentage >= 90;
  const isGood = overallPercentage >= 70;
  const needsImprovement = overallPercentage < 60;

  // Preparar datos para gráfica radar de subsecciones
  const radarData = subsectionResults.map(sub => ({
    name: sub.name,
    value: sub.percentage
  }));

  // Preparar datos para gráfica de barras
  const barData = subsectionResults.map(sub => ({
    name: sub.name,
    value: sub.percentage
  }));

  const getStatusIcon = () => {
    if (isExcellent) return { icon: Award, color: 'text-green-500', bg: 'bg-green-50' };
    if (isGood) return { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50' };
    return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' };
  };

  const statusInfo = getStatusIcon();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${statusInfo.bg}`}>
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                ¡Sección Completada!
              </h2>
              <p className="text-sm text-gray-600">
                {sectionName} - Planta {plantType}
              </p>
            </div>
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
          {/* Resumen general */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Resumen General</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(overallPercentage)}%
                  </div>
                  <div className="text-sm text-gray-600">Puntuación General</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalCorrect}
                  </div>
                  <div className="text-sm text-gray-600">Respuestas Correctas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Total Preguntas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {ponderacion}%
                  </div>
                  <div className="text-sm text-gray-600">Peso de Sección</div>
                </div>
              </div>
              
              {/* Gráfica circular del resultado general */}
              <div className="flex justify-center mt-6">
                <CircularChart
                  percentage={overallPercentage}
                  size={200}
                  strokeWidth={12}
                  title={`Evaluación: ${sectionName}`}
                  subtitle={`${totalCorrect}/${totalQuestions} correctas`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resultados por subsecciones */}
          {subsectionResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados por Subsección</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfica radar */}
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-center">Vista Radar</h4>
                    <div className="flex justify-center">
                      {radarData.length > 0 && (
                        <RadarChart 
                          data={radarData}
                          width={500}
                          height={500}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Gráfica de barras */}
                  <div>
                    <h4 className="text-lg font-medium mb-4">Detalle por Subsección</h4>
                    {barData.length > 0 && (
                      <BarChart 
                        data={barData}
                        title=""
                        width={500}
                        height={400}
                      />
                    )}
                  </div>
                </div>
                
                {/* Tabla de resultados detallada */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-3">Detalle Numérico</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 p-2 text-left text-sm font-medium">Subsección</th>
                          <th className="border border-gray-300 p-2 text-center text-sm font-medium">Correctas</th>
                          <th className="border border-gray-300 p-2 text-center text-sm font-medium">Total</th>
                          <th className="border border-gray-300 p-2 text-center text-sm font-medium">Porcentaje</th>
                          <th className="border border-gray-300 p-2 text-center text-sm font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subsectionResults.map((sub, index) => {
                          const status = sub.percentage >= 80 ? 
                            { label: 'Excelente', color: 'text-green-600 bg-green-50' } :
                            sub.percentage >= 60 ?
                            { label: 'Bueno', color: 'text-blue-600 bg-blue-50' } :
                            { label: 'Mejorar', color: 'text-red-600 bg-red-50' };
                            
                          return (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border border-gray-300 p-2 text-sm font-medium">{sub.name}</td>
                              <td className="border border-gray-300 p-2 text-center text-sm">{sub.correctAnswers}</td>
                              <td className="border border-gray-300 p-2 text-center text-sm">{sub.totalQuestions}</td>
                              <td className="border border-gray-300 p-2 text-center text-sm font-bold">
                                {Math.round(sub.percentage)}%
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recomendaciones */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-sm text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Ver Detalles Después
            </Button>
            <Button
              onClick={() => {
                onContinue();
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continuar Evaluación
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionCompletionModal;
