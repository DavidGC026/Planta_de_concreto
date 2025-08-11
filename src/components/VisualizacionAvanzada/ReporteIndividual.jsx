import React from 'react';

const ReporteIndividual = ({ resultado }) => {
  if (!resultado) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header del reporte */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{resultado.nombre_completo}</h3>
            <p className="text-blue-100 text-sm">{resultado.rol}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getScoreBackground(resultado.puntuacion_ponderada)} ${getScoreColor(resultado.puntuacion_ponderada)}`}>
              {resultado.puntuacion_ponderada}%
            </div>
          </div>
        </div>
      </div>

      {/* Información general */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">Fecha de Evaluación</p>
            <p className="text-gray-800 font-semibold">{formatDate(resultado.fecha_finalizacion)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">Estado</p>
            <p className={`font-semibold capitalize ${resultado.estado === 'completada' ? 'text-green-600' : 'text-yellow-600'}`}>
              {resultado.estado}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">Puntuación Total</p>
            <p className="text-gray-800 font-semibold">{resultado.puntuacion_total} puntos</p>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        {resultado.estadisticas && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas Detalladas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{resultado.estadisticas.total_preguntas}</p>
                <p className="text-sm text-gray-600">Total Preguntas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{resultado.estadisticas.respuestas_si}</p>
                <p className="text-sm text-gray-600">Respuestas Sí</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{resultado.estadisticas.respuestas_no}</p>
                <p className="text-sm text-gray-600">Respuestas No</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{resultado.estadisticas.respuestas_na}</p>
                <p className="text-sm text-gray-600">No Aplica</p>
              </div>
            </div>

            {/* Información de preguntas trampa si existe */}
            {resultado.estadisticas.preguntas_trampa_respondidas > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{resultado.estadisticas.preguntas_trampa_respondidas}</p>
                    <p className="text-sm text-gray-600">Preguntas Trampa</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{resultado.estadisticas.preguntas_trampa_incorrectas}</p>
                    <p className="text-sm text-gray-600">Trampa Incorrectas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultados por sección */}
        {resultado.secciones && resultado.secciones.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Resultados por Sección</h4>
            <div className="space-y-3">
              {resultado.secciones.map((seccion, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-800 text-sm">{seccion.nombre}</h5>
                    <span className="text-sm font-bold text-blue-600">{seccion.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${seccion.porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{seccion.respuestas_correctas}/{seccion.total_preguntas} correctas</span>
                    <span>Ponderación: {seccion.ponderacion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {resultado.observaciones && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Observaciones</h4>
            <p className="text-blue-700 text-sm">{resultado.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporteIndividual;
