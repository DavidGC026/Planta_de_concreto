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

  // Función para generar gráfica radar con anillos SVG
  const generateRadarChart = () => {
    if (!sections || sections.length === 0) {
      return generateSimpleCircularChart();
    }

    const centerX = 300;
    const centerY = 300;
    const maxRadius = 140;
    const minRadius = 30;
    
    // Calcular datos de las secciones para el radar
    const sectionData = sections.map((section, index) => {
      // Calcular porcentaje de la sección basado en las respuestas
      let sectionScore = 0;
      let sectionQuestions = 0;
      
      // Obtener todas las claves de respuestas para buscar patrones
      const answerKeys = Object.keys(results.answers || {});
      
      if (section.preguntas) {
        // Para evaluaciones de personal y equipo con preguntas
        section.preguntas.forEach((pregunta, qIndex) => {
          // Buscar claves que correspondan a esta sección y pregunta
          // Patrones posibles:
          // - "rol-seccion-pregunta" (evaluación personal)
          // - "seccion-subseccion-pregunta" (evaluación equipo)
          // - "seccion-pregunta" (evaluación simulada)
          
          const possibleKeys = [
            `${index}-${qIndex}`, // Patrón simple
            `simulado-${index}-${qIndex}`, // Patrón simulado
            // Buscar cualquier clave que termine con el patrón de sección-pregunta
          ];
          
          // También buscar claves que contengan el índice de sección
          const matchingKey = answerKeys.find(key => {
            const parts = key.split('-');
            if (parts.length >= 3) {
              // Para evaluación personal: rol-seccion-pregunta
              return parts[1] == index && parts[2] == qIndex;
            } else if (parts.length === 2) {
              // Para evaluación simple: seccion-pregunta
              return parts[0] == index && parts[1] == qIndex;
            }
            return false;
          });
          
          if (matchingKey && results.answers[matchingKey]) {
            sectionQuestions++;
            const answer = results.answers[matchingKey];
            
            // Evaluar respuesta según el tipo
            if (pregunta.tipo_pregunta === 'seleccion_multiple') {
              if (answer === pregunta.respuesta_correcta) {
                sectionScore += 10;
              }
            } else {
              // Pregunta abierta
              if (answer === 'si') {
                sectionScore += 10;
              } else if (answer === 'regular') {
                sectionScore += 5;
              }
              // 'no' y 'na' = 0 puntos
            }
          }
        });
      } else if (section.items) {
        // Para evaluación de operación con items
        section.items.forEach((item, itemIndex) => {
          const key = `${index}-${itemIndex}`;
          if (results.answers[key]) {
            sectionQuestions++;
            const status = results.answers[key];
            if (status === 'bueno') {
              sectionScore += 10;
            } else if (status === 'regular') {
              sectionScore += 5;
            }
            // 'malo' = 0 puntos
          }
        });
      } else if (section.subsections) {
        // Para evaluación de equipo con subsecciones
        section.subsections.forEach((subsection, subIndex) => {
          // Buscar respuestas para esta subsección
          const subsectionKeys = answerKeys.filter(key => 
            key.includes(`${section.id}-${subsection.id}`) || 
            key.includes(`${index}-${subIndex}`)
          );
          
          subsectionKeys.forEach(key => {
            if (results.answers[key]) {
              sectionQuestions++;
              const answer = results.answers[key];
              if (answer === 'si' || answer === 'bueno') {
                sectionScore += 10;
              } else if (answer === 'regular') {
                sectionScore += 5;
              }
            }
          });
        });
      }
      
      const percentage = sectionQuestions > 0 ? (sectionScore / (sectionQuestions * 10)) * 100 : 0;
      
      return {
        name: section.nombre || section.title || section.name || `Sección ${index + 1}`,
        percentage: Math.min(Math.max(percentage, 0), 100), // Asegurar que esté entre 0 y 100
        angle: (index * 360) / sections.length,
        questionsCount: sectionQuestions,
        score: sectionScore
      };
    });

    // Log para debugging
    console.log('Section data for radar chart:', sectionData);
    console.log('Available answer keys:', Object.keys(results.answers || {}));

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
          {/* Anillo exterior - Verde (86-100%) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={maxRadius + 20}
            fill="url(#greenGradient)"
            stroke="#16a34a"
            strokeWidth="2"
          />
          
          {/* Anillo medio - Amarillo (61-85%) */}
          {!isPersonalEvaluation && (
            <circle
              cx={centerX}
              cy={centerY}
              r={maxRadius - 20}
              fill="url(#yellowGradient)"
              stroke="#ca8a04"
              strokeWidth="2"
            />
          )}
          
          {/* Anillo interior - Rojo (0-60% o 0-90% para personal) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={isPersonalEvaluation ? maxRadius - 20 : maxRadius - 60}
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
          {sectionData.map((section, index) => {
            const angle = (section.angle - 90) * (Math.PI / 180);
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

          {/* Etiquetas de las secciones */}
          {radarPoints.map((point, index) => {
            const angle = (point.angle - 90) * (Math.PI / 180);
            const labelRadius = maxRadius + 60;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            
            // Ajustar posición del texto según el ángulo
            let textAnchor = 'middle';
            let dominantBaseline = 'middle';
            
            if (labelX > centerX + 10) textAnchor = 'start';
            else if (labelX < centerX - 10) textAnchor = 'end';
            
            if (labelY > centerY + 10) dominantBaseline = 'hanging';
            else if (labelY < centerY - 10) dominantBaseline = 'baseline';

            const truncatedName = point.name.length > 20 ? point.name.substring(0, 20) + '...' : point.name;

            return (
              <g key={index}>
                {/* Fondo blanco para mejor legibilidad */}
                <rect
                  x={labelX - (textAnchor === 'start' ? 5 : textAnchor === 'end' ? 115 : 60)}
                  y={labelY - 20}
                  width="120"
                  height="40"
                  fill="rgba(255, 255, 255, 0.95)"
                  rx="6"
                  stroke="rgba(0, 0, 0, 0.2)"
                  strokeWidth="1"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
                <text
                  x={labelX}
                  y={labelY - 5}
                  textAnchor={textAnchor}
                  dominantBaseline={dominantBaseline}
                  className="text-xs font-medium fill-gray-800"
                >
                  {truncatedName}
                </text>
                <text
                  x={labelX}
                  y={labelY + 10}
                  textAnchor={textAnchor}
                  dominantBaseline={dominantBaseline}
                  className="text-sm font-bold fill-blue-600"
                >
                  {Math.round(point.percentage)}%
                </text>
              </g>
            );
          })}

          {/* Etiquetas de porcentajes en los anillos */}
          <g className="opacity-80">
            <text x={centerX} y={centerY - minRadius - 0.2 * (maxRadius - minRadius) - 5} className="text-xs fill-white font-bold" textAnchor="middle">20%</text>
            <text x={centerX} y={centerY - minRadius - 0.4 * (maxRadius - minRadius) - 5} className="text-xs fill-white font-bold" textAnchor="middle">40%</text>
            <text x={centerX} y={centerY - minRadius - 0.6 * (maxRadius - minRadius) - 5} className="text-xs fill-white font-bold" textAnchor="middle">60%</text>
            <text x={centerX} y={centerY - minRadius - 0.8 * (maxRadius - minRadius) - 5} className="text-xs fill-white font-bold" textAnchor="middle">80%</text>
            <text x={centerX} y={centerY - maxRadius - 5} className="text-xs fill-white font-bold" textAnchor="middle">100%</text>
          </g>

          {/* Etiquetas de los rangos de colores */}
          <g className="opacity-90">
            {/* Etiqueta Verde */}
            <rect x={centerX + maxRadius + 30} y={centerY - maxRadius - 10} width="100" height="25" fill="rgba(34, 197, 94, 0.9)" rx="4" />
            <text x={centerX + maxRadius + 80} y={centerY - maxRadius + 7} className="text-xs fill-white font-bold" textAnchor="middle">
              {isPersonalEvaluation ? '91-100%' : '86-100%'}
            </text>
            
            {/* Etiqueta Amarilla */}
            {!isPersonalEvaluation && (
              <>
                <rect x={centerX + maxRadius + 30} y={centerY - 10} width="100" height="25" fill="rgba(234, 179, 8, 0.9)" rx="4" />
                <text x={centerX + maxRadius + 80} y={centerY + 7} className="text-xs fill-white font-bold" textAnchor="middle">61-85%</text>
              </>
            )}
            
            {/* Etiqueta Roja */}
            <rect x={centerX + maxRadius + 30} y={centerY + maxRadius - 15} width="100" height="25" fill="rgba(239, 68, 68, 0.9)" rx="4" />
            <text x={centerX + maxRadius + 80} y={centerY + maxRadius + 2} className="text-xs fill-white font-bold" textAnchor="middle">
              {isPersonalEvaluation ? '0-90%' : '0-60%'}
            </text>
          </g>
        </svg>
        
        {/* Información de debugging (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
            <div>Secciones: {sectionData.length}</div>
            <div>Respuestas: {Object.keys(results.answers || {}).length}</div>
            {sectionData.map((section, idx) => (
              <div key={idx}>
                {section.name}: {section.percentage.toFixed(1)}% ({section.questionsCount} preguntas)
              </div>
            ))}
          </div>
        )}
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
          {!isPersonalEvaluation && (
            <circle
              cx={centerX}
              cy={centerY}
              r={middleRadius}
              fill="none"
              stroke="#eab308"
              strokeWidth={strokeWidth}
              opacity="0.3"
            />
          )}
          
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

              {/* Gráfica radar con anillos SVG */}
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