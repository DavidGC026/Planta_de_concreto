import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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

  // Generar gráfica radar para subsecciones
  const generateSubsectionRadarChart = () => {
    if (!subsectionResults || subsectionResults.length === 0) {
      return null;
    }

    const centerX = 300;
    const centerY = 300;
    const maxRadius = 140;
    const minRadius = 30;
    
    // Calcular puntos del polígono para subsecciones
    const radarPoints = subsectionResults.map((subsection, index) => {
      const angle = (index * 360) / subsectionResults.length - 90; // -90 para empezar arriba
      const angleRad = (angle * Math.PI) / 180;
      const radius = minRadius + (subsection.percentage / 100) * (maxRadius - minRadius);
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      return { x, y, ...subsection, angle };
    });

    // Crear path del polígono
    const pathData = radarPoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <div className="relative flex items-center justify-center mb-6">
        <svg width="600" height="600" className="drop-shadow-lg">
          {/* Definir gradientes para los anillos */}
          <defs>
            <radialGradient id="redGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
            </radialGradient>
            <radialGradient id="yellowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.9" />
            </radialGradient>
            <radialGradient id="greenGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.9" />
            </radialGradient>
          </defs>

          {/* Anillos de fondo con colores */}
          <circle
            cx={centerX}
            cy={centerY}
            r={maxRadius + 20}
            fill="url(#greenGradient)"
            stroke="#16a34a"
            strokeWidth="2"
          />
          
          <circle
            cx={centerX}
            cy={centerY}
            r={maxRadius - 20}
            fill="url(#yellowGradient)"
            stroke="#ca8a04"
            strokeWidth="2"
          />
          
          <circle
            cx={centerX}
            cy={centerY}
            r={maxRadius - 60}
            fill="url(#redGradient)"
            stroke="#dc2626"
            strokeWidth="2"
          />

          {/* Líneas de la cuadrícula radial */}
          {[20, 40, 60, 80, 100].map(percent => {
            const radius = minRadius + (percent / 100) * (maxRadius - minRadius);
            return (
              <circle
                key={percent}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            );
          })}

          {/* Líneas radiales desde el centro */}
          {radarPoints.map((point, index) => {
            const angle = (point.angle - 90) * (Math.PI / 180);
            const endX = centerX + (maxRadius + 15) * Math.cos(angle);
            const endY = centerY + (maxRadius + 15) * Math.sin(angle);
            
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="1"
              />
            );
          })}

          {/* Polígono de datos */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.4)"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}
          />

          {/* Puntos de datos */}
          {radarPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="3"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
              }}
            />
          ))}

          {/* Etiquetas de las subsecciones */}
          {radarPoints.map((point, index) => {
            const angle = (point.angle - 90) * (Math.PI / 180);
            const labelRadius = maxRadius + 60;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            
            let textAnchor = 'middle';
            let dominantBaseline = 'middle';
            
            if (labelX > centerX + 10) textAnchor = 'start';
            else if (labelX < centerX - 10) textAnchor = 'end';
            
            if (labelY > centerY + 10) dominantBaseline = 'hanging';
            else if (labelY < centerY - 10) dominantBaseline = 'baseline';

            // Truncar nombres más agresivamente para que quepan mejor
            const truncatedName = point.name.length > 12 ? point.name.substring(0, 12) + '...' : point.name;

            return (
              <g key={index}>
                {/* Texto del nombre de la subsección sin recuadro */}
                <text
                  x={labelX}
                  y={labelY - 8}
                  textAnchor={textAnchor}
                  dominantBaseline={dominantBaseline}
                  className="text-2xl font-bold fill-white"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9), 2px -2px 4px rgba(0,0,0,0.9), -2px 2px 4px rgba(0,0,0,0.9)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}
                >
                  {truncatedName}
                </text>
                {/* Porcentaje */}
                <text
                  x={labelX}
                  y={labelY + 8}
                  textAnchor={textAnchor}
                  dominantBaseline={dominantBaseline}
                  className="text-3xl font-bold fill-yellow-300"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9), 2px -2px 4px rgba(0,0,0,0.9), -2px 2px 4px rgba(0,0,0,0.9)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}
                >
                  {Math.round(point.percentage)}%
                </text>
              </g>
            );
          })}

        </svg>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
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
            {/* Estado de la sección */}
            <div className="text-center mb-8">
              <div className={`${statusBg} rounded-lg p-6 inline-block`}>
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <StatusIcon className={`w-8 h-8 ${statusColor}`} />
                  <div>
                    <div className={`text-3xl font-bold ${statusColor}`}>
                      {sectionStatus}
                    </div>
                    <div className="text-sm text-gray-600">
                      Estado de {sectionName}
                    </div>
                  </div>
                </div>
                <div className={`text-4xl font-bold ${statusColor} mb-2`}>
                  {Math.round(overallPercentage)}%
                </div>
                <div className="text-sm text-gray-600">
                  {totalCorrect}/{totalQuestions} respuestas correctas
                </div>
              </div>
            </div>

            {/* Escala de colores */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Escala de Evaluación por Anillos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-red-800">Rojo (0-60%)</div>
                    <div className="text-sm text-red-600">Nivel deficiente</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-yellow-800">Amarillo (61-85%)</div>
                    <div className="text-sm text-yellow-600">Nivel regular</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-green-800">Verde (86-100%)</div>
                    <div className="text-sm text-green-600">Nivel excelente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfica radar de subsecciones */}
            {subsectionResults && subsectionResults.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Resultados por Subsección</h3>
                </div>
                {generateSubsectionRadarChart()}
              </div>
            )}

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
                <div className="text-2xl font-bold text-orange-600">{subsectionResults?.length || 0}</div>
                <div className="text-sm text-gray-600">Subsecciones</div>
              </div>
            </div>

            {/* Detalles por subsección */}
            {subsectionResults && subsectionResults.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle por Subsección</h3>
                <div className="space-y-3">
                  {subsectionResults.map((subsection, index) => {
                    let statusColor;
                    if (subsection.percentage >= 86) statusColor = 'border-green-500 bg-green-50';
                    else if (subsection.percentage >= 61) statusColor = 'border-yellow-500 bg-yellow-50';
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
            )}

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