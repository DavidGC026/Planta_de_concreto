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
    sections,
    // NO mostrar información de preguntas trampa
    isPersonalEvaluation = false
  } = results;
  
  // Determinar el estado según el tipo de evaluación y puntaje
  let status, statusColor, statusIcon;
  
  if (isPlantStatus) {
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

  // Función para generar gráfica radar con anillos de colores de fondo
  const generateRadarChart = () => {
    if (!sections || sections.length === 0) {
      return generateSimpleCircularChart();
    }

    const centerX = 300;
    const centerY = 300;
    const maxRadius = 120;
    const minRadius = 20;
    
    // Calcular datos de las secciones para el radar
    const sectionData = sections.map((section, index) => {
      // Calcular porcentaje de la sección basado en las respuestas
      let sectionScore = 0;
      let sectionQuestions = 0;
      
      if (section.preguntas) {
        section.preguntas.forEach((pregunta, qIndex) => {
          const key = Object.keys(results.answers || {}).find(k => 
            k.includes(`-${index}-${qIndex}`) || k.includes(`${index}-${qIndex}`)
          );
          
          if (key && results.answers[key]) {
            sectionQuestions++;
            if (results.answers[key] === 'si' || results.answers[key] === 'bueno') {
              sectionScore += 10;
            } else if (results.answers[key] === 'regular') {
              sectionScore += 5;
            }
          }
        });
      } else if (section.items) {
        // Para evaluación de operación
        section.items.forEach((item, itemIndex) => {
          const key = `${index}-${itemIndex}`;
          if (results.answers[key]) {
            sectionQuestions++;
            if (results.answers[key] === 'bueno') {
              sectionScore += 10;
            } else if (results.answers[key] === 'regular') {
              sectionScore += 5;
            }
          }
        });
      }
      
      const percentage = sectionQuestions > 0 ? (sectionScore / (sectionQuestions * 10)) * 100 : 0;
      
      return {
        name: section.nombre || section.title || `Sección ${index + 1}`,
        percentage: Math.min(percentage, 100),
        angle: (index * 360) / sections.length
      };
    });

    const numSections = sectionData.length;
    
    // Generar puntos del polígono
    const radarPoints = sectionData.map(section => {
      const angle = (section.angle - 90) * (Math.PI / 180); // -90 para empezar arriba
      const radius = minRadius + (section.percentage / 100) * (maxRadius - minRadius);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y, ...section };
    });

    // Crear path del polígono
    const pathData = radarPoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <div className="relative flex items-center justify-center mb-6">
        <svg width="600" height="600" className="drop-shadow-lg">
          {/* Anillos de fondo con colores */}
          {/* Anillo rojo (0-60% o 0-90% para personal) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={minRadius + (isPersonalEvaluation ? 0.9 : 0.6) * (maxRadius - minRadius)}
            fill="#fef2f2"
            stroke="#fecaca"
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Anillo amarillo (61-85% - solo para no personal) */}
          {!isPersonalEvaluation && (
            <circle
              cx={centerX}
              cy={centerY}
              r={minRadius + 0.85 * (maxRadius - minRadius)}
              fill="#fffbeb"
              stroke="#fed7aa"
              strokeWidth="1"
              opacity="0.8"
            />
          )}
          
          {/* Anillo verde (86-100% o 91-100% para personal) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={maxRadius}
            fill="#f0fdf4"
            stroke="#bbf7d0"
            strokeWidth="1"
            opacity="0.8"
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
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}

          {/* Líneas radiales desde el centro */}
          {sectionData.map((section, index) => {
            const angle = (section.angle - 90) * (Math.PI / 180);
            const endX = centerX + maxRadius * Math.cos(angle);
            const endY = centerY + maxRadius * Math.sin(angle);
            
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}

          {/* Polígono de datos */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Puntos de datos */}
          {radarPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Etiquetas de las secciones */}
          {radarPoints.map((point, index) => {
            const angle = (point.angle - 90) * (Math.PI / 180);
            const labelRadius = maxRadius + 40;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            
            // Ajustar posición del texto según el ángulo
            let textAnchor = 'middle';
            let dominantBaseline = 'middle';
            
            if (labelX > centerX + 10) textAnchor = 'start';
            else if (labelX < centerX - 10) textAnchor = 'end';
            
            if (labelY > centerY + 10) dominantBaseline = 'hanging';
            else if (labelY < centerY - 10) dominantBaseline = 'baseline';

            return (
              <g key={index}>
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  dominantBaseline={dominantBaseline}
                  className="text-xs font-medium fill-gray-700"
                  style={{ maxWidth: '80px' }}
                >
                  {point.name.length > 20 ? point.name.substring(0, 20) + '...' : point.name}
                </text>
                <text
                  x={labelX}
                  y={labelY + 12}
                  textAnchor={textAnchor}
                  dominantBaseline={dominantBaseline}
                  className="text-xs font-bold fill-blue-600"
                >
                  {Math.round(point.percentage)}%
                </text>
              </g>
            );
          })}

          {/* Etiquetas de porcentajes en los anillos */}
          <text x={centerX + minRadius + 0.2 * (maxRadius - minRadius)} y={centerY - 5} className="text-xs fill-gray-500" textAnchor="middle">20%</text>
          <text x={centerX + minRadius + 0.4 * (maxRadius - minRadius)} y={centerY - 5} className="text-xs fill-gray-500" textAnchor="middle">40%</text>
          <text x={centerX + minRadius + 0.6 * (maxRadius - minRadius)} y={centerY - 5} className="text-xs fill-gray-500" textAnchor="middle">60%</text>
          <text x={centerX + minRadius + 0.8 * (maxRadius - minRadius)} y={centerY - 5} className="text-xs fill-gray-500" textAnchor="middle">80%</text>
          <text x={centerX + maxRadius} y={centerY - 5} className="text-xs fill-gray-500" textAnchor="middle">100%</text>
        </svg>
        
        {/* Información central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className={`text-4xl font-bold ${getScoreColor(score, isPersonalEvaluation)} mb-2`}>
            {score}%
          </div>
          <div className="text-sm text-gray-600 text-center">
            Puntuación: {score}
          </div>
          {!isPlantStatus && correctAnswers && (
            <div className="text-xs text-gray-500 mt-1">
              Correctas: {correctAnswers}/{totalAnswers}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Función para generar gráfica circular simple (fallback)
  const generateSimpleCircularChart = () => {
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
    if (isPersonalEvaluation) {
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
          <div className={`text-6xl font-bold ${getScoreColor(score, isPersonalEvaluation)}`}>
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
        observaciones: 'Evaluación completada exitosamente con ponderación por secciones',
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
            .color-system-box { background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${getChartColor(score, isPersonalEvaluation)}; }
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
            <p>Sistema de Evaluación con Ponderación por Secciones</p>
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
  const getScoreColor = (score, isPersonal) => {
    if (isPersonal) {
      return score >= 91 ? 'text-green-600' : 'text-red-600';
    } else {
      if (score >= 86) return 'text-green-600';
      if (score >= 61) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  // Función para obtener el color de fondo de la estadística
  const getScoreBgColor = (score, isPersonal) => {
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
  const getChartColor = (score, isPersonal) => {
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

              {/* Indicador del sistema de calificación para personal */}
              {isPersonalEvaluation && (
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
              </div>

              {/* Gráfica radar con anillos de colores de fondo */}
              <div className="flex justify-center mb-8">
                {generateRadarChart()}
              </div>

              {/* Estadísticas con colores dinámicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`${getScoreBgColor(score, isPersonalEvaluation)} p-4 rounded-lg text-center border border-opacity-30`}>
                  <div className={`text-2xl font-bold ${getScoreColor(score, isPersonalEvaluation)}`}>{score}%</div>
                  <div className="text-sm text-gray-600">Puntuación Final</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getRangeDescription(score, isPersonalEvaluation)}
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