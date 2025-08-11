import React from 'react';
import RadarChart from './RadarChart';

const ResultCard = ({ resultado }) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg mb-8 overflow-hidden">
      {/* Header con logos y título */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Logo IMCYC */}
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">IMCYC</span>
          </div>
          {/* Logo MOCTEZUMA */}
          <div className="text-green-600 font-bold text-lg">
            MOCTEZUMA
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-gray-800">Evaluación: Jefe de Planta</h2>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del usuario - sin imagen */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800">
              {resultado.nombre_limpio || resultado.nombre}
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-medium text-gray-600 w-16">ID:</span>
                <span className="text-gray-800">{resultado.id}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-16">Fecha:</span>
                <span className="text-gray-800">{resultado.fecha_formateada || resultado.fecha}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-16">Correo:</span>
                <span className="text-gray-800">{resultado.email || resultado.nombre}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-16">Puntaje:</span>
                <span className={`font-bold ${resultado.pass ? 'text-green-600' : 'text-red-600'}`}>
                  {resultado.total_obtenido}%
                </span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-16">Estado:</span>
                <span className={`font-bold ${resultado.pass ? 'text-green-600' : 'text-red-600'}`}>
                  {resultado.pass ? 'APROBADO' : 'NO APROBADO'}
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico radar */}
          <div className="flex justify-center items-center">
            {resultado.calificaciones_secciones && (
              <div className="w-full max-w-2xl">
                <RadarChart
                  data={Object.keys(resultado.calificaciones_secciones).map(key => ({ 
                    label: key, 
                    value: resultado.calificaciones_secciones[key]?.porcentaje || 0 
                  }))}
                  userName={resultado.nombre_limpio || resultado.nombre}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
