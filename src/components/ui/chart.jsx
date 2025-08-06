import React from 'react';

// Componente de gráfica circular para mostrar el progreso de una sección
export const CircularChart = ({ percentage, size = 120, strokeWidth = 8, title, subtitle }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Determinar color según el porcentaje
  let color, bgColor, textColor;
  if (percentage >= 80) {
    color = '#22c55e'; // Verde
    bgColor = 'bg-green-50';
    textColor = 'text-green-600';
  } else if (percentage >= 60) {
    color = '#eab308'; // Amarillo
    bgColor = 'bg-yellow-50';
    textColor = 'text-yellow-600';
  } else {
    color = '#ef4444'; // Rojo
    bgColor = 'bg-red-50';
    textColor = 'text-red-600';
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Círculo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Círculo de progreso */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />
        </svg>
        
        {/* Contenido central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-2xl font-bold ${textColor}`}>
            {Math.round(percentage)}%
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 text-center">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      
      {title && (
        <div className="mt-2 text-sm font-medium text-gray-700 text-center">
          {title}
        </div>
      )}
    </div>
  );
};

// Componente de gráfica de barras para comparar secciones
export const BarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
      )}
      
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          
          // Determinar color según el valor
          let barColor;
          if (item.value >= 80) barColor = 'bg-green-500';
          else if (item.value >= 60) barColor = 'bg-yellow-500';
          else barColor = 'bg-red-500';
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-32 text-sm font-medium text-gray-700 truncate">
                {item.name}
              </div>
              
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full ${barColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {Math.round(item.value)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de gráfica radar para vista general - MEJORADO
export const RadarChart = ({ data, width = 800, height = 800 }) => {
  // Validate that data is an array
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No hay datos para mostrar</p>
      </div>
    );
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 230; // Margen optimizado para textos
  const minRadius = 50;

  // Función para limpiar y normalizar texto para SVG
  const cleanText = (text) => {
    if (!text) return 'Sin nombre';
    // Normalizar caracteres Unicode y asegurar que los acentos se muestren correctamente
    let cleanedText = text.toString().trim();
    
    // Normalizar Unicode si está disponible
    if (cleanedText.normalize) {
      cleanedText = cleanedText.normalize('NFC');
    }
    
    return cleanedText;
  };

  // Prepare section data with angles
  const sectionData = data.map((item, index) => ({
    name: cleanText(item.name || item.label),
    percentage: Math.min(Math.max(item.value || 0, 0), 100),
    angle: (index * 360) / data.length,
    questionsCount: 1,
    score: item.value || 0
  }));

  // Generate radar points
  const radarPoints = sectionData.map(section => {
    const angle = (section.angle - 90) * (Math.PI / 180); // -90 to start at top
    const radius = minRadius + (section.percentage / 100) * (maxRadius - minRadius);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, ...section };
  });

  // Create polygon path
  const pathData = radarPoints.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  return (
    <div className="relative flex flex-col items-center justify-center mb-6 p-4 overflow-visible">
      <svg 
        width={width} 
        height={height} 
        className="drop-shadow-lg" 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ maxWidth: '100%', height: 'auto' }}
        xmlnsXlink="http://www.w3.org/1999/xlink"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Define gradients for the rings */}
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

        {/* Background rings with colors */}
        {/* Outer ring - Green (86-100%) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={maxRadius + 20}
          fill="url(#greenGradient)"
          stroke="#16a34a"
          strokeWidth="2"
        />

        {/* Middle ring - Yellow (61-85%) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={maxRadius - 20}
          fill="url(#yellowGradient)"
          stroke="#ca8a04"
          strokeWidth="2"
        />

        {/* Inner ring - Red (0-60%) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={maxRadius - 60}
          fill="url(#redGradient)"
          stroke="#dc2626"
          strokeWidth="2"
        />

        {/* Radial grid lines */}
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

        {/* Radial lines from center */}
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

        {/* Data polygon */}
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

        {/* Data points */}
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

        {/* Section labels */}
        {radarPoints.map((point, index) => {
          const angle = (point.angle - 90) * (Math.PI / 180);
          const labelRadius = maxRadius + 70;
          const labelX = centerX + labelRadius * Math.cos(angle);
          const labelY = centerY + labelRadius * Math.sin(angle);

          // Adjust text position based on angle
          let textAnchor = 'middle';
          let dominantBaseline = 'middle';

          if (labelX > centerX + 10) textAnchor = 'start';
          else if (labelX < centerX - 10) textAnchor = 'end';

          if (labelY > centerY + 10) dominantBaseline = 'hanging';
          else if (labelY < centerY - 10) dominantBaseline = 'baseline';

          // Split long text into multiple lines with intelligent wrapping
          const words = point.name.split(' ');
          const lines = [];
          let currentLine = '';
          
          // Calcular caracteres máximos basado en la posición del texto
          let maxCharsPerLine;
          const distanceFromCenter = Math.abs(labelX - centerX);
          const distanceFromEdge = Math.min(labelX, width - labelX);
          
          // Si está cerca de los bordes, usar menos caracteres
          if (distanceFromEdge < 100) {
            maxCharsPerLine = 8;
          } else if (distanceFromEdge < 150) {
            maxCharsPerLine = 12;
          } else {
            maxCharsPerLine = 14;
          }

          words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (testLine.length <= maxCharsPerLine) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          });
          if (currentLine) lines.push(currentLine);

          // Allow up to 3 lines
          if (lines.length > 3) {
            lines[2] = lines[2].length > 18 ? lines[2].substring(0, 18) + '...' : lines[2];
            lines.splice(3);
          }

          return (
            <g key={index}>
              {/* Section name text in multiple lines */}
              {lines.map((line, lineIndex) => (
                <text
                  key={lineIndex}
                  x={labelX}
                  y={labelY - 20 + (lineIndex * 20) - ((lines.length - 1) * 10)}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-white"
                  style={{
                    fontSize: '23px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9), 2px -2px 4px rgba(0,0,0,0.9), -2px 2px 4px rgba(0,0,0,0.9)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}
                >
                  {line}
                </text>
              ))}

              {/* Percentage */}
              <text
                x={labelX}
                y={labelY + 25 + ((lines.length - 1) * 10)}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-lg font-bold fill-yellow-300"
                style={{
                  fontSize: '26px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9), 2px -2px 4px rgba(0,0,0,0.9), -2px 2px 4px rgba(0,0,0,0.9)',
                  filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                }}
              >
                {Math.round(point.percentage)}%
              </text>
            </g>
          );
        })}

        {/* Center title */}
        <text
          x={centerX}
          y={centerY}
          fontSize="18"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9), 2px -2px 4px rgba(0,0,0,0.9), -2px 2px 4px rgba(0,0,0,0.9)',
            filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
          }}
        >
          Evaluación
        </text>
      </svg>
    </div>
  );
};

// Componente de indicador de calidad
export const QualityIndicator = ({ percentage, label }) => {
  let status, color, bgColor;
  
  if (percentage >= 80) {
    status = 'EXCELENTE';
    color = 'text-green-600';
    bgColor = 'bg-green-100';
  } else if (percentage >= 60) {
    status = 'BUENO';
    color = 'text-yellow-600';
    bgColor = 'bg-yellow-100';
  } else if (percentage >= 40) {
    status = 'REGULAR';
    color = 'text-orange-600';
    bgColor = 'bg-orange-100';
  } else {
    status = 'DEFICIENTE';
    color = 'text-red-600';
    bgColor = 'bg-red-100';
  }
  
  return (
    <div className={`${bgColor} rounded-lg p-4 text-center`}>
      <div className={`text-2xl font-bold ${color}`}>
        {status}
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {label}
      </div>
      <div className={`text-lg font-semibold ${color} mt-2`}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
};