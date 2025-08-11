import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import UsuariosListJefe from './UsuariosListJefe';
import ResultadosUsuarioJefe from './ResultadosUsuarioJefe';

const EmpresaViewJefe = () => {
  const { empresaSlug } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (empresaSlug) {
      fetchEmpresaData();
    }
  }, [empresaSlug]);

  const fetchEmpresaData = async () => {
    try {
      setLoading(true);
      
      // Primero obtenemos la lista de empresas para validar el slug y obtener el nombre real
      const empresasResponse = await fetch('/api/get-empresas-jefe.php');
      const empresasData = await empresasResponse.json();
      
      if (!empresasData.success) {
        throw new Error('Error al cargar empresas');
      }

      // Encontrar la empresa por slug (convertir nombre a slug para comparar)
      const empresaEncontrada = empresasData.data.find(emp => {
        const slug = emp.nombre.toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-');
        return slug === empresaSlug;
      });
      
      if (!empresaEncontrada) {
        setError('Empresa no encontrada');
        setLoading(false);
        return;
      }

      setEmpresa(empresaEncontrada);

      // Cargar evaluaciones de la empresa usando el nombre real
      const evaluacionesResponse = await fetch(
        `/api/get-results-jefe.php?empresa=${encodeURIComponent(empresaEncontrada.nombre)}`
      );
      const evaluacionesData = await evaluacionesResponse.json();

      if (evaluacionesData.success) {
        setEvaluaciones(evaluacionesData.data);
      } else {
        throw new Error(evaluacionesData.error || 'Error al cargar evaluaciones');
      }
      
    } catch (error) {
      console.error('Error fetching empresa data:', error);
      setError(error.message || 'Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelector = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de la empresa...</p>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={fetchEmpresaData} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Reintentar
            </button>
            <button 
              onClick={handleBackToSelector} 
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
            >
              Volver al selector
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="text-yellow-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Empresa no encontrada</h3>
          <p className="text-gray-600 mb-4">La empresa solicitada no existe o no está disponible.</p>
          <button 
            onClick={handleBackToSelector} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Volver al selector
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-100">
      {/* Header de la empresa */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleBackToSelector}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver a empresas</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{empresa.nombre}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>{empresa.total_usuarios} usuarios</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{empresa.total_evaluaciones} evaluaciones</span>
                  </span>
                  {empresa.promedio_puntuacion > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-medium text-purple-600">{empresa.promedio_puntuacion}% promedio</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con rutas */}
      <div className="relative z-10">
        <Routes>
          <Route 
            path="/" 
            element={
              <UsuariosListJefe 
                evaluaciones={evaluaciones}
                empresaNombre={empresa.nombre}
                empresa={empresa}
              />
            } 
          />
          <Route 
            path="/usuario/:email/*" 
            element={
              <ResultadosUsuarioJefe 
                evaluaciones={evaluaciones}
                empresaNombre={empresa.nombre}
                empresa={empresa}
              />
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default EmpresaViewJefe;
