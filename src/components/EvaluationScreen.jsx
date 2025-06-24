import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowLeft, CheckCircle, XCircle, MinusCircle, UserCheck, Users, Wrench, Settings, Zap, ClipboardCheck, Loader2, BarChart3, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Evaluación de estado de planta (Operación)
const plantStatusEvaluation = {
  title: 'Evaluación del Estado de la Planta',
  icon: ClipboardCheck,
  sections: [
    {
      title: 'Estado de Equipos Principales',
      items: [
        { name: 'Mezcladora principal', status: null },
        { name: 'Básculas de cemento', status: null },
        { name: 'Básculas de agregados', status: null },
        { name: 'Sistema de agua', status: null },
        { name: 'Bandas transportadoras', status: null },
        { name: 'Silos de cemento', status: null },
        { name: 'Compresor de aire', status: null },
        { name: 'Sistema eléctrico', status: null },
        { name: 'Tolvas de agregados', status: null },
        { name: 'Sistema de control', status: null }
      ]
    },
    {
      title: 'Infraestructura y Seguridad',
      items: [
        { name: 'Señalización de seguridad', status: null },
        { name: 'Extintores', status: null },
        { name: 'Botiquín de primeros auxilios', status: null },
        { name: 'Iluminación general', status: null },
        { name: 'Drenajes y desagües', status: null },
        { name: 'Accesos y vialidades', status: null },
        { name: 'Área de laboratorio', status: null },
        { name: 'Oficinas administrativas', status: null },
        { name: 'Almacén de materiales', status: null },
        { name: 'Cerca perimetral', status: null }
      ]
    },
    {
      title: 'Documentación y Certificaciones',
      items: [
        { name: 'Licencias de operación', status: null },
        { name: 'Certificados de calidad', status: null },
        { name: 'Manuales de operación', status: null },
        { name: 'Registros de mantenimiento', status: null },
        { name: 'Bitácoras de producción', status: null },
        { name: 'Certificados de calibración', status: null },
        { name: 'Pólizas de seguro', status: null },
        { name: 'Permisos ambientales', status: null },
        { name: 'Capacitación del personal', status: null },
        { name: 'Procedimientos de emergencia', status: null }
      ]
    }
  ]
};

// Definición de tipos de plantas
const plantTypes = [
  { id: "pequena", name: "Planta pequeña" },
  { id: "mediana", name: "Planta mediana" },
  { id: "grande", name: "Planta grande" }
];

// Definición de categorías de evaluación de equipo
const equipmentCategories = [
  { id: "produccion", name: "Producción y mezclado", 
    subsections: [
      "Mezcladora", "Dosificación", "Bandas transportadoras", 
      "Tolvas", "Silos", "Sistemas de control", "Bombas"
    ]
  },
  { id: "transporte", name: "Transporte y entrega", 
    subsections: [
      "Camiones revolvedores", "Bombas de concreto", "Sistemas de carga",
      "Equipos de descarga", "Mantenimiento de flota"
    ]
  },
  { id: "calidad", name: "Control de calidad", 
    subsections: [
      "Equipos de laboratorio", "Instrumentos de medición", "Calibración",
      "Sistemas de muestreo", "Equipos de prueba"
    ]
  },
  { id: "mantenimiento", name: "Mantenimiento", 
    subsections: [
      "Herramientas", "Equipos de diagnóstico", "Repuestos",
      "Sistemas de lubricación", "Equipos de limpieza"
    ]
  },
  { id: "seguridad", name: "Seguridad y medio ambiente", 
    subsections: [
      "Equipos de protección", "Sistemas contra incendios", "Control de polvo",
      "Tratamiento de aguas", "Gestión de residuos"
    ]
  }
];

const evaluationDataConfig = {
  personal: {
    title: 'Evaluación de Personal',
    icon: Users,
    needsRole: true
  },
  equipo: {
    title: 'Evaluación de Equipo',
    icon: Wrench,
    needsRole: false,
    needsPlantType: true,
    needsCategory: true
  },
  operacion: {
    title: 'Evaluación del Estado de la Planta',
    icon: Settings,
    isPlantStatus: true,
    data: plantStatusEvaluation
  }
};

