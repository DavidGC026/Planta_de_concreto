import React, { useEffect, useState } from 'react';
import apiService from '@/services/api';
import ReporteIndividual from './ReporteIndividual';
import HistogramaResultados from './HistogramaResultados';

const ResultadosUsuario = ({ usuario, onBack }) => {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener todas las evaluaciones
        const allResults = await apiService.getResultadosPersonal();
        
        // Filtrar por el usuario seleccionado
        const userResults = allResults.filter(r => 
          (r.nombre_completo) === usuario
        );
        
        setResultados(userResults);
      } catch (err) {
        console.error('Error al cargar resultados:', err);
        setError('Error al cargar los resultados del usuario');
      } finally {
        setLoading(false);
      }
    };
    fetchResultados();
  }, [usuario]);

  if (loading) return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando resultados...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center text-red-600 py-8">
        <p className="text-lg font-semibold">Error</p>
        <p>{error}</p>
      </div>
    </div>
  );

  if (resultados.length === 0) return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors duration-200 border border-gray-300 shadow-md"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a usuarios
        </button>
      </div>
      <div className="text-center py-8">
        <p className="text-gray-600 text-lg">No hay resultados para este usuario.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors duration-200 border border-gray-300 shadow-md"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a usuarios
        </button>
      </div>

      {/* Título del usuario */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resultados de {usuario}</h1>
        <p className="text-gray-600">{resultados.length} evaluación{resultados.length !== 1 ? 'es' : ''} encontrada{resultados.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Resultados con formato de reporte individual */}
      {resultados.map((resultado, idx) => (
        <div key={resultado.id || idx} className="mb-8">
          <ReporteIndividual resultado={resultado} />
        </div>
      ))}
      
      {/* Histograma de resultados del usuario */}
      <HistogramaResultados 
        resultados={resultados.filter(r => r.puntuacion_ponderada && r.fecha_finalizacion)} 
        usuario={usuario} 
      />
    </div>
  );
};

export default ResultadosUsuario;
