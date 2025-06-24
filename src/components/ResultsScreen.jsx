import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Download, RotateCcw, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ResultsScreen = ({ results, onBack, onNewEvaluation }) => {
  const { score, totalAnswers, correctAnswers, isPlantStatus, ponderacionTotal, preguntasTrampa } = results;
  
  // Determinar el estado según el tipo de evaluación
  let status, statusColor, statusIcon;
  
  if (isPlantStatus) {
    // Para evaluación de estado de planta
    if (score >= 80) {
      status = 'EXCELENTE';
      statusColor = 'text-green-600';
      statusIcon = CheckCircle;
    } else if (score >= 60) {
      status = 'BUENO';
      statusColor = 'text-blue-600';
      statusIcon = CheckCircle;
    } else if (score >= 40) {
      status = 'REGULAR';
      statusColor = 'text-yellow-600';
      statusIcon = XCircle;
    } else {
      status = 'DEFICIENTE';
      statusColor = 'text-red-600';
      statusIcon = XCircle;
    }
  } else {
    // Para cuestionarios (sistema de ponderación)
    status = score >= 70 ? 'APROBADO' : 'REPROBADO';
    statusColor = status === 'APROBADO' ? 'text-green-600' : 'text-red-600';
    statusIcon = status === 'APROBADO' ? CheckCircle : XCircle;
  }

  const StatusIcon = statusIcon;

  // Radar chart data (mock data for visualization)
  const categories = [
    'Conocimiento técnico y operativo',
    'Gestión de la producción',
    'Mantenimiento del equipo',
    'Seguridad y cumplimiento normativo',
    'Control de calidad',
    'Gestión del personal',
    'Documentación y control administrativo',
    'Coordinación con logística y clientes',
    'Resolución de problemas',
    'Mejora continua y enfoque a resultados'
  ];

  const generateRadarChart = () => {
    const centerX = 200;
    const centerY = 200;
    const radius = 150;
    const levels = 5;
    
    // Generate grid circles
    const gridCircles = [];
    for (let i = 1; i <= levels; i++) {
      const r = (radius * i) / levels;
      gridCircles.push(
        <circle
          key={`grid-${i}`}
          cx={centerX}
          cy={centerY}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }

    // Generate grid lines
    const gridLines = [];
    categories.forEach((_, index) => {
      const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      gridLines.push(
        <line
          key={`line-${index}`}
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    });

    // Generate data points based on actual score
    const dataPoints = [];
    const scoreRatio = score / 100; // Normalizar el score a un valor entre 0 y 1
    const values = categories.map(() => Math.random() * 0.3 + scoreRatio * 0.7); // Variar alrededor del score real
    
    values.forEach((value, index) => {
      const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);
      dataPoints.push({ x, y });
    });

    // Create polygon path
    const pathData = dataPoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <svg width="400" height="400" className="radar-chart">
        {gridCircles}
        {gridLines}
        
        {/* Data area */}
        <path
          d={pathData}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {dataPoints.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
          />
        ))}
        
        {/* Category labels */}
        {categories.map((category, index) => {
          const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
          const labelRadius = radius + 30;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          
          return (
            <text
              key={`label-${index}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#374151"
              className="font-medium"
            >
              <tspan x={x} dy="0">{category.split(' ').slice(0, 2).join(' ')}</tspan>
              {category.split(' ').length > 2 && (
                <tspan x={x} dy="12">{category.split(' ').slice(2).join(' ')}</tspan>
              )}
            </text>
          );
        })}
      </svg>
    );
  };

  const generateReportData = () => {
    const reportData = {
      evaluacion: {
        titulo: results.evaluationTitle,
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        puntuacion: score,
        puntuacion_ponderada: score, // En el nuevo sistema, score ya es la ponderada
        total_preguntas: totalAnswers,
        respuestas_correctas: correctAnswers || 'N/A',
        preguntas_trampa: preguntasTrampa || 0,
        estado: status,
        tipo: isPlantStatus ? 'Estado de Planta' : 'Cuestionario Ponderado',
        ponderacion_total: ponderacionTotal || 100
      },
      secciones: results.sections || [],
      respuestas: results.answers || {},
      estadisticas: {
        porcentaje_aciertos: isPlantStatus ? 'N/A' : Math.round((correctAnswers / totalAnswers) * 100),
        tiempo_evaluacion: 'N/A',
        observaciones: 'Evaluación completada exitosamente con sistema de ponderación'
      }
    };

    return reportData;
  };

  const handleDownloadJSON = () => {
    try {
      const reportData = generateReportData();
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `reporte_evaluacion_ponderada_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "✅ Reporte descargado",
        description: "El reporte JSON con ponderación se ha descargado exitosamente"
      });
    } catch (error) {
      toast({
        title: "❌ Error al descargar",
        description: "No se pudo generar el reporte JSON"
      });
    }
  };

  const handleDownloadPDF = () => {
    try {
      const reportData = generateReportData();
      
      // Crear contenido HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Evaluación IMCYC - Sistema de Ponderación</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #0055A5; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { color: #0055A5; font-size: 24px; font-weight: bold; }
            .title { color: #002D72; font-size: 20px; margin: 10px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .status { font-size: 18px; font-weight: bold; padding: 10px; text-align: center; border-radius: 5px; }
            .status.aprobado { background-color: #d4edda; color: #155724; }
            .status.reprobado { background-color: #f8d7da; color: #721c24; }
            .status.excelente { background-color: #d1ecf1; color: #0c5460; }
            .status.bueno { background-color: #d4edda; color: #155724; }
            .status.regular { background-color: #fff3cd; color: #856404; }
            .status.deficiente { background-color: #f8d7da; color: #721c24; }
            .section { margin: 20px 0; }
            .section-title { background-color: #f8f9fa; padding: 10px; font-weight: bold; }
            .ponderacion-box { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .trampa-info { background-color: #fff3e0; padding: 10px; border-radius: 5px; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">IMCYC</div>
            <div class="title">Instituto Mexicano del Cemento y del Concreto A.C.</div>
            <div class="title">Reporte de Evaluación - Sistema de Ponderación</div>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <h3>Información General</h3>
              <p><strong>Evaluación:</strong> ${reportData.evaluacion.titulo}</p>
              <p><strong>Fecha:</strong> ${reportData.evaluacion.fecha}</p>
              <p><strong>Hora:</strong> ${reportData.evaluacion.hora}</p>
              <p><strong>Tipo:</strong> ${reportData.evaluacion.tipo}</p>
            </div>
            
            <div class="info-box">
              <h3>Resultados</h3>
              <p><strong>Puntuación Ponderada:</strong> ${reportData.evaluacion.puntuacion_ponderada}%</p>
              <p><strong>Total de preguntas:</strong> ${reportData.evaluacion.total_preguntas}</p>
              ${!isPlantStatus ? `<p><strong>Respuestas correctas:</strong> ${reportData.evaluacion.respuestas_correctas}</p>` : ''}
              ${!isPlantStatus ? `<p><strong>Porcentaje:</strong> ${reportData.estadisticas.porcentaje_aciertos}%</p>` : ''}
              ${reportData.evaluacion.preguntas_trampa > 0 ? `<p><strong>Preguntas trampa respondidas:</strong> ${reportData.evaluacion.preguntas_trampa}</p>` : ''}
            </div>
          </div>
          
          <div class="ponderacion-box">
            <h3>Sistema de Ponderación</h3>
            <p>Esta evaluación utiliza un sistema de ponderación donde cada sección tiene un peso específico que suma al 100% total.</p>
            <p><strong>Ponderación Total Configurada:</strong> ${reportData.evaluacion.ponderacion_total}%</p>
            <p><strong>Puntuación Obtenida:</strong> ${reportData.evaluacion.puntuacion_ponderada}% de ${reportData.evaluacion.ponderacion_total}%</p>
          </div>
          
          ${reportData.evaluacion.preguntas_trampa > 0 ? `
          <div class="trampa-info">
            <h3>Preguntas Trampa</h3>
            <p>Se incluyeron <strong>${reportData.evaluacion.preguntas_trampa}</strong> preguntas trampa en esta evaluación.</p>
            <p>Las preguntas trampa no afectan la puntuación final, pero sirven para evaluar el conocimiento específico.</p>
          </div>
          ` : ''}
          
          <div class="status ${status.toLowerCase()}">
            RESULTADO: ${status}
          </div>
          
          <div class="section">
            <div class="section-title">Observaciones</div>
            <p>${reportData.estadisticas.observaciones}</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} IMCYC - Instituto Mexicano del Cemento y del Concreto A.C.</p>
            <p>Reporte generado automáticamente el ${new Date().toLocaleString('es-MX')}</p>
            <p>Sistema de Evaluación con Ponderación y Preguntas Trampa</p>
          </div>
        </body>
        </html>
      `;
      
      // Crear blob y descargar
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_evaluacion_ponderada_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Reporte descargado",
        description: "El reporte HTML con ponderación se ha descargado exitosamente. Puedes abrirlo en tu navegador o convertirlo a PDF."
      });
    } catch (error) {
      toast({
        title: "❌ Error al descargar",
        description: "No se pudo generar el reporte HTML"
      });
    }
  };

  return (
    <div className="min-h-screen construction-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-700/20"></div>
      
      {/* Results Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="glass-card border-0 rounded-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-800 mb-4">
                {results.evaluationTitle}
              </CardTitle>
              
              <div className="flex items-center justify-center space-x-4 mb-4">
                <StatusIcon className={`w-8 h-8 ${statusColor}`} />
                <div className={`text-4xl font-bold ${statusColor}`}>
                  {status}
                </div>
              </div>
              
              <div className="text-xl text-gray-600">
                Puntuación Ponderada: <span className="font-bold">{score}%</span>
                {ponderacionTotal && ponderacionTotal !== 100 && (
                  <span className="text-sm text-gray-500"> (de {ponderacionTotal}%)</span>
                )}
                {!isPlantStatus && correctAnswers && (
                  <span> | Correctas: {correctAnswers}/{totalAnswers}</span>
                )}
              </div>

              {preguntasTrampa > 0 && (
                <div className="mt-2 text-sm text-orange-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Preguntas trampa respondidas: {preguntasTrampa}
                </div>
              )}
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <div className="flex justify-center mb-8">
                {generateRadarChart()}
              </div>

              {/* Estadísticas adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{score}%</div>
                  <div className="text-sm text-gray-600">Puntuación Ponderada</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {isPlantStatus ? 'N/A' : `${Math.round((correctAnswers / totalAnswers) * 100)}%`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isPlantStatus ? 'Evaluación Cualitativa' : 'Porcentaje de Aciertos'}
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{totalAnswers}</div>
                  <div className="text-sm text-gray-600">
                    {isPlantStatus ? 'Items Evaluados' : 'Preguntas Respondidas'}
                  </div>
                </div>

                {preguntasTrampa > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{preguntasTrampa}</div>
                    <div className="text-sm text-gray-600">Preguntas Trampa</div>
                  </div>
                )}
              </div>

              {/* Información del sistema de ponderación */}
              {!isPlantStatus && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Sistema de Ponderación</h3>
                  <p className="text-blue-700 text-sm">
                    Esta evaluación utiliza un sistema de ponderación donde cada sección tiene un peso específico. 
                    La puntuación final se calcula basándose en la importancia relativa de cada área evaluada.
                  </p>
                  {preguntasTrampa > 0 && (
                    <p className="text-orange-700 text-sm mt-2">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Se incluyeron preguntas trampa que no afectan la puntuación pero evalúan conocimiento específico.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleDownloadJSON}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar JSON</span>
                </Button>

                <Button
                  onClick={handleDownloadPDF}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Descargar HTML</span>
                </Button>
                
                <Button
                  onClick={onNewEvaluation}
                  variant="outline"
                  className="px-6 py-3 flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nueva Evaluación</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Character */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed bottom-8 right-8 z-20"
      >
        <img  
          alt="Mascota IMCYC trabajador de construcción"
          className="w-24 h-24 drop-shadow-lg"
          src="/Concreton.png" 
        />
      </motion.div>
    </div>
  );
};

export default ResultsScreen;