const EvaluationScreen = ({ evaluationType, onBack, onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [plantStatusAnswers, setPlantStatusAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [evaluationData, setEvaluationData] = useState(null);
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  const config = evaluationDataConfig[evaluationType];

  useEffect(() => {
    if (evaluationType === 'personal' && !evaluationStarted) {
      loadRoles();
    } else if (evaluationType === 'operacion') {
      setEvaluationData(config.data);
      setEvaluationStarted(true);
    } else if (evaluationType === 'equipo' && !evaluationStarted) {
      // Para equipo, primero mostramos selección de tipo de planta
      // No cargamos datos hasta que se seleccione tipo y categoría
    }
  }, [evaluationType]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await apiService.getRolesPersonal();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los roles de personal"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      // Para equipo, pasamos el tipo de planta y categoría como parámetros adicionales
      const params = {
        tipo: evaluationType,
        rol: selectedRole,
        ...(evaluationType === 'equipo' && { 
          tipoPlanta: selectedPlantType,
          categoria: selectedCategory 
        })
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

  const totalSections = evaluationData?.secciones?.length || 0;
  const currentSectionData = evaluationData?.secciones?.[currentSection];

  const progress = totalSections > 0 
    ? ((currentSection + 1) / totalSections) * 100
    : 0;

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedRole || evaluationType}-${currentSection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const handlePlantStatusAnswer = (itemIndex, status) => {
    const key = `${currentSection}-${itemIndex}`;
    setPlantStatusAnswers(prev => ({ ...prev, [key]: status }));
  };

  const handleNextSection = async () => {
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

      if (evaluationType === 'operacion') {
        // Calcular puntuación para evaluación de estado de planta
        const totalItems = Object.keys(plantStatusAnswers).length;
        let score = 0;
        
        Object.values(plantStatusAnswers).forEach(status => {
          if (status === 'bueno') score += 10;
          else if (status === 'regular') score += 5;
          // 'malo' = 0 puntos
        });

        // Preparar datos para guardar - evaluación de operación
        const evaluacionData = {
          usuario_id: user.id,
          tipo_evaluacion: evaluationType,
          rol_personal: null,
          respuestas: Object.entries(plantStatusAnswers).map(([key, status]) => {
            return {
              pregunta_id: null, // Para evaluación de operación no hay pregunta_id real
              respuesta: status === 'bueno' ? 'si' : status === 'regular' ? 'na' : 'no',
              observacion: `Item: ${key} - Estado: ${status}`
            };
          }),
          observaciones: 'Evaluación de estado de planta completada'
        };

        // Guardar en base de datos
        const result = await apiService.guardarEvaluacion(evaluacionData);

        onComplete({
          answers: plantStatusAnswers,
          score: Math.round(result.puntuacion_ponderada || score),
          totalAnswers: totalItems,
          evaluationTitle: evaluationData.title,
          sections: evaluationData.sections,
          isPlantStatus: true
        });
      } else {
        // Preparar datos para guardar - cuestionarios con ponderación
        const evaluacionData = {
          usuario_id: user.id,
          tipo_evaluacion: evaluationType,
          rol_personal: selectedRole,
          tipo_planta: selectedPlantType,
          categoria: selectedCategory,
          respuestas: Object.entries(answers).map(([key, selectedAnswer]) => {
            const [roleOrType, sectionIndex, questionIndex] = key.split('-');
            const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];
            
            return {
              pregunta_id: question?.pregunta_id || question?.id || null,
              respuesta: selectedAnswer,
              observacion: question?.es_trampa ? 'Pregunta trampa' : null
            };
          }),
          observaciones: `Evaluación de ${evaluationType === 'equipo' ? 'equipo' : 'personal'} completada`
        };

        // Guardar en base de datos
        const result = await apiService.guardarEvaluacion(evaluacionData);

        onComplete({
          answers,
          score: Math.round(result.puntuacion_ponderada || 0),
          totalAnswers: result.estadisticas.total_preguntas,
          correctAnswers: result.estadisticas.respuestas_si + result.estadisticas.respuestas_a + result.estadisticas.respuestas_b + result.estadisticas.respuestas_c,
          evaluationTitle: evaluationData.tipo_evaluacion || config.title,
          sections: evaluationData.secciones || [],
          ponderacionTotal: evaluationData.total_ponderacion || 100,
          preguntasTrampa: result.estadisticas.preguntas_trampa_respondidas || 0
        });
      }

      toast({
        title: "✅ Evaluación completada",
        description: "Los resultados han sido guardados exitosamente"
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

  const handlePlantTypeSelect = (plantType) => {
    setSelectedPlantType(plantType);
    setShowCategorySelection(true);
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setCurrentSection(0);
    setAnswers({});
    await loadEvaluationData();
  };

  const MainIcon = config.icon;

  // Calcular estadísticas de ponderación para cuestionarios
  const calculatePonderationStats = () => {
    if (evaluationType === 'operacion' || !evaluationData?.secciones) {
      return null;
    }

    const totalQuestions = evaluationData.secciones.reduce((total, seccion) => {
      return total + (seccion.preguntas?.length || 0);
    }, 0);

    const answeredQuestions = Object.keys(answers).length;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Calcular respuestas por tipo y preguntas trampa
    const responseStats = {
      si: 0,
      no: 0,
      na: 0,
      a: 0,
      b: 0,
      c: 0,
      trampa: 0
    };

    let ponderacionAcumulada = 0;

    Object.entries(answers).forEach(([key, answer]) => {
      const [roleOrType, sectionIndex, questionIndex] = key.split('-');
      const question = evaluationData?.secciones?.[sectionIndex]?.preguntas?.[questionIndex];
      
      if (question?.es_trampa) {
        responseStats.trampa++;
      } else if (responseStats.hasOwnProperty(answer)) {
        responseStats[answer]++;
        
        // Calcular ponderación acumulada
        if (question && (answer === 'si' || 
            (question.tipo_pregunta === 'seleccion_multiple' && answer === question.respuesta_correcta))) {
          ponderacionAcumulada += question.ponderacion_individual || 0;
        }
      }
    });

    return {
      totalQuestions,
      answeredQuestions,
      progressPercentage,
      responseStats,
      ponderacionAcumulada: Math.round(ponderacionAcumulada * 100) / 100,
      totalPonderacion: evaluationData.total_ponderacion || 100
    };
  };

  const ponderationStats = calculatePonderationStats();

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  // Pantalla de selección de tipo de planta para evaluación de equipo
  if (evaluationType === 'equipo' && !evaluationStarted) {
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
              <h2 className="text-2xl font-bold text-white mb-2">Evaluación de Equipo</h2>
              <p className="text-white/80">Seleccione el tipo de planta y categoría a evaluar</p>
            </div>

            {!showCategorySelection ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">Tipo de planta:</h3>
                <div className="space-y-4">
                  {plantTypes.map((type, index) => (
                    <motion.div
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => handlePlantTypeSelect(type.id)}
                        className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-gray-800 font-medium block">{type.name}</span>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-4">Categoría a evaluar:</h3>
                <div className="space-y-4">
                  {equipmentCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => handleCategorySelect(category.id)}
                        className="w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-gray-800 font-medium block">{category.name}</span>
                            <span className="text-gray-600 text-sm">
                              {category.subsections.slice(0, 3).join(', ')}
                              {category.subsections.length > 3 && '...'}
                            </span>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCategorySelection(false)}
                    className="text-white border-white hover:bg-white/20 hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a selección de planta
                  </Button>
                </div>
              </>
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

  // Pantalla de selección de roles
  if (evaluationType === 'personal' && !evaluationStarted) {
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
              <h2 className="text-2xl font-bold text-white mb-2">Selecciona el rol a evaluar</h2>
              <p className="text-white/80">Elige el tipo de personal que será evaluado</p>
            </div>

            {roles.map((role, index) => (
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
            ))}
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
        <Building2 size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron preguntas para esta selección.</p>
        <Button onClick={onBack} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
        </Button>
      </div>
    );
  }

  // Verificar si todas las preguntas/items de la sección actual han sido respondidas
  const allQuestionsAnswered = evaluationType === 'operacion' 
    ? currentSectionData?.items?.every((_, index) => {
        const key = `${currentSection}-${index}`;
        return plantStatusAnswers[key] !== undefined;
      })
    : currentSectionData?.preguntas?.every((_, index) => {
        const key = `${selectedRole || evaluationType}-${currentSection}-${index}`;
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Botón de desarrollo para saltar a resultados - solo en primera sección y no en operación */}
        {currentSection === 0 && evaluationType !== 'operacion' && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={onSkipToResults}
              variant="outline"
              size="sm"
              className="bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Saltar a Resultados (Dev)</span>
            </Button>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {evaluationData.tipo_evaluacion || config.title}
              {evaluationData.configuracion && (
                <span className="text-sm text-blue-600 ml-2">
                  (Ponderación: {evaluationData.total_ponderacion}%)
                </span>
              )}
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
          <div className={`${evaluationType !== 'operacion' && ponderationStats ? 'w-3/5' : 'w-full'}`}>
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
                    <h2 className="text-xl font-semibold text-gray-800 text-center flex items-center justify-center">
                      {currentSectionData?.nombre}
                      {currentSectionData?.ponderacion > 0 && (
                        <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {currentSectionData.ponderacion}%
                        </span>
                      )}
                    </h2>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    {evaluationType === 'operacion' ? (
                      // Evaluación de estado de planta
                      <div className="space-y-4">
                        {currentSectionData?.items?.map((item, index) => {
                          const key = `${currentSection}-${index}`;
                          const selectedStatus = plantStatusAnswers[key];

                          return (
                            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                              <h3 className="text-lg font-medium text-gray-800 mb-3">
                                {index + 1}. {item.name}
                              </h3>
                              
                              <div className="flex space-x-4">
                                {[
                                  { value: 'bueno', label: 'Bueno', color: 'bg-green-500 hover:bg-green-600' },
                                  { value: 'regular', label: 'Regular', color: 'bg-yellow-500 hover:bg-yellow-600' },
                                  { value: 'malo', label: 'Malo', color: 'bg-red-500 hover:bg-red-600' }
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handlePlantStatusAnswer(index, option.value)}
                                    className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                                      selectedStatus === option.value 
                                        ? option.color + ' ring-2 ring-offset-2 ring-gray-400'
                                        : option.color
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Cuestionario normal
                      <div className="space-y-6">
                        {currentSectionData?.preguntas?.map((question, index) => {
                          const key = `${selectedRole || evaluationType}-${currentSection}-${index}`;
                          const selectedAnswer = answers[key];

                          return (
                            <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                {index + 1}. {question.pregunta}
                                {question.es_trampa && (
                                  <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Trampa
                                  </span>
                                )}
                                {question.ponderacion_individual > 0 && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {question.ponderacion_individual}%
                                  </span>
                                )}
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
                    )}

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

          {/* Panel de ponderación - solo para cuestionarios */}
          {evaluationType !== 'operacion' && ponderationStats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Sistema de Ponderación
                  </h3>
                </div>
                
                <div className="p-4">
                  <div className="space-y-4">
                    {/* Progreso general */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso general</span>
                        <span>{Math.round(ponderationStats.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${ponderationStats.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ponderationStats.answeredQuestions} de {ponderationStats.totalQuestions} preguntas
                      </div>
                    </div>

                    {/* Ponderación acumulada */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Ponderación Acumulada</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {ponderationStats.ponderacionAcumulada}%
                        </div>
                        <div className="text-xs text-gray-500">
                          de {ponderationStats.totalPonderacion}% total
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(ponderationStats.ponderacionAcumulada / ponderationStats.totalPonderacion) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas de respuestas */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución de respuestas</h4>
                      <div className="space-y-2">
                        {/* Respuestas Sí/No/NA */}
                        {(ponderationStats.responseStats.si > 0 || ponderationStats.responseStats.no > 0 || ponderationStats.responseStats.na > 0) && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                <span>Sí</span>
                              </div>
                              <span className="font-medium">{ponderationStats.responseStats.si}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <XCircle className="w-4 h-4 text-red-600 mr-2" />
                                <span>No</span>
                              </div>
                              <span className="font-medium">{ponderationStats.responseStats.no}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <MinusCircle className="w-4 h-4 text-gray-600 mr-2" />
                                <span>No Aplica</span>
                              </div>
                              <span className="font-medium">{ponderationStats.responseStats.na}</span>
                            </div>
                          </>
                        )}

                        {/* Respuestas de selección múltiple */}
                        {(ponderationStats.responseStats.a > 0 || ponderationStats.responseStats.b > 0 || ponderationStats.responseStats.c > 0) && (
                          <>
                            <div className="border-t pt-2 mt-2">
                              <div className="text-xs text-gray-500 mb-2">Selección múltiple</div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-600">A)</span>
                                <span className="font-medium">{ponderationStats.responseStats.a}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-600">B)</span>
                                <span className="font-medium">{ponderationStats.responseStats.b}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-blue-600">C)</span>
                                <span className="font-medium">{ponderationStats.responseStats.c}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Preguntas trampa */}
                        {ponderationStats.responseStats.trampa > 0 && (
                          <div className="border-t pt-2 mt-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                                <span>Preguntas Trampa</span>
                              </div>
                              <span className="font-medium text-orange-600">{ponderationStats.responseStats.trampa}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información de configuración */}
                    {evaluationData.configuracion && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuración</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Preguntas trampa disponibles: {evaluationData.estadisticas?.total_preguntas_trampa_disponibles || 0}</div>
                          <div>Trampa por sección: {evaluationData.configuracion.preguntas_trampa_por_seccion}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
};

export default EvaluationScreen;