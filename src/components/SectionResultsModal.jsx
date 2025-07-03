import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CircularChart, QualityIndicator } from '@/components/ui/chart';
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const SectionResultsModal = ({ 
  isOpen, 
  onClose, 
  onContinue, 
  sectionData, 
  sectionResults,
  isLastSection = false 
}) => {
  if (!isOpen || !sectionData || !sectionResults) return null;

  const { percentage, correctAnswers, totalQuestions, recommendations } = sectionResults;

  // Determinar el estado de la sección
  let sectionStatus, statusIcon, statusColor;
  if (percentage >= 80) {
    sectionStatus = 'Excelente';
    statusIcon = CheckCircle;
    statusColor = 'text-green-600';
  } else if (percentage >= 60) {
    sectionStatus = 'Bueno';
    statusIcon = CheckCircle;
    statusColor = 'text-yellow-600';
  } else if (percentage >= 40) {
    sectionStatus = 'Regular';
    statusIcon = AlertTriangle;
    statusColor = 'text-orange-600';
  } else {
    sectionStatus = 'Deficiente';
    statusIcon = XCircle;
    statusColor = 'text-red-600';
  }

  const StatusIcon = statusIcon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Resultados de Sección</h2>
                <p className="text-blue-100 mt-1">{sectionData.nombre}</p>
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
            {/* Gráfica principal */}
            <div className="flex justify-center mb-8">
              <CircularChart
                percentage={percentage}
                size={160}
                strokeWidth={12}
                title="Calificación de la Sección"
                subtitle={`${correctAnswers}/${totalQuestions} correctas`}
              />
            </div>

            {/* Indicador de calidad */}
            <div className="mb-6">
              <QualityIndicator
                percentage={percentage}
                label={`Estado de ${sectionData.nombre}`}
              />
            </div>

            {/* Estadísticas detalladas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{correctAnswers}</div>
                <div className="text-sm text-gray-600">Correctas</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{totalQuestions - correctAnswers}</div>
                <div className="text-sm text-gray-600">Incorrectas</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {/* Estado de la sección */}
            <div className="flex items-center justify-center space-x-3 mb-6">
              <StatusIcon className={`w-8 h-8 ${statusColor}`} />
              <div>
                <div className={`text-xl font-bold ${statusColor}`}>
                  {sectionStatus}
                </div>
                <div className="text-sm text-gray-600">
                  Estado de la sección
                </div>
              </div>
            </div>

            {/* Recomendaciones */}
            {recommendations && recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Recomendaciones:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-600">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Información de ponderación */}
            {sectionData.ponderacion && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600">
                  <strong>Ponderación de la sección:</strong> {sectionData.ponderacion}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Contribución al total:</strong> {((percentage * sectionData.ponderacion) / 100).toFixed(2)} puntos
                </div>
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
                {isLastSection ? 'Ver Resultados Finales' : 'Continuar Evaluación'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SectionResultsModal;