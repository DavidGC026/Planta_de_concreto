import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { RotateCcw, CheckCircle, XCircle, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ResultsScreen = ({ results, onBack, onNewEvaluation }) => {
  const { 
    score, 
    totalAnswers, 
    correctAnswers, 
    evaluationTitle,
    sections
  } = results;
  
  // Determinar el estado según el puntaje (para evaluación de personal: ≥91% aprobado)
  const status = score >= 91 ? 'APROBADO' : 'REPROBADO';
  const statusColor = status === 'APROBADO' ? 'text-green-600' : 'text-red-600';
  const StatusIcon = status === 'APROBADO' ? CheckCircle : XCircle;

  // Función para generar gráfica circular
  const generateCircularChart = () => {
    const centerX = 200;
    const centerY = 200;
    const outerRadius = 120;
    const strokeWidth = 30;
    
    const percentage = Math.min(Math.max(score, 0), 100);
    const circumference = 2 * Math.PI * outerRadius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    // Color según el rango para evaluación de personal
    const progressColor = score >= 91 ? '#22c55e' : '#ef4444';

    return (
      <div className="relative flex items-center justify-center mb-6">
        <svg width="400" height="400" className="transform -rotate-90">
          {/* Anillo de fondo */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          
          {/* Círculo de progreso */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1.5s ease-in-out',
            }}
          />
        </svg>
        
        {/* Contenido central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-bold ${statusColor}`}>
            {score}%
          </div>
          <div className="text-lg text-gray-600 mt-2">
            Puntuación
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {correctAnswers}/{totalAnswers} correctas
          </div>
        </div>
      </div>
    );
  };

  const handleDownloadReport = () => {
    try {
      const reportData = {
        evaluacion: {
          titulo: evaluationTitle,
          fecha: new Date().toLocaleDateString('es-MX'),
          hora: new Date().toLocaleTimeString('es-MX'),
          puntuacion: score,
          total_preguntas: totalAnswers,
          respuestas_correctas: correctAnswers,
          estado: status,
          tipo: 'Evaluación de Jefe de Planta'
        },
        secciones: sections || [],
        respuestas: results.answers || {}
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `evaluacion_jefe_planta_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "✅ Reporte descargado",
        description: "El reporte se ha descargado exitosamente"
      });
    } catch (error) {
      toast({
        title: "❌ Error al descargar",
        description: "No se pudo generar el reporte"
      });
    }
  };

  return (
    <div className="min-h-screen custom-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-700/20"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="glass-card border-0 rounded-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-800 mb-4">
                {evaluationTitle}
              </CardTitle>
              
              <div className="flex items-center justify-center space-x-4 mb-4">
                <StatusIcon className={`w-8 h-8 ${statusColor}`} />
                <div className={`text-4xl font-bold ${statusColor}`}>
                  {status}
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Sistema de Jefe de Planta:</span> Se requiere ≥91% para aprobar
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {/* Escala de colores */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Escala de Evaluación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-red-800">Rojo (0-90%)</div>
                      <div className="text-sm text-red-600">Reprobado</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-green-800">Verde (91-100%)</div>
                      <div className="text-sm text-green-600">Aprobado</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfica circular */}
              <div className="flex justify-center mb-8">
                {generateCircularChart()}
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`${score >= 91 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg text-center border border-opacity-30`}>
                  <div className={`text-2xl font-bold ${statusColor}`}>{score}%</div>
                  <div className="text-sm text-gray-600">Puntuación Final</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {score >= 91 ? 'Verde (91-100%)' : 'Rojo (0-90%)'}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((correctAnswers / totalAnswers) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Porcentaje de Aciertos</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{totalAnswers}</div>
                  <div className="text-sm text-gray-600">Preguntas Respondidas</div>
                </div>
              </div>

              {/* Información del sistema */}
              <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">📋 Evaluación de Jefe de Planta</h3>
                <p className="text-indigo-700 text-sm">
                  Esta evaluación mide las competencias específicas requeridas para el rol de Jefe de Planta. 
                  Se requiere una puntuación mínima de <strong>91%</strong> para aprobar la evaluación.
                </p>
              </div>

              {/* Desglose por secciones */}
              {sections && sections.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Desglose por Secciones</h3>
                  <div className="space-y-3">
                    {sections.map((section, index) => {
                      // Calcular respuestas de esta sección
                      let sectionCorrect = 0;
                      let sectionTotal = 0;

                      section.preguntas?.forEach((_, qIndex) => {
                        const key = `jefe_planta-${index}-${qIndex}`;
                        if (results.answers[key]) {
                          sectionTotal++;
                          if (results.answers[key] === 'si') {
                            sectionCorrect++;
                          }
                        }
                      });

                      const sectionPercentage = sectionTotal > 0 ? (sectionCorrect / sectionTotal) * 100 : 0;

                      return (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">{section.nombre}</h4>
                            <div className="text-sm text-gray-600">
                              Peso: {section.ponderacion}%
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {sectionCorrect}/{sectionTotal} correctas
                            </div>
                            <div className={`text-sm font-medium ${
                              sectionPercentage >= 91 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Math.round(sectionPercentage)}%
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${
                                sectionPercentage >= 91 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${sectionPercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  className="px-6 py-3 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Reporte</span>
                </Button>
                
                <Button
                  onClick={onNewEvaluation}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nueva Evaluación</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mascota */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed bottom-0 right-0 md:right-8 z-20"
      >
        <img  
          alt="Mascota IMCYC"
          className="w-32 h-32 md:w-40 md:h-40 drop-shadow-lg"
          src="/Concreton.png" 
        />
      </motion.div>
    </div>
  );
};

export default ResultsScreen;