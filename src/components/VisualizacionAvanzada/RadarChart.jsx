import React from 'react';

const RadarChart = ({ data, width = 800, height = 800 }) => {
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
    name: cleanText(item.label),
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

export default RadarChart;
