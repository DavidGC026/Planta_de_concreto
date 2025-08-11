import React, { useEffect, useState } from 'react';
import apiService from '@/services/api';

const UsuariosList = ({ onSelectUser }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener evaluaciones de la API actual
        const results = await apiService.getResultadosPersonal();
        
        // Crear un mapa de usuarios únicos con información completa
        const usuariosMap = new Map();
        results.forEach(r => {
          const userId = r.username;
          const userName = r.nombre_completo;
          
          if (!usuariosMap.has(userId)) {
            usuariosMap.set(userId, {
              id: r.id,
              nombre: userName,
              username: r.username,
              rol: r.rol,
              total_evaluaciones: 0
            });
          }
          usuariosMap.get(userId).total_evaluaciones++;
        });
        
        const usuariosArray = Array.from(usuariosMap.values())
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        setUsuarios(usuariosArray);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando usuarios...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center text-red-600 py-8">
        <p className="text-lg font-semibold">Error</p>
        <p>{error}</p>
      </div>
    </div>
  );

  if (usuarios.length === 0) return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center py-8">
        <p className="text-gray-600 text-lg">No hay usuarios con resultados.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Selecciona un usuario</h2>
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-200">
        <div className="space-y-3">
          {usuarios.map((usuario, index) => (
            <button
              key={usuario.username}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold px-6 py-4 rounded-lg shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-gray-200"
              onClick={() => onSelectUser(usuario.nombre)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg text-gray-800">{usuario.nombre}</span>
                    <span className="text-sm text-gray-500">{usuario.rol} • {usuario.total_evaluaciones} evaluaciones</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center text-gray-600 text-sm">
          Total de usuarios: {usuarios.length}
        </div>
      </div>
    </div>
  );
};

export default UsuariosList;
