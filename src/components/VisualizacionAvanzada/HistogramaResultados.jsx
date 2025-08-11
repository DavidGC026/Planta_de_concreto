import React, { useState } from 'react';

const HistogramaResultados = ({ resultados, usuario }) => {
  const [paginaActual, setPaginaActual] = useState(0);
  const evaluacionesPorPagina = 5;

  // Validar que tenemos datos
  if (!resultados || resultados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Histograma de Resultados</h3>
        <p className="text-gray-600">No hay datos suficientes para mostrar el histograma.</p>
      </div>
    );
  }

  // Ordenar resultados por fecha
  const resultadosOrdenados = [...resultados].sort((a, b) => 
    new Date(b.fecha_finalizacion) - new Date(a.fecha_finalizacion)
  );

  // Calcular páginas
  const totalPaginas = Math.ceil(resultadosOrdenados.length / evaluacionesPorPagina);
  const evaluacionesPagina = resultadosOrdenados.slice(
    paginaActual * evaluacionesPorPagina,
    (paginaActual + 1) * evaluacionesPorPagina
  );

  // Calcular estadísticas
  const promedio = resultados.reduce((sum, r) => sum + (r.puntuacion_ponderada || 0), 0) / resultados.length;
  const maximo = Math.max(...resultados.map(r => r.puntuacion_ponderada || 0));
  const minimo = Math.min(...resultados.map(r => r.puntuacion_ponderada || 0));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getBarColor = (puntuacion) => {
    if (puntuacion >= 80) return 'bg-green-500';
    if (puntuacion >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (puntuacion) => {
    if (puntuacion >= 80) return 'text-green-600';
    if (puntuacion >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Histograma de Resultados</h3>
        {usuario && (
          <div className="text-sm text-gray-600">
            Usuario: <span className="font-semibold">{usuario}</span>
          </div>
        )}
      </div>

      {/* Estadísticas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-600 text-sm font-medium">Promedio</p>
          <p className="text-2xl font-bold text-blue-700">{promedio.toFixed(1)}%</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-600 text-sm font-medium">Máximo</p>
          <p className="text-2xl font-bold text-green-700">{maximo}%</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm font-medium">Mínimo</p>
          <p className="text-2xl font-bold text-red-700">{minimo}%</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">
          Evaluaciones {paginaActual * evaluacionesPorPagina + 1}-{Math.min((paginaActual + 1) * evaluacionesPorPagina, resultados.length)} de {resultados.length}
        </h4>
        
        <div className="space-y-4">
          {evaluacionesPagina.map((resultado, index) => {
            const puntuacion = resultado.puntuacion_ponderada || 0;
            const indexGlobal = paginaActual * evaluacionesPorPagina + index + 1;
            
            return (
              <div key={resultado.id || index} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium text-gray-600 text-right">
                  #{indexGlobal}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">
                      {formatDate(resultado.fecha_finalizacion)}
                    </span>
                    <span className={`text-sm font-bold ${getTextColor(puntuacion)}`}>
                      {puntuacion}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getBarColor(puntuacion)}`}
                      style={{ width: `${puntuacion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controles de paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPaginaActual(Math.max(0, paginaActual - 1))}
            disabled={paginaActual === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i}
                onClick={() => setPaginaActual(i)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  i === paginaActual
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPaginaActual(Math.min(totalPaginas - 1, paginaActual + 1))}
            disabled={paginaActual === totalPaginas - 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default HistogramaResultados;
