import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CircularChart, BarChart, QualityIndicator } from '@/components/ui/chart';
import { X, CheckCircle, AlertTriangle, XCircle, Award, TrendingUp } from 'lucide-react';

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
    subsectionResults, 
    recommendations,
    ponderacion 
  } = sectionData;

  // Determinar el estado general de la sección
  let sectionStatus, statusIcon, statusColor, statusBg;
  if (overallPercentage >= 80) {
    sectionStatus = 'Excelente';
    statusIcon = Award;
    statusColor = 'text-green-600';
    statusBg = 'bg-green-50';
  } else if (overallPercentage >= 60) {
    sectionStatus = 'Bueno';
    statusIcon = CheckCircle;
    statusColor = 'text-yellow-600';
    statusBg = 'bg-yellow-50';
  } else if (overallPercentage >= 40) {
    sectionStatus = 'Regular';
    statusIcon = AlertTriangle;
    statusColor = 'text-orange-600';
    statusBg = 'bg-orange-50';
  } else {
    sectionStatus = 'Deficiente';
    statusIcon = XCircle;
    statusColor = 'text-red-600';
    statusBg = 'bg-red-50';
  }

  const StatusIcon = statusIcon;

  // Preparar datos para la gráfica de barras de subsecciones
  const chartData = subsectionResults.map(subsection => ({
    name: subsection.name,
    value: subsection.percentage
  }));

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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Sección Completada</h2>
                <p className="text-blue-100 mt-1">{sectionName} - Planta {plantType}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Puntuación general de la sección */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <CircularChart
                  percentage={overallPercentage}
                  size={180}
                  strokeWidth={14}
                  title="Calificación General de la Sección"
                  subtitle={`${totalCorrect}/${totalQuestions} respuestas correctas`}
                />
              </div>

              {/* Estado de la sección */}
              <div className={`${statusBg} rounded-lg p-4 inline-block`}>
                <div className="flex items-center justify-center space-x-3">
                  <StatusIcon className={`w-8 h-8 ${statusColor}`} />
                  <div>
                    <div className={`text-2xl font-bold ${statusColor}`}>
                      {sectionStatus}
                    </div>
                    <div className="text-sm text-gray-600">
                      Estado de {sectionName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(overallPercentage)}%</div>
                <div className="text-sm text-gray-600">Puntuación</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
                <div className="text-sm text-gray-600">Correctas</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{subsectionResults.length}</div>
                <div className="text-sm text-gray-600">Subsecciones</div>
              </div>
            </div>

            {/* Gráfica de resultados por subsección */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Resultados por Subsección</h3>
              </div>
              <BarChart data={chartData} />
            </div>

            {/* Detalles por subsección */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle por Subsección</h3>
              <div className="space-y-3">
                {subsectionResults.map((subsection, index) => {
                  let statusColor;
                  if (subsection.percentage >= 80) statusColor = 'border-green-500 bg-green-50';
                  else if (subsection.percentage >= 60) statusColor = 'border-yellow-500 bg-yellow-50';
                  else statusColor = 'border-red-500 bg-red-50';

                  return (
                    <div key={index} className={`border-l-4 ${statusColor} p-4 rounded-r-lg`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">{subsection.name}</div>
                          <div className="text-sm text-gray-600">
                            {subsection.correctAnswers}/{subsection.totalQuestions} correctas
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">
                            {Math.round(subsection.percentage)}%
                          </div>
                          {subsection.ponderacion && (
                            <div className="text-xs text-gray-500">
                              Peso: {subsection.ponderacion}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Información de ponderación */}
            {ponderacion && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-indigo-800 mb-2">Información de Ponderación:</h3>
                <div className="text-sm text-indigo-700">
                  <div><strong>Ponderación de la sección:</strong> {ponderacion}%</div>
                  <div><strong>Contribución al total:</strong> {((overallPercentage * ponderacion) / 100).toFixed(2)} puntos</div>
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {recommendations && recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-3">Recomendaciones para {sectionName}:</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
                onClick={onContinue}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continuar Evaluación
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SectionCompletionModal;