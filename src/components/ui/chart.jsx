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

// Componente de gráfica radar para vista general
export const RadarChart = ({ data, size = 300 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - 40;
  const minRadius = 20;
  
  // Calcular puntos del polígono
  const points = data.map((item, index) => {
    const angle = (index * 360) / data.length - 90; // -90 para empezar arriba
    const angleRad = (angle * Math.PI) / 180;
    const radius = minRadius + (item.value / 100) * (maxRadius - minRadius);
    
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);
    
    return { x, y, ...item };
  });
  
  // Crear path del polígono
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';
  
  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Círculos de referencia */}
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
              strokeDasharray="5,5"
            />
          );
        })}
        
        {/* Líneas radiales */}
        {data.map((_, index) => {
          const angle = (index * 360) / data.length - 90;
          const angleRad = (angle * Math.PI) / 180;
          const endX = centerX + maxRadius * Math.cos(angleRad);
          const endY = centerY + maxRadius * Math.sin(angleRad);
          
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="#e5e7eb"
              strokeWidth="1"
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
        {points.map((point, index) => (
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
        
        {/* Etiquetas */}
        {points.map((point, index) => {
          const angle = (index * 360) / data.length - 90;
          const angleRad = (angle * Math.PI) / 180;
          const labelRadius = maxRadius + 20;
          const labelX = centerX + labelRadius * Math.cos(angleRad);
          const labelY = centerY + labelRadius * Math.sin(angleRad);
          
          return (
            <text
              key={index}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium fill-gray-700"
            >
              {point.name.length > 15 ? point.name.substring(0, 15) + '...' : point.name}
            </text>
          );
        })}
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