import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BarChart, RadarChart, QualityIndicator } from '@/components/ui/chart';
import { X, Download, BarChart3, Target } from 'lucide-react';

const EvaluationSummaryModal = ({ 
  isOpen, 
  onClose, 
  onFinish, 
  evaluationData,
  plantType 
}) => {
  if (!isOpen || !evaluationData) return null;

  const { sectionResults, overallScore, totalQuestions, correctAnswers } = evaluationData;

  // Preparar datos para las gráficas
  const chartData = sectionResults.map(section => ({
    name: section.name,
    value: section.percentage
  }));

  // Generar recomendaciones generales
  const generateRecommendations = () => {
    const recommendations = [];
    
    sectionResults.forEach(section => {
      if (section.percentage < 60) {
        recommendations.push(`Mejorar ${section.name.toLowerCase()}: ${section.percentage}% actual`);
      }
    });

    if (overallScore >= 80) {
      recommendations.push('Excelente desempeño general. Mantener estándares actuales.');
    } else if (overallScore >= 60) {
      recommendations.push('Buen desempeño con oportunidades de mejora identificadas.');
    } else {
      recommendations.push('Se requiere plan de mejora integral para la planta.');
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Resumen de Evaluación</h2>
                <p className="text-green-100 mt-1">Planta {plantType} - Evaluación Completa</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-green-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Puntuación general */}
            <div className="text-center mb-8">
              <QualityIndicator
                percentage={overallScore}
                label={`Calidad General de la Planta ${plantType}`}
              />
            </div>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(overallScore)}%</div>
                <div className="text-sm text-gray-600">Puntuación Final</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Respuestas Correctas</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Evaluado</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{sectionResults.length}</div>
                <div className="text-sm text-gray-600">Secciones</div>
              </div>
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfica de barras */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Resultados por Sección</h3>
                </div>
                <BarChart 
                  data={chartData}
                />
              </div>

              {/* Gráfica radar */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Vista Radar</h3>
                </div>
                <RadarChart 
                  data={chartData}
                  size={280}
                />
              </div>
            </div>

            {/* Detalles por sección */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle por Sección</h3>
              <div className="space-y-3">
                {sectionResults.map((section, index) => {
                  let statusColor;
                  if (section.percentage >= 80) statusColor = 'border-green-500 bg-green-50';
                  else if (section.percentage >= 60) statusColor = 'border-yellow-500 bg-yellow-50';
                  else statusColor = 'border-red-500 bg-red-50';

                  return (
                    <div key={index} className={`border-l-4 ${statusColor} p-4 rounded-r-lg`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">{section.name}</div>
                          <div className="text-sm text-gray-600">
                            {section.correctAnswers}/{section.totalQuestions} correctas
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">
                            {Math.round(section.percentage)}%
                          </div>
                          {section.ponderacion && (
                            <div className="text-xs text-gray-500">
                              Peso: {section.ponderacion}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-800 mb-3">Recomendaciones Generales:</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6 py-2"
              >
                Cerrar
              </Button>
              
              <Button
                onClick={() => {/* Implementar descarga */}}
                variant="outline"
                className="px-6 py-2 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Reporte</span>
              </Button>
              
              <Button
                onClick={onFinish}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Finalizar Evaluación
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EvaluationSummaryModal;