import React, { useState, useEffect, useRef } from 'react';
import { IMAGES } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, UserCheck, Zap, Loader2, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ResultsScreen from './ResultsScreen';

// Simulación de apiService para página independiente
const createStandaloneApiService = (embedUser) => {
  return {
    getCurrentUser: () => embedUser,
    getUserAllowedRoles: async (userId) => {
      // Simular obtener roles permitidos desde la base de datos
      const roles = [
        { codigo: 'jefe_planta', nombre: 'Jefe de Planta', descripcion: 'Supervisión general de la planta' },
        { codigo: 'laboratorista', nombre: 'Laboratorista', descripcion: 'Control de calidad del concreto' },
        { codigo: 'operador_camion', nombre: 'Operador de Camión Revolvedor', descripcion: 'Manejo y transporte de concreto' },
        { codigo: 'operador_bombas', nombre: 'Operador de Bombas de Concreto', descripcion: 'Operación de bombas de concreto' }
      ];
      return roles;
    },
    getPreguntas: async (params) => {
      // Simular obtener preguntas de evaluación
      return {
        secciones: [
          {
            nombre: 'Conocimiento técnico y operativo',
            ponderacion: 15.00,
            p_minimo_aprobacion: 90.00,
            preguntas: [
              { id: 1, pregunta: '¿Conoce las especificaciones técnicas del concreto?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 2, pregunta: '¿Puede identificar los diferentes tipos de cemento?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 3, pregunta: '¿Sabe operar el equipo de mezclado?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 4, pregunta: '¿Conoce los procedimientos de seguridad?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 5, pregunta: '¿Maneja correctamente los materiales?', tipo_pregunta: 'abierta', es_trampa: false }
            ]
          },
          {
            nombre: 'Gestión de la producción',
            ponderacion: 20.00,
            p_minimo_aprobacion: 85.00,
            preguntas: [
              { id: 6, pregunta: '¿Planifica la producción diaria?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 7, pregunta: '¿Controla los tiempos de entrega?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 8, pregunta: '¿Optimiza los recursos disponibles?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 9, pregunta: '¿Coordina con el equipo de trabajo?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 10, pregunta: '¿Supervisa la calidad del producto?', tipo_pregunta: 'abierta', es_trampa: false }
            ]
          },
          {
            nombre: 'Mantenimiento del equipo',
            ponderacion: 10.00,
            p_minimo_aprobacion: 80.00,
            preguntas: [
              { id: 11, pregunta: '¿Realiza mantenimiento preventivo?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 12, pregunta: '¿Identifica fallas en el equipo?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 13, pregunta: '¿Lleva registros de mantenimiento?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 14, pregunta: '¿Coordina reparaciones externas?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 15, pregunta: '¿Optimiza el uso de refacciones?', tipo_pregunta: 'abierta', es_trampa: false }
            ]
          },
          {
            nombre: 'Gestión del personal',
            ponderacion: 10.00,
            p_minimo_aprobacion: 85.00,
            preguntas: [
              { id: 16, pregunta: '¿Capacita al personal nuevo?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 17, pregunta: '¿Evalúa el desempeño del equipo?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 18, pregunta: '¿Resuelve conflictos laborales?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 19, pregunta: '¿Promueve el trabajo en equipo?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 20, pregunta: '¿Asigna tareas eficientemente?', tipo_pregunta: 'abierta', es_trampa: false }
            ]
          },
          {
            nombre: 'Seguridad y cumplimiento normativo',
            ponderacion: 10.00,
            p_minimo_aprobacion: 95.00,
            preguntas: [
              { id: 21, pregunta: '¿Conoce las normas de seguridad?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 22, pregunta: '¿Utiliza equipo de protección personal?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 23, pregunta: '¿Reporta incidentes de seguridad?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 24, pregunta: '¿Cumple con regulaciones ambientales?', tipo_pregunta: 'abierta', es_trampa: false },
              { id: 25, pregunta: '¿Mantiene áreas de trabajo limpias?', tipo_pregunta: 'abierta', es_trampa: false }
            ]
          }
        ]
      };
    },
    guardarEvaluacion: async (evaluacionData) => {
      // Simular guardar evaluación
      console.log('Guardando evaluación:', evaluacionData);
      return { puntuacion_ponderada: 85.5 };
    },
    guardarProgresoSeccion: async (progresoData) => {
      // Simular guardar progreso de sección
      console.log('Guardando progreso:', progresoData);
      return { success: true };
    }
  };
};

const PersonalEvaluationStandalone = ({ embedUser }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [evaluationData, setEvaluationData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [apiService] = useState(() => createStandaloneApiService(embedUser));
  
  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    if (!evaluationStarted && embedUser) {
      loadRoles();
    }
  }, [embedUser]);

  // Scroll al inicio cuando cambia la sección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentSection]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const allowedRolesData = await apiService.getUserAllowedRoles(embedUser.id);
      setRoles(allowedRolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los roles"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      const params = {
        tipo: 'personal',
        rol: selectedRole
      };
      const data = await apiService.getPreguntas(params);
      setEvaluationData(data);
      setEvaluationStarted(true);
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar las preguntas de evaluación"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (roleCode) => {
    setSelectedRole(roleCode);
    setCurrentSection(0);
    setAnswers({});
    await loadEvaluationData();
  };

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedRole}-${currentSection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const handleNextSection = async () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      await completeEvaluation();
    }
  };

  const completeEvaluation = async () => {
    try {
      setLoading(true);
      
      // Calcular puntuación final
      let totalScore = 0;
      let totalNormalQuestions = 0;
      let correctNormalAnswers = 0;

      Object.entries(answers).forEach(([key, selectedAnswer]) => {
        const [roleOrType, sectionIndex, questionIndex] = key.split('-');
        const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];

        if (question && !question.es_trampa) {
          totalNormalQuestions++;
          if (selectedAnswer === 'si') {
            totalScore += 10;
            correctNormalAnswers++;
          }
        }
      });

      const finalPercentage = totalNormalQuestions > 0 ? (correctNormalAnswers / totalNormalQuestions) * 100 : 0;

      const evaluationResults = {
        answers,
        score: Math.round(finalPercentage),
        totalAnswers: totalNormalQuestions,
        correctAnswers: correctNormalAnswers,
        evaluationTitle: `Evaluación de Personal - ${selectedRole}`,
        sections: evaluationData.secciones || [],
        isPersonalEvaluation: true
      };

      setResults(evaluationResults);
      setShowResults(true);

      toast({
        title: "✅ Evaluación completada",
        description: "Los resultados han sido calculados exitosamente"
      });

    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo completar la evaluación"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewEvaluation = () => {
    setShowResults(false);
    setResults(null);
    setEvaluationStarted(false);
    setSelectedRole(null);
    setCurrentSection(0);
    setAnswers({});
  };

  const totalSections = evaluationData?.secciones?.length || 0;
  const currentSectionData = evaluationData?.secciones?.[currentSection];
  const progress = totalSections > 0 ? ((currentSection + 1) / totalSections) * 100 : 0;

  // Pantalla de resultados
  if (showResults && results) {
    return (
      <ResultsScreen 
        results={results} 
        onNewEvaluation={handleNewEvaluation}
        onBack={handleNewEvaluation}
      />
    );
  }

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando evaluación de personal...</p>
        </div>
      </div>
    );
  }

  // Pantalla de selección de roles
  if (!evaluationStarted) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("/${IMAGES.FONDO}")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 pt-24">
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Evaluación de Personal</h2>
              <p className="text-white/80">Selecciona el rol a evaluar</p>
              {embedUser && (
                <div className="mt-4 bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded-lg">
                  <p className="text-sm">
                    <strong>Usuario:</strong> {embedUser.nombre || embedUser.username || 'Usuario Embebido'}
                  </p>
                </div>
              )}
            </div>

            {roles.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
                  <h3 className="font-semibold mb-2">Sin roles disponibles</h3>
                  <p className="text-sm">
                    No se encontraron roles disponibles para esta evaluación.
                  </p>
                </div>
              </div>
            ) : (
              roles.map((role, index) => (
                <motion.div
                  key={role.codigo}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => handleRoleSelect(role.codigo)}
                    className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-gray-800 font-medium block">{role.nombre}</span>
                        {role.descripcion && (
                          <span className="text-gray-600 text-sm">{role.descripcion}</span>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <img
          src={IMAGES.CONCRETON}
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-40 drop-shadow-2xl pointer-events-none"
        />
      </div>
    );
  }

  if (!evaluationData || !evaluationData.secciones || evaluationData.secciones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4 pt-24">
        <UserCheck size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron preguntas para esta selección.</p>
        <Button onClick={handleNewEvaluation} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
        </Button>
      </div>
    );
  }

  // Verificar si todas las preguntas de la sección actual han sido respondidas
  const allQuestionsAnswered = currentSectionData?.preguntas?.every((_, index) => {
    const key = `${selectedRole}-${currentSection}-${index}`;
    return answers[key] !== undefined;
  });

  // Pantalla de evaluación
  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("/${IMAGES.FONDO}")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 pt-24" ref={evaluationContentRef}>
        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Evaluación de Personal - {selectedRole}
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="flex h-full">
              {Array.from({ length: totalSections }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < currentSection ? 'bg-blue-600' :
                    i === currentSection ? 'bg-blue-400' : 'bg-gray-300'}
                    ${i < totalSections - 1 ? 'mr-1' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
              {/* Header de la sección */}
              <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 text-center">
                  {currentSectionData?.nombre}
                </h2>
                {currentSectionData?.ponderacion && (
                  <div className="text-center text-sm text-gray-600 mt-1">
                    Ponderación: {currentSectionData.ponderacion}%
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6">
                <div className="space-y-6">
                  {currentSectionData?.preguntas?.map((question, index) => {
                    const key = `${selectedRole}-${currentSection}-${index}`;
                    const selectedAnswer = answers[key];

                    return (
                      <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          {index + 1}. {question.pregunta}
                        </h3>

                        {/* Pregunta abierta (Sí/No/NA) */}
                        <div className="space-y-2">
                          <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value="si"
                              checked={selectedAnswer === 'si'}
                              onChange={() => handleAnswer(index, 'si')}
                              className="mr-3 text-green-600 focus:ring-green-500"
                            />
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-gray-700">Sí</span>
                          </label>

                          <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value="no"
                              checked={selectedAnswer === 'no'}
                              onChange={() => handleAnswer(index, 'no')}
                              className="mr-3 text-red-600 focus:ring-red-500"
                            />
                            <XCircle className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-gray-700">No</span>
                          </label>

                          <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value="na"
                              checked={selectedAnswer === 'na'}
                              onChange={() => handleAnswer(index, 'na')}
                              className="mr-3 text-gray-600 focus:ring-gray-500"
                            />
                            <MinusCircle className="w-5 h-5 text-gray-600 mr-2" />
                            <span className="text-gray-700">No Aplica</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botón para continuar */}
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleNextSection}
                    disabled={!allQuestionsAnswered || loading}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {currentSection < totalSections - 1 ? 'Siguiente Sección' : 'Finalizar Evaluación'}
                    </span>
                  </Button>
                </div>

                {/* Contador de secciones */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  Sección {currentSection + 1} de {totalSections}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <img
        src={IMAGES.CONCRETON}
        alt="Mascota Concreton"
        className="w-32 h-40 drop-shadow-2xl"
      />
    </div>
  );
};

export default PersonalEvaluationStandalone;
