import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, BarChart3, Calendar, ChevronDown, ChevronUp, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const ViewPersonalResults = ({ onBack, username }) => {
  const [results, setResults] = useState([]);
  const [resultsByRole, setResultsByRole] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [expandedEvaluations, setExpandedEvaluations] = useState({});

  useEffect(() => {
    fetchPersonalResults();
  }, []);

  const fetchPersonalResults = async () => {
    try {
      setLoading(true);
      
      // Obtener datos reales de la API
      const data = await apiService.getResultadosPersonal();
      
      // Agrupar resultados por rol
      const grouped = data.reduce((acc, result) => {
        if (!acc[result.rol]) {
          acc[result.rol] = [];
        }
        acc[result.rol].push(result);
        return acc;
      }, {});
      
      setResults(data);
      setResultsByRole(grouped);
      
      if (data.length === 0) {
        toast({
          title: "Información",
          description: "No se encontraron evaluaciones de personal completadas",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error fetching personal results:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados de evaluaciones: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEvaluationExpansion = (evaluationId) => {
    setExpandedEvaluations(prev => ({
      ...prev,
      [evaluationId]: !prev[evaluationId]
    }));
  };

  const getRoleColor = (role) => {
    const colors = {
      'Jefe de Planta': 'bg-blue-100 text-blue-800 border-blue-200',
      'Laboratorista': 'bg-green-100 text-green-800 border-green-200',
      'Operador de Camión Revolvedor': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Operador de Bombas de Concreto': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (estado) => {
    const colors = {
      'completada': 'bg-green-100 text-green-800',
      'en_progreso': 'bg-yellow-100 text-yellow-800',
      'cancelada': 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg text-white">Cargando resultados de evaluaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("public/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
              <h2 className="text-2xl font-bold text-gray-800">
                Resultados de Evaluaciones de Personal
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Usuario: {username}</span>
            </div>
          </div>
        </div>

        {selectedRole ? (
          /* Vista detallada de un rol específico */
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setSelectedRole(null)}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a roles
                  </Button>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedRole}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedRole)}`}>
                  {resultsByRole[selectedRole]?.length} evaluación(es)
                </span>
              </div>
            </div>
            
            {resultsByRole[selectedRole]?.map((evaluation) => (
              <motion.div
                key={evaluation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{evaluation.username}</h4>
                        <p className="text-sm text-gray-600">ID: {evaluation.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.estado)}`}>
                        {evaluation.estado}
                      </span>
                      <Button
                        onClick={() => toggleEvaluationExpansion(evaluation.id)}
                        variant="outline"
                        size="sm"
                      >
                        {expandedEvaluations[evaluation.id] ? (
                          <><ChevronUp className="w-4 h-4 mr-2" /> Contraer</>
                        ) : (
                          <><ChevronDown className="w-4 h-4 mr-2" /> Expandir</>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Puntuación Total</p>
                      <p className="text-lg font-semibold text-gray-800">{evaluation.puntuacion_total}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Fecha de Inicio</p>
                      <p className="text-sm text-gray-800">{new Date(evaluation.fecha_inicio).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Observaciones</p>
                      <p className="text-sm text-gray-800">{evaluation.observaciones || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedEvaluations[evaluation.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t pt-4"
                      >
                        <h5 className="text-md font-semibold text-gray-800 mb-3">Resultados por Sección:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {evaluation.secciones?.map((seccion, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-gray-800 truncate" title={seccion.nombre}>
                                  {seccion.nombre.length > 30 ? seccion.nombre.substring(0, 30) + '...' : seccion.nombre}
                                </p>
                                <span className="text-sm font-semibold text-blue-600">
                                  {seccion.puntuacion}/{seccion.ponderacion}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(seccion.puntuacion / seccion.ponderacion) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Vista de resumen por roles */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(resultsByRole).map(([role, evaluations], index) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedRole(role)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                      {evaluations.length} evaluación(es)
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{role}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Puntuación promedio:</span>
                      <span className="font-medium text-gray-800">
                        {(evaluations.reduce((sum, ev) => sum + ev.puntuacion_total, 0) / evaluations.length).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completadas:</span>
                      <span className="font-medium text-green-600">
                        {evaluations.filter(ev => ev.estado === 'completada').length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 text-center">
                      Haz clic para ver detalles
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {Object.keys(resultsByRole).length === 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay evaluaciones disponibles</h3>
            <p className="text-gray-600">No se encontraron resultados de evaluaciones de personal.</p>
          </div>
        )}
      </div>
      
      <img
        src="/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-40 drop-shadow-2xl pointer-events-none"
      />
    </div>
  );
};

export default ViewPersonalResults;
