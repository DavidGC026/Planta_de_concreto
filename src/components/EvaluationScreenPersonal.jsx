import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, UserCheck, Zap, Loader2, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import permissionsService from '@/services/permissionsService';

const EvaluationScreenPersonal = ({ onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [evaluationData, setEvaluationData] = useState(null);
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [hasPermissionRestrictions, setHasPermissionRestrictions] = useState(false);

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    if (!evaluationStarted) {
      loadRoles();
      checkUserPermissions();
    }
  }, []);

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
      
      const user = apiService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener roles permitidos para este usuario específico
      const allowedRolesData = await permissionsService.getUserAllowedRoles(user.id);
      
      if (!Array.isArray(allowedRolesData) || allowedRolesData.length === 0) {
        // Si no tiene roles permitidos, mostrar mensaje de error
        toast({
          title: "❌ Sin permisos",
          description: "No tienes permisos para realizar evaluaciones de personal"
        });
        setRoles([]);
        setAllowedRoles([]);
        setHasPermissionRestrictions(true);
        return;
      }
      
      setRoles(allowedRolesData);
      setAllowedRoles(allowedRolesData);
      setHasPermissionRestrictions(allowedRolesData.length < 4); // Menos de 4 roles = permisos restringidos
      
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los roles permitidos"
      });
      setRoles([]);
      setAllowedRoles([]);
      setHasPermissionRestrictions(true);
    } finally {
      setLoading(false);
    }
  };

  const checkUserPermissions = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      const permissionsInfo = await permissionsService.getPermissionsInfo(user.id);
      setHasPermissionRestrictions(permissionsInfo.restrictedAccess);
      
      // Log para debugging
      console.log('Información de permisos:', permissionsInfo);
      
    } catch (error) {
      console.error('Error checking permissions:', error);
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

  // Función para generar evaluación simulada
  const generateSimulatedEvaluation = () => {
    if (!evaluationData?.secciones) {
      // Si no hay datos reales, crear datos simulados
      const simulatedSections = [
        { nombre: 'Conocimiento técnico y operativo', ponderacion: 15.00 },
        { nombre: 'Gestión de la producción', ponderacion: 20.00 },
        { nombre: 'Mantenimiento del equipo', ponderacion: 10.00 },
        { nombre: 'Gestión del personal', ponderacion: 10.00 },
        { nombre: 'Seguridad y cumplimiento normativo', ponderacion: 10.00 },
        { nombre: 'Control de calidad', ponderacion: 10.00 },
        { nombre: 'Documentación y control administrativo', ponderacion: 5.00 },
        { nombre: 'Mejora continua y enfoque a resultados', ponderacion: 7.50 },
        { nombre: 'Coordinación con logística y clientes', ponderacion: 5.00 },
        { nombre: 'Resolución de problemas', ponderacion: 7.50 }
      ];

      return generateSimulatedResults(simulatedSections);
    }

    return generateSimulatedResults(evaluationData.secciones);
  };

  const generateSimulatedResults = (sections) => {
    const simulatedAnswers = {};
    const simulatedSections = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    sections.forEach((section, sectionIndex) => {
      // Generar 5 preguntas simuladas por sección
      const questionsPerSection = 5;
      const sectionQuestions = [];

      for (let i = 0; i < questionsPerSection; i++) {
        const questionId = `${selectedRole || 'simulado'}-${sectionIndex}-${i}`;

        // Generar respuesta aleatoria con tendencia hacia respuestas positivas
        const randomValue = Math.random();
        let answer;

        if (randomValue < 0.7) { // 70% probabilidad de respuesta correcta
          answer = 'si';
          correctAnswers++;
        } else if (randomValue < 0.9) { // 20% probabilidad de respuesta incorrecta
          answer = 'no';
        } else { // 10% probabilidad de N/A
          answer = 'na';
        }

        simulatedAnswers[questionId] = answer;
        totalQuestions++;

        // Crear pregunta simulada
        sectionQuestions.push({
          id: i,
          pregunta_id: i,
          pregunta: `Pregunta simulada ${i + 1} de ${section.nombre || section.title}`,
          tipo_pregunta: 'abierta',
          es_trampa: false
        });
      }

      simulatedSections.push({
        ...section,
        preguntas: sectionQuestions
      });
    });

    // Calcular puntuación simulada
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Crear objeto de resultados simulados
    const simulatedResults = {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Personal Simulada - ${selectedRole || 'Rol Genérico'}`,
      sections: simulatedSections,
      isPersonalEvaluation: true,
      isSimulated: true
    };

    return simulatedResults;
  };

  const handleSkipToResults = () => {
    try {
      const simulatedResults = generateSimulatedEvaluation();

      toast({
        title: "🎯 Evaluación Simulada",
        description: "Se ha generado una evaluación con respuestas aleatorias para demostración"
      });

      onComplete(simulatedResults);
    } catch (error) {
      console.error('Error generating simulated evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo generar la evaluación simulada"
      });
    }
  };

  const totalSections = evaluationData?.secciones?.length || 0;
  const currentSectionData = evaluationData?.secciones?.[currentSection];

  const progress = totalSections > 0
    ? ((currentSection + 1) / totalSections) * 100
    : 0;

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedRole}-${currentSection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const saveCurrentSectionProgress = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) return;

      // Calcular progreso de la sección actual (solo preguntas normales)
      let sectionScore = 0;
      let totalQuestions = 0;
      let correctAnswers = 0;

      const sectionAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith(`${selectedRole}-${currentSection}-`));

      sectionAnswers.forEach(([key, answer]) => {
        const [, sectionIndex, questionIndex] = key.split('-');
        const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];

        // Solo contar preguntas normales (no trampa)
        if (question && !question.es_trampa) {
          totalQuestions++;
          if (answer === 'si' ||
              (question.tipo_pregunta === 'seleccion_multiple' && answer === question.respuesta_correcta)) {
            sectionScore += 10; // Puntuación estándar por pregunta
            correctAnswers++;
          }
        }
      });

      const sectionPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Guardar progreso de sección
      await apiService.guardarProgresoSeccion({
        usuario_id: user.id,
        tipo_evaluacion: 'personal',
        seccion_nombre: currentSectionData?.nombre || `Sección ${currentSection + 1}`,
        seccion_orden: currentSection + 1,
        puntaje_seccion: sectionScore,
        puntaje_porcentaje: sectionPercentage,
        respuestas_correctas: correctAnswers,
        total_preguntas: totalQuestions,
        rol_personal: selectedRole
      });

    } catch (error) {
      console.error('Error saving section progress:', error);
    }
  };

  const handleNextSection = async () => {
    // Guardar progreso de la sección actual
    await saveCurrentSectionProgress();

    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      // Completar evaluación
      await completeEvaluation();
    }
  };

  const completeEvaluation = async () => {
    try {
      setLoading(true);

      const user = apiService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calcular puntuación final y verificar preguntas trampa
      let totalScore = 0;
      let totalNormalQuestions = 0;
      let correctNormalAnswers = 0;
      let wrongTrapAnswers = 0;

      Object.entries(answers).forEach(([key, selectedAnswer]) => {
        const [roleOrType, sectionIndex, questionIndex] = key.split('-');
        const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];

        if (question) {
          if (question.es_trampa) {
            // Verificar preguntas trampa (solo contar errores)
            if (selectedAnswer === 'no' ||
                (question.tipo_pregunta === 'seleccion_multiple' && selectedAnswer !== question.respuesta_correcta)) {
              wrongTrapAnswers++;
            }
          } else {
            // Contar preguntas normales
            totalNormalQuestions++;
            if (selectedAnswer === 'si' ||
                (question.tipo_pregunta === 'seleccion_multiple' && selectedAnswer === question.respuesta_correcta)) {
              totalScore += 10;
              correctNormalAnswers++;
            }
          }
        }
      });

      // Determinar si reprueba por preguntas trampa
      const failedByTrapQuestions = wrongTrapAnswers >= 2;

      // Calcular porcentaje final (solo de preguntas normales)
      const finalPercentage = totalNormalQuestions > 0 ? (correctNormalAnswers / totalNormalQuestions) * 100 : 0;

      // Preparar datos para guardar
      const evaluacionData = {
        usuario_id: user.id,
        tipo_evaluacion: 'personal',
        rol_personal: selectedRole,
        respuestas: Object.entries(answers).map(([key, selectedAnswer]) => {
          const [roleOrType, sectionIndex, questionIndex] = key.split('-');
          const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];

          return {
            pregunta_id: question?.pregunta_id || question?.id || null,
            respuesta: selectedAnswer,
            observacion: question?.es_trampa ? 'Pregunta trampa' : null
          };
        }),
        observaciones: `Evaluación de personal completada - Rol: ${selectedRole}${failedByTrapQuestions ? ' - REPROBADO POR PREGUNTAS TRAMPA' : ''} - Sistema: Ponderación por secciones`
      };

      // Guardar en base de datos
      const result = await apiService.guardarEvaluacion(evaluacionData);

      onComplete({
        answers,
        score: Math.round(result.puntuacion_ponderada || finalPercentage), // Usar puntuación ponderada del backend
        totalAnswers: totalNormalQuestions,
        correctAnswers: correctNormalAnswers,
        evaluationTitle: `Evaluación de Personal - ${selectedRole}`,
        sections: evaluationData.secciones || [],
        // NO incluir información de preguntas trampa
        isPersonalEvaluation: true
      });

      toast({
        title: failedByTrapQuestions ? "❌ Evaluación reprobada" : "✅ Evaluación completada",
        description: failedByTrapQuestions
          ? "Evaluación reprobada por preguntas de verificación"
          : "Los resultados han sido guardados exitosamente con ponderación por secciones"
      });

    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la evaluación. Intenta nuevamente."
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

  // Calcular estadísticas mejoradas con información de la base de datos
  const calculateEnhancedStats = () => {
    if (!evaluationData?.secciones) {
      return null;
    }

    // Calcular totales generales
    const totalQuestions = evaluationData.secciones.reduce((total, seccion) => {
      return total + (seccion.preguntas?.filter(p => !p.es_trampa).length || 0);
    }, 0);

    const answeredQuestions = Object.entries(answers).filter(([key, answer]) => {
      const [roleOrType, sectionIndex, questionIndex] = key.split('-');
      const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];
      return question && !question.es_trampa;
    }).length;

    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Calcular respuestas por tipo (solo preguntas normales)
    const responseStats = {
      si: 0,
      no: 0,
      na: 0,
      a: 0,
      b: 0,
      c: 0
    };

    let correctAnswers = 0;

    Object.entries(answers).forEach(([key, answer]) => {
      const [roleOrType, sectionIndex, questionIndex] = key.split('-');
      const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];

      if (question && !question.es_trampa) {
        // Contar respuestas normales
        if (responseStats.hasOwnProperty(answer)) {
          responseStats[answer]++;

          if (answer === 'si' ||
              (question.tipo_pregunta === 'seleccion_multiple' && answer === question.respuesta_correcta)) {
            correctAnswers++;
          }
        }
      }
    });

    // Calcular información detallada por sección
    const sectionsInfo = evaluationData.secciones.map((seccion, sectionIndex) => {
      const normalQuestions = seccion.preguntas?.filter(p => !p.es_trampa) || [];
      const totalSectionQuestions = normalQuestions.length;

      // Contar respuestas de esta sección
      let sectionAnswered = 0;
      let sectionCorrect = 0;

      normalQuestions.forEach((question, qIndex) => {
        const key = `${selectedRole}-${sectionIndex}-${qIndex}`;
        const answer = answers[key];

        if (answer) {
          sectionAnswered++;
          if (answer === 'si' ||
              (question.tipo_pregunta === 'seleccion_multiple' && answer === question.respuesta_correcta)) {
            sectionCorrect++;
          }
        }
      });

      const sectionProgress = totalSectionQuestions > 0 ? (sectionAnswered / totalSectionQuestions) * 100 : 0;
      const sectionScore = sectionAnswered > 0 ? (sectionCorrect / sectionAnswered) * 100 : 0;

      return {
        nombre: seccion.nombre,
        ponderacion: seccion.ponderacion || 0,
        totalPreguntas: totalSectionQuestions,
        preguntasRespondidas: sectionAnswered,
        respuestasCorrectas: sectionCorrect,
        progreso: sectionProgress,
        puntuacion: sectionScore,
        isCurrentSection: sectionIndex === currentSection,
        isCompleted: sectionProgress === 100
      };
    });

    // Calcular ponderación total
    const totalPonderacion = evaluationData.secciones.reduce((total, seccion) => {
      return total + (seccion.ponderacion || 0);
    }, 0);

    return {
      totalQuestions,
      answeredQuestions,
      progressPercentage,
      responseStats,
      correctAnswers,
      currentScore: answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0,
      sectionsInfo,
      totalPonderacion,
      configuracion: evaluationData.configuracion
    };
  };

  const enhancedStats = calculateEnhancedStats();

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
            backgroundImage: `url("public/Fondo.png")`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Personal</h2>
              <p className="text-white/80">Selecciona el rol a evaluar</p>
              {hasPermissionRestrictions && (
                <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg">
                  <p className="text-sm">
                    <strong>Acceso Restringido:</strong> Solo puedes evaluar los roles para los que tienes permisos asignados.
                  </p>
                </div>
              )}
            </div>

            {/* Botón para saltar a resultados simulados */}
            <div className="mb-6 flex justify-center">
              <Button
                onClick={handleSkipToResults}
                variant="outline"
                size="lg"
                className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2 px-6 py-3"
              >
                <Zap className="w-5 h-5" />
                <span>Ver Evaluación Simulada</span>
              </Button>
            </div>

            {roles.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
                  <h3 className="font-semibold mb-2">Sin permisos de evaluación</h3>
                  <p className="text-sm">
                    No tienes permisos para realizar evaluaciones de personal. 
                    Contacta al administrador para solicitar acceso.
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
          src="public/Concreton.png"
          alt="Mascota Concreton"
          className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-32 md:w-40 md:h-40 pointer-events-none"
        />
      </div>
    );
  }

  if (!evaluationData || !evaluationData.secciones || evaluationData.secciones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4">
        <UserCheck size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron preguntas para esta selección.</p>
        <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
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
          backgroundImage: `url("public/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8" ref={evaluationContentRef}>
        {/* Botón de desarrollo para saltar a resultados - solo en primera sección */}
        {currentSection === 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={handleSkipToResults}
              variant="outline"
              size="sm"
              className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Saltar a Resultados (Simulado)</span>
            </Button>
          </div>
        )}

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

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className={`${enhancedStats ? 'w-3/5' : 'w-full'}`}>
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
                    {/* Mostrar ponderación de la sección */}
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
                              {/* NO mostrar indicador de preguntas trampa */}
                            </h3>

                            {question.tipo_pregunta === 'seleccion_multiple' ? (
                              // Pregunta de selección múltiple
                              <div className="space-y-2">
                                {['a', 'b', 'c'].map((option) => {
                                  const optionText = question[`opcion_${option}`];
                                  if (!optionText) return null;

                                  return (
                                    <label
                                      key={option}
                                      className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                    >
                                      <input
                                        type="radio"
                                        name={`question-${index}`}
                                        value={option}
                                        checked={selectedAnswer === option}
                                        onChange={() => handleAnswer(index, option)}
                                        className="mr-3 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="font-medium text-blue-600 mr-2">{option.toUpperCase()})</span>
                                      <span className="text-gray-700">{optionText}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              // Pregunta abierta (Sí/No/NA)
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
                            )}
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

          {/* Panel de estadísticas mejorado */}
          {enhancedStats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Criterios de evaluación
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-4">
                    {/* Tabla de criterios de evaluación */}
                    <div className="overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-2 font-medium text-gray-700">Criterios de evaluación</th>
                            <th className="text-center p-2 font-medium text-gray-700">Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enhancedStats.sectionsInfo.map((section, index) => (
                            <tr
                              key={index}
                              className={`border-b border-gray-100 ${
                                section.isCurrentSection ? 'bg-blue-50' :
                                section.isCompleted ? 'bg-green-50' : ''
                              }`}
                            >
                              <td className="p-2">
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-blue-600 mr-1">
                                    {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-800 truncate" title={section.nombre}>
                                    {section.nombre.length > 25 ? section.nombre.substring(0, 25) + '...' : section.nombre}
                                  </span>
                                  {section.isCurrentSection && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-1 flex-shrink-0" />
                                  )}
                                  {section.isCompleted && (
                                    <CheckCircle className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" />
                                  )}
                                </div>
                              </td>
                              <td className="text-center p-2 text-xs font-medium">
                                {section.ponderacion}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td className="p-2 text-xs">TOTAL</td>
                            <td className="text-center p-2 text-xs">100</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Progreso general */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Progreso general</h4>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(enhancedStats.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enhancedStats.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {enhancedStats.answeredQuestions} de {enhancedStats.totalQuestions} preguntas
                      </div>
                    </div>

                    {/* Puntuación estimada */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Puntuación estimada</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {enhancedStats.currentScore}
                        </div>
                        <div className="text-xs text-gray-500">
                          puntos acumulados
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {enhancedStats.correctAnswers} correctas de {enhancedStats.answeredQuestions} respondidas
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas de respuestas */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución de respuestas</h4>
                      <div className="space-y-2">
                        {/* Respuestas Sí/No/NA */}
                        {(enhancedStats.responseStats.si > 0 || enhancedStats.responseStats.no > 0 || enhancedStats.responseStats.na > 0) && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                <span>Sí</span>
                              </div>
                              <span className="font-medium">{enhancedStats.responseStats.si}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <XCircle className="w-4 h-4 text-red-600 mr-2" />
                                <span>No</span>
                              </div>
                              <span className="font-medium">{enhancedStats.responseStats.no}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <MinusCircle className="w-4 h-4 text-gray-600 mr-2" />
                                <span>No Aplica</span>
                              </div>
                              <span className="font-medium">{enhancedStats.responseStats.na}</span>
                            </div>
                          </>
                        )}

                        {/* Respuestas de selección múltiple */}
                        {(enhancedStats.responseStats.a > 0 || enhancedStats.responseStats.b > 0 || enhancedStats.responseStats.c > 0) && (
                          <>
                            <div className="border-t pt-2 mt-2">
                              <div className="text-xs text-gray-500 mb-2">Selección múltiple</div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-600">A)</span>
                                <span className="font-medium">{enhancedStats.responseStats.a}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-600">B)</span>
                                <span className="font-medium">{enhancedStats.responseStats.b}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-600">C)</span>
                                <span className="font-medium">{enhancedStats.responseStats.c}</span>
                              </div>
                            </div>
                          </>
                        )}
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

export default EvaluationScreenPersonal;
