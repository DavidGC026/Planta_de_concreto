import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, CheckCircle, XCircle, MinusCircle, UserCheck, Loader2, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const JefePlantaEvaluation = ({ onComplete, onLogout, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);

  useEffect(() => {
    loadEvaluationData();
  }, []);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      const params = {
        tipo: 'personal',
        rol: 'jefe_planta'
      };

      const data = await apiService.getPreguntas(params);
      setEvaluationData(data);
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      
      // Datos de ejemplo si no se puede conectar al backend
      const mockData = {
        tipo_evaluacion: 'personal',
        rol_personal: 'jefe_planta',
        secciones: [
          {
            id: 1,
            nombre: 'Conocimiento técnico y operativo',
            ponderacion: 15.00,
            preguntas: [
              {
                pregunta_id: 1,
                pregunta: '¿Conoce los procedimientos de control de calidad del concreto?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 2,
                pregunta: '¿Maneja adecuadamente los tiempos de mezclado?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 3,
                pregunta: '¿Supervisa el cumplimiento de las especificaciones técnicas?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              }
            ]
          },
          {
            id: 2,
            nombre: 'Gestión de la producción',
            ponderacion: 20.00,
            preguntas: [
              {
                pregunta_id: 4,
                pregunta: '¿Planifica eficientemente la producción diaria?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 5,
                pregunta: '¿Optimiza el uso de recursos y materiales?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 6,
                pregunta: '¿Coordina adecuadamente con el área de logística?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              }
            ]
          },
          {
            id: 3,
            nombre: 'Seguridad y cumplimiento normativo',
            ponderacion: 25.00,
            preguntas: [
              {
                pregunta_id: 7,
                pregunta: '¿Implementa y supervisa las medidas de seguridad?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 8,
                pregunta: '¿Asegura el cumplimiento de las normas ambientales?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 9,
                pregunta: '¿Mantiene actualizados los protocolos de emergencia?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              }
            ]
          },
          {
            id: 4,
            nombre: 'Gestión del personal',
            ponderacion: 20.00,
            preguntas: [
              {
                pregunta_id: 10,
                pregunta: '¿Capacita regularmente a su equipo de trabajo?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 11,
                pregunta: '¿Evalúa el desempeño del personal a su cargo?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 12,
                pregunta: '¿Fomenta un ambiente de trabajo colaborativo?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              }
            ]
          },
          {
            id: 5,
            nombre: 'Mejora continua y resultados',
            ponderacion: 20.00,
            preguntas: [
              {
                pregunta_id: 13,
                pregunta: '¿Implementa acciones de mejora continua?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 14,
                pregunta: '¿Analiza y reporta indicadores de desempeño?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              },
              {
                pregunta_id: 15,
                pregunta: '¿Busca constantemente optimizar los procesos?',
                tipo_pregunta: 'abierta',
                es_trampa: false
              }
            ]
          }
        ]
      };
      
      setEvaluationData(mockData);
      
      toast({
        title: "⚠️ Modo sin conexión",
        description: "Usando datos de ejemplo para la evaluación"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalSections = evaluationData?.secciones?.length || 0;
  const currentSectionData = evaluationData?.secciones?.[currentSection];

  const progress = totalSections > 0
    ? ((currentSection + 1) / totalSections) * 100
    : 0;

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `jefe_planta-${currentSection}-${questionIndex}`;
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
      let totalQuestions = 0;
      let correctAnswers = 0;

      Object.entries(answers).forEach(([key, selectedAnswer]) => {
        totalQuestions++;
        if (selectedAnswer === 'si') {
          totalScore += 10;
          correctAnswers++;
        }
      });

      const finalPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Preparar resultados
      const results = {
        answers,
        score: Math.round(finalPercentage),
        totalAnswers: totalQuestions,
        correctAnswers: correctAnswers,
        evaluationTitle: 'Evaluación de Jefe de Planta',
        sections: evaluationData.secciones || [],
        isPersonalEvaluation: true
      };

      onComplete(results);

      toast({
        title: "✅ Evaluación completada",
        description: "Los resultados han sido calculados exitosamente"
      });

    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo completar la evaluación. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar si todas las preguntas de la sección actual han sido respondidas
  const allQuestionsAnswered = currentSectionData?.preguntas?.every((_, index) => {
    const key = `jefe_planta-${currentSection}-${index}`;
    return answers[key] !== undefined;
  });

  // Calcular estadísticas
  const calculateStats = () => {
    if (!evaluationData?.secciones) return null;

    const totalQuestions = evaluationData.secciones.reduce((total, seccion) => {
      return total + (seccion.preguntas?.length || 0);
    }, 0);

    const answeredQuestions = Object.keys(answers).length;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    let correctAnswers = 0;
    Object.values(answers).forEach(answer => {
      if (answer === 'si') {
        correctAnswers++;
      }
    });

    const currentScore = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;

    return {
      totalQuestions,
      answeredQuestions,
      progressPercentage,
      correctAnswers,
      currentScore
    };
  };

  const stats = calculateStats();

  if (loading && !evaluationData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (!evaluationData || !evaluationData.secciones || evaluationData.secciones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
        <UserCheck size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron preguntas para la evaluación de Jefe de Planta.</p>
        <Button onClick={onLogout} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      {/* Header */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/Logo_imcyc.png" 
                alt="Logo IMCYC" 
                className="h-12 w-auto" 
              />
              <div>
                <span className="text-xl font-bold text-gray-800">Evaluación Jefe de Planta</span>
                <p className="text-sm text-gray-600">Usuario: {username}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex items-center space-x-2 border-red-600 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Evaluación de Jefe de Planta
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

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className={`${stats ? 'w-3/5' : 'w-full'}`}>
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
                        const key = `jefe_planta-${currentSection}-${index}`;
                        const selectedAnswer = answers[key];

                        return (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">
                              {index + 1}. {question.pregunta}
                            </h3>

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

          {/* Panel de estadísticas */}
          {stats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Progreso de Evaluación
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-4">
                    {/* Progreso general */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Progreso general</h4>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(stats.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stats.answeredQuestions} de {stats.totalQuestions} preguntas
                      </div>
                    </div>

                    {/* Puntuación estimada */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Puntuación estimada</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.currentScore}%
                        </div>
                        <div className="text-xs text-gray-500">
                          puntos acumulados
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stats.correctAnswers} correctas de {stats.answeredQuestions} respondidas
                        </div>
                      </div>
                    </div>

                    {/* Información del sistema */}
                    <div className="border-t pt-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-xs font-medium text-blue-800 mb-1">Sistema de Evaluación</h4>
                        <div className="text-xs text-blue-700">
                          <div>• Respuesta "Sí" = Correcta</div>
                          <div>• Respuesta "No" = Incorrecta</div>
                          <div>• "No Aplica" = No cuenta</div>
                          <div>• Ponderación por secciones</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <img
        src="/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
      />
    </div>
  );
};

export default JefePlantaEvaluation;