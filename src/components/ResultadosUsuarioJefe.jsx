import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResultadosUsuarioJefe = ({ evaluaciones, empresaNombre, empresa }) => {
  const { email } = useParams();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);

  useEffect(() => {
    const processResultados = () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!evaluaciones || evaluaciones.length === 0 || !email) {
          setResultados([]);
          return;
        }

        const targetEmail = decodeURIComponent(email);
        
        // Filtrar evaluaciones por email del usuario
        const userResults = evaluaciones.filter(evaluacion => 
          evaluacion.email === targetEmail || evaluacion.usuario_email === targetEmail
        );
        
        if (userResults.length === 0) {
          setError('No se encontraron evaluaciones para este usuario.');
          return;
        }

        // Obtener información del usuario desde la primera evaluación
        const firstResult = userResults[0];
        setUsuario({
          nombre: firstResult.nombre || firstResult.usuario_nombre || firstResult.nombre_limpio,
          email: firstResult.email || firstResult.usuario_email,
          empresa: firstResult.empresa || firstResult.usuario_empresa || empresaNombre
        });

        // Ordenar resultados por fecha (más recientes primero)
        const sortedResults = userResults.sort((a, b) => {
          const dateA = new Date(a.fecha || a.created_at);
          const dateB = new Date(b.fecha || b.created_at);
          return dateB - dateA;
        });
        
        setResultados(sortedResults);
        
        // Seleccionar la evaluación más reciente por defecto
        if (sortedResults.length > 0) {
          setSelectedEvaluacion(sortedResults[0]);
        }
        
      } catch (err) {
        console.error('Error processing resultados:', err);
        setError('Error al procesar los resultados del usuario');
      } finally {
        setLoading(false);
      }
    };

    processResultados();
  }, [evaluaciones, email, empresaNombre]);

  const handleBackToUsers = () => {
    navigate('../');
  };

  const calculateStats = () => {
    if (resultados.length === 0) return null;
    
    const aprobadas = resultados.filter(r => r.pass_status === 'APROBADO' || r.pass).length;
    const reprobadas = resultados.length - aprobadas;
    const promedio = resultados.reduce((sum, r) => sum + (parseFloat(r.total_obtenido) || 0), 0) / resultados.length;
    const mejorPuntaje = Math.max(...resultados.map(r => parseFloat(r.total_obtenido) || 0));
    const peorPuntaje = Math.min(...resultados.map(r => parseFloat(r.total_obtenido) || 0));
    
    return {
      total: resultados.length,
      aprobadas,
      reprobadas,
      promedio: promedio.toFixed(1),
      mejorPuntaje: mejorPuntaje.toFixed(1),
      peorPuntaje: peorPuntaje.toFixed(1)
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados del usuario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleBackToUsers}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Volver a usuarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBackToUsers}
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors duration-200 border border-gray-300 shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a usuarios de {empresaNombre}
        </button>
      </div>

      {/* Información del usuario */}
      {usuario && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{usuario.nombre}</h1>
                <p className="text-gray-600">{usuario.email}</p>
                <p className="text-sm text-gray-500">{usuario.empresa}</p>
              </div>
            </div>
          </div>

          {/* Estadísticas del usuario */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">Evaluaciones</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.aprobadas}</div>
                <div className="text-sm text-green-700">Aprobadas</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{stats.reprobadas}</div>
                <div className="text-sm text-red-700">Reprobadas</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.promedio}%</div>
                <div className="text-sm text-purple-700">Promedio</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.mejorPuntaje}%</div>
                <div className="text-sm text-emerald-700">Mejor</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.peorPuntaje}%</div>
                <div className="text-sm text-orange-700">Menor</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de evaluaciones */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Evaluaciones</h2>
              <p className="text-sm text-gray-600">Selecciona una evaluación para ver el detalle</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {resultados.map((resultado, index) => (
                <div
                  key={resultado.id || index}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedEvaluacion?.id === resultado.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedEvaluacion(resultado)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        resultado.pass_status === 'APROBADO' || resultado.pass 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium text-gray-800">
                        Evaluación #{index + 1}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {parseFloat(resultado.total_obtenido || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Fecha:</span>
                      <span>{new Date(resultado.fecha || resultado.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Estado:</span>
                      <span className={`font-medium ${
                        resultado.pass_status === 'APROBADO' || resultado.pass 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {resultado.pass_status === 'APROBADO' || resultado.pass ? 'Aprobado' : 'Reprobado'}
                      </span>
                    </div>
                    {resultado.tipo_evaluacion && (
                      <div className="flex justify-between mt-1">
                        <span>Tipo:</span>
                        <span>{resultado.tipo_evaluacion}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalle de evaluación seleccionada */}
        <div className="lg:col-span-2">
          {selectedEvaluacion ? (
            <DetailedEvaluationView evaluacion={selectedEvaluacion} />
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Selecciona una evaluación</h3>
                <p className="text-gray-600">Elige una evaluación de la lista para ver los detalles completos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar el detalle de una evaluación
const DetailedEvaluationView = ({ evaluacion }) => {
  const [activeTab, setActiveTab] = useState('resumen');

  const parseCalificaciones = (calificaciones) => {
    if (typeof calificaciones === 'string') {
      try {
        return JSON.parse(calificaciones);
      } catch {
        return {};
      }
    }
    return calificaciones || {};
  };

  const parseRespuestas = (respuestas) => {
    if (typeof respuestas === 'string') {
      try {
        return JSON.parse(respuestas);
      } catch {
        return {};
      }
    }
    return respuestas || {};
  };

  const calificaciones = parseCalificaciones(evaluacion.calificaciones_secciones);
  const respuestas = parseRespuestas(evaluacion.respuestas);

  const tabs = [
    { id: 'resumen', name: 'Resumen', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'secciones', name: 'Por Secciones', icon: 'M19 11H5m14-7H5m14 14H5' },
    { id: 'respuestas', name: 'Respuestas', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Detalle de Evaluación
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            evaluacion.pass_status === 'APROBADO' || evaluacion.pass
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {evaluacion.pass_status === 'APROBADO' || evaluacion.pass ? 'APROBADO' : 'REPROBADO'}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {new Date(evaluacion.fecha || evaluacion.created_at).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'resumen' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {parseFloat(evaluacion.total_obtenido || 0).toFixed(1)}%
              </div>
              <div className="text-gray-600">Puntuación Total</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700">ID de Evaluación</div>
                <div className="text-gray-900">{evaluacion.id}</div>
              </div>
              {evaluacion.tipo_evaluacion && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Tipo</div>
                  <div className="text-gray-900">{evaluacion.tipo_evaluacion}</div>
                </div>
              )}
            </div>

            {evaluacion.observaciones && (
              <div className="mt-4">
                <div className="font-medium text-gray-700 mb-2">Observaciones</div>
                <div className="bg-gray-50 p-3 rounded text-gray-900 whitespace-pre-wrap">
                  {evaluacion.observaciones}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'secciones' && (
          <div className="space-y-4">
            {Object.entries(calificaciones).length > 0 ? (
              Object.entries(calificaciones).map(([seccion, datos]) => (
                <div key={seccion} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{seccion}</h3>
                    <span className="text-lg font-bold text-blue-600">
                      {parseFloat(datos.porcentaje || datos || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(parseFloat(datos.porcentaje || datos || 0), 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">No hay datos de secciones disponibles</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'respuestas' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(respuestas).length > 0 ? (
              Object.entries(respuestas).map(([pregunta, respuesta]) => (
                <div key={pregunta} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-800 mb-2">
                    {pregunta}
                  </div>
                  <div className="text-gray-600 bg-gray-50 p-2 rounded">
                    {typeof respuesta === 'object' ? JSON.stringify(respuesta, null, 2) : respuesta}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">No hay respuestas disponibles</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultadosUsuarioJefe;
