import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Download, RotateCcw, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ResultsScreen = ({ results, onBack, onNewEvaluation }) => {
  const { 
    score, 
    totalAnswers, 
    correctAnswers, 
    isPlantStatus, 
    evaluationTitle,
    wrongTrapAnswers = 0,
    failedByTrapQuestions = false,
    isPersonalEvaluation = false
  } = results;
  
  // Determinar el estado según el tipo de evaluación y puntaje
  let status, statusColor, statusIcon;
  
  // Verificar si reprobó por preguntas trampa
  if (failedByTrapQuestions) {
    status = 'REPROBADO POR PREGUNTAS TRAMPA';
    statusColor = 'text-red-600';
    statusIcon = AlertTriangle;
  } else if (isPlantStatus) {
    // Para evaluación de estado de planta (operación)
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
    // Para cuestionarios de personal y equipo
    if (isPersonalEvaluation) {
      // Sistema específico para evaluación de personal (91-100% aprobado)
      if (score >= 91) {
        status = 'APROBADO';
        statusColor = 'text-green-600';
        statusIcon = CheckCircle;
      } else {
        status = 'REPROBADO';
        statusColor = 'text-red-600';
        statusIcon = XCircle;
      }
    } else {
      // Sistema original para evaluación de equipo
      status = score >= 70 ? 'APROBADO' : 'REPROBADO';
      statusColor = status === 'APROBADO' ? 'text-green-600' : 'text-red-600';
      statusIcon = status === 'APROBADO' ? CheckCircle : XCircle;
    }
  }

  const StatusIcon = statusIcon;

  // Función para generar gráfica circular con anillos de colores
  const generateCircularChart = () => {
    const centerX = 200;
    const centerY = 200;
    const outerRadius = 120;
    const middleRadius = 90;
    const innerRadius = 60;
    const strokeWidth = 30;
    
    // Calcular el porcentaje para la gráfica
    const percentage = Math.min(Math.max(score, 0), 100);
    const circumference = 2 * Math.PI * outerRadius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    // Determinar color del progreso según los rangos especificados
    let progressColor;
    if (failedByTrapQuestions) {
      progressColor = '#ef4444'; // Rojo para preguntas trampa
    } else if (isPersonalEvaluation) {
      // Para evaluación de personal: 0-90% rojo, 91-100% verde
      progressColor = score >= 91 ? '#22c55e' : '#ef4444';
    } else {
      // Para otras evaluaciones: 0-60% rojo, 61-85% amarillo, 86-100% verde
      if (score >= 86) {
        progressColor = '#22c55e'; // Verde
      } else if (score >= 61) {
        progressColor = '#eab308'; // Amarillo
      } else {
        progressColor = '#ef4444'; // Rojo
      }
    }

    return (
      <div className="relative flex items-center justify-center mb-6">
        <svg width="400" height="400" className="transform -rotate-90">
          {/* Anillo exterior - Verde (86-100%) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="none"
            stroke="#22c55e"
            strokeWidth={strokeWidth}
            opacity="0.3"
          />
          
          {/* Anillo medio - Amarillo (61-85%) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={middleRadius}
            fill="none"
            stroke="#eab308"
            strokeWidth={strokeWidth}
            opacity="0.3"
          />
          
          {/* Anillo interior - Rojo (0-60%) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            opacity="0.3"
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
          <div className={`text-6xl font-bold ${getScoreColor(score, isPersonalEvaluation, failedByTrapQuestions)}`}>
            {score}%
          </div>
          <div className="text-lg text-gray-600 mt-2">
            Puntuación
          </div>
          {!isPlantStatus && correctAnswers && (
            <div className="text-sm text-gray-500 mt-1">
              {correctAnswers}/{totalAnswers} correctas
            </div>
          )}
        </div>
      </div>
    );
  };

  const generateReportData = () => {
    const reportData = {
      evaluacion: {
        titulo: results.evaluationTitle,
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX'),
        puntuacion: score,
        total_preguntas: totalAnswers,
        respuestas_correctas: correctAnswers || 'N/A',
        preguntas_trampa_incorrectas: wrongTrapAnswers || 0,
        reprobado_por_trampa: failedByTrapQuestions,
        estado: status,
        tipo: isPlantStatus ? 'Estado de Planta' : 'Cuestionario con Ponderación por Secciones',
        sistema_calificacion: isPersonalEvaluation 
          ? 'Personal (Aprobado ≥91%)' 
          : 'Estándar (Aprobado ≥70%)'
      },
      secciones: results.sections || [],
      respuestas: results.answers || {},
      estadisticas: {
        porcentaje_aciertos: isPlantStatus ? 'N/A' : Math.round((correctAnswers / totalAnswers) * 100),
        tiempo_evaluacion: 'N/A',
        observaciones: failedByTrapQuestions 
          ? `Evaluación reprobada por ${wrongTrapAnswers} errores en preguntas de verificación`
          : 'Evaluación completada exitosamente con ponderación por secciones',
        rango_color: getRangeDescription(score, isPersonalEvaluation),
        sistema_ponderacion: 'Basado en tabla secciones_evaluacion'
      }
    };

    return reportData;
  };

  const handleDownloadJSON = () => {
    try {
      const reportData = generateReportData();
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `reporte_evaluacion_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "✅ Reporte descargado",
        description: "El reporte JSON se ha descargado exitosamente"
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
          <title>Reporte de Evaluación IMCYC</title>
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
            .trap-warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
            .color-system-box { background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${getChartColor(score, isPersonalEvaluation, failedByTrapQuestions)}; }
            .ponderation-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #6366f1; }
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
            <div class="title">Reporte de Evaluación</div>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <h3>Información General</h3>
              <p><strong>Evaluación:</strong> ${reportData.evaluacion.titulo}</p>
              <p><strong>Fecha:</strong> ${reportData.evaluacion.fecha}</p>
              <p><strong>Hora:</strong> ${reportData.evaluacion.hora}</p>
              <p><strong>Tipo:</strong> ${reportData.evaluacion.tipo}</p>
              <p><strong>Sistema:</strong> ${reportData.evaluacion.sistema_calificacion}</p>
            </div>
            
            <div class="info-box">
              <h3>Resultados</h3>
              <p><strong>Puntuación:</strong> ${reportData.evaluacion.puntuacion}%</p>
              <p><strong>Total de preguntas:</strong> ${reportData.evaluacion.total_preguntas}</p>
              ${!isPlantStatus ? `<p><strong>Respuestas correctas:</strong> ${reportData.evaluacion.respuestas_correctas}</p>` : ''}
              ${!isPlantStatus ? `<p><strong>Porcentaje:</strong> ${reportData.estadisticas.porcentaje_aciertos}%</p>` : ''}
              <p><strong>Rango de color:</strong> ${reportData.estadisticas.rango_color}</p>
            </div>
          </div>
          
          <div class="ponderation-box">
            <h3>🔢 Sistema de Ponderación por Secciones</h3>
            <p>Esta evaluación utiliza el sistema de <strong>ponderación por secciones</strong> de la tabla <code>secciones_evaluacion</code>.</p>
            <p><strong>Cálculo:</strong> Cada sección tiene un peso específico que se multiplica por el porcentaje de aciertos de esa sección.</p>
            <p><em>Ejemplo: Sección A (20% peso) con 80% aciertos = 16% de contribución al total</em></p>
          </div>
          
          ${failedByTrapQuestions ? `
          <div class="trap-warning">
            <h3>⚠️ Evaluación Reprobada por Preguntas de Verificación</h3>
            <p>La evaluación fue reprobada debido a <strong>${wrongTrapAnswers} errores</strong> en preguntas de verificación.</p>
            <p>Las preguntas de verificación evalúan conocimientos fundamentales y son críticas para la aprobación.</p>
          </div>
          ` : ''}
          
          <div class="color-system-box">
            <h3>Sistema de Evaluación por Anillos de Color</h3>
            ${isPersonalEvaluation ? `
              <p><strong>🔴 Rojo (0-90%):</strong> Reprobado - Requiere mejora significativa</p>
              <p><strong>🟢 Verde (91-100%):</strong> Aprobado - Cumple con los estándares</p>
              <p><em>Nota: Para evaluación de personal se requiere ≥91% para aprobar</em></p>
            ` : `
              <p><strong>🔴 Rojo (0-60%):</strong> Nivel deficiente - Requiere mejora significativa</p>
              <p><strong>🟡 Amarillo (61-85%):</strong> Nivel regular - Requiere algunas mejoras</p>
              <p><strong>🟢 Verde (86-100%):</strong> Nivel excelente - Cumple con los estándares</p>
            `}
            <p><em>Preguntas de verificación: 2 o más errores = Reprobación automática</em></p>
          </div>
          
          <div class="status ${status.toLowerCase().replace(/\s+/g, '_')}">
            RESULTADO: ${status}
          </div>
          
          <div class="section">
            <div class="section-title">Observaciones</div>
            <p>${reportData.estadisticas.observaciones}</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} IMCYC - Instituto Mexicano del Cemento y del Concreto A.C.</p>
            <p>Reporte generado automáticamente el ${new Date().toLocaleString('es-MX')}</p>
            <p>Sistema de Evaluación con Ponderación por Secciones y Preguntas de Verificación</p>
          </div>
        </body>
        </html>
      `;
      
      // Crear blob y descargar
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_evaluacion_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Reporte descargado",
        description: "El reporte HTML se ha descargado exitosamente. Puedes abrirlo en tu navegador o convertirlo a PDF."
      });
    } catch (error) {
      toast({
        title: "❌ Error al descargar",
        description: "No se pudo generar el reporte HTML"
      });
    }
  };

  // Función para obtener el color de la estadística según el puntaje
  const getScoreColor = (score, isPersonal, failedTrap) => {
    if (failedTrap) return 'text-red-600';
    
    if (isPersonal) {
      return score >= 91 ? 'text-green-600' : 'text-red-600';
    } else {
      if (score >= 86) return 'text-green-600';
      if (score >= 61) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  // Función para obtener el color de fondo de la estadística
  const getScoreBgColor = (score, isPersonal, failedTrap) => {
    if (failedTrap) return 'bg-red-50';
    
    if (isPersonal) {
      return score >= 91 ? 'bg-green-50' : 'bg-red-50';
    } else {
      if (score >= 86) return 'bg-green-50';
      if (score >= 61) return 'bg-yellow-50';
      return 'bg-red-50';
    }
  };

  // Función para obtener descripción del rango
  const getRangeDescription = (score, isPersonal) => {
    if (isPersonal) {
      return score >= 91 ? 'Verde (91-100%)' : 'Rojo (0-90%)';
    } else {
      if (score >= 86) return 'Verde (86-100%)';
      if (score >= 61) return 'Amarillo (61-85%)';
      return 'Rojo (0-60%)';
    }
  };

  // Función para obtener color del gráfico
  const getChartColor = (score, isPersonal, failedTrap) => {
    if (failedTrap) return '#ef4444';
    
    if (isPersonal) {
      return score >= 91 ? '#22c55e' : '#ef4444';
    } else {
      if (score >= 86) return '#22c55e';
      if (score >= 61) return '#eab308';
      return '#ef4444';
    }
  };

  return (
    <div className="min-h-screen custom-bg">
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

              {/* Alerta de preguntas trampa */}
              {failedByTrapQuestions && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      Reprobado por {wrongTrapAnswers} errores en preguntas de verificación
                    </span>
                  </div>
                  <p className="text-sm text-red-600 mt-2">
                    Las preguntas de verificación evalúan conocimientos fundamentales críticos
                  </p>
                </div>
              )}

              {/* Indicador del sistema de calificación para personal */}
              {isPersonalEvaluation && !failedByTrapQuestions && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Sistema de Personal:</span> Se requiere ≥91% para aprobar
                </div>
              )}
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {/* Escala de colores encima de la gráfica */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Escala de Evaluación por Anillos</h3>
                {isPersonalEvaluation ? (
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
                ) : (
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
                )}
                <div className="text-center text-sm text-gray-600 bg-orange-50 p-3 rounded border border-orange-200 mt-4">
                  <strong>Preguntas de Verificación:</strong> 2 o más errores = Reprobación automática
                </div>
              </div>

              {/* Gráfica circular con anillos */}
              <div className="flex justify-center mb-8">
                {generateCircularChart()}
              </div>

              {/* Estadísticas con colores dinámicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`${getScoreBgColor(score, isPersonalEvaluation, failedByTrapQuestions)} p-4 rounded-lg text-center border border-opacity-30`}>
                  <div className={`text-2xl font-bold ${getScoreColor(score, isPersonalEvaluation, failedByTrapQuestions)}`}>{score}%</div>
                  <div className="text-sm text-gray-600">Puntuación Final</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {failedByTrapQuestions ? '🔴 Reprobado por verificación' :
                     getRangeDescription(score, isPersonalEvaluation)}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
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
              </div>

              {/* Información del sistema de ponderación */}
              {!isPlantStatus && (
                <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-2">🔢 Sistema de Ponderación por Secciones</h3>
                  <p className="text-indigo-700 text-sm">
                    Esta evaluación utiliza el sistema de <strong>ponderación por secciones</strong> de la tabla <code>secciones_evaluacion</code>. 
                    Cada sección tiene un peso específico que se multiplica por el porcentaje de aciertos de esa sección.
                    Las preguntas de verificación actúan como filtro de seguridad: 2 o más errores resultan en reprobación automática.
                    {isPersonalEvaluation && (
                      <span className="block mt-2 font-medium">
                        Para evaluación de personal se requiere una puntuación ≥91% para aprobar.
                      </span>
                    )}
                  </p>
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