import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmpresaSelectorJefe = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      // Usar la nueva API para evaluación de jefe de planta
      const apiURL = '/api/get-empresas-jefe.php';
      
      const response = await fetch(apiURL);
      const data = await response.json();
      
      if (data.success) {
        setEmpresas(data.data);
      } else {
        setError(data.error || 'Error al cargar empresas');
      }
    } catch (error) {
      console.error('Error fetching empresas:', error);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaSelect = (empresa) => {
    // Crear slug para la URL desde el nombre de empresa
    const slug = empresa.nombre.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Quitar caracteres especiales
      .replace(/\s+/g, '-'); // Reemplazar espacios con guiones
    
    navigate(`/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar empresas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchEmpresas} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/img/logo-imcyc.png" 
              alt="IMCYC Logo" 
              className="h-16 w-auto"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Visualización Avanzada de Resultados
          </h1>
          <p className="text-gray-600 text-lg">
            Selecciona una empresa para ver el análisis detallado de evaluaciones
          </p>
        </div>

        {/* Empresas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map((empresa, index) => (
            <div 
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-300 group"
              onClick={() => handleEmpresaSelect(empresa)}
            >
              <div className="p-6">
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Empresa</span>
                  </div>
                </div>

                {/* Nombre de la empresa */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4 group-hover:text-blue-700 transition-colors">
                  {empresa.nombre}
                </h3>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{empresa.total_usuarios}</div>
                    <div className="text-sm text-gray-600">Usuarios</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{empresa.total_evaluaciones}</div>
                    <div className="text-sm text-gray-600">Evaluaciones</div>
                  </div>
                </div>

                {/* Promedio y fechas */}
                {empresa.promedio_puntuacion > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Promedio General</span>
                      <span className="text-lg font-bold text-purple-600">{empresa.promedio_puntuacion}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Última evaluación: {new Date(empresa.ultima_evaluacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700 transition-colors">
                    <span className="font-medium">Ver resultados</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay empresas */}
        {empresas.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay empresas disponibles</h3>
            <p className="text-gray-600">No se encontraron empresas con evaluaciones.</p>
          </div>
        )}

        {/* Total de empresas */}
        {empresas.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Total de empresas con evaluaciones: <span className="font-semibold">{empresas.length}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresaSelectorJefe;
