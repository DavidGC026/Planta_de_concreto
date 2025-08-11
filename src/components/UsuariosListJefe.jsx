import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UsuariosListJefe = ({ evaluaciones, empresaNombre, empresa }) => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const processUsuarios = () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!evaluaciones || evaluaciones.length === 0) {
          setUsuarios([]);
          return;
        }

        // Crear un mapa de usuarios únicos con información completa
        const usuariosMap = new Map();
        
        evaluaciones.forEach(evaluacion => {
          const userKey = evaluacion.email || evaluacion.nombre;
          const userName = evaluacion.nombre || evaluacion.usuario_nombre || evaluacion.nombre_limpio;
          const userEmail = evaluacion.email || evaluacion.usuario_email;
          
          if (!usuariosMap.has(userKey)) {
            usuariosMap.set(userKey, {
              id: evaluacion.usuario_id,
              nombre: userName,
              email: userEmail,
              empresa: evaluacion.empresa || evaluacion.usuario_empresa || empresaNombre,
              evaluaciones: [],
              total_evaluaciones: 0,
              promedio_puntuacion: 0,
              ultima_evaluacion: null,
              estados: {
                aprobadas: 0,
                reprobadas: 0
              }
            });
          }
          
          const usuario = usuariosMap.get(userKey);
          usuario.evaluaciones.push(evaluacion);
          usuario.total_evaluaciones++;
          
          // Actualizar estadísticas
          if (evaluacion.pass_status === 'APROBADO' || evaluacion.pass) {
            usuario.estados.aprobadas++;
          } else {
            usuario.estados.reprobadas++;
          }
          
          // Actualizar última evaluación
          const fechaEvaluacion = new Date(evaluacion.fecha || evaluacion.created_at);
          if (!usuario.ultima_evaluacion || fechaEvaluacion > new Date(usuario.ultima_evaluacion)) {
            usuario.ultima_evaluacion = evaluacion.fecha || evaluacion.created_at;
          }
        });
        
        // Calcular promedios
        usuariosMap.forEach(usuario => {
          if (usuario.evaluaciones.length > 0) {
            const suma = usuario.evaluaciones.reduce((total, ev) => {
              return total + (parseFloat(ev.total_obtenido) || 0);
            }, 0);
            usuario.promedio_puntuacion = (suma / usuario.evaluaciones.length).toFixed(1);
          }
        });
        
        const usuariosArray = Array.from(usuariosMap.values())
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        setUsuarios(usuariosArray);
      } catch (err) {
        console.error('Error processing usuarios:', err);
        setError('Error al procesar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    processUsuarios();
  }, [evaluaciones, empresaNombre]);

  // Filtrar usuarios por término de búsqueda
  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUsuarioClick = (usuario) => {
    navigate(`usuario/${encodeURIComponent(usuario.email)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
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
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No hay usuarios</h3>
          <p className="text-gray-600">No se encontraron usuarios con evaluaciones en esta empresa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header con estadísticas */}
      <div className="mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 border">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Usuarios - {empresaNombre}
          </h2>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{usuarios.length}</p>
                  <p className="text-sm text-blue-700">Usuarios</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{evaluaciones.length}</p>
                  <p className="text-sm text-green-700">Evaluaciones</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {empresa?.promedio_puntuacion || '0'}%
                  </p>
                  <p className="text-sm text-purple-700">Promedio</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {usuarios.reduce((total, u) => total + u.total_evaluaciones, 0)}
                  </p>
                  <p className="text-sm text-orange-700">Total Eval.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar usuario por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuariosFiltrados.map((usuario, index) => (
          <div
            key={usuario.id || usuario.email}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-300 group"
            onClick={() => handleUsuarioClick(usuario)}
          >
            <div className="p-6">
              {/* Header del usuario */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:from-blue-600 group-hover:to-purple-700 transition-all">
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>
              </div>

              {/* Información del usuario */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                  {usuario.nombre}
                </h3>
                <p className="text-sm text-gray-600 truncate">{usuario.email}</p>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-blue-600">{usuario.total_evaluaciones}</div>
                  <div className="text-xs text-gray-600">Evaluaciones</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-green-600">{usuario.promedio_puntuacion}%</div>
                  <div className="text-xs text-gray-600">Promedio</div>
                </div>
              </div>

              {/* Estados de evaluaciones */}
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="flex items-center space-x-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{usuario.estados.aprobadas} aprobadas</span>
                </span>
                <span className="flex items-center space-x-1 text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{usuario.estados.reprobadas} reprobadas</span>
                </span>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700 transition-colors">
                  <span className="font-medium">Ver evaluaciones</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsuariosListJefe;
