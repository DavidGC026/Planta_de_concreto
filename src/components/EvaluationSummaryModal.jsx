import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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

  // Generar gráfica radar para secciones principales
  const generateSectionRadarChart = () => {
    if (!sectionResults || sectionResults.length === 0) {
      return null;
    }

    const centerX = 300;
    const centerY = 300;
    const maxRadius = 140;
    const minRadius = 30;
    
    // Calcular puntos del polígono para secciones
    const radarPoints = sectionResults.map((section, index) => {
      const angle = (index * 360) / sectionResults.length - 90; // -90 para empezar arriba
      const angleRad = (angle * Math.PI) / 180;
      const x = 400 + radius * Math.cos(angle); // Usar coordenadas del nuevo centro
      const y = 400 + radius * Math.sin(angle);
      const y = centerY + radius * Math.sin(angleRad);
      return { x, y, ...section, angle };
    });

    // Crear path del polígono
    const pathData = radarPoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <div className="relative flex items-center justify-center mb-6">
        <svg width="800" height="800" className="drop-shadow-lg"> {/* Aumentar tamaño del SVG */}
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
            cx={400} {/* Centrar en el nuevo tamaño */}
            cy={400}
            r={maxRadius + 20}
            fill="url(#greenGradient)"
            stroke="#16a34a"
            strokeWidth="2"
          />
          
          <circle
            cx={400}
            cy={400}
            r={maxRadius - 20}
            fill="url(#yellowGradient)"
            stroke="#ca8a04"
            strokeWidth="2"
          />
          
          <circle
            cx={400}
            cy={400}
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
                cx={400}
                cy={400}
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
            const endX = 400 + (maxRadius + 15) * Math.cos(angle);
            const endY = 400 + (maxRadius + 15) * Math.sin(angle);
            
            return (
              <line
                key={index}
                x1={400}
                y1={400}
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

          {/* Etiquetas de las secciones */}
          {radarPoints.map((point, index) => {
            const angle = (point.angle - 90) * (Math.PI / 180);
            const labelRadius = maxRadius + 120; // Aumentar distancia para más espacio
            const labelX = 400 + labelRadius * Math.cos(angle);
            const labelY = 400 + labelRadius * Math.sin(angle);
            
            let textAnchor = 'middle';
            let dominantBaseline = 'middle';
            
            if (labelX > 400 + 10) textAnchor = 'start';
            else if (labelX < 400 - 10) textAnchor = 'end';
            
            if (labelY > 400 + 10) dominantBaseline = 'hanging';
            else if (labelY < 400 - 10) dominantBaseline = 'baseline';

            // Dividir texto largo en múltiples líneas
            const maxCharsPerLine = 20;
            const words = point.name.split(' ');
            const lines = [];
            let currentLine = '';
            
            words.forEach(word => {
              if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            });
            if (currentLine) lines.push(currentLine);
            
            // Permitir hasta 3 líneas
            if (lines.length > 3) {
              lines[2] = lines[2].length > 15 ? lines[2].substring(0, 15) + '...' : lines[2];
            // Dividir texto largo en múltiples líneas
            const maxCharsPerLine = 20;
            const words = point.name.split(' ');
            const lines = [];
            let currentLine = '';
            
            words.forEach(word => {
              if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            });
            if (currentLine) lines.push(currentLine);
            
            // Permitir hasta 3 líneas
            if (lines.length > 3) {
              lines[2] = lines[2].length > 15 ? lines[2].substring(0, 15) + '...' : lines[2];
              lines.splice(3);
            }

            return (
              <g key={index}>
                {/* Texto del nombre de la sección en múltiples líneas */}
                {lines.map((line, lineIndex) => (
                  <text
                    key={lineIndex}
                    x={labelX}
                    y={labelY - 16 + (lineIndex * 24) - ((lines.length - 1) * 12)}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    className="text-2xl font-bold fill-white"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9), 2px -2px 4px rgba(0,0,0,0.9), -2px 2px 4px rgba(0,0,0,0.9)',
                      filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                    }}
                  >
                    {line}
                  </text>
                ))}
                
                {/* Texto del nombre de la sección en múltiples líneas */}
                {lines.map((line, lineIndex) => (
                  <text
                    key={lineIndex}
                    x={labelX}
                    y={labelY - 16 + (lineIndex * 24) - ((lines.length - 1) * 12)}
                    textAnchor={textAnchor}
                  y={labelY + 16 + ((lines.length - 1) * 12)}
                    className="text-2xl font-bold fill-white"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9), 2px -2px 4px rgba(0,0,0,0.9), -2px 2px 4px rgba(0,0,0,0.9)',
                      filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                    }}
                  >
                    {line}
                  </text>
                ))}
                
              </g>
            );
          })}

        </svg>
      </div>
    );
  };

  // Generar recomendaciones generales
  const generateRecommendations = () => {
    const recommendations = [];
    
    sectionResults.forEach(section => {
      if (section.percentage < 60) {
        recommendations.push(`Mejorar ${section.name.toLowerCase()}: ${section.percentage}% actual`);
      }
    });

    if (overallScore >= 86) {
      recommendations.push('Excelente desempeño general. Mantener estándares actuales.');
    } else if (overallScore >= 61) {
      recommendations.push('Buen desempeño con oportunidades de mejora identificadas.');
    } else {
      recommendations.push('Se requiere plan de mejora integral para la planta.');
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Función para determinar el estado general
  const getOverallStatus = () => {
    if (overallScore >= 86) return { status: 'EXCELENTE', color: 'text-green-600', bg: 'bg-green-50' };
    if (overallScore >= 61) return { status: 'BUENO', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'DEFICIENTE', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const overallStatus = getOverallStatus();

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
            {/* Estado general */}
            <div className="text-center mb-8">
              <div className={`${overallStatus.bg} rounded-lg p-6 inline-block`}>
                <div className={`text-4xl font-bold ${overallStatus.color} mb-2`}>
                  {overallStatus.status}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Calidad General de la Planta {plantType}
                </div>
                <div className={`text-5xl font-bold ${overallStatus.color}`}>
                  {Math.round(overallScore)}%
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

            {/* Gráfica radar de secciones */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Vista Radar por Secciones</h3>
              </div>
              {generateSectionRadarChart()}
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

            {/* Detalles por sección */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Detalle por Sección</h3>
              </div>
              <div className="space-y-3">
                {sectionResults.map((section, index) => {
                  let statusColor;
                  if (section.percentage >= 86) statusColor = 'border-green-500 bg-green-50';
                  else if (section.percentage >= 61) statusColor = 'border-yellow-500 bg-yellow-50';
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